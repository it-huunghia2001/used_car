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
import dayjs from "@/lib/dayjs"; // Sử dụng file config ở trên
import { getCurrentUser } from "@/lib/session-server";

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

export async function getMyTasksAction() {
  try {
    const user = await getAuthUser();
    if (!user?.id) return [];

    const now = dayjs().tz("Asia/Ho_Chi_Minh");

    const [config, tasks] = await Promise.all([
      db.leadSetting.findFirst(),
      db.task.findMany({
        where: {
          assigneeId: user.id,
          status: "PENDING",
        },
        include: {
          customer: {
            include: {
              carModel: { select: { id: true, name: true } },
              referrer: { select: { fullName: true } },
              // LẤY ĐẦY ĐỦ THÔNG TIN XE Ở ĐÂY
              leadCar: true,

              activities: {
                include: {
                  user: { select: { fullName: true } }, // Để biết ai là người ghi chú
                },
                orderBy: { createdAt: "desc" }, // Mới nhất hiện lên đầu
              },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      }),
    ]);

    const maxLate = config?.maxLateMinutes || 30;

    return tasks.map((task) => {
      const scheduledAtVN = dayjs(task.scheduledAt).tz("Asia/Ho_Chi_Minh");
      const deadline = scheduledAtVN.add(maxLate, "minute");

      const isOverdue = now.isAfter(deadline);
      const minutesOverdue = isOverdue ? now.diff(deadline, "minute") : 0;

      // 1. Lấy leadCar ra và xử lý riêng
      const rawLeadCar = task.customer?.leadCar;
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
            // Đảm bảo ép kiểu luôn các trường Decimal khác nếu có (ví dụ: seats, engine...)
          }
        : null;

      // 2. Chuyển toàn bộ task thành Plain Object MỘT LẦN DUY NHẤT
      const plainTask = JSON.parse(JSON.stringify(task));

      // 3. Ghi đè dữ liệu đã xử lý vào object sạch
      return {
        ...plainTask,
        isOverdue,
        minutesOverdue,
        customer: {
          ...plainTask.customer,
          leadCar: formattedLeadCar, // Thay thế data thô bằng data đã ép kiểu Number
        },
      };
    });
  } catch (error) {
    console.error("Error in getMyTasksAction:", error);
    return [];
  }
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
  reason?: string,
) {
  const auth = await getAuthUser();
  if (!auth) {
    return {
      success: false,
      error: "Bạn không có quyền thực hiện thao tác này",
    };
  }

  try {
    // 1. Tìm Activity
    const activity = await db.leadActivity.findUnique({
      where: { id: activityId },
      include: { customer: true },
    });

    if (!activity) {
      return { success: false, error: "Không tìm thấy dữ liệu yêu cầu" };
    }

    // 2. PHÂN LOẠI DỮ LIỆU: Kiểm tra xem có phải yêu cầu Thu mua (JSON) không
    let isPurchaseRequest = false;
    let purchaseData: any = null;

    try {
      if (
        activity.note &&
        (activity.note.includes("carData") || activity.note.startsWith("{"))
      ) {
        purchaseData = JSON.parse(activity.note);
        if (purchaseData.carData) isPurchaseRequest = true;
      }
    } catch (e) {
      isPurchaseRequest = false;
    }

    // 3. Lấy thông tin nhân viên (chỉ cần cho trường hợp Thu mua xe)
    let staff: any = null;
    if (isPurchaseRequest) {
      staff = await db.user.findUnique({
        where: { id: activity.createdById },
        select: { id: true, branchId: true },
      });
      if (!staff || !staff.branchId) {
        return {
          success: false,
          error: "Nhân viên đề xuất không tồn tại hoặc thiếu chi nhánh",
        };
      }
    }

    // --- BẮT ĐẦU TRANSACTION ---
    const result = await db.$transaction(
      async (tx) => {
        // TRƯỜNG HỢP: TỪ CHỐI (REJECT)
        if (decision === "REJECT") {
          // Cập nhật khách về trạng thái cũ để tiếp tục chăm sóc
          await tx.customer.update({
            where: { id: activity.customerId },
            data: { status: "FOLLOW_UP" },
          });

          // Tạo log từ chối
          await tx.leadActivity.create({
            data: {
              customerId: activity.customerId,
              status: "REJECTED_APPROVAL",
              note: `❌ Bị từ chối phê duyệt. Lý do: ${reason || "Không xác định"}`,
              createdById: auth.id,
            },
          });

          // Đóng activity yêu cầu cũ
          await tx.leadActivity.update({
            where: { id: activityId },
            data: { status: "CANCELLED" },
          });

          return { type: "REJECTED" };
        }

        // TRƯỜNG HỢP: PHÊ DUYỆT (APPROVE)
        if (isPurchaseRequest) {
          // --- LOGIC A: DUYỆT THU MUA XE ---
          const { carData, contractData } = purchaseData;

          const carModelDb = await tx.carModel.findUnique({
            where: { id: carData.carModelId },
          });

          if (!carModelDb) throw new Error("Dòng xe không tồn tại");

          const carTypePrefix = (carModelDb.grade || "CAR")
            .substring(0, 3)
            .toUpperCase();
          const yearSuffix = new Date().getFullYear().toString().slice(-2);
          const count = await tx.car.count({
            where: {
              stockCode: { startsWith: `${carTypePrefix}${yearSuffix}` },
            },
          });

          const sequence = (count + 1).toString().padStart(3, "0");
          const generatedStockCode = `${carTypePrefix}${yearSuffix}${sequence}`;

          const createdCar = await tx.car.create({
            data: {
              stockCode: generatedStockCode,
              modelName: carData.modelName || "Xe nhập từ Lead",
              vin: carData.vin?.toUpperCase() || "CHUA_CO_VIN",
              licensePlate: carData.licensePlate?.toUpperCase() || null,
              year: parseInt(carData.year) || 0,
              odo: parseInt(carData.odo) || 0,
              transmission:
                (carData.transmission as Transmission) || "AUTOMATIC",
              fuelType: (carData.fuelType as FuelType) || "GASOLINE",
              carType: (carData.carType as CarType) || "SUV",
              color: carData.color || null,
              interiorColor: carData.interiorColor || null,
              seats: parseInt(carData.seats) || 5,
              costPrice: contractData.price
                ? parseFloat(contractData.price)
                : 0,
              status: "REFURBISHING",
              branchId: staff.branchId,
              carModelId: carData.carModelId,
              purchaserId: staff.id,
              referrerId: activity.customer.referrerId,
              purchasedAt: new Date(),
            },
          });

          await tx.carOwnerHistory.create({
            data: {
              carId: createdCar.id,
              customerId: activity.customerId,
              type: "PURCHASE",
              contractNo: contractData.contractNo,
              price: parseFloat(contractData.price),
              note: contractData.note,
              date: new Date(),
            },
          });

          await tx.customer.update({
            where: { id: activity.customerId },
            data: { status: "DEAL_DONE" },
          });

          await tx.leadActivity.update({
            where: { id: activityId },
            data: {
              status: "DEAL_DONE",
              note: `✅ Đã duyệt nhập kho [${generatedStockCode}]`,
            },
          });

          return { type: "PURCHASE_DONE", stockCode: generatedStockCode };
        } else {
          // --- LOGIC B: DUYỆT DỪNG CHĂM SÓC (LOSE/FROZEN) ---
          // Lấy trạng thái mong muốn từ chính Activity (Sales đã chọn khi gửi)
          // Nếu activity.status là PENDING_LOSE_APPROVAL thì ta phải tìm trạng thái đích trong log hoặc mặc định LOSE
          // Ở đây giả định bạn đã lưu targetStatus vào status của activity

          await tx.customer.update({
            where: { id: activity.customerId },
            data: {
              status:
                activity.status === "PENDING_LOSE_APPROVAL"
                  ? "LOSE"
                  : activity.status,
            },
          });

          await tx.leadActivity.update({
            where: { id: activityId },
            data: {
              note: `✅ Admin đã duyệt kết thúc hồ sơ. Nội dung: ${activity.note}`,
            },
          });

          return { type: "STATUS_UPDATED" };
        }
      },
      { timeout: 20000 },
    );

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/assigned-tasks");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Lỗi Approval:", error);
    return { success: false, error: error.message || "Lỗi xử lý phê duyệt" };
  }
}
// 3. Cập nhật các trạng thái thông thường (Giữ nguyên)
export async function processLeadStatusUpdate(
  leadId: string,
  status: LeadStatus,
  reasonId: string,
  note: string,
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
  contractData: any,
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
  note: string,
  targetStatus: LeadStatus, // Thêm tham số này để biết ý định của Sales
) {
  const auth = await getAuthUser();
  if (!auth) throw new Error("Unauthorized");

  await db.$transaction(async (tx) => {
    // 1. Cập nhật trạng thái khách hàng sang "Chờ duyệt đóng"
    await tx.customer.update({
      where: { id: leadId },
      data: { status: LeadStatus.PENDING_LOSE_APPROVAL },
    });

    // 2. Tạo lịch sử hoạt động ghi rõ Sales muốn chuyển về trạng thái gì
    await tx.leadActivity.create({
      data: {
        customerId: leadId,
        status: targetStatus, // Lưu trạng thái Sales mong muốn (LOSE/FROZEN...)
        reasonId,
        note: `[YÊU CẦU DUYỆT ĐÓNG]: ${note}`,
        createdById: auth.id,
      },
    });
  });

  revalidatePath("/dashboard/assigned-tasks");
  return { success: true };
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
    },
    orderBy: { createdAt: "desc" },
  });

  // Chuyển đổi Decimal sang Number trước khi gửi xuống Client
  return cars.map((car) => ({
    ...car,
    sellingPrice: car.sellingPrice ? Number(car.sellingPrice) : 0,
  }));
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
        if (customer.assignedAt) {
          const diffDays = dayjs(now).diff(dayjs(customer.assignedAt), "day");
          if (diffDays <= (config?.hotDays || 3)) urgencyLevel = "HOT";
          else if (diffDays <= (config?.warmDays || 7)) urgencyLevel = "WARM";
          else urgencyLevel = "COOL";
        }

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
          operations.push(
            tx.task.create({
              data: {
                title: `Gọi lại: ${customer.fullName}`,
                content: payload?.nextNote || "Chăm sóc khách hàng",
                scheduledAt: nextContactAt,
                deadlineAt: dayjs(nextContactAt)
                  .add(maxLateMinutes, "minute")
                  .toDate(),
                customerId: customerId,
                assigneeId: user.id,
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

    return result;
  } catch (error: any) {
    console.error("🔥 Error in updateCustomerStatusAction:", error);
    return { success: false, error: error.message };
  }
}
