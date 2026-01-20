/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";
import {
  LeadStatus,
  CarStatus,
  Transmission,
  FuelType,
  CarType,
  UrgencyType,
} from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

/** --- HELPERS --- */
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("used-car")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    return { id: decoded.id, role: decoded.role };
  } catch (err) {
    return null;
  }
}

/** --- QUERIES --- */
export async function getActiveReasonsAction(type: LeadStatus) {
  return await db.leadReason.findMany({
    where: { type, active: true },
    orderBy: { content: "asc" },
  });
}

export async function getMyAssignedLeads() {
  const user = await getAuthUser();
  if (!user || !user.id) return [];

  // 1. Lấy cấu hình ngày của Admin
  const config = await db.leadSetting.findUnique({
    where: { id: "lead_config" },
  });
  const HOT_DAYS = config?.hotDays ?? 1;
  const WARM_DAYS = config?.warmDays ?? 3;

  // 2. Lấy danh sách khách hàng
  const leads = await db.customer.findMany({
    where: {
      assignedToId: user.id,
      status: { in: ["ASSIGNED", "CONTACTED", "NEW"] },
    },
    include: {
      carModel: { select: { id: true, name: true } },
      referrer: { select: { id: true, fullName: true, phone: true } },
      // Chỉ lấy 1 hoạt động mới nhất để hiển thị nhanh "Ghi chú lần cuối"
      activities: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          reason: { select: { content: true } },
        },
      },
    },
    // Sắp xếp: Ưu tiên những người có lịch hẹn (nextContactAt) sắp đến hoặc đã quá hạn
    orderBy: [
      { nextContactAt: "asc" },
      { urgencyLevel: "asc" },
      { updatedAt: "desc" },
    ],
  });
  // 3. Xử lý dữ liệu trước khi trả về: Nếu urgencyLevel rỗng thì tự tính dựa trên thời gian thực
  return leads.map((lead) => {
    // Nếu chưa có (khách mới), tính toán dựa trên assignedAt
    console.log("-------------------------");
    if (lead.lastContactAt) {
      const diffInDays =
        (new Date().getTime() - new Date(lead.lastContactAt).getTime()) /
        (1000 * 3600 * 24);
      console.log(lead.lastContactAt);
      let tempUrgency: UrgencyType = UrgencyType.COOL;
      if (diffInDays <= HOT_DAYS) tempUrgency = UrgencyType.HOT;
      else if (diffInDays <= WARM_DAYS) tempUrgency = UrgencyType.WARM;

      return { ...lead, urgencyLevel: tempUrgency };
    } else if (lead.assignedAt) {
      const diffInDays =
        (new Date().getTime() - new Date(lead.assignedAt).getTime()) /
        (1000 * 3600 * 24);
      console.log(lead.assignedAt);

      let tempUrgency: UrgencyType = UrgencyType.COOL;
      if (diffInDays <= HOT_DAYS) tempUrgency = UrgencyType.HOT;
      else if (diffInDays <= WARM_DAYS) tempUrgency = UrgencyType.WARM;

      return { ...lead, urgencyLevel: tempUrgency };
    }

    return { ...lead, urgencyLevel: UrgencyType.COOL };
  });
}

/** --- MUTATIONS --- */

// 1. Gửi duyệt Thu mua (Lưu toàn bộ form bao gồm Hợp đồng vào JSON)
export async function requestPurchaseApproval(leadId: string, values: any) {
  const auth = await getAuthUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    return await db.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: leadId },
        data: { status: LeadStatus.PENDING_DEAL_APPROVAL },
      });

      // values lúc này phải bao gồm: carData (thông tin xe) và contractData (hợp đồng)
      await tx.leadActivity.create({
        data: {
          customerId: leadId,
          status: LeadStatus.PENDING_DEAL_APPROVAL,
          note: JSON.stringify({
            requestType: "CAR_PURCHASE",
            carData: values.carData,
            contractData: values.contractData, // Số HĐ, giá chốt, ngày ký...
          }),
          createdById: auth.id,
        },
      });

      revalidatePath("/dashboard/assigned-tasks");
      return { success: true };
    });
  } catch (error: any) {
    throw new Error("Lỗi gửi yêu cầu: " + error.message);
  }
}

