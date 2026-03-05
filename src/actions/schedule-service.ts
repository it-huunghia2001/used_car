/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs";

// 1. Lấy danh sách lịch trực theo tháng
export async function getMonthlySchedules(branchId: string, month: Date) {
  try {
    const startOfMonth = dayjs(month).startOf("month").toDate();
    const endOfMonth = dayjs(month).endOf("month").toDate();

    const data = await db.salesSchedule.findMany({
      where: {
        branchId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        user: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { date: "asc" },
    });
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// 2. Thêm nhân viên vào lịch trực
export async function upsertSchedule(
  date: Date | string,
  branchId: string,
  userId: string,
) {
  try {
    // KỸ THUẬT QUAN TRỌNG:
    // .tz() sẽ chuyển 17:00:00 UTC thành 00:00:00 VN
    // sau đó .startOf("day") sẽ chốt đúng ngày đó.
    const targetDate = dayjs(date)
      .tz("Asia/Ho_Chi_Minh")
      .startOf("day")
      .toDate();

    console.log("Ngày sau khi chuẩn hóa (VN):", targetDate);
    // Kết quả sẽ luôn là 00:00:00.000 của ngày bạn chọn trên UI

    // Truy vấn dùng targetDate đã chuẩn hóa
    const exist = await db.salesSchedule.findFirst({
      where: {
        date: targetDate,
        userId,
        branchId,
      },
    });

    if (exist)
      return { success: false, error: "Nhân viên đã có lịch ngày này" };

    await db.salesSchedule.create({
      data: { date: targetDate, branchId, userId },
    });

    revalidatePath("/dashboard/schedules");
    return { success: true };
  } catch (error: any) {
    console.error("Upsert Schedule Error:", error);
    return { success: false, error: "Lỗi hệ thống khi lưu lịch trực" };
  }
}

// 3. Xóa nhân viên khỏi lịch trực
export async function removeStaffFromSchedule(id: string) {
  try {
    await db.salesSchedule.delete({ where: { id } });
    revalidatePath("/dashboard/schedules");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 4. Lấy danh sách nhân viên Sales của chi nhánh
export async function getBranchSalesStaff(branchId: string) {
  const users = await db.user.findMany({
    where: { branchId, role: "SALES_STAFF", active: true },
    select: { id: true, fullName: true, username: true },
  });
  return { success: true, data: JSON.parse(JSON.stringify(users)) };
}
