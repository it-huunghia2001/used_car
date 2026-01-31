/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  referralEmailTemplate,
  staffAssignmentEmailTemplate,
} from "@/lib/mail-templates";
import { sendMail } from "@/lib/mail-service";
import { LeadStatus, TaskStatus, UrgencyType } from "@prisma/client";
import { getCurrentUser } from "@/lib/session-server";
import dayjs from "@/lib/dayjs";

// interface CreateCustomerInput {
//   fullName: string;
//   phone: string;
//   type: ReferralType;
//   referrerId: string;
//   carModelId?: string;
//   carYear?: string;
//   licensePlate?: string;
//   budget?: string;
//   expectedPrice?: string;
//   note?: string;
// }

/**
 * 1. TẠO LỜI GIỚI THIỆU MỚI
 */
// Thêm import hàm gửi mail và templates vào đầu file action

export async function createCustomerAction(rawData: any) {
  try {
    const now = new Date();
    const todayStart = dayjs().startOf("day").toDate();

    // 1. BÓC TÁCH VÀ CHUẨN HÓA DỮ LIỆU
    // Tách selectedCarId (biến tạm), budget và carYear (cần ép kiểu) ra khỏi data
    const { selectedCarId, budget, carYear, ...data } = rawData;

    // Ép kiểu về String để khớp với Schema Prisma (budget và carYear trong DB là String)
    const finalBudget =
      budget !== undefined && budget !== null ? String(budget) : null;
    const finalYear =
      carYear !== undefined && carYear !== null ? String(carYear) : null;

    // Chuẩn hóa biển số xe (Viết hoa, xóa ký tự đặc biệt)
    const cleanPlate = data.licensePlate
      ? data.licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, "")
      : undefined;

    // 2. KIỂM TRA TRÙNG LẶP
    const activeStatuses = {
      notIn: [LeadStatus.DEAL_DONE, LeadStatus.CANCELLED, LeadStatus.LOSE],
    };

    if (data.type === "BUY") {
      // Đối với khách MUA: Chặn trùng Số điện thoại
      const duplicatePhone = await db.customer.findFirst({
        where: {
          phone: data.phone,
          type: "BUY",
          status: activeStatuses,
        },
      });

      if (duplicatePhone) {
        return {
          success: false,
          error: `Số điện thoại ${data.phone} đang có yêu cầu MUA XE đang xử lý.`,
        };
      }
    } else if (cleanPlate) {
      // Đối với luồng khác (SELL/VALUATION...): Chặn trùng Biển số
      const duplicateCar = await db.customer.findFirst({
        where: {
          licensePlate: cleanPlate,
          status: activeStatuses,
        },
      });

      if (duplicateCar) {
        return {
          success: false,
          error: `Xe biển số ${cleanPlate} đang có yêu cầu xử lý trên hệ thống.`,
        };
      }
    }
    // 3. XÁC ĐỊNH CHI NHÁNH NGƯỜI GIỚI THIỆU
    const referrer = await db.user.findUnique({
      where: { id: data.referrerId },
      select: { branchId: true, fullName: true, username: true },
    });

    if (!referrer?.branchId) {
      return {
        success: false,
        error: "Không thể xác định chi nhánh người giới thiệu.",
      };
    }

    // 4. LOGIC PHÂN BỔ NHÂN VIÊN (Xoay vòng)
    let assignedStaffId: string | null = null;
    let assignmentLog = "";

    if (data.type === "BUY") {
      // LUỒNG MUA XE: Chia cho Sales Staff đang trực hôm nay
      const schedules = await db.salesSchedule.findMany({
        where: { date: todayStart, branchId: referrer.branchId },
        select: { userId: true },
      });
      const onDutyIds = schedules.map((s) => s.userId);

      const staff = await db.user.findFirst({
        where: {
          id: { in: onDutyIds },
          role: "SALES_STAFF",
          active: true,
        },
        orderBy: { lastAssignedAt: "asc" },
      });

      if (staff) {
        assignedStaffId = staff.id;
        assignmentLog = "Phân bổ tự động theo lịch trực Sales.";
      }
    } else {
      // LUỒNG THU MUA/ĐỊNH GIÁ: Chia đều cho Purchase Staff
      const staff = await db.user.findFirst({
        where: {
          branchId: referrer.branchId,
          role: "PURCHASE_STAFF",
          active: true,
        },
        orderBy: { lastAssignedAt: "asc" },
      });

      if (staff) {
        assignedStaffId = staff.id;
        assignmentLog = "Phân bổ xoay vòng Thu mua.";
      }
    }

    // Fallback: Nếu không tìm thấy staff thì Manager nhận
    if (!assignedStaffId) {
      const manager = await db.user.findFirst({
        where: { branchId: referrer.branchId, role: "MANAGER", active: true },
      });
      assignedStaffId = manager?.id || null;
      assignmentLog = assignedStaffId
        ? "Fallback: Gán cho Quản lý chi nhánh."
        : "Chờ phân bổ.";
    }

    // 5. TRANSACTION: LƯU DỮ LIỆU ĐỒNG BỘ
    //
    const newCustomer = await db.$transaction(
      async (tx) => {
        // Lấy cấu hình Deadline
        const config = await tx.leadSetting.findFirst();
        const maxLate = config?.maxLateMinutes || 30;

        // Xử lý thông tin xe nếu có xe chọn từ kho
        let stockCarInfo = null;
        if (selectedCarId) {
          stockCarInfo = await tx.car.findUnique({
            where: { id: selectedCarId },
          });
        }

        console.log(stockCarInfo);

        const stockNote = stockCarInfo
          ? `\n[XE TRONG KHO]: ${stockCarInfo.stockCode} - ${stockCarInfo.modelName}`
          : "";

        const customer = await tx.customer.create({
          data: {
            ...data,
            licensePlate: cleanPlate,
            carYear: finalYear,
            budget: finalBudget,
            expectedPrice: String(data.expectedPrice),
            status: assignedStaffId ? LeadStatus.ASSIGNED : LeadStatus.NEW,
            assignedToId: assignedStaffId,
            assignedAt: assignedStaffId ? now : null,
            note: data.note ? `${data.note}${stockNote}` : stockNote,
            branchId: referrer?.branchId,

            // TỰ ĐỘNG TẠO LEADCAR TỪ XE TRONG KHO (Nếu có)
            // TẠO LEADCAR: Áp dữ liệu từ kho xe vào đây
            leadCar: stockCarInfo
              ? {
                  create: {
                    modelName: stockCarInfo.modelName,
                    year: stockCarInfo.year,
                    licensePlate: stockCarInfo.licensePlate,
                    odo: stockCarInfo.odo,
                    color: stockCarInfo.color,
                    interiorColor: stockCarInfo.interiorColor,
                    transmission: stockCarInfo.transmission,
                    fuelType: stockCarInfo.fuelType,
                    carType: stockCarInfo.carType,
                    origin: stockCarInfo.origin,
                    ownerType: stockCarInfo.ownerType,
                    seats: stockCarInfo.seats,
                    engineSize: stockCarInfo.engineSize,
                    driveTrain: stockCarInfo.driveTrain,
                    expectedPrice: stockCarInfo.sellingPrice, // Lấy giá bán hiện tại làm giá kỳ vọng
                    description: `Mã kho liên kết: ${stockCarInfo.stockCode}`,
                    note: "Khách hàng chọn xe trực tiếp từ kho xe có sẵn.",
                  },
                }
              : undefined,

            // Tự động tạo Task gọi điện đầu tiên cho nhân viên
            tasks: assignedStaffId
              ? {
                  create: {
                    title: "📞 Liên hệ khách hàng mới",
                    content: `Nhu cầu ${data.type}. ${stockNote || "Khách tìm xe theo nhu cầu chung."}`,
                    scheduledAt: now,
                    // Ép kiểu Number để đảm bảo dayjs tính toán đúng
                    deadlineAt: dayjs(now)
                      .add(Number(maxLate), "minute")
                      .toDate(),
                    status: TaskStatus.PENDING,
                    type: data.type !== "BUY" ? "PURCHASE" : "SALES",
                    // Sử dụng connect thay vì điền ID trực tiếp nếu Schema định nghĩa quan hệ
                    assignee: {
                      connect: { id: assignedStaffId },
                    },
                  },
                }
              : undefined,

            // Ghi lại lịch sử hoạt động đầu tiên
            activities: {
              create: {
                status: assignedStaffId ? LeadStatus.ASSIGNED : LeadStatus.NEW,
                note: assignmentLog || "Khách hàng mới được tạo từ giới thiệu.",
                createdById: data.referrerId,
              },
            },
          },
          include: {
            referrer: { include: { branch: true } },
            carModel: true,
            assignedTo: true,
            leadCar: true,
          },
        });

        // Cập nhật mốc thời gian gán cuối để xoay vòng công bằng
        if (assignedStaffId) {
          await tx.user.update({
            where: { id: assignedStaffId },
            data: { lastAssignedAt: now },
          });
        }

        return customer;
      },
      { timeout: 15000 }, // Tăng timeout lên 15 giây để xử lý đủ logic
    );

    // 6. GỬI THÔNG BÁO EMAIL (Chạy ngầm bên ngoài transaction)
    (async () => {
      try {
        const typeLabels: any = {
          SELL: "BÁN XE",
          BUY: "MUA XE",
          VALUATION: "ĐỊNH GIÁ",
          SELL_TRADE_NEW: "ĐỔI MỚI",
          SELL_TRADE_USED: "ĐỔI CŨ",
        };
        const details = `Dòng xe: ${newCustomer.carModel?.name || "N/A"}\nBiển số: ${cleanPlate || "N/A"}\nGhi chú: ${newCustomer.note || "N/A"}`;

        // Email cho Manager & Global Manager
        const managers = await db.user.findMany({
          where: {
            OR: [
              { isGlobalManager: true },
              { role: "MANAGER", branchId: referrer.branchId, active: true },
            ],
          },
          select: { email: true },
        });
        const managerEmails = managers.map((m) => m.email).filter(Boolean);

        if (managerEmails.length > 0) {
          await sendMail({
            to: managerEmails.join(","),
            subject: `[CRM] Khách mới từ người giới thiệu - ${newCustomer.referrer?.branch?.name}`,
            html: referralEmailTemplate({
              customerName: newCustomer.fullName,
              typeLabel: typeLabels[data.type] || data.type,
              referrerName: referrer.fullName || referrer.username,
              details,
              branchName: newCustomer.referrer?.branch?.name,
            }),
          });
        }

        // Email cho Nhân viên được gán nhiệm vụ
        if (newCustomer.assignedTo?.email) {
          await sendMail({
            to: newCustomer.assignedTo.email,
            subject: `[NHIỆM VỤ MỚI] Liên hệ khách hàng: ${newCustomer.fullName}`,
            html: staffAssignmentEmailTemplate({
              customerName: newCustomer.fullName,
              customerPhone: newCustomer.phone,
              typeLabel: typeLabels[data.type] || data.type,
              details,
              branchName: newCustomer.referrer?.branch?.name,
            }),
          });
        }
      } catch (e) {
        console.error("Lỗi gửi mail thông báo:", e);
      }
    })();

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/referrals/new");
    const serializedCustomer = JSON.parse(JSON.stringify(newCustomer));

    return { success: true, data: serializedCustomer };
  } catch (error: any) {
    console.error("Lỗi createCustomerAction:", error);
    return {
      success: false,
      error: error.message || "Lỗi hệ thống khi xử lý dữ liệu",
    };
  }
}
/**
 * 2. CẬP NHẬT TRẠNG THÁI KÈM LÝ DO & TÍNH TOÁN ĐỘ GẤP (URGENCY)
 */
