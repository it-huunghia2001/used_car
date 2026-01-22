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
  date: Date,
  branchId: string,
  userId: string,
) {
  try {
    const targetDate = dayjs(date).startOf("day").toDate();

    // Tránh trùng lặp trong cùng 1 ngày
    const exist = await db.salesSchedule.findFirst({
      where: { date: targetDate, userId, branchId },
    });
    if (exist)
      return { success: false, error: "Nhân viên đã có trong lịch ngày này" };

    await db.salesSchedule.create({
      data: { date: targetDate, branchId, userId },
    });

    revalidatePath("/dashboard/schedules");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống" };
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