// 2. Phê duyệt nhập kho (Giải nén JSON, tạo Car VÀ tạo CarOwnerHistory)
export async function approveCarPurchase(
  activityId: string,
  decision: "APPROVE" | "REJECT",
  reason?: string
) {
  const auth = await getAuthUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    return await db.$transaction(async (tx) => {
      const activity = await tx.leadActivity.findUnique({
        where: { id: activityId },
      });

      if (!activity || !activity.note)
        throw new Error("Không tìm thấy dữ liệu yêu cầu");

      const [customer, staff] = await Promise.all([
        tx.customer.findUnique({ where: { id: activity.customerId } }),
        tx.user.findUnique({ where: { id: activity.createdById } }),
      ]);

      if (!customer || !staff)
        throw new Error("Thông tin khách hoặc nhân viên không tồn tại");

      const { carData, contractData } = JSON.parse(activity.note);

      if (decision === "APPROVE") {
        const branchId = staff.branchId;
        if (!branchId) throw new Error("Nhân viên không thuộc chi nhánh nào.");

        // A. Tạo xe chính thức
        const createdCar = await tx.car.create({
          data: {
            modelName: carData.modelName || "Xe nhập từ Lead",
            vin: carData.vin?.toUpperCase() || "CHUA_CO_VIN",
            licensePlate: carData.licensePlate?.toUpperCase() || null,
            year: parseInt(carData.year) || 0,
            odo: parseInt(carData.odo) || 0,
            transmission:
              (carData.transmission as Transmission) || Transmission.AUTOMATIC,
            fuelType: (carData.fuelType as FuelType) || FuelType.GASOLINE,
            carType: (carData.carType as CarType) || CarType.SUV,
            color: carData.color || null,
            interiorColor: carData.interiorColor || null,
            seats: parseInt(carData.seats) || 5,
            costPrice: contractData.price ? parseFloat(contractData.price) : 0,
            status: CarStatus.REFURBISHING,
            branchId: branchId,
            carModelId: carData.carModelId || null,
            purchaserId: staff.id,
            referrerId: customer.referrerId,
            purchasedAt: new Date(),
          },
        });

        // B. Tạo Hợp đồng / Lịch sử sở hữu (CarOwnerHistory)
        await tx.carOwnerHistory.create({
          data: {
            carId: createdCar.id,
            customerId: customer.id,
            type: "PURCHASE",
            contractNo: contractData.contractNo,
            price: parseFloat(contractData.price),
            note: contractData.note,
            date: new Date(),
          },
        });

        await tx.customer.update({
          where: { id: activity.customerId },
          data: { status: LeadStatus.DEAL_DONE },
        });

        await tx.leadActivity.update({
          where: { id: activityId },
          data: {
            status: LeadStatus.DEAL_DONE,
            note: `Đã duyệt nhập kho & tạo hợp đồng ${contractData.contractNo}`,
          },
        });
      } else {
        await tx.customer.update({
          where: { id: activity.customerId },
          data: { status: LeadStatus.CONTACTED },
        });

        await tx.leadActivity.create({
          data: {
            customerId: activity.customerId,
            status: LeadStatus.CONTACTED,
            note: `Yêu cầu thu mua bị từ chối: ${
              reason || "Không đạt tiêu chuẩn"
            }`,
            createdById: auth.id,
          },
        });
      }

      revalidatePath("/dashboard/approvals");
      revalidatePath("/dashboard/assigned-tasks");
      return { success: true };
    });
  } catch (error: any) {
    console.error("Lỗi Approval:", error);
    throw new Error(error.message);
  }
}

// 3. Cập nhật các trạng thái thông thường (Giữ nguyên)
export async function processLeadStatusUpdate(
  leadId: string,
  status: LeadStatus,
  reasonId: string,
  note: string
) {
  const auth = await getAuthUser();
  if (!auth) throw new Error("Unauthorized");

  await db.customer.update({
    where: { id: leadId },
    data: {
      status,
      activities: {
        create: {
          status,
          reasonId: reasonId || null,
          note,
          createdById: auth.id,
        },
      },
    },
  });
  revalidatePath("/dashboard/assigned-tasks");
  return { success: true };
}

