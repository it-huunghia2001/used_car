/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. Lấy danh sách toàn bộ lý do
export async function getNotSeenReasons() {
  return await db.notSeenCarModel.findMany({
    orderBy: { name: "asc" },
  });
}

// 2. Tạo mới hoặc cập nhật lý do
export async function upsertNotSeenReason(data: {
  id?: string;
  name: string;
  content?: string;
}) {
  try {
    if (data.id) {
      await db.notSeenCarModel.update({
        where: { id: data.id },
        data: { name: data.name, content: data.content },
      });
    } else {
      await db.notSeenCarModel.create({
        data: { name: data.name, content: data.content },
      });
    }
    revalidatePath("/dashboard/settings/reasons");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Xóa lý do
export async function deleteNotSeenReason(id: string) {
  try {
    await db.notSeenCarModel.delete({ where: { id } });
    revalidatePath("/dashboard/settings/reasons");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "Không thể xóa vì lý do này đang được sử dụng.",
    };
  }
}
