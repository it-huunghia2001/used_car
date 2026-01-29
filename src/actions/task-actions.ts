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
  TaskStatus,
  Role,
  TaskType,
} from "@prisma/client";
import dayjs from "@/lib/dayjs"; // Sử dụng file config ở trên
import { getCurrentUser } from "@/lib/session-server";

const serializePrisma = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

/** --- QUERIES --- */
export async function getActiveReasonsAction(type: LeadStatus) {
  const reasons = await db.leadReason.findMany({
    where: { type, active: true },
    orderBy: { content: "asc" },
  });
  return serializePrisma(reasons);
}

export async function getMyTasksAction() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return [];

    const now = dayjs().tz("Asia/Ho_Chi_Minh");
    let taskTypeFilter: any = undefined;

    if (user.role === Role.SALES_STAFF) {
      taskTypeFilter = TaskType.SALES;
    } else if (user.role === Role.PURCHASE_STAFF) {
      taskTypeFilter = TaskType.PURCHASE;
    }

    const [config, tasks] = await Promise.all([
      db.leadSetting.findFirst(),
      db.task.findMany({
        where: {
          assigneeId: user.id,
          ...(taskTypeFilter && { type: taskTypeFilter }),
          status: "PENDING",
        },
        include: {
          customer: {
            include: {
              carModel: { select: { id: true, name: true } },
              referrer: { select: { fullName: true } },
              leadCar: true,
              activities: {
                include: {
                  user: { select: { fullName: true } },
                },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      }),
    ]);

    const maxLate = config?.maxLateMinutes || 30;

    const processedTasks = tasks.map((task) => {
      const customer = task.customer;
      const scheduledAtVN = dayjs(task.scheduledAt).tz("Asia/Ho_Chi_Minh");
      const deadline = scheduledAtVN.add(maxLate, "minute");

      const isOverdue = now.isAfter(deadline);
      const minutesOverdue = isOverdue ? now.diff(deadline, "minute") : 0;

      // --- LOGIC TÍNH TOÁN URGENCYLEVEL ĐỘNG ---
      let currentUrgency = customer?.urgencyLevel || "COOL";

      if (customer?.lastContactAt) {
        const diffDays = now.diff(dayjs(customer.lastContactAt), "day");

        if (diffDays <= (config?.hotDays || 3)) {
          currentUrgency = "HOT";
        } else if (diffDays <= (config?.warmDays || 7)) {
          currentUrgency = "WARM";
        } else {
          currentUrgency = "COOL";
        }
      }

      // Ép kiểu Decimal sang Number cho leadCar
      const rawLeadCar = customer?.leadCar;
      const formattedLeadCar = rawLeadCar
        ? {
            ...rawLeadCar,
            tSurePrice: rawLeadCar.tSurePrice
              ? Number(rawLeadCar.tSurePrice)
              : null,
            expectedPrice: rawLeadCar.expectedPrice
              ? Number(rawLeadCar.expectedPrice)
              : null,
            finalPrice: rawLeadCar.finalPrice
              ? Number(rawLeadCar.finalPrice)
              : null,
          }
        : null;

      // Chuyển sang Plain Object
      const plainTask = JSON.parse(JSON.stringify(task));

      return {
        ...plainTask,
        isOverdue,
        minutesOverdue,
        customer: {
          ...plainTask.customer,
          urgencyLevel: currentUrgency, // Ghi đè bằng giá trị vừa tính toán
          leadCar: formattedLeadCar,
        },
      };
    });

    return serializePrisma(processedTasks);
  } catch (error) {
    console.error("Error in getMyTasksAction:", error);
    return [];
  }
}
/** --- MUTATIONS --- */

// 1. Gửi duyệt Thu mua (Lưu toàn bộ form bao gồm Hợp đồng vào JSON)
export async function requestPurchaseApproval(leadId: string, values: any) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");

  if (!values.carData || !values.contractData) {
    throw new Error("Dữ liệu xe hoặc hợp đồng không đầy đủ");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Kiểm tra khách hàng và trạng thái hiện tại
      const customer = await tx.customer.findUnique({
        where: { id: leadId },
        select: { status: true, fullName: true },
      });

      if (!customer) throw new Error("Không tìm thấy khách hàng");
      if (customer.status === LeadStatus.PENDING_DEAL_APPROVAL) {
        throw new Error("Hồ sơ này đã được gửi duyệt trước đó");
      }

      // 2. CẬP NHẬT TRẠNG THÁI TASK (QUAN TRỌNG)
      // Tìm task PENDING gần nhất của lead này để đóng lại
      // Việc này giúp Sales không còn thấy Task này trong danh sách "Nhiệm vụ của tôi"
      const now = new Date();
      await tx.task.updateMany({
        where: {
          customerId: leadId,
          assigneeId: auth.id,
          status: "PENDING",
        },
        data: {
          status: "COMPLETED",
          completedAt: now,
          content: `Đã gửi yêu cầu phê duyệt thu mua. Giá chốt: ${Number(
            values.contractData.price,
          ).toLocaleString()} VNĐ`,
        },
      });

      // 3. Cập nhật trạng thái Customer
      await tx.customer.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.PENDING_DEAL_APPROVAL,
          // Xóa ngày hẹn tiếp theo vì đang chờ duyệt
          nextContactAt: null,
        },
      });

      // 4. Tạo Activity Snapshot (Dùng để Admin xem và Parse dữ liệu)
      const activity = await tx.leadActivity.create({
        data: {
          customerId: leadId,
          status: LeadStatus.PENDING_DEAL_APPROVAL,
          note: JSON.stringify({
            requestType: "CAR_PURCHASE",
            carData: values.carData,
            contractData: values.contractData,
            submittedAt: now.toISOString(),
          }),
          createdById: auth.id,
        },
      });

      // 5. Đồng bộ dữ liệu vào bảng LeadCar
      // Việc này giúp các phòng ban khác (giám định, kế toán) thấy được thông tin mới nhất
      await tx.leadCar.upsert({
        where: { customerId: leadId },
        update: {
          ...values.carData,
          finalPrice: values.contractData.price, // Lưu giá chốt vào LeadCar luôn
        },
        create: {
          customerId: leadId,
          ...values.carData,
          finalPrice: values.contractData.price,
        },
      });

      // Revalidate các path liên quan
      revalidatePath("/dashboard/assigned-tasks");
      revalidatePath("/dashboard/approvals");
      revalidatePath(`/dashboard/customers/${leadId}`);

      return { success: true, activityId: activity.id };
    });
    return serializePrisma(result);
  } catch (error: any) {
    console.error("Purchase Approval Error:", error);
    throw new Error(error.message || "Lỗi hệ thống khi gửi yêu cầu");
  }
}
// 2. Phê duyệt nhập kho (Giải nén JSON, tạo Car VÀ tạo CarOwnerHistory)

