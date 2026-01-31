/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. Lấy danh sách lý do
export async function getSellReasons() {
  return await db.reasonBuyCar.findMany({
    orderBy: { name: "asc" },
  });
}

// 2. Thêm hoặc Cập nhật lý do
export async function upsertSellReason(data: {
  id?: string;
  name: string;
  content?: string;
}) {
  try {
    if (data.id) {
      await db.reasonBuyCar.update({
        where: { id: data.id },
        data: { name: data.name, content: data.content },
      });
    } else {
      await db.reasonBuyCar.create({
        data: { name: data.name, content: data.content },
      });
    }
    revalidatePath("/dashboard/settings/reasons");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "Tên lý do này đã tồn tại hoặc có lỗi xảy ra.",
    };
  }
}

// 3. Xóa lý do
export async function deleteSellReason(id: string) {
  try {
    await db.reasonBuyCar.delete({ where: { id } });
    revalidatePath("/dashboard/settings/reasons");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "Lý do này đang được sử dụng, không thể xóa.",
    };
  }
}
