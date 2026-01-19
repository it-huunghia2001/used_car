/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { db } from "@/lib/db";
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