export async function approveCarPurchase(
  activityId: string,
  decision: "APPROVE" | "REJECT",
  reason?: string,
  adminUpdatedData?: any,
) {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: "Unauthorized" };

  try {
    const activity = await db.leadActivity.findUnique({
      where: { id: activityId },
      include: { customer: true },
    });

    if (!activity) return { success: false, error: "Không tìm thấy yêu cầu" };

    let purchaseData: any = null;
    try {
      purchaseData = JSON.parse(activity.note || "{}");
    } catch (e) {
      purchaseData = {};
    }

    const isPurchaseRequest = activity.status === "PENDING_DEAL_APPROVAL";

    const result = await db.$transaction(
      async (tx) => {
        // --- TRƯỜNG HỢP 1: TỪ CHỐI (Giữ nguyên logic của bạn nhưng thêm đóng Task cũ) ---
        if (decision === "REJECT") {
          await tx.customer.update({
            where: { id: activity.customerId },
            data: { status: "FOLLOW_UP" },
          });

          // Đóng các Task cũ liên quan đến việc thu mua này nếu có
          await tx.task.updateMany({
            where: { customerId: activity.customerId, status: "PENDING" },
            data: { status: "CANCELLED" },
          });

          await tx.task.create({
            data: {
              title: "SỬA HỒ SƠ: Thu mua bị từ chối",
              content: `Lý do: ${reason || "Không xác định"}. Vui lòng kiểm tra lại thông tin xe/giá và gửi lại phê duyệt.`,
              type: "PURCHASE", // CẬP NHẬT TYPE
              scheduledAt: new Date(),
              deadlineAt: dayjs().add(1, "hour").toDate(),
              status: "PENDING",
              customerId: activity.customerId,
              assigneeId: activity.createdById,
            },
          });

          await tx.leadActivity.update({
            where: { id: activityId },
            data: {
              status: "REJECTED_APPROVAL",
              note: `❌ Admin từ chối: ${reason}`,
            },
          });

          return { type: "REJECTED" };
        }

        // --- TRƯỜNG HỢP 2: PHÊ DUYỆT ---
        if (isPurchaseRequest) {
          const carData = adminUpdatedData || purchaseData.carData;
          const contractData = adminUpdatedData
            ? {
                price: adminUpdatedData.price,
                contractNo: adminUpdatedData.contractNo,
                note: adminUpdatedData.adminNote,
              }
            : purchaseData.contractData;

          const staff = await tx.user.findUnique({
            where: { id: activity.createdById },
            select: { branchId: true, id: true },
          });

          if (!staff?.branchId)
            throw new Error("Nhân viên đề xuất thiếu chi nhánh");

          // Tạo Stock Code (Giữ logic của bạn)
          const carModelDb = await tx.carModel.findUnique({
            where: { id: carData.carModelId },
          });
          const carTypePrefix = (carModelDb?.grade || "CAR")
            .substring(0, 3)
            .toUpperCase();
          const yearSuffix = new Date().getFullYear().toString().slice(-2);

          // Dùng findFirst để lấy mã cuối cùng chính xác hơn thay vì chỉ count
          const lastCar = await tx.car.findFirst({
            where: {
              stockCode: { startsWith: `${carTypePrefix}${yearSuffix}` },
            },
            orderBy: { stockCode: "desc" },
          });

          let lastNumber = 0;
          if (lastCar) {
            lastNumber = parseInt(lastCar.stockCode.slice(-3));
          }
          const generatedStockCode = `${carTypePrefix}${yearSuffix}${(lastNumber + 1).toString().padStart(3, "0")}`;

          // Tạo Xe vào kho
          const createdCar = await tx.car.create({
            data: {
              vin: carData.vin?.toUpperCase(),
              engineNumber: carData.engineNumber?.toUpperCase(),
              licensePlate: carData.licensePlate?.toUpperCase(),
              year: Number(carData.year),
              odo: Number(carData.odo),
              transmission: carData.transmission,
              contractNumber: contractData.contractNo,
              fuelType: carData.fuelType,
              carType: carData.carType,
              seats: Number(carData.seats) || 5,
              engineSize: carData.engineSize,
              driveTrain: carData.driveTrain,
              color: carData.color,
              interiorColor: carData.interiorColor,
              origin: carData.origin,
              ownerType: carData.ownerType,
              registrationDeadline: carData.registrationDeadline,
              insuranceDeadline: carData.insuranceDeadline,
              insuranceTNDS: carData.insuranceTNDS,
              insuranceTNDSDeadline: carData.insuranceTNDSDeadline,
              insuranceVC: carData.insuranceVC,
              insuranceVCCorp: carData.insuranceVCCorp,
              insuranceVCDeadline: carData.insuranceVCDeadline,
              images: carData.images,
              description: carData.description,
              features: carData.features,
              costPrice: contractData.price, // Prisma tự xử lý Decimal từ number/string
              stockCode: generatedStockCode,
              modelName: carModelDb?.name ?? "",
              carModelId: carData.carModelId,
              branchId: staff.branchId,
              purchaserId: staff.id,
              referrerId: activity.customer.referrerId,
              purchasedAt: new Date(),
              status: "REFURBISHING",
            },
          });

          // Lưu lịch sử chủ xe
          await tx.carOwnerHistory.create({
            data: {
              carId: createdCar.id,
              customerId: activity.customerId,
              type: "PURCHASE",
              contractNo: contractData.contractNo,
              price: contractData.price,
              date: new Date(),
            },
          });

          // Cập nhật Customer & Hoàn tất Task
          await tx.customer.update({
            where: { id: activity.customerId },
            data: { status: "DEAL_DONE" },
          });

          await tx.task.updateMany({
            where: { customerId: activity.customerId, status: "PENDING" },
            data: { status: "COMPLETED", completedAt: new Date() },
          });

          await tx.leadActivity.update({
            where: { id: activityId },
            data: {
              status: "DEAL_DONE",
              note: `✅ Admin đã duyệt nhập kho: ${generatedStockCode}. ${reason ? "Ghi chú: " + reason : ""}`,
            },
          });

          return { type: "PURCHASE_DONE", stockCode: generatedStockCode };
        }

        return { type: "UNKNOWN" };
      },
      { timeout: 30000 },
    );

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/assigned-tasks");
    revalidatePath("/dashboard/inventory"); // Revalidate thêm trang kho xe
    return { success: true, data: result };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}
