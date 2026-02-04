/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  lateLeadRecallEmailTemplate,
  overdueCustomerReminderEmailTemplate,
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
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Phiên đăng nhập hết hạn.");

    // 1. BÓC TÁCH VÀ CHUẨN HÓA DỮ LIỆU
    const { selectedCarId, budget, carYear, ...data } = rawData;

    const finalBudget =
      budget !== undefined && budget !== null ? String(budget) : null;
    const finalYear =
      carYear !== undefined && carYear !== null ? String(carYear) : null;

    // Chuẩn hóa biển số xe
    const cleanPlate = data.licensePlate
      ? data.licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, "")
      : undefined;

    // 2. KIỂM TRA TRÙNG LẶP & LOGIC TÁI SỬ DỤNG LEAD TRỄ
    const activeStatuses = {
      notIn: [LeadStatus.DEAL_DONE, LeadStatus.CANCELLED, LeadStatus.LOSE],
    };

    // Tìm kiếm khách hàng cũ dựa trên Phone (BUY) hoặc Biển số (SELL/VALUATION...)
    const existingCustomer = await db.customer.findFirst({
      where: {
        OR: [
          { phone: data.phone, type: "BUY" },
          { licensePlate: cleanPlate, type: { not: "BUY" } },
        ],
        status: activeStatuses,
      },
    });

    if (existingCustomer) {
      // Nếu khách KHÔNG bị trễ -> Chặn trùng như bình thường
      if (!existingCustomer.isLate) {
        const identity = data.type === "BUY" ? data.phone : cleanPlate;
        return {
          success: false,
          error: `Dữ liệu ${identity} đang có yêu cầu đang xử lý trên hệ thống.`,
        };
      }
      // Nếu có isLate = true -> Cho phép đi tiếp xuống bước Transaction để cập nhật
    }

    // 3. XÁC ĐỊNH CHI NHÁNH & 4. PHÂN BỔ NHÂN VIÊN
    const referrer = await db.user.findUnique({
      where: { id: data.referrerId },
      select: { branchId: true, fullName: true, username: true },
    });

    if (!referrer?.branchId)
      throw new Error("Không thể xác định chi nhánh người giới thiệu.");

    let assignedStaffId: string | null = null;
    let assignmentLog = "";

    if (data.type === "BUY") {
      const schedules = await db.salesSchedule.findMany({
        where: { date: todayStart, branchId: referrer.branchId },
        select: { userId: true },
      });
      const onDutyIds = schedules.map((s) => s.userId);

      const staff = await db.user.findFirst({
        where: { id: { in: onDutyIds }, role: "SALES_STAFF", active: true },
        orderBy: { lastAssignedAt: "asc" },
      });

      if (staff) {
        assignedStaffId = staff.id;
        assignmentLog = "Phân bổ tự động theo lịch trực Sales.";
      }
    } else {
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

    // 5. TRANSACTION: LƯU DỮ LIỆU (CREATE HOẶC UPDATE)
    const result = await db.$transaction(
      async (tx) => {
        const config = await tx.leadSetting.findFirst();
        const maxLate = config?.maxLateMinutes || 30;

        const stockCarInfo = selectedCarId
          ? await tx.car.findUnique({ where: { id: selectedCarId } })
          : null;
        const stockNote = stockCarInfo
          ? `\n[XE TRONG KHO]: ${stockCarInfo.stockCode} - ${stockCarInfo.modelName}`
          : "";

        const commonData: any = {
          ...data,
          licensePlate: cleanPlate,
          carYear: finalYear,
          budget: finalBudget,
          expectedPrice: String(data.expectedPrice),
          status: assignedStaffId ? LeadStatus.ASSIGNED : LeadStatus.NEW,
          assignedToId: assignedStaffId,
          assignedAt: assignedStaffId ? now : null,
          isLate: false, // Reset cờ trễ
          lastFrozenAt: null, // Xóa mốc đóng băng
          branchId: referrer.branchId,
          referralDate: now, // Tính lại ngày bắt đầu mới
          note: data.note ? `${data.note}${stockNote}` : stockNote,
        };

        let customer;

        if (existingCustomer?.isLate) {
          // --- KỊCH BẢN TÁI SINH LEAD ---
          customer = await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              ...commonData,
              referrerId: data.referrerId, // Cập nhật người giới thiệu mới
              activities: {
                create: {
                  status: assignedStaffId
                    ? LeadStatus.ASSIGNED
                    : LeadStatus.NEW,
                  note: `[TÁI SINH]: ${assignmentLog}. Khách cũ bị trễ từ người giới thiệu trước.`,
                  createdById: data.referrerId,
                },
              },
              tasks: assignedStaffId
                ? {
                    create: {
                      title: "📞 Liên hệ lại khách hàng (Lead tái sinh)",
                      content: `Khách hàng cũ bị trễ, cần liên hệ lại ngay. Nhu cầu: ${data.type}`,
                      scheduledAt: now,
                      deadlineAt: dayjs(now)
                        .add(Number(maxLate), "minute")
                        .toDate(),
                      status: TaskStatus.PENDING,
                      type: data.type !== "BUY" ? "PURCHASE" : "SALES",
                      assigneeId: assignedStaffId,
                    },
                  }
                : undefined,
            },
            include: {
              carModel: true,
              assignedTo: true,
              leadCar: true,
              referrer: { include: { branch: true } },
            },
          });
        } else {
          // --- KỊCH BẢN TẠO MỚI HOÀN TOÀN ---
          customer = await tx.customer.create({
            data: {
              ...commonData,
              leadCar: stockCarInfo
                ? {
                    create: {
                      modelName: stockCarInfo.modelName,
                      year: stockCarInfo.year,
                      licensePlate: stockCarInfo.licensePlate,
                      expectedPrice: stockCarInfo.sellingPrice,
                      note: "Khách chọn từ kho xe.",
                    },
                  }
                : undefined,
              activities: {
                create: {
                  status: assignedStaffId
                    ? LeadStatus.ASSIGNED
                    : LeadStatus.NEW,
                  note:
                    assignmentLog || "Khách hàng mới được tạo từ giới thiệu.",
                  createdById: data.referrerId,
                },
              },
              tasks: assignedStaffId
                ? {
                    create: {
                      title: "📞 Liên hệ khách hàng mới",
                      scheduledAt: now,
                      deadlineAt: dayjs(now)
                        .add(Number(maxLate), "minute")
                        .toDate(),
                      status: TaskStatus.PENDING,
                      type: data.type !== "BUY" ? "PURCHASE" : "SALES",
                      assigneeId: assignedStaffId,
                    },
                  }
                : undefined,
            },
            include: {
              carModel: true,
              assignedTo: true,
              leadCar: true,
              referrer: { include: { branch: true } },
            },
          });
        }

        if (assignedStaffId) {
          await tx.user.update({
            where: { id: assignedStaffId },
            data: { lastAssignedAt: now },
          });
        }

        return customer;
      },
      { timeout: 20000 },
    );

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/referrals/new");

    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("🔥 createCustomerAction Error:", error.message);
    return { success: false, error: error.message || "Lỗi hệ thống" };
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

