/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import { revalidatePath } from "next/cache";

// Lấy cấu hình duy nhất
export async function getLeadSettings() {
  const settings = await db.leadSetting.findUnique({
    where: { id: "lead_config" },
  });

  // Nếu chưa có (lần đầu chạy), tạo mặc định
  if (!settings) {
    return await db.leadSetting.create({
      data: { id: "lead_config", hotDays: 3, warmDays: 7 },
    });
  }
  return settings;
}

// Cập nhật cấu hình
export async function updateLeadSettings(hotDays: number, warmDays: number) {
  try {
    if (hotDays >= warmDays) {
      throw new Error("Số ngày mức HOT phải nhỏ hơn số ngày mức WARM");
    }

    const result = await db.leadSetting.update({
      where: { id: "lead_config" },
      data: { hotDays, warmDays },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: result };
  } catch (error: any) {
    throw new Error(error.message || "Không thể cập nhật cấu hình");
  }
}

// 1. Lấy danh sách khách hàng FROZEN theo phân quyền
export async function getFrozenLeadsAction() {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: "Unauthorized" };

  try {
    const whereCondition: any = { status: "FROZEN" };

    // Phân quyền: Manager chỉ thấy chi nhánh mình, Admin/Global thấy tất cả
    if (auth.role === "MANAGER" && !auth.isGlobalManager) {
      whereCondition.referrer = { branchId: auth.branchId };
    }

    const leads = await db.customer.findMany({
      where: whereCondition,
      include: {
        referrer: {
          select: { fullName: true, branch: { select: { name: true } } },
        },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: leads };
  } catch (error) {
    return { success: false, error: "Lỗi lấy danh sách khách đóng băng" };
  }
}

// 2. Thực hiện rã băng
export async function unfreezeLeadAction(customerId: string) {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: "Unauthorized" };

  try {
    return await db.$transaction(async (tx) => {
      const lead = await tx.customer.findUnique({
        where: { id: customerId },
        select: { fullName: true, status: true },
      });

      if (!lead || lead.status !== "FROZEN") {
        throw new Error("Khách hàng không ở trạng thái đóng băng");
      }

      // Cập nhật trạng thái khách
      const updated = await tx.customer.update({
        where: { id: customerId },
        data: {
          status: "CONTACTED",
          lastContactAt: new Date(),
        },
      });

      // Ghi lịch sử hoạt động (Log History)
      await tx.leadActivity.create({
        data: {
          customerId: customerId,
          status: "CONTACTED",
          note: `🔓 Đã rã băng bởi ${auth.fullName} (${auth.role}). Hệ thống chuyển trạng thái về Đã liên hệ.`,
          createdById: auth.id,
        },
      });

      return { success: true, name: updated.fullName };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    revalidatePath("/dashboard/frozen-leads");
  }
}

// 3. Lấy lịch sử chi tiết của một khách hàng
export async function getCustomerHistoryAction(customerId: string) {
  try {
    const activities = await db.leadActivity.findMany({
      where: { customerId },
      include: {
        user: { select: { fullName: true, role: true } },
        reason: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: activities };
  } catch (error) {
    return { success: false, error: "Không thể tải lịch sử khách hàng" };
  }
}
