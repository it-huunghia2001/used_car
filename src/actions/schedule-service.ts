/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
// 1. Lấy danh sách lịch trực theo tháng
// 1. Lấy danh sách lịch trực theo tháng
export async function getMonthlySchedules(branchId: string, month: Date) {
  try {
    // Ép mốc thời gian về đúng múi giờ VN để tính toán đầu/cuối tháng
    const startOfMonth = dayjs(month)
      .tz("Asia/Ho_Chi_Minh")
      .startOf("month")
      .toDate();

    const endOfMonth = dayjs(month)
      .tz("Asia/Ho_Chi_Minh")
      .endOf("month")
      .toDate();

    console.log("Truy vấn chi nhánh:", branchId);
    console.log("Từ ngày (UTC):", startOfMonth.toISOString());
    console.log("Đến ngày (UTC):", endOfMonth.toISOString());

    const data = await db.salesSchedule.findMany({
      where: {
        branchId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        user: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { date: "asc" },
    });

    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    console.error("Lỗi getMonthlySchedules:", error);
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
    // Sử dụng trực tiếp dayjs đã được extend ở trên
    const targetDate = dayjs(date)
      .tz("Asia/Ho_Chi_Minh")
      .startOf("day")
      .add(1, "hour")
      .toDate();

    console.log("Dữ liệu gửi lên:", date);
    console.log(
      "Chuẩn hóa VN:",
      dayjs(targetDate).format("YYYY-MM-DD HH:mm:ss"),
    );

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
  } catch (error: any) {
    console.error("Lỗi chi tiết:", error);
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
