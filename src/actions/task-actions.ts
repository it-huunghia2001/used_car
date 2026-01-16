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
  return await db.customer.findMany({
    where: {
      assignedToId: user.id,
      status: { in: ["ASSIGNED", "CONTACTED", "NEW"] },
    },
    include: {
      carModel: { select: { id: true, name: true } },
      referrer: { select: { id: true, fullName: true, phone: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** --- MUTATIONS --- */

// 1. Gửi duyệt Thu mua (Lưu toàn bộ form vào JSON trong LeadActivity)
export async function requestPurchaseApproval(leadId: string, values: any) {
  const auth = await getAuthUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    return await db.$transaction(async (tx) => {
      // Cập nhật trạng thái khách hàng sang chờ duyệt
      await tx.customer.update({
        where: { id: leadId },
        data: { status: LeadStatus.PENDING_DEAL_APPROVAL },
      });

      // Tạo activity chứa thông tin xe trong trường note (JSON)
      await tx.leadActivity.create({
        data: {
          customerId: leadId,
          status: LeadStatus.PENDING_DEAL_APPROVAL,
          note: JSON.stringify({
            requestType: "CAR_PURCHASE",
            carData: values,
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

// 2. Phê duyệt nhập kho (Giải nén JSON và tạo bản ghi Car chính thức)
export async function approveCarPurchase(
  activityId: string,
  decision: "APPROVE" | "REJECT",
  reason?: string
) {
  const auth = await getAuthUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    return await db.$transaction(async (tx) => {
      // Lấy activity gốc
      const activity = await tx.leadActivity.findUnique({
        where: { id: activityId },
      });

      if (!activity || !activity.note)
        throw new Error("Không tìm thấy dữ liệu yêu cầu");

      // Truy vấn thủ công các thông tin liên quan để đảm bảo không lỗi quan hệ
      const [customer, staff] = await Promise.all([
        tx.customer.findUnique({ where: { id: activity.customerId } }),
        tx.user.findUnique({ where: { id: activity.createdById } }),
      ]);

      if (!customer || !staff)
        throw new Error("Thông tin khách hoặc nhân viên không tồn tại");

      const { carData } = JSON.parse(activity.note);

      if (decision === "APPROVE") {
        // Lấy chi nhánh của nhân viên thu mua để gán cho xe
        const branchId = staff.branchId;
        if (!branchId)
          throw new Error("Nhân viên thu mua chưa được gán vào chi nhánh nào.");

        // Tạo xe vào bảng Car từ dữ liệu tạm trong JSON
        await tx.car.create({
          data: {
            modelName: carData.modelName || "Xe nhập từ Lead",
            vin: carData.vin?.toUpperCase() || "CHUA_CO_VIN",
            licensePlate: carData.licensePlate?.toUpperCase() || null,
            year: parseInt(carData.year) || 0,
            odo: parseInt(carData.odo) || 0,

            // Ép kiểu Enum để khớp với Prisma Schema
            transmission:
              (carData.transmission as Transmission) || Transmission.AUTOMATIC,
            fuelType: (carData.fuelType as FuelType) || FuelType.GASOLINE,
            carType: (carData.carType as CarType) || CarType.SUV,

            color: carData.color || null,
            interiorColor: carData.interiorColor || null,
            seats: parseInt(carData.seats) || 5,
            costPrice: carData.price ? parseFloat(carData.price) : 0,
            status: CarStatus.REFURBISHING,

            branchId: branchId,
            carModelId: carData.carModelId || null,
            purchaserId: staff.id,
            referrerId: customer.referrerId,
            purchasedAt: new Date(),
          },
        });

        // Chốt Deal cho khách hàng
        await tx.customer.update({
          where: { id: activity.customerId },
          data: { status: LeadStatus.DEAL_DONE },
        });

        // Đánh dấu Activity là đã xử lý
        await tx.leadActivity.update({
          where: { id: activityId },
          data: {
            status: LeadStatus.DEAL_DONE,
            note: `Đã duyệt nhập kho bởi Admin. Xe: ${carData.modelName}`,
          },
        });
      } else {
        // TRƯỜNG HỢP TỪ CHỐI: Trả khách về trạng thái đang chăm sóc
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

// 3. Cập nhật các trạng thái thông thường (không qua phê duyệt)
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

// 4. Lấy danh sách các yêu cầu đang chờ duyệt
// Cập nhật lại hàm này trong src/actions/task-actions.ts
export async function getPendingApprovalsAction() {
  return await db.leadActivity.findMany({
    where: {
      status: {
        in: ["PENDING_DEAL_APPROVAL", "PENDING_LOSE_APPROVAL"],
      },
    },
    include: {
      customer: {
        select: { fullName: true, phone: true },
      },
      // Đổi 'createdBy' thành 'user' (hoặc tên tương ứng trong schema)
      user: {
        select: { fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Thêm vào file actions/task-actions.ts

// Gửi duyệt Bán xe (Dành cho khách Mua)
export async function requestSaleApproval(leadId: string, carId: string) {
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
        note: JSON.stringify({ requestType: "CAR_SALE", carId }),
        createdById: auth.id,
      },
    });
  });
  revalidatePath("/dashboard/assigned-tasks");
  return { success: true };
}

// Gửi duyệt Thất bại (Close Lead)
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

// Lấy danh sách xe đang sẵn sàng để bán (Fix lỗi bạn gặp phải)
export async function getAvailableCars() {
  return await db.car.findMany({
    where: {
      status: CarStatus.READY_FOR_SALE,
    },
    select: {
      id: true,
      modelName: true,
      licensePlate: true,
      costPrice: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
