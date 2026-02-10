/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session-server"; // Giả định helper lấy user từ session
import { Role } from "@prisma/client";

/**
 * Hàm Helper kiểm tra quyền Admin/Manager
 */
async function checkAdminAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const isAdmin = user.role === Role.ADMIN || user.role === Role.MANAGER;
  if (!isAdmin)
    throw new Error("Forbidden: Bạn không có quyền thực hiện hành động này");

  return user;
}

// ==========================================
// A. QUẢN LÝ LÝ DO BÁN XE (SELL REASON)
// ==========================================

export async function getSellReasons() {
  // Lấy danh sách không cần check auth gắt gao để sale có thể xem
  return await db.sellReason.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function upsertSellReason(data: {
  id?: string;
  name: string;
  content?: string;
}) {
  try {
    await checkAdminAuth(); // Kiểm tra quyền trước khi ghi đè dữ liệu

    if (data.id) {
      await db.sellReason.update({
        where: { id: data.id },
        data: { name: data.name, content: data.content },
      });
    } else {
      await db.sellReason.create({
        data: { name: data.name, content: data.content },
      });
    }
    revalidatePath("/dashboard/settings/reasons");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi hệ thống khi xử lý lý do bán.",
    };
  }
}

export async function deleteSellReason(id: string) {
  try {
    await checkAdminAuth();
    await db.sellReason.delete({ where: { id } });
    revalidatePath("/dashboard/settings/reasons");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "Không thể xóa lý do bán này (có thể đang được sử dụng).",
    };
  }
}

// ==========================================
// B. QUẢN LÝ LÝ DO MUA XE (BUY REASON)
// ==========================================

export async function getBuyReasons() {
  return await db.buyReason.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function upsertBuyReason(data: {
  id?: string;
  name: string;
  content?: string;
}) {
  try {
    await checkAdminAuth();

    if (data.id) {
      await db.buyReason.update({
        where: { id: data.id },
        data: { name: data.name, content: data.content },
      });
    } else {
      await db.buyReason.create({
        data: { name: data.name, content: data.content },
      });
    }
    revalidatePath("/dashboard/settings/reasons");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi hệ thống khi xử lý lý do mua.",
    };
  }
}

export async function deleteBuyReason(id: string) {
  try {
    await checkAdminAuth();
    await db.buyReason.delete({ where: { id } });
    revalidatePath("/dashboard/settings/reasons");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "Không thể xóa lý do mua này (có thể đang được sử dụng).",
    };
  }
}
