/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  referralEmailTemplate,
  staffAssignmentEmailTemplate,
} from "@/lib/mail-templates";
import { sendMail } from "@/lib/mail-service";
import { LeadStatus, ReferralType, UrgencyType } from "@prisma/client";
import { getCurrentUser } from "@/lib/session-server";

interface CreateCustomerInput {
  fullName: string;
  phone: string;
  type: ReferralType;
  referrerId: string;
  carModelId?: string;
  carYear?: string;
  licensePlate?: string;
  budget?: string;
  expectedPrice?: string;
  note?: string;
}

/**
 * 1. TẠO LỜI GIỚI THIỆU MỚI
 */
// Thêm import hàm gửi mail và templates vào đầu file action

export async function createCustomerAction(data: CreateCustomerInput) {
  try {
    const cleanPlate = data.licensePlate
      ? data.licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, "")
      : undefined;

    // --- 1. KIỂM TRA TRÙNG LẶP ---
    const duplicate = await db.customer.findFirst({
      where: {
        OR: [...(cleanPlate ? [{ licensePlate: cleanPlate }] : [])],
        status: { notIn: [LeadStatus.DEAL_DONE, LeadStatus.CANCELLED] },
      },
      include: { referrer: { select: { fullName: true, username: true } } },
    });

    if (duplicate) {
      const refName =
        duplicate.referrer.fullName || duplicate.referrer.username;
      throw new Error(
        `Khách hàng/Biển số này đã có trên hệ thống, được giới thiệu bởi [${refName}].`,
      );
    }

    // --- 2. XÁC ĐỊNH ROLE CẦN PHÂN BỔ ---
    // SELL, VALUATION -> PURCHASE_STAFF
    // BUY -> SALES_STAFF
    const targetRole =
      data.type === "SELL" || data.type === "VALUATION"
        ? "PURCHASE_STAFF"
        : "SALES_STAFF";

    // --- 3. TÌM NGƯỜI GIỚI THIỆU ĐỂ LẤY CHI NHÁNH ---
    const referrer = await db.user.findUnique({
      where: { id: data.referrerId },
      select: { branchId: true, fullName: true, username: true },
    });

    let assignedStaffId: string | null = null;

    // --- 4. THỰC HIỆN CHIA ĐỀU (ROUND ROBIN) ---
    if (referrer?.branchId) {
      const staff = await db.user.findFirst({
        where: {
          branchId: referrer.branchId,
          role: targetRole,
          active: true,
        },
        // Quan trọng: Người nào có lastAssignedAt cũ nhất (đợi lâu nhất) sẽ nhận khách
        orderBy: { lastAssignedAt: "asc" },
      });

      if (staff) {
        assignedStaffId = staff.id;
      }
    }

    const now = new Date();

    // --- 5. TẠO DỮ LIỆU KHÁCH HÀNG ---
    const newCustomer = await db.customer.create({
      data: {
        ...data,
        licensePlate: cleanPlate,
        carYear: data.carYear ? String(data.carYear) : null,
        status: assignedStaffId ? LeadStatus.ASSIGNED : LeadStatus.NEW,
        assignedToId: assignedStaffId,
        assignedAt: assignedStaffId ? now : null,
      },
      include: {
        referrer: { include: { branch: true } },
        carModel: true,
        assignedTo: true,
      },
    });

    // --- 6. CẬP NHẬT THỜI GIAN PHÂN BỔ CỦA NHÂN VIÊN ---
    if (assignedStaffId) {
      await db.user.update({
        where: { id: assignedStaffId },
        data: { lastAssignedAt: now },
      });
    }

    // --- 7. GỬI MAIL THÔNG BÁO ---
    try {
      const typeLabel =
        data.type === "SELL"
          ? "BÁN XE"
          : data.type === "BUY"
            ? "MUA XE"
            : "ĐỊNH GIÁ XE";

      const details = `Dòng xe: ${newCustomer.carModel?.name || data.carYear || "Không rõ"}\nBiển số: ${cleanPlate || "Chưa có"}\nGhi chú: ${data.note || "Không có"}`;

      // A. LẤY DANH SÁCH EMAIL QUẢN LÝ
      const managers = await db.user.findMany({
        where: {
          OR: [
            { isGlobalManager: true }, // Quản lý tổng
            {
              role: "MANAGER",
              branchId: referrer?.branchId, // Quản lý chi nhánh
              active: true,
            },
          ],
        },
        select: { email: true },
      });

      const managerEmails = managers.map((m) => m.email).filter(Boolean);

      // B. Gửi cho các Quản lý (Nếu có)
      if (managerEmails.length > 0) {
        await sendMail({
          to: managerEmails.join(","), // Gửi đồng loạt (hoặc dùng bcc tùy cấu hình sendMail của bạn)
          subject: `[CRM] Khách hàng mới - Chi nhánh ${newCustomer.referrer?.branch?.name || "Hệ thống"}`,
          html: referralEmailTemplate({
            customerName: newCustomer.fullName,
            typeLabel: typeLabel,
            referrerName: referrer?.fullName || referrer?.username || "N/A",
            details: details,
            branchName: newCustomer.referrer?.branch?.name,
          }),
        });
      }

      // B. Gửi cho Nhân viên được chỉ định (Dù là Purchase hay Sales)
      if (newCustomer.assignedTo?.email) {
        await sendMail({
          to: newCustomer.assignedTo.email,
          subject: `[NHIỆM VỤ MỚI] Chăm sóc khách hàng ${newCustomer.fullName.toUpperCase()}`,
          html: staffAssignmentEmailTemplate({
            customerName: newCustomer.fullName,
            customerPhone: newCustomer.phone,
            typeLabel: typeLabel,
            details: details,
            branchName: newCustomer.referrer?.branch?.name,
          }),
        });
      }
    } catch (mailErr) {
      console.error("Lỗi gửi mail thông báo:", mailErr);
    }

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi hệ thống");
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
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { assignedAt: true, firstContactAt: true, urgencyLevel: true },
      });

      const updateData: any = { status, lastContactAt: now };

      if (nextContactAt) {
        updateData.nextContactAt = nextContactAt;
      }

      // LOGIC TÍNH URGENCY KHI LIÊN HỆ LẦN ĐẦU (Chuyển sang CONTACTED)
      if (
        status === LeadStatus.CONTACTED &&
        !customer?.firstContactAt &&
        customer?.assignedAt
      ) {
        // Lấy config từ Admin, nếu không có mặc định là 1 ngày cho HOT, 3 ngày cho WARM
        const config = await tx.leadSetting.findFirst();
        const hotDays = config?.hotDays || 1;
        const warmDays = config?.warmDays || 3;

        const diffTime = Math.abs(
          now.getTime() - customer.assignedAt.getTime(),
        );
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        let urgency: UrgencyType = UrgencyType.COOL;
        if (diffDays <= hotDays) urgency = UrgencyType.HOT;
        else if (diffDays <= warmDays) urgency = UrgencyType.WARM;

        updateData.firstContactAt = now;
        updateData.urgencyLevel = urgency;
      }

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
    throw new Error(
      error.message || "Không thể cập nhật trạng thái khách hàng.",
    );
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
    await db.customer.update({
      where: { id: customerId },
      data: {
        assignedToId: staffId,
        status: LeadStatus.ASSIGNED,
        assignedAt: now, // Reset lại thời gian tính cho nhân viên mới
      },
    });

    await db.user.update({
      where: { id: staffId },
      data: { lastAssignedAt: now },
    });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    throw new Error("Lỗi phân bổ.");
  }
}

/**
 * 5. LẤY DANH SÁCH (Bổ sung các trường thời gian mới)
 */
export async function getCustomersAction() {
  return await db.customer.findMany({
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
    },
    orderBy: { createdAt: "desc" },
  });
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
        carOwnerHistories: {
          include: {
            car: {
              select: {
                stockCode: true,
                modelName: true,
                licensePlate: true,
              },
            },
          },
          orderBy: { date: "desc" },
          take: 1,
        },
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