// 3. Cập nhật các trạng thái thông thường (Giữ nguyên)
export async function processLeadStatusUpdate(
  leadId: string,
  status: LeadStatus,
  reasonId: string,
  note: string,
) {
  const auth = await getCurrentUser();
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

export async function getPendingApprovalsAction() {
  try {
    // 1. Lấy thông tin người dùng hiện tại
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    // 2. Xác định phạm vi quyền hạn
    const isGlobalPower =
      currentUser.role === "ADMIN" || currentUser.isGlobalManager;

    // 3. Xây dựng điều kiện lọc
    const where: any = {
      status: { in: ["PENDING_DEAL_APPROVAL", "PENDING_LOSE_APPROVAL"] },
    };

    // Nếu không có quyền Global, chỉ lấy yêu cầu từ nhân viên trong cùng chi nhánh
    if (!isGlobalPower) {
      where.user = {
        branchId: currentUser.branchId,
      };
    }

    const approvals = await db.leadActivity.findMany({
      where,
      include: {
        customer: {
          include: {
            leadCar: true,
            carModel: true,
          },
        },
        user: {
          select: {
            fullName: true,
            branchId: true, // Lấy để kiểm tra nếu cần
          },
        },
        reason: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Chuyển đổi Plain Object an toàn
    return JSON.parse(JSON.stringify(approvals));
  } catch (error) {
    console.error("Lỗi getPendingApprovalsAction:", error);
    return [];
  }
}

export async function requestSaleApproval(
  customerId: string,
  data: {
    carId: string;
    finalPrice: number;
    paymentMethod: string;
    note: string;
  },
  taskId?: string, // Thêm dấu ? để biến taskId thành tùy chọn (optional)
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Bạn cần đăng nhập để thực hiện");

    const now = new Date();

    const result = await db.$transaction(
      async (tx) => {
        let isLate = false;
        let lateMinutes = 0;

        // --- 1. XỬ LÝ TASK (NẾU CÓ) ---
        // Nếu taskId tồn tại và không trùng với customerId, chúng ta mới xử lý Task
        if (taskId && taskId !== customerId) {
          const currentTask = await tx.task.findUnique({
            where: { id: taskId },
            select: { deadlineAt: true, status: true },
          });

          // Chỉ cập nhật nếu Task đang ở trạng thái PENDING
          if (currentTask && currentTask.status === "PENDING") {
            const deadline = new Date(currentTask.deadlineAt);
            isLate = now > deadline;
            lateMinutes = isLate
              ? Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60))
              : 0;

            await tx.task.update({
              where: { id: taskId },
              data: {
                status: TaskStatus.COMPLETED,
                completedAt: now,
                isLate: isLate,
                lateMinutes: lateMinutes,
              },
            });
          }
        }

        // --- 2. CẬP NHẬT KHÁCH HÀNG (LUÔN THỰC HIỆN) ---
        await tx.customer.update({
          where: { id: customerId },
          data: {
            status: LeadStatus.PENDING_DEAL_APPROVAL,
            leadCar: {
              update: {
                finalPrice: data.finalPrice,
                note: `Chốt bán chủ động: ${data.note} | HTTT: ${data.paymentMethod}`,
              },
            },
          },
        });

        // --- 3. GHI LOG HOẠT ĐỘNG ---
        const car = await tx.car.findUnique({
          where: { id: data.carId },
          select: { stockCode: true, modelName: true },
        });

        const activity = await tx.leadActivity.create({
          data: {
            customerId: customerId,
            status: LeadStatus.PENDING_DEAL_APPROVAL,
            note: `[YÊU CẦU CHỐT ĐƠN]: Bán xe ${car?.stockCode} - ${car?.modelName}. Giá: ${data.finalPrice.toLocaleString()}đ.`,
            createdById: auth.id,
            isLate: isLate,
            lateMinutes: lateMinutes,
          },
        });

        // --- 4. KHÓA XE TRONG KHO ---
        await tx.car.update({
          where: { id: data.carId },
          data: { status: "BOOKED" },
        });

        return { isLate, lateMinutes, activity };
      },
      { timeout: 20000 },
    );

    revalidatePath("/dashboard/sales-tasks");
    revalidatePath("/dashboard/approvals");

    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Sale Approval Error:", error);
    return { success: false, error: error.message || "Lỗi hệ thống" };
  }
}
/**
 * 6. Gửi duyệt Dừng xử lý khách hàng (Lose/Frozen/Pending View)
 * Luồng đi:
 * - Đóng Task hiện tại (PENDING -> CANCELLED/COMPLETED)
 * - Chuyển Customer sang trạng thái chờ duyệt (PENDING_LOSE_APPROVAL)
 * - Tạo bản ghi Activity để Admin có dữ liệu phê duyệt
 */
export async function requestLoseApproval(
  customerId: string,
  reasonId: string,
  note: string,
  targetStatus: LeadStatus,
) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    // 1. KIỂM TRA CHẶN GỬI TRÙNG (Ngoài transaction để nhẹ tải)
    const currentCustomer = await db.customer.findUnique({
      where: { id: customerId },
      select: { status: true },
    });

    if (!currentCustomer) throw new Error("Khách hàng không tồn tại");

    if (
      ["PENDING_LOSE_APPROVAL", "PENDING_DEAL_APPROVAL"].includes(
        currentCustomer.status,
      )
    ) {
      return {
        success: false,
        error: "Hồ sơ này đang trong trạng thái chờ duyệt.",
      };
    }

    // 2. THỰC HIỆN TRONG TRANSACTION VỚI TIMEOUT TÙY CHỈNH
    const result = await db.$transaction(
      async (tx) => {
        const now = new Date();

        // --- A. TỰ ĐỘNG ĐÓNG TẤT CẢ TASK BẰNG UPDATEMANY (NHANH HƠN VÒNG LẶP) ---
        // Lưu ý: updateMany không trả về chi tiết từng bản ghi, nên ta lấy thông tin trễ trước đó
        const lateTask = await tx.task.findFirst({
          where: {
            assigneeId: auth.id,
            customerId: customerId,
            status: "PENDING",
            deadlineAt: { lt: now }, // Tìm xem có cái nào trễ không
          },
          orderBy: { deadlineAt: "asc" }, // Lấy cái trễ nhất
        });

        let isLate = false;
        let lateMinutes = 0;
        if (lateTask) {
          isLate = true;
          lateMinutes = dayjs(now).diff(lateTask.deadlineAt, "minute");
        }

        // Đóng tất cả cùng lúc
        await tx.task.updateMany({
          where: {
            assigneeId: auth.id,
            customerId: customerId,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            completedAt: now,
            // Với updateMany ta không thể gán isLate/lateMinutes riêng cho từng cái
            // nhưng có thể gán chung đại diện cho phiên làm việc này
            isLate: isLate,
            lateMinutes: lateMinutes,
          },
        });

        // --- B. CẬP NHẬT TRẠNG THÁI KHÁCH HÀNG ---
        const updatedCustomer = await tx.customer.update({
          where: { id: customerId },
          data: { status: "PENDING_LOSE_APPROVAL" },
        });

        // --- C. TẠO NHẬT KÝ PHÊ DUYỆT ---
        const activity = await tx.leadActivity.create({
          data: {
            customerId,
            status: "PENDING_LOSE_APPROVAL",
            reasonId,
            note: `[YÊU CẦU DUYỆT DỪNG - ĐÍCH: ${targetStatus}]: ${note}`,
            createdById: auth.id,
            isLate,
            lateMinutes,
          },
        });

        return { updatedCustomer, activity };
      },
      {
        timeout: 20000, // Tăng lên 20 giây để tránh lỗi P2028
      },
    );

    // 3. REVALIDATE
    revalidatePath("/dashboard/assigned-tasks");
    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/leads");

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Lose Request Error:", error);
    return { success: false, error: error.message || "Lỗi xử lý giao dịch" };
  }
}