export async function updateCustomerStatusAction(
  customerId: string,
  status: LeadStatus,
  note: string,
  userId: string,
  nextContactAt?: Date, // Cho phép hẹn ngày gọi lại
) {
  try {
    const now = new Date();

    await db.$transaction(async (tx) => {
      const updateData: any = { status, lastContactAt: now };

      if (nextContactAt) {
        updateData.nextContactAt = nextContactAt;
      }

      updateData.firstContactAt = now;

      // 1. Cập nhật khách hàng
      await tx.customer.update({
        where: { id: customerId },
        data: updateData,
      });

      // 2. Ghi log vào bảng LeadActivity
      await tx.leadActivity.create({
        data: {
          customerId,
          status,
          note,
          createdById: userId,
        },
      });
    });

    revalidatePath("/dashboard/customers");

    return { success: true };
  } catch (error: any) {
    console.log("--- DEBUG ERROR ---");
    console.error(error); // Xem chi tiết lỗi Prisma ở đây
    return { success: false, error: error.message || "Lỗi hệ thống nội bộ" };
  }
}

/**
 * 4. PHÂN BỔ THỦ CÔNG (CŨNG TÍNH THỜI GIAN GIAO)
 */

export async function assignCustomerAction(
  customerId: string,
  staffId: string,
) {
  try {
    const now = new Date();

    await db.$transaction(async (tx) => {
      // 1. Lấy cấu hình Admin
      const config = await tx.leadSetting.findFirst();
      const maxLate = config?.maxLateMinutes || 30;

      // 2. Hủy các Task PENDING cũ của người trước (nếu có) để tránh chồng chéo
      await tx.task.updateMany({
        where: { customerId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });

      // 3. Cập nhật Customer và Tạo Task mới cho Staff mới
      await tx.customer.update({
        where: { id: customerId },
        data: {
          assignedToId: staffId,
          status: LeadStatus.ASSIGNED,
          assignedAt: now,
          // Tạo Task trực tiếp trong update customer
          tasks: {
            create: {
              title: "📞 Tiếp nhận khách hàng (Phân bổ thủ công)",
              content: "Bạn được quản lý chỉ định chăm sóc khách hàng này.",
              scheduledAt: now,
              deadlineAt: dayjs(now).add(maxLate, "minute").toDate(),
              assigneeId: staffId,
              status: "PENDING",
            },
          },
        },
      });

      // 4. Ghi log Activity cho việc chuyển giao
      await tx.leadActivity.create({
        data: {
          customerId,
          status: LeadStatus.ASSIGNED,
          note: `Quản lý đã phân bổ khách hàng này cho bạn.`,
          createdById: staffId, // Hoặc ID của người thực hiện phân bổ
        },
      });

      // 5. Cập nhật lượt chia cho User
      await tx.user.update({
        where: { id: staffId },
        data: { lastAssignedAt: now },
      });
    });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Lỗi phân bổ thủ công." };
  }
}

/**
 * 5. LẤY DANH SÁCH (Bổ sung các trường thời gian mới)
 */
export async function getCustomersAction() {
  try {
    // 1. Lấy thông tin người dùng hiện tại
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    // 2. Xác định phạm vi quyền hạn
    const isGlobalPower =
      currentUser.role === "ADMIN" || currentUser.isGlobalManager;

    // 3. Xây dựng điều kiện lọc (where)
    const where: any = {};

    // Nếu không có quyền Global, chỉ lấy khách hàng thuộc chi nhánh của người quản lý
    if (!isGlobalPower) {
      where.branchId = currentUser.branchId;
    }

    const customers = await db.customer.findMany({
      where, // Áp dụng bộ lọc chi nhánh
      include: {
        carModel: { select: { name: true } },
        referrer: {
          select: {
            fullName: true,
            username: true,
            branch: { select: { name: true } },
          },
        },
        assignedTo: { select: { fullName: true, id: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true } } },
        },
        // Đảm bảo lấy thông tin chi nhánh của khách hàng
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Trả về dữ liệu sạch
    return JSON.parse(JSON.stringify(customers));
  } catch (error: any) {
    console.error("Lỗi getCustomersAction:", error);
    return [];
  }
}
export async function getMyReferralsAction() {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    const referrals = await db.customer.findMany({
      where: {
        referrerId: auth.id,
      },
      include: {
        // Lấy thông tin dòng xe quan tâm
        carModel: {
          select: { name: true },
        },
        // Lấy thông tin giao dịch nếu deal đã xong
        // carOwnerHistories: {
        //   include: {
        //     car: {
        //       select: {
        //         stockCode: true,
        //         modelName: true,
        //         licensePlate: true,
        //       },
        //     },
        //   },
        //   orderBy: { date: "desc" },
        //   take: 1,
        // },
      },
      orderBy: {
        createdAt: "desc", // Khách mới nhất lên đầu
      },
    });

    return referrals;
  } catch (error: any) {
    console.error("Error fetching referrals:", error);
    throw new Error("Không thể tải lịch sử giới thiệu");
  }
}

export async function createSelfAssignedLeadAction(formData: any) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Bạn cần đăng nhập để thực hiện hành động này");

  const {
    fullName,
    phone,
    carModelId,
    carYear,
    licensePlate,
    budget,
    expectedPrice,
    note,
  } = formData;

  try {
    const newLead = await db.$transaction(async (tx) => {
      // 1. Tạo khách hàng mới
      const customer = await tx.customer.create({
        data: {
          fullName,
          phone,
          type: auth.role === "PURCHASE_STAFF" ? "SELL" : "BUY",
          carModelId,
          carYear,
          licensePlate,
          budget: String(budget),
          expectedPrice,
          note,

          // QUAN TRỌNG: Tự giới thiệu và tự phân bổ
          referrerId: auth.id, // Người giới thiệu là tôi
          assignedToId: auth.id, // Người xử lý cũng là tôi

          // Cập nhật trạng thái và thời gian bàn giao ngay lập tức
          status: LeadStatus.ASSIGNED,
          assignedAt: new Date(),
          urgencyLevel: UrgencyType.HOT, // Tự mình nhập thì thường là khách đang HOT
        },
      });

      // 2. Tạo một bản ghi Activity để lưu vết lịch sử
      await tx.leadActivity.create({
        data: {
          customerId: customer.id,
          status: LeadStatus.ASSIGNED,
          note: "Nhân viên tự tạo khách hàng và nhận chăm sóc trực tiếp.",
          createdById: auth.id,
        },
      });

      return customer;
    });

    revalidatePath("/dashboard/assigned-tasks"); // Refresh lại trang danh sách nhiệm vụ
    return { success: true, data: newLead };
  } catch (error: any) {
    console.error("Lỗi tạo Lead tự gán:", error);
    throw new Error(error.message || "Không thể tạo khách hàng");
  }
}

