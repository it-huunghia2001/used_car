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
import { sendMail } from "@/lib/mail-service";
import {
  dealApprovalRequestEmailTemplate,
  dealResultEmailTemplate,
  loseApprovalRequestEmailTemplate,
  loseResultEmailTemplate,
  purchaseResultEmailTemplate,
  purchaseResultEmailTemplate2,
  saleApprovalRequestEmailTemplate,
  unfreezeAssignmentEmailTemplate,
} from "@/lib/mail-templates";

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
              inspectorRef: {
                select: {
                  fullName: true,
                },
              },
              notSeenReasonRef: {
                select: {
                  name: true,
                },
              },
              buyReasonRef: {
                select: {
                  name: true,
                },
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
    // Ép kiểu các trường số để tránh lỗi Prisma (Int/Decimal)
    const formattedCarData = {
      ...values.carData,
      year: values.carData.year ? Number(values.carData.year) : null,
      odo: values.carData.odo ? Number(values.carData.odo) : 0,
      seats: values.carData.seats ? Number(values.carData.seats) : 5,
    };

    const result = await db.$transaction(async (tx) => {
      // 1. Lấy thông tin khách hàng và chi nhánh
      const customer = await tx.customer.findUnique({
        where: { id: leadId },
        include: { branch: true }, // Lấy thêm thông tin chi nhánh
      });

      if (!customer) throw new Error("Không tìm thấy khách hàng");
      if (customer.status === LeadStatus.PENDING_DEAL_APPROVAL) {
        throw new Error("Hồ sơ này đã được gửi duyệt trước đó");
      }

      const now = new Date();

      // 2. Cập nhật trạng thái Task (Hoàn thành task gọi điện/chăm sóc)
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
          nextContactAt: null,
        },
      });

      // 4. Tạo Activity Snapshot
      const activity = await tx.leadActivity.create({
        data: {
          customerId: leadId,
          status: LeadStatus.PENDING_DEAL_APPROVAL,
          note: JSON.stringify({
            requestType: "CAR_PURCHASE",
            carData: formattedCarData,
            contractData: values.contractData,
            submittedAt: now.toISOString(),
          }),
          createdById: auth.id,
        },
      });

      // 5. Đồng bộ vào LeadCar
      await tx.leadCar.upsert({
        where: { customerId: leadId },
        update: {
          ...formattedCarData,
          finalPrice: values.contractData.price,
        },
        create: {
          customerId: leadId,
          ...formattedCarData,
          finalPrice: values.contractData.price,
        },
      });

      return {
        activityId: activity.id,
        customerName: customer.fullName,
        branchId: customer.branchId,
        branchName: customer.branch?.name || "Chi nhánh gốc",
      };
    });

    // 6. GỬI THÔNG BÁO EMAIL (Chạy ngoài transaction)
    (async () => {
      try {
        // Lấy danh sách quản lý: Manager của chi nhánh đó HOẶC Global Manager
        const managers = await db.user.findMany({
          where: {
            active: true,
            OR: [
              { isGlobalManager: true },
              {
                role: "MANAGER",
                branchId: result.branchId,
              },
            ],
          },
          select: { email: true },
        });

        const managerEmails = managers.map((m) => m.email).filter(Boolean);

        if (managerEmails.length > 0) {
          await sendMail({
            to: managerEmails.join(","),
            subject: `[PHÊ DUYỆT] Đề nghị chốt Thu mua: ${result.customerName.toUpperCase()}`,
            html: dealApprovalRequestEmailTemplate({
              staffName: auth.fullName || auth.username,
              customerName: result.customerName,
              carName: formattedCarData.modelName,
              licensePlate: formattedCarData.licensePlate,
              dealPrice: Number(values.contractData.price),
              contractNo: values.contractData.contractNo,
              type: "PURCHASE",
              branchName: result.branchName,
            }),
          });
        }
      } catch (mailError) {
        console.error("Lỗi gửi mail phê duyệt:", mailError);
      }
    })();

    // 7. Revalidate
    revalidatePath("/dashboard/assigned-tasks");
    revalidatePath("/dashboard/approvals");
    revalidatePath(`/dashboard/customers/${leadId}`);

    return { success: true, activityId: result.activityId };
  } catch (error: any) {
    console.error("Purchase Approval Error:", error);
    return { success: false, error: error.message || "Lỗi hệ thống" };
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
      include: {
        customer: { include: { branch: true } },
        user: { select: { email: true, fullName: true, username: true } },
      },
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
        // --- 1. TRƯỜNG HỢP TỪ CHỐI ---
        if (decision === "REJECT") {
          await tx.customer.update({
            where: { id: activity.customerId },
            data: { status: "FOLLOW_UP" },
          });

          await tx.task.updateMany({
            where: { customerId: activity.customerId, status: "PENDING" },
            data: { status: "CANCELLED" },
          });

          await tx.task.create({
            data: {
              title: "SỬA HỒ SƠ: Thu mua bị từ chối",
              content: `Lý do: ${reason || "Không xác định"}. Vui lòng chỉnh sửa lại thông tin xe và gửi duyệt lại.`,
              type: "PURCHASE",
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

          return { type: "REJECTED", price: 0 };
        }

        // --- 2. TRƯỜNG HỢP PHÊ DUYỆT ---
        if (isPurchaseRequest) {
          const carData = adminUpdatedData || purchaseData.carData;
          const contractData = adminUpdatedData
            ? {
                price: adminUpdatedData.price,
                contractNo: adminUpdatedData.contractNo,
              }
            : purchaseData.contractData;

          // Xác định chi nhánh cho xe
          const staff = await tx.user.findUnique({
            where: { id: activity.createdById },
            select: { branchId: true },
          });
          const finalBranchId = staff?.branchId || activity.customer.branchId;
          if (!finalBranchId) throw new Error("Không xác định được chi nhánh.");

          // LỌC DỮ LIỆU SẠCH (Loại bỏ các trường không có trong Schema Car)
          const {
            price,
            contractNo,
            id,
            customerId,
            createdAt,
            updatedAt,
            note,
            adminNote,
            ...validCarFields
          } = carData;

          // Logic tạo Stock Code
          const carModelDb = await tx.carModel.findUnique({
            where: { id: carData.carModelId },
          });
          const carTypePrefix = (carModelDb?.grade || "CAR")
            .substring(0, 3)
            .toUpperCase();
          const yearSuffix = new Date().getFullYear().toString().slice(-2);

          const lastCar = await tx.car.findFirst({
            where: {
              stockCode: { startsWith: `${carTypePrefix}${yearSuffix}` },
            },
            orderBy: { stockCode: "desc" },
          });
          const lastNumber = lastCar
            ? parseInt(lastCar.stockCode.slice(-3))
            : 0;
          const generatedStockCode = `${carTypePrefix}${yearSuffix}${(lastNumber + 1).toString().padStart(3, "0")}`;

          // TẠO XE NHẬP KHO
          const createdCar = await tx.car.create({
            data: {
              ...validCarFields,
              stockCode: generatedStockCode,
              vin: carData.vin?.toUpperCase() || null,
              engineNumber: carData.engineNumber?.toUpperCase() || null,
              licensePlate: carData.licensePlate?.toUpperCase() || null,
              year: carData.year
                ? Number(carData.year)
                : new Date().getFullYear(),
              odo: carData.odo ? Number(carData.odo) : 0,
              seats: carData.seats ? Number(carData.seats) : 5,
              costPrice: contractData.price,
              contractNumber: contractData.contractNo,
              modelName: carModelDb?.name ?? "Xe thu mua",
              branchId: finalBranchId,
              purchaserId: activity.createdById,
              referrerId: activity.customer.referrerId,
              purchasedAt: new Date(),
              status: "REFURBISHING",
              //authorizedOwnerName đã được spread từ validCarFields nếu có trong carData
            },
          });

          // Ghi lịch sử và cập nhật trạng thái
          await tx.carOwnerHistory.create({
            data: {
              carId: createdCar.id,
              customerId: activity.customerId,
              type: "PURCHASE",
              contractNo: contractNo,
              price: contractData.price,
              date: new Date(),
            },
          });

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
              note: `✅ Nhập kho: ${generatedStockCode}`,
            },
          });

          return {
            type: "PURCHASE_DONE",
            stockCode: generatedStockCode,
            price: contractData.price,
            carName: carModelDb?.name,
          };
        }
        return { type: "UNKNOWN", price: 0 };
      },
      { timeout: 30000 },
    );

    // --- GỬI EMAIL THÔNG BÁO (NGOÀI TRANSACTION) ---
    if (activity.user?.email && result.type !== "UNKNOWN") {
      sendMail({
        to: activity.user.email,
        subject: `[KẾT QUẢ] Phê duyệt thu mua: ${activity.customer.fullName}`,
        html: purchaseResultEmailTemplate({
          staffName: activity.user.fullName || "Nhân viên",
          customerName: activity.customer.fullName,
          decision,
          reason,
          stockCode: (result as any).stockCode,
          carName: (result as any).carName || "Xe thu mua",
          price: Number(result.price),
        }),
      }).catch((err) => console.error("Mail Error:", err));
    }

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("🔥 Error:", error);
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
    contractNo: string; // THÊM TRƯỜNG NÀY
    note: string;
  },
  taskId?: string,
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Unauthorized");

    const now = new Date();

    const result = await db.$transaction(
      async (tx) => {
        // 1. Lấy dữ liệu cần thiết
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          include: { branch: true },
        });
        if (!customer) throw new Error("Khách hàng không tồn tại");

        const car = await tx.car.findUnique({
          where: { id: data.carId },
          select: { stockCode: true, modelName: true },
        });
        if (!car) throw new Error("Xe không tồn tại trong kho");

        // 2. Xử lý Task (nếu có)
        if (taskId && taskId !== customerId) {
          await tx.task.updateMany({
            where: { id: taskId, status: "PENDING" },
            data: {
              status: "COMPLETED",
              completedAt: now,
              // Logic tính trễ (isLate) có thể thêm ở đây nếu cần
            },
          });
        }

        // 3. Cập nhật trạng thái khách hàng & Số hợp đồng dự kiến
        await tx.customer.update({
          where: { id: customerId },
          data: {
            status: "PENDING_DEAL_APPROVAL",
            leadCar: {
              upsert: {
                create: {
                  finalPrice: data.finalPrice,
                  note: `HĐ: ${data.contractNo} | HTTT: ${data.paymentMethod}`,
                },
                update: {
                  finalPrice: data.finalPrice,
                  note: `HĐ: ${data.contractNo} | HTTT: ${data.paymentMethod} | Ghi chú: ${data.note}`,
                },
              },
            },
          },
        });

        // 4. Ghi log hoạt động phê duyệt
        const activity = await tx.leadActivity.create({
          data: {
            customerId: customerId,
            status: "PENDING_DEAL_APPROVAL",
            note: `[YÊU CẦU CHỐT BÁN] HĐ: ${data.contractNo}. Xe: ${car.stockCode}. Giá: ${data.finalPrice.toLocaleString()}đ.`,
            createdById: auth.id,
          },
        });

        // 5. Khóa xe
        await tx.car.update({
          where: { id: data.carId },
          data: {
            status: "BOOKED",
            contractNumber: data.contractNo, // Lưu tạm số hợp đồng vào xe
          },
        });

        return {
          activity,
          customerName: customer.fullName,
          branchId: customer.branchId,
          branchName: customer.branch?.name || "Hệ thống",
          car,
        };
      },
      { timeout: 20000 },
    );

    // 6. Gửi Email (Background Task)
    (async () => {
      try {
        const managers = await db.user.findMany({
          where: {
            active: true,
            OR: [
              { isGlobalManager: true },
              { role: "MANAGER", branchId: result.branchId },
            ],
          },
          select: { email: true },
        });

        const emails = managers.map((m) => m.email).filter(Boolean);
        if (emails.length > 0) {
          await sendMail({
            to: emails.join(","),
            subject: `[DUYỆT BÁN] HĐ ${data.contractNo} - Khách hàng: ${result.customerName.toUpperCase()}`,
            html: saleApprovalRequestEmailTemplate({
              staffName: auth.fullName || auth.username,
              customerName: result.customerName,
              carName: result.car.modelName,
              stockCode: result.car.stockCode,
              finalPrice: data.finalPrice,
              paymentMethod: data.paymentMethod,
              contractNo: data.contractNo,
              note: data.note,
              branchName: result.branchName,
            }),
          });
        }
      } catch (err) {
        console.error("Lỗi gửi mail phê duyệt bán:", err);
      }
    })();

    revalidatePath("/dashboard/sales-tasks");
    revalidatePath("/dashboard/approvals");

    return { success: true };
  } catch (error: any) {
    console.error("Sale Approval Error:", error);
    return { success: false, error: error.message };
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
    // 1. LẤY THÔNG TIN CHI TIẾT (Để phục vụ gửi mail và kiểm tra điều kiện)
    const [customer, reason] = await Promise.all([
      db.customer.findUnique({
        where: { id: customerId },
        include: { branch: true },
      }),
      db.leadReason.findUnique({
        where: { id: reasonId },
        select: { content: true },
      }),
    ]);

    if (!customer) throw new Error("Khách hàng không tồn tại");

    // Chặn gửi trùng yêu cầu
    if (
      ["PENDING_LOSE_APPROVAL", "PENDING_DEAL_APPROVAL"].includes(
        customer.status,
      )
    ) {
      return {
        success: false,
        error:
          "Hồ sơ này đang trong trạng thái chờ duyệt, vui lòng không gửi lại.",
      };
    }

    // 2. THỰC HIỆN TRONG TRANSACTION
    const result = await db.$transaction(
      async (tx) => {
        const now = new Date();

        // Kiểm tra Task trễ hạn trước khi đóng
        const lateTask = await tx.task.findFirst({
          where: {
            assigneeId: auth.id,
            customerId: customerId,
            status: "PENDING",
            deadlineAt: { lt: now },
          },
          orderBy: { deadlineAt: "asc" },
        });

        const isLate = !!lateTask;
        const lateMinutes = lateTask
          ? dayjs(now).diff(lateTask.deadlineAt, "minute")
          : 0;

        // A. Đóng tất cả task đang mở của hồ sơ này
        await tx.task.updateMany({
          where: {
            assigneeId: auth.id,
            customerId: customerId,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            completedAt: now,
            isLate,
            lateMinutes,
          },
        });

        // B. Cập nhật trạng thái khách hàng sang Chờ duyệt hủy
        const updatedCustomer = await tx.customer.update({
          where: { id: customerId },
          data: { status: "PENDING_LOSE_APPROVAL" },
        });

        // C. Tạo Nhật ký phê duyệt (Snap-shot dữ liệu tại thời điểm gửi)
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
      { timeout: 20000 },
    );

    // 3. GỬI THÔNG BÁO EMAIL (Chạy Background - Không đợi mail xong mới trả kết quả)
    (async () => {
      try {
        const managers = await db.user.findMany({
          where: {
            active: true,
            OR: [
              { isGlobalManager: true },
              { role: "MANAGER", branchId: customer.branchId },
            ],
          },
          select: { email: true },
        });

        const managerEmails = managers.map((m) => m.email).filter(Boolean);

        if (managerEmails.length > 0) {
          await sendMail({
            to: managerEmails.join(","),
            subject: `[YÊU CẦU DUYỆT ĐÓNG] Khách hàng: ${customer.fullName.toUpperCase()}`,
            html: loseApprovalRequestEmailTemplate({
              staffName: auth.fullName || auth.username,
              customerName: customer.fullName,
              customerPhone: customer.phone,
              reason: reason?.content || "Không rõ lý do",
              note: note,
              targetStatus: targetStatus,
              branchName: customer.branch?.name || "Hệ thống",
            }),
          });
        }
      } catch (err) {
        console.error("Lỗi gửi mail thông báo duyệt hủy:", err);
      }
    })();

    // 4. LÀM MỚI DỮ LIỆU UI
    revalidatePath("/dashboard/assigned-tasks");
    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/leads");

    return { success: true };
  } catch (error: any) {
    console.error("Lose Request Error:", error);
    return {
      success: false,
      error: error.message || "Lỗi hệ thống khi xử lý yêu cầu",
    };
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

        // 4. THỰC THI SONG SONG CÁC LỆNH GHI (Tối ưu tốc độ tránh Timeout)
        const operations = [];

        // Cập nhật khách hàng
        operations.push(
          tx.customer.update({
            where: { id: customerId },
            data: {
              status,
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
        timeout: 20000, // Tăng lên 15 giây để xử lý các tác vụ nặng
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
    // 1. CHUẨN HÓA DỮ LIỆU
    const cleanPlate = values.licensePlate
      ? values.licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, "")
      : undefined;

    const activeStatuses = {
      notIn: [LeadStatus.DEAL_DONE, LeadStatus.CANCELLED, LeadStatus.LOSE],
    };

    // 2. KIỂM TRA TRÙNG LẶP (Đồng bộ logic với createCustomerAction)
    if (values.type === "BUY") {
      // Đối với khách MUA: Chặn trùng Số điện thoại đang xử lý
      const duplicatePhone = await db.customer.findFirst({
        where: {
          phone: values.phone,
          type: "BUY",
          status: activeStatuses,
        },
      });

      if (duplicatePhone) {
        return {
          success: false,
          error: `Số điện thoại ${values.phone} đang có yêu cầu MUA XE đang xử lý.`,
        };
      }
    } else if (cleanPlate) {
      // Đối với khách BÁN/ĐỊNH GIÁ: Chặn trùng Biển số xe đang xử lý
      const duplicatePlate = await db.customer.findFirst({
        where: {
          licensePlate: cleanPlate,
          status: activeStatuses,
        },
      });

      if (duplicatePlate) {
        return {
          success: false,
          error: `Biển số ${cleanPlate} đang hiện hữu và đang được xử lý trên hệ thống.`,
        };
      }
    }

    // 3. TRANSACTION LƯU DỮ LIỆU
    return await db.$transaction(async (tx) => {
      const now = new Date();

      const customer = await tx.customer.create({
        data: {
          fullName: values.fullName,
          phone: values.phone,
          status: LeadStatus.CONTACTED, // Tự tạo thì nhảy thẳng sang Contacted
          type: values.type,
          referrerId: auth.id,
          assignedToId: auth.id,
          assignedAt: now,
          branchId: auth.branchId,
          carModelId: values.carModelId,
          licensePlate: cleanPlate,
          note: values.note,

          leadCar: {
            create: {
              carModelId: values.carModelId,
              licensePlate: cleanPlate,
              year: values.year ? values.year : undefined, // Đảm bảo kiểu string cho carYear
            },
          },

          tasks: {
            create: {
              title: `🌟 CHĂM SÓC: ${values.fullName}`,
              content: `Khách hàng tự khai thác - ${values.note || "Nghiệp vụ " + values.type}`,
              scheduledAt: now,
              // Deadline 1 năm để nhân viên tự quản lý, không ép KPI trễ phút
              deadlineAt: dayjs(now).add(1, "year").toDate(),
              assigneeId: auth.id,
              status: TaskStatus.PENDING,
              type: values.type === "BUY" ? "SALES" : "PURCHASE", // Gán type task chuẩn theo nghiệp vụ
            },
          },

          activities: {
            create: {
              status: LeadStatus.CONTACTED,
              note: `[NHÂN VIÊN TỰ TẠO] Khách hàng tự khai thác. Biển số: ${cleanPlate || "N/A"}`,
              createdById: auth.id,
            },
          },
        },
      });

      // Cập nhật mốc thời gian gán cuối cho chính nhân viên này
      await tx.user.update({
        where: { id: auth.id },
        data: { lastAssignedAt: now },
      });

      revalidatePath("/dashboard/assigned-tasks");
      revalidatePath("/dashboard/my-referrals"); // Revalidate thêm trang lịch sử cá nhân

      return { success: true, data: JSON.parse(JSON.stringify(customer)) };
    });
  } catch (error: any) {
    console.error("Lỗi selfCreateCustomerAction:", error);
    return { success: false, error: error.message || "Lỗi hệ thống" };
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
    // 1. Lấy thông tin Activity và nhân viên đề xuất
    const activity = await db.leadActivity.findUnique({
      where: { id: activityId },
      include: {
        customer: true,
        user: {
          // Nhân viên đề xuất (người nhận mail)
          select: { email: true, fullName: true, username: true },
        },
      },
    });

    if (!activity) throw new Error("Không tìm thấy yêu cầu phê duyệt");

    const result = await db.$transaction(
      async (tx) => {
        const customerId = activity.customerId;
        const finalStatus = (targetStatus as LeadStatus) || LeadStatus.LOSE;

        if (decision === "APPROVE") {
          // --- ĐỒNG Ý CHO DỪNG ---
          await tx.customer.update({
            where: { id: customerId },
            data: {
              status: finalStatus,
              note: activity.note
                ? `${activity.customer.note}\n[ADMIN DUYỆT ĐÓNG]: ${activity.note}`
                : activity.customer.note,
            },
          });

          await tx.leadActivity.create({
            data: {
              customerId: customerId,
              status: finalStatus,
              reasonId: activity.reasonId,
              note: `✅ Admin [${auth.fullName}] đã phê duyệt đóng hồ sơ.`,
              createdById: auth.id,
            },
          });
        } else {
          // --- TỪ CHỐI (BẮT LÀM TIẾP) ---
          const taskType =
            activity.customer.type === "BUY" ? "SALES" : "PURCHASE";

          await tx.customer.update({
            where: { id: customerId },
            data: { status: LeadStatus.CONTACTED },
          });

          await tx.task.create({
            data: {
              title: "⚠️ TIẾP TỤC CHĂM SÓC: " + activity.customer.fullName,
              content: `Admin từ chối yêu cầu dừng hồ sơ. Lý do: Kiểm tra lại nhu cầu khách và tương tác thêm.`,
              assigneeId: activity.createdById,
              customerId: customerId,
              type: taskType,
              scheduledAt: new Date(),
              deadlineAt: dayjs().add(4, "hour").toDate(),
              status: TaskStatus.PENDING,
            },
          });

          await tx.leadActivity.create({
            data: {
              customerId: customerId,
              status: LeadStatus.REJECTED_APPROVAL,
              reasonId: activity.reasonId,
              note: `❌ Admin [${auth.fullName}] từ chối yêu cầu đóng hồ sơ. Yêu cầu làm tiếp.`,
              createdById: auth.id,
            },
          });
        }

        // Cập nhật Activity yêu cầu ban đầu là đã xử lý
        await tx.leadActivity.update({
          where: { id: activityId },
          data: {
            status:
              decision === "APPROVE"
                ? LeadStatus.DEAL_DONE
                : LeadStatus.REJECTED_APPROVAL,
          },
        });

        return { success: true };
      },
      { timeout: 15000 },
    );

    // 2. GỬI EMAIL THÔNG BÁO CHO NHÂN VIÊN (Background task)
    if (activity.user?.email) {
      (async () => {
        try {
          await sendMail({
            to: activity.user.email,
            subject: `[KẾT QUẢ] Duyệt dừng hồ sơ khách hàng: ${activity.customer.fullName.toUpperCase()}`,
            html: loseResultEmailTemplate({
              staffName:
                activity.user.fullName || activity.user.username || "Nhân viên",
              customerName: activity.customer.fullName,
              decision: decision,
              targetStatus: targetStatus,
            }),
          });
        } catch (e) {
          console.error("Lỗi gửi mail phản hồi dừng hồ sơ:", e);
        }
      })();
    }

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/assigned-tasks");
    revalidatePath("/dashboard/frozen-leads");

    return { success: true };
  } catch (error: any) {
    console.error("Approve Lose Request Error:", error);
    return { success: false, error: error.message };
  }
}

// làm chức năng rã băng
export async function unfreezeCustomerAction(
  customerId: string,
  assigneeId: string,
  note: string,
) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Lấy thông tin khách hàng và chi tiết nhân viên mới
      const currentCustomer = await tx.customer.findUnique({
        where: { id: customerId },
        include: { branch: true },
      });

      if (!currentCustomer || currentCustomer.status !== "FROZEN") {
        throw new Error(
          "Hồ sơ này đã được rã băng hoặc không còn ở trạng thái đóng băng.",
        );
      }

      const assignee = await tx.user.findUnique({
        where: { id: assigneeId },
        select: { email: true, fullName: true, username: true },
      });

      if (!assignee) throw new Error("Không tìm thấy nhân viên tiếp quản.");

      const now = new Date();

      // 2. Cập nhật Customer
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          status: "FOLLOW_UP",
          assignedToId: assigneeId,
          assignedAt: now,
        },
      });

      // 3. Xác định loại nhiệm vụ
      const taskType = currentCustomer.type === "BUY" ? "SALES" : "PURCHASE";
      const typeLabel =
        currentCustomer.type === "BUY" ? "MUA XE" : "THU MUA / ĐỊNH GIÁ";

      // 4. Tạo Task mới
      await tx.task.create({
        data: {
          title: `❄️ RÃ BĂNG: Tiếp tục chăm sóc ${updatedCustomer.fullName}`,
          content: `Lý do rã băng: ${note}`,
          customerId: customerId,
          assigneeId: assigneeId,
          type: taskType,
          scheduledAt: now,
          deadlineAt: dayjs(now).add(2, "hour").toDate(),
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

      return {
        success: true,
        assignee,
        customerName: updatedCustomer.fullName,
        customerPhone: updatedCustomer.phone,
        branchName: currentCustomer.branch?.name,
        typeLabel,
      };
    });

    // 6. GỬI MAIL THÔNG BÁO CHO NHÂN VIÊN ĐƯỢC CHỌN (Background)
    if (result.assignee.email) {
      (async () => {
        try {
          await sendMail({
            to: result.assignee.email,
            subject: `[NHIỆM VỤ RÃ BĂNG] Chăm sóc khách hàng: ${result.customerName.toUpperCase()}`,
            html: unfreezeAssignmentEmailTemplate({
              staffName: result.assignee.fullName || result.assignee.username,
              customerName: result.customerName,
              customerPhone: result.customerPhone,
              unfreezeNote: note,
              typeLabel: result.typeLabel,
              branchName: result.branchName || "Chi nhánh gốc",
            }),
          });
        } catch (mailErr) {
          console.error("Lỗi gửi mail rã băng:", mailErr);
        }
      })();
    }

    revalidatePath("/dashboard/frozen-leads");
    revalidatePath("/dashboard/assigned-tasks");

    return { success: true };
  } catch (error: any) {
    console.error("Unfreeze Error:", error);
    return { success: false, error: error.message };
  }
}