// 7. Lấy danh sách xe sẵn sàng (Giữ nguyên)
export async function getAvailableCars() {
  const cars = await db.car.findMany({
    where: { status: CarStatus.READY_FOR_SALE },
    select: {
      id: true,
      modelName: true,
      licensePlate: true,
      sellingPrice: true, // Đây là Decimal
      stockCode: true,
      year: true,
      vin: true,
      color: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Chuyển đổi Decimal sang Number trước khi gửi xuống Client
  return serializePrisma(cars);
}

export async function updateCustomerStatusAction(
  customerId: string,
  status: LeadStatus,
  note: string,
  currentTaskId?: string,
  nextContactAtStr?: string | null,
  payload?: {
    nextNote?: string;
    reasonId?: string;
  },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const now = new Date();
    const nextContactAt = nextContactAtStr ? new Date(nextContactAtStr) : null;

    // Tách Transaction ra một biến để kiểm soát kết quả
    const result = await db.$transaction(
      async (tx) => {
        // 1. Lấy dữ liệu cần thiết đồng thời
        const [config, currentTask, customer] = await Promise.all([
          tx.leadSetting.findFirst(),
          currentTaskId
            ? tx.task.findUnique({ where: { id: currentTaskId } })
            : null,
          tx.customer.findUnique({ where: { id: customerId } }),
        ]);

        if (!customer) throw new Error("Customer not found");

        const maxLateMinutes = config?.maxLateMinutes || 30;
        let isLate = false;
        let lateMinutes = 0;

        // 2. Tính toán logic xử lý Task cũ
        if (currentTask && currentTask.status === "PENDING") {
          const deadline = dayjs(currentTask.scheduledAt).add(
            maxLateMinutes,
            "minute",
          );
          isLate = dayjs(now).isAfter(deadline);
          lateMinutes = isLate ? dayjs(now).diff(deadline, "minute") : 0;

          // Cập nhật Task cũ
          await tx.task.update({
            where: { id: currentTaskId },
            data: {
              status: "COMPLETED",
              completedAt: now,
              content: note,
              isLate,
              lateMinutes,
            },
          });
        }

        // 3. Tính toán Urgency Level
        let urgencyLevel = customer.urgencyLevel;
        if (customer.lastContactAt) {
          const diffDays = dayjs(now).diff(
            dayjs(customer.lastContactAt),
            "day",
          );
          if (diffDays <= (config?.hotDays || 3)) urgencyLevel = "HOT";
          else if (diffDays <= (config?.warmDays || 7)) urgencyLevel = "WARM";
          else urgencyLevel = "COOL";
        }

        console.log("urgencyLevel: " + urgencyLevel);

        // 4. THỰC THI SONG SONG CÁC LỆNH GHI (Tối ưu tốc độ tránh Timeout)
        const operations = [];

        // Cập nhật khách hàng
        operations.push(
          tx.customer.update({
            where: { id: customerId },
            data: {
              status,
              urgencyLevel,
              lastContactAt: now,
              firstContactAt: customer.firstContactAt ? undefined : now,
              nextContactAt: nextContactAt,
              nextContactNote: payload?.nextNote || null,
              contactCount: { increment: 1 },
            },
          }),
        );

        // Tạo Task mới nếu có hẹn
        if (nextContactAt) {
          // --- LOGIC XÁC ĐỊNH TYPE THÔNG MINH ---
          let taskType: "SALES" | "PURCHASE" | "MAINTENANCE" = "SALES";

          if (currentTask?.type === "MAINTENANCE") {
            // Nếu đang xử lý task bảo dưỡng thì task hẹn tiếp theo cũng là bảo dưỡng
            taskType = "MAINTENANCE";
          } else if (customer.status === "DEAL_DONE") {
            // Nếu khách đã chốt đơn xong xuôi, các lần gọi sau là chăm sóc bảo trì
            taskType = "MAINTENANCE";
          } else {
            // Các trường hợp còn lại dựa theo nhu cầu gốc của khách
            taskType = customer.type === "BUY" ? "SALES" : "PURCHASE";
          }
          operations.push(
            tx.task.create({
              data: {
                title: `Gọi lại: ${customer.fullName}`,
                content: payload?.nextNote || "Chăm sóc khách hàng",
                scheduledAt: nextContactAt,
                deadlineAt: dayjs(nextContactAt)
                  .add(maxLateMinutes, "minute")
                  .toDate(),
                type: taskType,
                assigneeId: user.id,
                customerId: customerId,
                status: "PENDING",
              },
            }),
          );
        }

        // Ghi nhật ký hoạt động
        operations.push(
          tx.leadActivity.create({
            data: {
              customerId,
              status,
              note: isLate ? `[TRỄ ${lateMinutes}m] ${note}` : note,
              createdById: user.id,
              reasonId: payload?.reasonId || null,
              isLate,
              lateMinutes,
            },
          }),
        );

        await Promise.all(operations);

        return { success: true, isLate, lateMinutes };
      },
      {
        timeout: 15000, // Tăng lên 15 giây để xử lý các tác vụ nặng
      },
    );

    // 5. Đưa revalidatePath RA NGOÀI Transaction
    revalidatePath("/dashboard/assigned-tasks");

    return serializePrisma(result);
  } catch (error: any) {
    console.error("🔥 Error in updateCustomerStatusAction:", error);
    return { success: false, error: error.message };
  }
}

//Tạo khách hàng mới và gán trực tiếp cho nhân

export async function selfCreateCustomerAction(values: any) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    // START: KIỂM TRA TRÙNG LẶP (Logic tương tự createCustomerAction)

    // 1. Chuẩn hóa biển số xe
    const cleanPlate = values.licensePlate
      ? values.licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, "")
      : undefined;

    // 2. Kiểm tra trùng Biển số (Chỉ trùng khi đang trong giai đoạn xử lý)
    if (cleanPlate) {
      const duplicatePlate = await db.customer.findFirst({
        where: {
          licensePlate: cleanPlate,
          status: {
            notIn: [
              LeadStatus.DEAL_DONE,
              LeadStatus.CANCELLED,
              LeadStatus.LOSE,
            ],
          },
        },
      });

      if (duplicatePlate) {
        return {
          success: false,
          error: `Biển số ${cleanPlate} đang hiện hữu trong hệ thống.`,
        };
      }
    }

    return await db.$transaction(async (tx) => {
      const now = new Date();

      // Tạo Customer
      const customer = await tx.customer.create({
        data: {
          fullName: values.fullName,
          phone: values.phone,
          status: LeadStatus.CONTACTED,
          type: values.type,
          referrerId: auth.id,
          assignedToId: auth.id,
          assignedAt: now,
          branchId: auth.branchId,
          carModelId: values.carModelId,
          licensePlate: values.licensePlate?.toUpperCase(),
          note: values.note,

          // Tạo LeadCar
          leadCar: {
            create: {
              carModelId: values.carModelId,
              licensePlate: values.licensePlate?.toUpperCase(),
              year: values.year,
            },
          },

          // TẠO TASK ĐỂ HIỂN THỊ TRÊN TRANG NHIỆM VỤ
          tasks: {
            create: {
              title: `🌟 CHĂM SÓC: ${values.fullName}`,
              content: `Khách hàng tự khai thác - ${values.note || "Nghiệp vụ " + values.type}`,
              scheduledAt: now,
              // Mẹo: Đặt Deadline 1 năm sau để không bao giờ bị báo "QUÁ HẠN" (LATE KPI)
              type: "PURCHASE", // CẬP NHẬT TYPE
              deadlineAt: dayjs(now).add(1, "year").toDate(),
              assigneeId: auth.id,
              status: "PENDING",
            },
          },

          activities: {
            create: {
              status: LeadStatus.CONTACTED,
              note: `[NHÂN VIÊN TỰ TẠO] Khách hàng tự khai thác. Biển số: ${values.licensePlate || "N/A"}`,
              createdById: auth.id,
            },
          },
        },
      });

      await tx.user.update({
        where: { id: auth.id },
        data: { lastAssignedAt: now },
      });

      revalidatePath("/dashboard/assigned-tasks");
      return { success: true, data: customer };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveLoseRequestAction(
  activityId: string,
  decision: "APPROVE" | "REJECT",
  targetStatus?: string,
) {
  const auth = await getCurrentUser();
  if (!auth || (auth.role !== "ADMIN" && auth.role !== "MANAGER")) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }

  try {
    const result = await db.$transaction(
      async (tx) => {
        // 1. Lấy thông tin Activity kèm theo reasonId
        const activity = await tx.leadActivity.findUnique({
          where: { id: activityId },
          include: { customer: true },
        });

        if (!activity) throw new Error("Không tìm thấy yêu cầu phê duyệt");

        if (decision === "APPROVE") {
          // --- TRƯỜNG HỢP: ĐỒNG Ý CHO DỪNG ---

          const finalStatus = (targetStatus as LeadStatus) || LeadStatus.LOSE;

          await tx.customer.update({
            where: { id: activity.customerId },
            data: {
              status: finalStatus,
              note: activity.note
                ? `${activity.customer.note}\n[ADMIN DUYỆT ĐÓNG]: ${activity.note}`
                : activity.customer.note,
            },
          });

          // Ghi log hoạt động cuối cùng - QUAN TRỌNG: Phải truyền reasonId vào đây
          await tx.leadActivity.create({
            data: {
              customerId: activity.customerId,
              status: finalStatus,
              reasonId: activity.reasonId, // Kế thừa lý do từ yêu cầu phê duyệt sang log cuối
              note: `✅ Admin [${auth.fullName}] đã phê duyệt đóng hồ sơ.`,
              createdById: auth.id,
            },
          });
        } else {
          // --- TRƯỜNG HỢP: TỪ CHỐI (BẮT LÀM TIẾP) ---
          const taskType =
            activity.customer.type === "BUY" ? "SALES" : "PURCHASE";
          await tx.customer.update({
            where: { id: activity.customerId },
            data: { status: LeadStatus.CONTACTED },
          });

          await tx.task.create({
            data: {
              title: "⚠️ TIẾP TỤC CHĂM SÓC: " + activity.customer.fullName,
              content: `Admin từ chối yêu cầu dừng hồ sơ. Lý do: Kiểm tra lại nhu cầu khách và tương tác thêm.`,
              assigneeId: activity.createdById,
              customerId: activity.customerId,
              type: taskType,
              scheduledAt: new Date(),
              deadlineAt: dayjs().add(4, "hour").toDate(),
              status: TaskStatus.PENDING,
            },
          });

          // Ghi log từ chối - Cũng nên giữ lại reasonId để biết họ từng xin nghỉ vì lý do gì
          await tx.leadActivity.create({
            data: {
              customerId: activity.customerId,
              status: LeadStatus.REJECTED_APPROVAL,
              reasonId: activity.reasonId,
              note: `❌ Admin [${auth.fullName}] từ chối yêu cầu đóng hồ sơ. Yêu cầu làm tiếp.`,
              createdById: auth.id,
            },
          });
        }

        // 3. Cập nhật chính Activity yêu cầu ban đầu
        await tx.leadActivity.update({
          where: { id: activityId },
          data: {
            status:
              decision === "APPROVE"
                ? LeadStatus.DEAL_DONE // Đánh dấu là đã xử lý xong yêu cầu này
                : LeadStatus.REJECTED_APPROVAL,
          },
        });

        return { success: true };
      },
      { timeout: 15000 },
    );

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/assigned-tasks");
    revalidatePath("/dashboard/frozen-leads"); // Thêm dòng này để cập nhật trang rã băng

    return { success: true };
  } catch (error: any) {
    console.error("Approve Lose Request Error:", error);
    return { success: false, error: error.message };
  }
}

// làm chức năng rã băng
export async function unfreezeCustomerAction(
  customerId: string,
  assigneeId: string, // Quản lý chọn người sẽ tiếp quản khách này
  note: string,
) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    return await db.$transaction(async (tx) => {
      // 1. Lấy thông tin khách hàng hiện tại để kiểm tra trạng thái và loại nghiệp vụ
      const currentCustomer = await tx.customer.findUnique({
        where: { id: customerId },
        select: {
          status: true,
          fullName: true,
          type: true, // Lấy trường type (BUY/SELL/...) để xác định Task Type
        },
      });

      if (!currentCustomer || currentCustomer.status !== "FROZEN") {
        throw new Error(
          "Hồ sơ này đã được rã băng hoặc không còn ở trạng thái đóng băng.",
        );
      }

      // 2. Cập nhật Customer sang trạng thái Follow up
      const customer = await tx.customer.update({
        where: { id: customerId },
        data: {
          status: "FOLLOW_UP",
          assignedToId: assigneeId,
          assignedAt: new Date(),
        },
      });

      // 3. Xác định loại nhiệm vụ (Task Type)
      // Nếu khách hàng ban đầu có nhu cầu mua (BUY) -> SALES
      // Nếu khách hàng có nhu cầu bán/định giá/đổi xe -> PURCHASE
      const taskType = currentCustomer.type === "BUY" ? "SALES" : "PURCHASE";

      // 4. Tạo Task mới cho nhân viên nhận khách kèm theo TYPE
      await tx.task.create({
        data: {
          title: `❄️ RÃ BĂNG: Tiếp tục chăm sóc ${customer.fullName}`,
          content: `Lý do rã băng: ${note}`,
          customerId: customerId,
          assigneeId: assigneeId,

          type: taskType, // CẬP NHẬT TYPE TẠI ĐÂY

          scheduledAt: new Date(),
          deadlineAt: dayjs().add(2, "hour").toDate(), // Phải liên hệ lại trong 2 tiếng
          status: "PENDING",
        },
      });

      // 5. Ghi nhật ký hoạt động
      await tx.leadActivity.create({
        data: {
          customerId: customerId,
          status: "FOLLOW_UP",
          note: `[RÃ BĂNG] - Quản lý ${auth.fullName} đã rã băng và giao cho nhân viên tiếp quản. Ghi chú: ${note}`,
          createdById: auth.id,
        },
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error("Unfreeze Error:", error);
    return { success: false, error: error.message };
  }
}

export async function approveDealAction(
  activityId: string,
  decision: "APPROVE" | "REJECT",
  adminNote: string,
  contractNo?: string, // THÊM: Số hợp đồng bán lẻ
) {
  try {
    const auth = await getCurrentUser();
    if (!auth || (auth.role !== "MANAGER" && !auth.isGlobalManager)) {
      throw new Error("Bạn không có quyền thực hiện phê duyệt này.");
    }

    const activity = await db.leadActivity.findUnique({
      where: { id: activityId },
      include: {
        customer: {
          include: { leadCar: true },
        },
      },
    });

    if (!activity) throw new Error("Không tìm thấy yêu cầu phê duyệt.");

    return await db.$transaction(
      async (tx) => {
        const customerId = activity.customerId;
        const stockCodeMatch =
          activity.customer?.leadCar?.description?.match(/([A-Z0-9-]{5,})/);
        const stockCode = stockCodeMatch ? stockCodeMatch[0] : null;

        if (decision === "REJECT") {
          // --- LOGIC TỪ CHỐI (Giữ nguyên) ---
          await tx.customer.update({
            where: { id: customerId },
            data: { status: LeadStatus.FOLLOW_UP },
          });

          if (stockCode) {
            await tx.car.update({
              where: { stockCode },
              data: { status: "READY_FOR_SALE" },
            });
          }

          await tx.task.create({
            data: {
              title: "⚠️ CẬP NHẬT LẠI HỒ SƠ CHỐT BÁN",
              content: `Admin từ chối chốt đơn. Lý do: ${adminNote}`,
              type: "SALES",
              status: "PENDING",
              customerId: customerId,
              assigneeId: activity.createdById,
              scheduledAt: new Date(),
              deadlineAt: dayjs().add(2, "hour").toDate(),
            },
          });

          await tx.leadActivity.update({
            where: { id: activityId },
            data: {
              status: LeadStatus.REJECTED_APPROVAL,
              note: `[TỪ CHỐI CHỐT ĐƠN]: ${adminNote}`,
            },
          });
        } else {
          // --- TRƯỜNG HỢP PHÊ DUYỆT BÁN ---
          if (!contractNo && decision === "APPROVE") {
            throw new Error("Vui lòng nhập số hợp đồng để hoàn tất chốt bán.");
          }

          // 1. Chốt khách hàng
          await tx.customer.update({
            where: { id: customerId },
            data: { status: LeadStatus.DEAL_DONE },
          });

          // 2. Chốt xe & Cập nhật SỐ HỢP ĐỒNG MỚI
          if (stockCode) {
            const car = await tx.car.update({
              where: { stockCode },
              data: {
                status: "SOLD",
                soldAt: new Date(),
                soldById: activity.createdById,
                contractNumber: contractNo, // CẬP NHẬT SỐ HỢP ĐỒNG BÁN LẺ VÀO ĐÂY
              },
            });

            // 3. Tạo lịch sử sở hữu xe (Ghi nhận hợp đồng SALE)
            await tx.carOwnerHistory.create({
              data: {
                carId: car.id,
                customerId: customerId,
                type: "SALE",
                contractNo: contractNo, // LƯU VẾT HỢP ĐỒNG VÀO HISTORY
                price: activity.customer?.leadCar?.finalPrice || 0,
                date: new Date(),
                note: `Quản lý ${auth.fullName} phê duyệt bán lẻ. Hợp đồng: ${contractNo}`,
              },
            });

            // 4. TỰ ĐỘNG TẠO TASK BẢO DƯỠNG (Giữ nguyên)
            const maintenanceDate = dayjs().add(1, "month").toDate();
            await tx.task.create({
              data: {
                title: "NHẮC BẢO DƯỠNG ĐỊNH KỲ (1 THÁNG)",
                content: `Liên hệ khách ${activity.customer?.fullName} cho xe ${car.modelName} (${car.licensePlate}). Hợp đồng: ${contractNo}`,
                type: "MAINTENANCE",
                scheduledAt: maintenanceDate,
                deadlineAt: dayjs(maintenanceDate).add(3, "day").toDate(),
                status: "PENDING",
                customerId: customerId,
                assigneeId: activity.createdById,
              },
            });
          }

          // 5. Cập nhật Activity
          await tx.leadActivity.update({
            where: { id: activityId },
            data: {
              status: LeadStatus.DEAL_DONE,
              note: `[PHÊ DUYỆT CHỐT ĐƠN]: ${adminNote}. Số HĐ: ${contractNo}`,
            },
          });
        }

        return { success: true };
      },
      { timeout: 20000 },
    );
  } catch (error: any) {
    console.error("Approve Deal Error:", error);
    return { success: false, error: error.message };
  }
}
// actions/task-actions.ts
export async function getMaintenanceTasksAction() {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: "Unauthorized" };
  return await db.task.findMany({
    where: {
      assigneeId: auth.id,
      status: "PENDING",
      type: "MAINTENANCE",
      title: { contains: "BẢO DƯỠNG" }, // Lọc theo từ khóa chúng ta đã set lúc Approve
    },
    include: { customer: true },
    orderBy: { deadlineAt: "asc" },
  });
}

export async function completeMaintenanceTaskAction(taskId: string) {
  const now = new Date();
  const task = await db.task.findUnique({ where: { id: taskId } });

  if (!task) return { success: false };

  // Tính KPI trễ phút nếu cần
  const isLate = now > task.deadlineAt;
  const lateMinutes = isLate
    ? Math.floor((now.getTime() - task.deadlineAt.getTime()) / 60000)
    : 0;

  await db.task.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt: now,
      isLate: isLate,
      lateMinutes: lateMinutes,
    },
  });
  return { success: true };
}

export async function getMyCustomersAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const customers = await db.customer.findMany({
    where: {
      assignedToId: user.id,
      status: {
        in: [
          "NEW",
          "CONTACTED",
          "FOLLOW_UP",
          "INSPECTING",
          "ASSIGNED",
          "PENDING_DEAL_APPROVAL",
          "PENDING_LOSE_APPROVAL",
        ], // Chỉ lấy khách đang trong luồng xử lý
      },
    },
    include: {
      carModel: { select: { name: true } },
      leadCar: true,
      branch: { select: { name: true } },
      activities: {
        include: {
          user: { select: { fullName: true } }, // Để biết ai là người ghi chú
        },
        orderBy: { createdAt: "desc" }, // Mới nhất hiện lên đầu
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return serializePrisma(customers);
}
