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

interface CreateCustomerInput {
  fullName: string;
  phone: string;
  type: "SELL" | "BUY" | "VALUATION";
  referrerId: string;
  carType?: string;
  licensePlate?: string;
  budget?: string;
  expectedPrice?: string;
  note?: string;
  carImages?: string;
  registrationImage?: string;
}

/**
 * TẠO LỜI GIỚI THIỆU MỚI & GỬI EMAIL THÔNG BÁO
 */
export async function createCustomerAction(data: CreateCustomerInput) {
  try {
    // 1. Lưu khách hàng và lấy thông tin chi tiết
    const newCustomer = await db.customer.create({
      data: {
        ...data,
        status: "NEW",
      },
      include: {
        referrer: {
          include: { branch: true },
        },
      },
    });

    // 2. Xác định danh sách Email người nhận (Global Manager + Branch Manager)
    const recipients = new Set<string>();

    const managers = await db.user.findMany({
      where: {
        active: true,
        OR: [
          { isGlobalManager: true },
          {
            branchId: newCustomer.referrer.branchId,
            role: "MANAGER",
          },
        ],
        NOT: { email: undefined },
      },
      select: { email: true },
    });

    managers.forEach((m) => {
      if (m.email) recipients.add(m.email);
    });

    if (process.env.ADMIN_EMAIL) recipients.add(process.env.ADMIN_EMAIL);

    // 3. Chuẩn bị nội dung Email (ẨN CÁC DÒNG KHÔNG CÓ DỮ LIỆU)
    const typeLabels = {
      SELL: "BÁN XE / ĐỔI XE",
      BUY: "MUA XE CŨ",
      VALUATION: "ĐỊNH GIÁ XE",
    };

    // Xây dựng nội dung chi tiết dạng danh sách, chỉ thêm nếu có dữ liệu
    const detailRows = [];
    if (data.carType) detailRows.push(`- Dòng xe: ${data.carType}`);
    if (data.licensePlate) detailRows.push(`- Biển số: ${data.licensePlate}`);
    if (data.budget) detailRows.push(`- Ngân sách: ${data.budget}`);
    if (data.expectedPrice)
      detailRows.push(`- Giá mong muốn: ${data.expectedPrice}`);
    if (data.note) detailRows.push(`- Ghi chú: ${data.note}`);

    const emailDetails =
      detailRows.length > 0
        ? detailRows.join("\n")
        : "- Không có thông tin chi tiết bổ sung";

    const htmlContent = referralEmailTemplate({
      customerName: data.fullName,
      typeLabel: typeLabels[data.type],
      referrerName:
        newCustomer.referrer.fullName || newCustomer.referrer.username,
      branchName: newCustomer.referrer.branch?.name,
      details: emailDetails,
    });

    // 4. Gửi mail bất đồng bộ
    if (recipients.size > 0) {
      const emailSubject = `[KHÁCH MỚI] ${data.fullName.toUpperCase()} - ${
        typeLabels[data.type]
      }`;

      Promise.all(
        Array.from(recipients).map((email) =>
          sendMail({ to: email, subject: emailSubject, html: htmlContent })
        )
      ).catch((err) => console.error("Lỗi gửi email:", err));
    }

    revalidatePath("/dashboard/referrals/history");
    revalidatePath("/dashboard/customers");

    return { success: true };
  } catch (error: any) {
    console.error("Referral Error:", error);
    throw new Error("Không thể gửi thông tin giới thiệu.");
  }
}

/**
 * LẤY DANH SÁCH KHÁCH HÀNG
 */
export async function getCustomersAction() {
  return await db.customer.findMany({
    include: {
      referrer: {
        select: {
          fullName: true,
          username: true,
          branch: { select: { name: true } },
        },
      },
      assignedTo: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * LẤY LỊCH SỬ GIỚI THIỆU CỦA CÁ NHÂN
 */
export async function getMyReferralsAction(referrerId: string) {
  return await db.customer.findMany({
    where: { referrerId },
    include: {
      assignedTo: { select: { fullName: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * PHÂN BỔ NHÂN VIÊN
 */
export async function assignCustomerAction(
  customerId: string,
  staffId: string
) {
  try {
    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: {
        assignedToId: staffId,
        status: "ASSIGNED",
      },
      include: {
        assignedTo: true,
        referrer: { include: { branch: true } },
      },
    });

    // Nếu nhân viên được giao có email, tiến hành gửi mail thông báo
    if (updatedCustomer.assignedTo?.email) {
      const typeLabels = {
        SELL: "BÁN XE / ĐỔI XE",
        BUY: "MUA XE CŨ",
        VALUATION: "ĐỊNH GIÁ XE",
      };

      // Xử lý thông tin chi tiết (ẩn các trường trống như yêu cầu trước)
      const detailRows = [];
      if (updatedCustomer.carType)
        detailRows.push(`- Dòng xe: ${updatedCustomer.carType}`);
      if (updatedCustomer.licensePlate)
        detailRows.push(`- Biển số: ${updatedCustomer.licensePlate}`);
      if (updatedCustomer.note)
        detailRows.push(`- Ghi chú: ${updatedCustomer.note}`);

      const htmlContent = staffAssignmentEmailTemplate({
        customerName: updatedCustomer.fullName,
        customerPhone: updatedCustomer.phone,
        typeLabel: typeLabels[updatedCustomer.type as keyof typeof typeLabels],
        details: detailRows.join("\n") || "Liên hệ để biết thêm chi tiết",
        branchName: updatedCustomer.referrer.branch?.name,
      });

      sendMail({
        to: updatedCustomer.assignedTo.email,
        subject: `[NHIỆM VỤ] Chăm sóc khách hàng: ${updatedCustomer.fullName.toUpperCase()}`,
        html: htmlContent,
      }).catch((err: any) => console.error("Lỗi gửi mail assign:", err));
    }

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    throw new Error("Lỗi khi phân bổ nhân viên");
  }
}
