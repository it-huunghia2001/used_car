/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { LeadStatus } from "@prisma/client";

/**
 * 1. Lấy tất cả lý do (Dùng cho trang quản trị Admin)
 */
export async function getAllReasons() {
  try {
    return await db.leadReason.findMany({
      orderBy: [{ type: "asc" }, { content: "asc" }],
    });
  } catch (error) {
    console.error("Lỗi getAllReasons:", error);
    return [];
  }
}

/**
 * 2. Tạo lý do mới
 * @param data { content: string, type: LeadStatus }
 */
export async function createReason(data: {
  content: string;
  type: LeadStatus;
}) {
  try {
    const newReason = await db.leadReason.create({
      data: {
        content: data.content,
        type: data.type,
        active: true,
      },
    });

    revalidatePath("/dashboard/admin/reasons"); // Cập nhật lại trang quản trị
    return { success: true, data: newReason };
  } catch (error: any) {
    throw new Error("Không thể tạo lý do: " + error.message);
  }
}

/**
 * 3. Cập nhật lý do (Sửa nội dung hoặc Bật/Tắt)
 */
export async function updateReason(
  id: string,
  data: { content?: string; active?: boolean; type?: LeadStatus }
) {
  try {
    await db.leadReason.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/admin/reasons");
    return { success: true };
  } catch (error: any) {
    throw new Error("Lỗi cập nhật lý do: " + error.message);
  }
}

/**
 * 4. Xóa lý do
 * Lưu ý: Chỉ nên xóa nếu lý do này chưa từng được sử dụng trong LeadActivity
 */
export async function deleteReason(id: string) {
  try {
    // Kiểm tra xem lý do đã được sử dụng chưa
    const isUsed = await db.leadActivity.findFirst({
      where: { reasonId: id },
    });

    if (isUsed) {
      // Nếu đã dùng rồi thì chỉ nên chuyển active = false (Soft delete)
      await db.leadReason.update({
        where: { id },
        data: { active: false },
      });
      return {
        success: true,
        message: "Lý do đã được sử dụng nên hệ thống chỉ ẩn đi.",
      };
    }

    await db.leadReason.delete({ where: { id } });
    revalidatePath("/dashboard/admin/reasons");
    return { success: true };
  } catch (error: any) {
    throw new Error("Lỗi khi xóa lý do: " + error.message);
  }
}
