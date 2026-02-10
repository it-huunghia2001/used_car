/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import dayjs from "@/lib/dayjs"; // Đảm bảo file này đã .extend(isBetween)

export async function getAdvancedReportAction(
  month?: number,
  year?: number,
  branchId?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const targetYear = year || dayjs().year();
  const startOfYear = dayjs(`${targetYear}-01-01`).startOf("year").toDate();
  const endOfYear = dayjs(`${targetYear}-12-31`).endOf("year").toDate();

  const todayStart = dayjs().startOf("day");
  const todayEnd = dayjs().endOf("day");
  const currentMonthStart = dayjs().startOf("month");

  // 1. Logic Phân Quyền (Authorization Where Clause)
  const where: any = { createdAt: { gte: startOfYear, lte: endOfYear } };

  if (branchId) where.branchId = branchId;

  const isGlobal = user.role === "ADMIN" || user.isGlobalManager;
  if (!isGlobal) {
    if (user.role === "MANAGER") {
      where.branchId = user.branchId;
    } else {
      where.assignedToId = user.id; // User thường chỉ thấy Lead của mình
    }
  }

  // 2. Truy vấn dữ liệu
  const [customers, inventoryStatus, staffPerformance, departmentStats] =
    await Promise.all([
      db.customer.findMany({
        where,
        select: {
          status: true,
          inspectStatus: true,
          urgencyLevel: true,
          createdAt: true,
          lastContactAt: true,
          nextContactAt: true,
          isLate: true,
        },
      }),
      db.car.groupBy({
        by: ["status"],
        where: isGlobal
          ? branchId
            ? { branchId: branchId }
            : {}
          : { branchId: user.branchId || undefined },
        _count: true,
      }),
      db.user.findMany({
        where: isGlobal
          ? branchId
            ? { branchId }
            : {}
          : { branchId: user.branchId },
        select: {
          id: true,
          fullName: true,
          role: true,
          username: true,
          branch: { select: { name: true } },
          _count: {
            select: {
              soldCars: true,
              purchases: true,
              leadActivities: { where: { isLate: true } },
              tasks: { where: { isLate: true } },
            },
          },
        },
        take: 10,
      }),
      // Thống kê giới thiệu theo phòng ban (Nếu có quan hệ)
      db.department.findMany({
        select: {
          name: true,
          _count: { select: { users: true } }, // Thay bằng logic thống kê lead nếu có schema
        },
      }),
    ]);

  // 3. Tính toán các chỉ số
  const stats = {
    // Thống kê Năm
    yearStats: {
      total: customers.length,
      inspected: customers.filter((c) => c.inspectStatus === "INSPECTED")
        .length,
      notInspected: customers.filter((c) => c.inspectStatus === "NOT_INSPECTED")
        .length,
      appointed: customers.filter((c) => c.inspectStatus === "APPOINTED")
        .length,
      following: customers.filter(
        (c) => !["DEAL_DONE", "CANCELLED", "LOSE"].includes(c.status),
      ).length,
    },
    // Thống kê Độ nóng (Tháng hiện tại)
    urgencyStats: {
      hot: customers.filter(
        (c) =>
          dayjs(c.createdAt).isAfter(currentMonthStart) &&
          c.urgencyLevel === "HOT",
      ).length,
      warm: customers.filter(
        (c) =>
          dayjs(c.createdAt).isAfter(currentMonthStart) &&
          c.urgencyLevel === "WARM",
      ).length,
      cool: customers.filter(
        (c) =>
          dayjs(c.createdAt).isAfter(currentMonthStart) &&
          c.urgencyLevel === "COOL",
      ).length,
    },
    // Thống kê Hôm nay
    todayStats: {
      needContact: customers.filter(
        (c) =>
          c.nextContactAt &&
          dayjs(c.nextContactAt).isBetween(todayStart, todayEnd, null, "[]"),
      ).length,
      lateToday: customers.filter((c) => c.isLate).length,
      contactedToday: customers.filter(
        (c) =>
          c.lastContactAt &&
          dayjs(c.lastContactAt).isBetween(todayStart, todayEnd, null, "[]"),
      ).length,
    },
    // Biểu đồ tăng trưởng
    growthChart: Array.from({ length: 12 }).map((_, i) => ({
      name: `T.${i + 1}`,
      count: customers.filter((c) => dayjs(c.createdAt).month() === i).length,
    })),
    // Giữ lại dữ liệu cũ cho UI
    inventoryStatus,
    staffPerformance,
    departmentStats: departmentStats.map((d) => ({
      name: d.name,
      count: d._count.users,
    })), // Ví dụ
    myPending: customers.filter(
      (c) => c.status === "ASSIGNED" || c.status === "FOLLOW_UP",
    ).length,
    totalPurchased: staffPerformance.reduce(
      (acc, curr) => acc + curr._count.purchases,
      0,
    ),
    totalSales: staffPerformance.reduce(
      (acc, curr) => acc + curr._count.soldCars,
      0,
    ),
    lateLeads: customers.filter((c) => c.isLate).length,
    lateTasks: 0, // Tính thêm từ bảng Task nếu cần
  };

  return JSON.parse(
    JSON.stringify({
      role: user.role,
      isGlobal,
      stats,
    }),
  );
}
