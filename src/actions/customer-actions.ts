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
      : null;

    // --- 1. KIỂM TRA TRÙNG LẶP --- (Giữ nguyên logic của bạn)
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
      throw new Error(`Thông tin này đã được giới thiệu bởi [${refName}].`);
    }

    // --- 2. PHÂN BỔ NHÂN VIÊN (ROUND ROBIN) --- (Giữ nguyên logic của bạn)
    let assignedStaffId: string | null = null;
    const referrer = await db.user.findUnique({
      where: { id: data.referrerId },
      select: { branchId: true, fullName: true, username: true },
    });

    if (
      (data.type === "SELL" || data.type === "VALUATION") &&
      referrer?.branchId
    ) {
      const staff = await db.user.findFirst({
        where: {
          branchId: referrer.branchId,
          role: "PURCHASE_STAFF",
          active: true,
        },
        orderBy: { lastAssignedAt: "asc" },
      });
      if (staff) assignedStaffId = staff.id;
    }

    const now = new Date();

    // --- 3. TẠO DỮ LIỆU ---
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

    // Cập nhật lượt phân bổ cho nhân viên
    if (assignedStaffId) {
      await db.user.update({
        where: { id: assignedStaffId },
        data: { lastAssignedAt: now },
      });
    }

    // --- 4. GỬI MAIL THÔNG BÁO ---
    // Chúng ta bọc trong try-catch riêng để nếu lỗi mail cũng không làm fail transaction chính
    try {
      const typeLabel =
        data.type === "SELL"
          ? "BÁN XE"
          : data.type === "BUY"
          ? "MUA XE"
          : "ĐỊNH GIÁ XE";

      const details = `Dòng xe: ${
        newCustomer.carModel?.name || data.carYear || "Không rõ"
      }\nBiển số: ${cleanPlate || "Chưa có"}\nGhi chú: ${
        data.note || "Không có"
      }`;

      // A. Gửi cho Quản lý (Thông báo có khách mới vào hệ thống)
      const managerEmail =
        process.env.MANAGER_EMAIL || "admin@toyotabinhduong.com.vn";
      await sendMail({
        to: managerEmail,
        subject: `[CRM] Khách hàng mới: ${newCustomer.fullName.toUpperCase()}`,
        html: referralEmailTemplate({
          customerName: newCustomer.fullName,
          typeLabel: typeLabel,
          referrerName: referrer?.fullName || referrer?.username || "N/A",
          details: details,
          branchName: newCustomer.referrer?.branch?.name,
        }),
      });

      // B. Gửi cho Nhân viên (Thông báo nhận nhiệm vụ)
      if (newCustomer.assignedTo?.email) {
        await sendMail({
          to: newCustomer.assignedTo.email,
          subject: `[NHIỆM VỤ] Chăm sóc khách hàng ${newCustomer.fullName.toUpperCase()}`,
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
  nextContactAt?: Date // Cho phép hẹn ngày gọi lại
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
          now.getTime() - customer.assignedAt.getTime()
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
      error.message || "Không thể cập nhật trạng thái khách hàng."
    );
  }
}

/**
 * 4. PHÂN BỔ THỦ CÔNG (CŨNG TÍNH THỜI GIAN GIAO)
 */
export async function assignCustomerAction(
  customerId: string,
  staffId: string
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