// 4. Lấy danh sách chờ duyệt (Giữ nguyên)
export async function getPendingApprovalsAction() {
  return await db.leadActivity.findMany({
    where: {
      status: { in: ["PENDING_DEAL_APPROVAL", "PENDING_LOSE_APPROVAL"] },
    },
    include: {
      customer: { select: { fullName: true, phone: true } },
      user: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// 5. Gửi duyệt Bán xe (Tích hợp thông tin hợp đồng vào JSON)
export async function requestSaleApproval(
  leadId: string,
  carId: string,
  contractData: any
) {
  const auth = await getAuthUser();
  if (!auth) throw new Error("Unauthorized");

  await db.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: leadId },
      data: { status: LeadStatus.PENDING_DEAL_APPROVAL },
    });

    await tx.leadActivity.create({
      data: {
        customerId: leadId,
        status: LeadStatus.PENDING_DEAL_APPROVAL,
        note: JSON.stringify({
          requestType: "CAR_SALE",
          carId,
          contractData, // Thông tin hợp đồng bán
        }),
        createdById: auth.id,
      },
    });
  });
  revalidatePath("/dashboard/assigned-tasks");
  return { success: true };
}

// 6. Gửi duyệt Thất bại (Giữ nguyên)
export async function requestLoseApproval(
  leadId: string,
  reasonId: string,
  note: string
) {
  const auth = await getAuthUser();
  if (!auth) throw new Error("Unauthorized");

  await db.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: leadId },
      data: { status: LeadStatus.PENDING_LOSE_APPROVAL },
    });

    await tx.leadActivity.create({
      data: {
        customerId: leadId,
        status: LeadStatus.PENDING_LOSE_APPROVAL,
        reasonId,
        note,
        createdById: auth.id,
      },
    });
  });
  revalidatePath("/dashboard/assigned-tasks");
  return { success: true };
}

// 7. Lấy danh sách xe sẵn sàng (Giữ nguyên)
export async function getAvailableCars() {
  return await db.car.findMany({
    where: { status: CarStatus.READY_FOR_SALE },
    select: {
      id: true,
      modelName: true,
      licensePlate: true,
      costPrice: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCustomerStatusAction(
  customerId: string,
  status: LeadStatus,
  note: string,
  nextContactAt?: Date
) {
  try {
    const now = new Date();

    return await db.$transaction(async (tx) => {
      const user = await getAuthUser();
      if (!user || !user.id) return [];
      // 1. Lấy cấu hình ngày từ Admin (LeadSetting)
      const config = await tx.leadSetting.findUnique({
        where: { id: "lead_config" },
      });

      // Mặc định nếu chưa có cấu hình trong DB (hotDays: 3, warmDays: 7 như schema)
      const HOT_DAYS = config?.hotDays ?? 3;
      const WARM_DAYS = config?.warmDays ?? 7;

      // 2. Lấy dữ liệu khách hàng hiện tại
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: {
          assignedAt: true,
          firstContactAt: true,
        },
      });

      if (!customer) throw new Error("Không tìm thấy khách hàng");

      // 3. Chuẩn bị dữ liệu cập nhật cho Customer
      const updateData: any = {
        status: status,
        lastContactAt: now,
        nextContactAt: nextContactAt || null,
      };

      // 4. LOGIC TÍNH ĐỘ GẤP (URGENCY) DỰA TRÊN NGÀY ADMIN SET
      // Chỉ tính khi chuyển sang CONTACTED lần đầu tiên và có ngày được giao (assignedAt)
      if (
        status === LeadStatus.CONTACTED &&
        !customer.firstContactAt &&
        customer.assignedAt
      ) {
        updateData.firstContactAt = now;

        // Tính toán khoảng cách thời gian theo NGÀY
        const diffInMs = now.getTime() - customer.assignedAt.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        let urgency: UrgencyType = UrgencyType.COOL;

        if (diffInDays <= HOT_DAYS) {
          urgency = UrgencyType.HOT; // Dưới hoặc bằng số ngày Admin set cho Hot
        } else if (diffInDays <= WARM_DAYS) {
          urgency = UrgencyType.WARM; // Dưới hoặc bằng số ngày Admin set cho Warm
        } else {
          urgency = UrgencyType.COOL; // Vượt quá số ngày Warm
        }

        updateData.urgencyLevel = urgency;
      }

      // 5. Thực thi cập nhật Customer
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: updateData,
      });

      // 6. Ghi nhật ký hoạt động (LeadActivity)
      await tx.leadActivity.create({
        data: {
          customerId: customerId,
          status: status,
          note: note,
          createdById: user.id,
        },
      });

      // Làm mới dữ liệu phía Client
      revalidatePath("/dashboard/assigned-tasks");
      revalidatePath("/dashboard/customers");

      return { success: true, data: updatedCustomer };
    });
  } catch (error: any) {
    console.error("Update Status Error:", error);
    throw new Error(error.message || "Lỗi khi cập nhật trạng thái khách hàng");
  }
}
