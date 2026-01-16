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
import { LeadStatus, ReferralType } from "@prisma/client";

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
export async function createCustomerAction(data: CreateCustomerInput) {
  try {
    const cleanPhone = data.phone.trim().replace(/\s/g, "");
    const cleanPlate = data.licensePlate
      ? data.licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, "")
      : null;

    // --- KIỂM TRA TRÙNG LẶP ---
    const duplicate = await db.customer.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(cleanPlate ? [{ licensePlate: cleanPlate }] : []),
        ],
        status: {
          notIn: [LeadStatus.DEAL_DONE, LeadStatus.CANCELLED],
        },
      },
      include: { referrer: { select: { fullName: true, username: true } } },
    });

    if (duplicate) {
      const refName =
        duplicate.referrer.fullName || duplicate.referrer.username;
      throw new Error(`Thông tin này đã được giới thiệu bởi [${refName}].`);
    }

    // --- PHÂN BỔ NHÂN VIÊN (ROUND ROBIN) ---
    let assignedStaffId: string | null = null;
    if (data.type === "SELL" || data.type === "VALUATION") {
      const referrer = await db.user.findUnique({
        where: { id: data.referrerId },
        select: { branchId: true },
      });

      if (referrer?.branchId) {
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
    }

    // --- TẠO DỮ LIỆU ---
    const newCustomer = await db.customer.create({
      data: {
        ...data,
        phone: cleanPhone,
        licensePlate: cleanPlate,
        carYear: data.carYear ? String(data.carYear) : null,
        status: assignedStaffId ? LeadStatus.ASSIGNED : LeadStatus.NEW,
        assignedToId: assignedStaffId,
      },
      include: {
        referrer: { include: { branch: true } },
        carModel: true,
        assignedTo: true,
      },
    });

    if (assignedStaffId) {
      await db.user.update({
        where: { id: assignedStaffId },
        data: { lastAssignedAt: new Date() },
      });
    }

    // --- GỬI THÔNG BÁO ---
    // (Giữ nguyên logic gửi email của bạn ở đây...)

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi hệ thống");
  }
}

/**
 * 2. CẬP NHẬT TRẠNG THÁI KÈM LÝ DO (LOSE, FROZEN, PENDING_VIEW, etc.)
 */
export async function updateCustomerStatusAction(
  customerId: string,
  status: LeadStatus,
  note: string,
  userId: string
) {
  try {
    await db.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái khách
      await tx.customer.update({
        where: { id: customerId },
        data: { status },
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
    throw new Error("Không thể cập nhật trạng thái khách hàng.");
  }
}

/**
 * 3. RÃ BĂNG KHÁCH HÀNG (CHỈ ADMIN/MANAGER)
 */
export async function unfreezeCustomerAction(
  customerId: string,
  userId: string
) {
  try {
    await db.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: { status: LeadStatus.CONTACTED },
      });

      await tx.leadActivity.create({
        data: {
          customerId,
          status: LeadStatus.CONTACTED,
          note: "Rã băng khách hàng từ trạng thái đóng băng.",
          createdById: userId,
        },
      });
    });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    throw new Error("Lỗi khi rã băng khách hàng.");
  }
}

/**
 * 4. PHÂN BỔ THỦ CÔNG
 */
export async function assignCustomerAction(
  customerId: string,
  staffId: string
) {
  try {
    await db.customer.update({
      where: { id: customerId },
      data: { assignedToId: staffId, status: LeadStatus.ASSIGNED },
    });

    await db.user.update({
      where: { id: staffId },
      data: { lastAssignedAt: new Date() },
    });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    throw new Error("Lỗi phân bổ.");
  }
}

/**
 * 5. LẤY DANH SÁCH (FULL DATA CHO ADMIN)
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
        include: { customer: { select: { fullName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 6. LẤY CHI TIẾT HOẠT ĐỘNG CỦA MỘT KHÁCH
 */
export async function getCustomerActivitiesAction(customerId: string) {
  return await db.leadActivity.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}