export async function approveDealAction(
  activityId: string,
  decision: "APPROVE" | "REJECT",
  adminNote: string,
  contractNo?: string,
) {
  try {
    const auth = await getCurrentUser();
    if (!auth || (auth.role !== "MANAGER" && !auth.isGlobalManager)) {
      throw new Error("Bạn không có quyền thực hiện phê duyệt này.");
    }

    // 1. Lấy thông tin Activity trước để giảm tải cho Transaction
    const activity = await db.leadActivity.findUnique({
      where: { id: activityId },
      include: {
        customer: { include: { leadCar: true } },
        user: { select: { email: true, fullName: true, username: true } },
      },
    });

    if (!activity) throw new Error("Không tìm thấy yêu cầu phê duyệt.");

    // Dữ liệu trả về để dùng cho việc gửi mail sau transaction
    let emailData: any = null;

    // 2. Chạy Transaction tập trung vào các lệnh ghi DB
    await db.$transaction(
      async (tx) => {
        const customerId = activity.customerId;

        // Tìm xe đang bị khóa (BOOKED) dựa trên số hợp đồng nhân viên đã nhập lúc gửi duyệt
        const linkedCar = await tx.car.findFirst({
          where: {
            status: "BOOKED",
            contractNumber: contractNo,
          },
        });

        if (!linkedCar) {
          throw new Error(
            `Không tìm thấy xe đang BOOKED với số HĐ: ${contractNo}`,
          );
        }

        if (decision === "REJECT") {
          // --- LOGIC TỪ CHỐI ---
          await tx.customer.update({
            where: { id: customerId },
            data: { status: LeadStatus.FOLLOW_UP },
          });

          await tx.car.update({
            where: { id: linkedCar.id },
            data: {
              status: "READY_FOR_SALE",
              contractNumber: null,
            },
          });

          await tx.task.create({
            data: {
              title: "⚠️ SỬA HỒ SƠ CHỐT BÁN BỊ TỪ CHỐI",
              content: `Lý do: ${adminNote}. Khách: ${activity.customer?.fullName}`,
              type: "SALES",
              status: "PENDING",
              customerId,
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
          // --- LOGIC PHÊ DUYỆT ---
          if (!contractNo) throw new Error("Thiếu số hợp đồng.");

          await tx.customer.update({
            where: { id: customerId },
            data: { status: LeadStatus.DEAL_DONE },
          });

          const car = await tx.car.update({
            where: { id: linkedCar.id },
            data: {
              status: "SOLD",
              soldAt: new Date(),
              soldById: activity.createdById,
              contractNumber: contractNo,
            },
          });

          await tx.carOwnerHistory.create({
            data: {
              carId: car.id,
              customerId,
              type: "SALE",
              contractNo,
              price: activity.customer?.leadCar?.finalPrice || 0,
              date: new Date(),
            },
          });

          // Hẹn lịch bảo dưỡng
          const mDate = dayjs().add(1, "month").toDate();
          await tx.task.create({
            data: {
              title: "NHẮC BẢO DƯỠNG ĐỊNH KỲ",
              type: "MAINTENANCE",
              scheduledAt: mDate,
              deadlineAt: dayjs(mDate).add(3, "day").toDate(),
              customerId,
              assigneeId: activity.createdById,
            },
          });

          await tx.leadActivity.update({
            where: { id: activityId },
            data: {
              status: LeadStatus.DEAL_DONE,
              note: `[PHÊ DUYỆT CHỐT ĐƠN]: ${adminNote}. Số HĐ: ${contractNo}`,
            },
          });
        }

        // Gán dữ liệu cho emailData TRƯỚC khi thoát transaction
        emailData = {
          carName: linkedCar.modelName,
          staffEmail: activity.user?.email,
        };
      },
      {
        timeout: 30000, // Tăng timeout lên 30s
      },
    );

    // 3. GỬI MAIL VÀ REVALIDATE NGOÀI TRANSACTION (Để tránh lỗi ID invalid)
    if (emailData?.staffEmail) {
      sendMail({
        to: emailData.staffEmail,
        subject: `[KẾT QUẢ] Phê duyệt hồ sơ: ${activity.customer?.fullName.toUpperCase()}`,
        html: dealResultEmailTemplate({
          staffName: activity.user?.fullName || "Nhân viên",
          customerName: activity.customer?.fullName || "Khách hàng",
          decision,
          adminNote,
          contractNo,
          carName: emailData.carName,
        }),
      }).catch((err) => console.error("Mail error:", err));
    }

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/cars");

    return { success: true };
  } catch (error: any) {
    console.error("🔥 Approve Deal Error:", error);
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

export async function getAllStaffAPPRAISERAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return await db.user.findMany({
    where: { active: true, role: Role.APPRAISER },
    select: { id: true, fullName: true, username: true },
  });
}

// 2. Lấy danh mục lý do bán xe
export async function getSellReasonsAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return await db.reasonBuyCar.findMany({
    orderBy: { name: "asc" },
  });
}

// 3. Lấy danh mục lý do chưa xem xe
export async function getNotSeenReasonsAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return await db.notSeenCarModel.findMany({
    orderBy: { name: "asc" },
  });
}