export async function getOverdueCustomersAction() {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");
  const sixtyDaysAgo = dayjs().subtract(60, "day").toDate();

  return await db.customer.findMany({
    where: {
      createdAt: { lt: sixtyDaysAgo },
      status: { notIn: ["DEAL_DONE", "CANCELLED", "LOSE", "FROZEN"] },
    },
    include: {
      referrer: { select: { fullName: true, email: true } },
      assignedTo: { select: { fullName: true, email: true } },
      carModel: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

// 2. Gửi Email nhắc nhở (Mockup logic gửi mail)
export async function sendReminderEmailAction(customerIds: string[]) {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Bạn cần đăng nhập để thực hiện thao tác này");
    // 1. Lấy thông tin chi tiết khách hàng và người liên quan
    const customers = await db.customer.findMany({
      where: { id: { in: customerIds } },
      include: {
        referrer: true,
        assignedTo: true,
        branch: true,
      },
    });

    if (customers.length === 0) {
      return { success: false, error: "Không tìm thấy dữ liệu khách hàng" };
    }

    // 2. Duyệt qua từng khách hàng để tạo mail và gửi
    for (const cust of customers) {
      const daysPending = dayjs().diff(dayjs(cust.createdAt), "day");

      // Tạo nội dung HTML từ template chuyên nghiệp
      const htmlBody = overdueCustomerReminderEmailTemplate({
        customerName: cust.fullName,
        customerPhone: cust.phone,
        staffName: cust.assignedTo?.fullName || "Chưa phân bổ",
        referrerName: cust.referrer?.fullName || "Hệ thống",
        createdAt: dayjs(cust.createdAt).format("DD/MM/YYYY"),
        daysPending: daysPending,
        typeLabel: cust.type === "SELL" ? "THU MUA" : "BÁN XE", // Bạn có thể thêm logic map type chi tiết hơn ở đây
        branchName: cust.branch?.name || "Tổng công ty",
      });

      const subject = `[CẢNH BÁO QUÁ HẠN] Hồ sơ khách hàng: ${cust.fullName.toUpperCase()} (${daysPending} ngày)`;

      // 3. Thực hiện gửi mail đồng thời cho cả Nhân viên và Người giới thiệu
      const recipients = [];
      if (cust.assignedTo?.email) recipients.push(cust.assignedTo.email);
      if (cust.referrer?.email) recipients.push(cust.referrer.email);

      if (recipients.length > 0) {
        // Gửi mail (Dùng Promise.all nếu muốn gửi song song cho nhanh)
        await Promise.all(
          recipients.map((email) =>
            sendMail({
              to: email,
              subject: subject,
              html: htmlBody,
            }),
          ),
        );
      }

      // 4. Ghi nhận vào nhật ký hệ thống (Activity Log) để biết đã gửi mail nhắc nhở
      await db.leadActivity.create({
        data: {
          customerId: cust.id,
          status: cust.status,
          note: `[HỆ THỐNG]: Đã gửi email cảnh báo quá hạn.`,
          createdById: auth.id, // Hoặc lấy ID của admin đang thực hiện
        },
      });
    }

    return {
      success: true,
      message: `Đã gửi thành công ${customers.length} thông báo.`,
    };
  } catch (error: any) {
    console.error("Lỗi gửi mail nhắc nhở:", error);
    return {
      success: false,
      error: error.message || "Lỗi hệ thống khi gửi mail",
    };
  }
}

// 3. Đóng băng khách hàng
export async function freezeOverdueCustomersAction(customerIds: string[]) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Unauthorized");

  try {
    // 1. Lấy thông tin chi tiết khách hàng và nhân viên trước khi đóng băng để gửi mail
    const customersToFreeze = await db.customer.findMany({
      where: { id: { in: customerIds } },
      include: {
        assignedTo: { select: { email: true, fullName: true } },
        carModel: { select: { name: true } },
      },
    });

    await db.$transaction(async (tx) => {
      // 2. Cập nhật trạng thái và bật cờ isLate
      await tx.customer.updateMany({
        where: { id: { in: customerIds } },
        data: {
          status: "FROZEN",
          isLate: true, // Đánh dấu trễ để cho phép tái sử dụng sau này
          lastFrozenAt: new Date(),
        },
      });

      // 3. Tạo lịch sử cho từng khách
      const logs = customerIds.map((id) => ({
        customerId: id,
        createdById: auth.id,
        status: "FROZEN" as const,
        note: "[HỆ THỐNG]: Tự động đóng băng & giải phóng quyền ưu tiên do hồ sơ quá hạn xử lý.",
      }));

      await tx.leadActivity.createMany({ data: logs });
    });

    // 4. GỬI EMAIL THÔNG BÁO THU HỒI (Chạy ngầm sau transaction)
    (async () => {
      for (const customer of customersToFreeze) {
        if (customer.assignedTo?.email) {
          try {
            await sendMail({
              to: customer.assignedTo.email,
              subject: `[THÔNG BÁO] Thu hồi khách hàng ${customer.fullName} do quá hạn KPI`,
              html: lateLeadRecallEmailTemplate({
                staffName: customer.assignedTo.fullName || "Nhân viên",
                customerName: customer.fullName,
                lateMinutes: 60 * 24 * 60, // Bạn có thể tính toán số phút trễ thực tế ở đây
                typeLabel: customer.type === "BUY" ? "MUA XE" : "THU MUA",
              }),
            });
          } catch (mailErr) {
            console.error(
              `Lỗi gửi mail cho ${customer.assignedTo.email}:`,
              mailErr,
            );
          }
        }
      }
    })();

    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/frozen-leads");
    return { success: true };
  } catch (error) {
    console.error("Freeze Action Error:", error);
    return { success: false };
  }
}