// lấy ds đóng băng
export async function getFrozenLeadsAction() {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    // 1. Xác định phạm vi quyền hạn
    const isGlobalPower = auth.role === "ADMIN" || auth.isGlobalManager;

    // 2. Xây dựng điều kiện lọc
    const where: any = { status: "FROZEN" };

    // Nếu không phải quyền Global, chỉ lấy khách thuộc chi nhánh của mình
    if (!isGlobalPower) {
      where.branchId = auth.branchId;
    }

    const leads = await db.customer.findMany({
      where, // Áp dụng bộ lọc
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        // Lấy thông tin chi nhánh để hiển thị trên UI cho Admin
        branch: { select: { name: true } },
        // Lấy activity cuối cùng để biết lý do tại sao hồ sơ này bị đóng băng
        activities: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { reason: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Serialize dữ liệu an toàn
    return JSON.parse(JSON.stringify(leads));
  } catch (error) {
    console.error("Lỗi lấy danh sách đóng băng:", error);
    return [];
  }
}

export async function getLeadsAction(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { role, id: userId, branchId, isGlobalManager } = user;
  const { search, status, page = 1, limit = 10 } = params;

  let whereClause: any = {};

  // --- 1. PHÂN QUYỀN TRUY CẬP ---
  if (role === "ADMIN" || isGlobalManager) {
    whereClause = {};
  } else if (role === "MANAGER") {
    whereClause = { branchId: branchId };
  } else {
    whereClause = {
      OR: [{ assignedToId: userId }, { referrerId: userId }],
    };
  }

  // --- 2. LỌC & TÌM KIẾM ---
  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (search) {
    whereClause.AND = [
      {
        OR: [
          { fullName: { contains: search } },
          { phone: { contains: search } },
          { licensePlate: { contains: search } },
        ],
      },
    ];
  }

  // --- 3. TRUY VẤN TỔNG LỰC ---
  const [data, total] = await Promise.all([
    db.customer.findMany({
      where: whereClause,
      include: {
        assignedTo: { select: { fullName: true, phone: true } },
        referrer: { select: { fullName: true, role: true } },
        branch: { select: { name: true } },
        carModel: { select: { name: true } },
        leadCar: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { user: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.customer.count({ where: whereClause }),
  ]);

  // --- 4. FIX LỖI DECIMAL (QUAN TRỌNG) ---
  // Sử dụng JSON.parse(JSON.stringify()) là cách nhanh nhất để biến Decimal thành String/Number
  // Hoặc map thủ công để tối ưu hiệu suất
  const serializedData = data.map((customer) => {
    if (customer.leadCar) {
      return {
        ...customer,
        leadCar: {
          ...customer.leadCar,
          tSurePrice: customer.leadCar.tSurePrice
            ? Number(customer.leadCar.tSurePrice)
            : null,
          expectedPrice: customer.leadCar.expectedPrice
            ? Number(customer.leadCar.expectedPrice)
            : null,
          finalPrice: customer.leadCar.finalPrice
            ? Number(customer.leadCar.finalPrice)
            : null,
        },
      };
    }
    return customer;
  });

  // Một cách "lười" nhưng hiệu quả 100% cho mọi loại dữ liệu phức tạp:
  // const serializedData = JSON.parse(JSON.stringify(data));

  return { data: serializedData, total };
}
