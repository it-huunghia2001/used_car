/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import dayjs from "@/lib/dayjs";

export async function getAdvancedReportAction(
  month?: number,
  year?: number,
  branchId?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const now = dayjs(); // Mốc thời gian thực tại
  const targetYear = year || now.year();

  const startOfYear = dayjs(`${targetYear}-01-01`).startOf("year").toDate();
  const endOfYear = dayjs(`${targetYear}-12-31`).endOf("year").toDate();
  const todayStart = now.startOf("day");
  const todayEnd = now.endOf("day");

  // Logic Phân Quyền
  const isGlobal = user.role === "ADMIN" || user.isGlobalManager;
  const filter: any = { createdAt: { gte: startOfYear, lte: endOfYear } };
  if (branchId) filter.branchId = branchId;
  if (!isGlobal) {
    if (user.role === "MANAGER") filter.branchId = user.branchId;
    else filter.assignedToId = user.id;
  }

  const [customers, inventory, staff] = await Promise.all([
    db.customer.findMany({
      where: filter,
      // Lấy thêm các trường thời gian để tính trễ chính xác
      select: {
        id: true,
        status: true,
        inspectStatus: true,
        urgencyLevel: true,
        createdAt: true,
        lastContactAt: true,
        nextContactAt: true,
        inspectDate: true,
        isLate: true, // Vẫn lấy để tham chiếu
      },
    }),
    db.car.groupBy({
      by: ["status"],
      where: isGlobal
        ? branchId
          ? { branchId }
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
        fullName: true,
        role: true,
        _count: { select: { soldCars: true, purchases: true } },
      },
      take: 5,
    }),
  ]);

  // --- LOGIC TÍNH TRỄ THỜI GIAN THỰC ---
  const lateRealtimeCount = customers.filter((c) => {
    // 1. Trễ lịch hẹn gọi điện: Có lịch hẹn < hiện tại và chưa hoàn thành cuộc gọi đó
    const isContactLate =
      c.nextContactAt &&
      dayjs(c.nextContactAt).isBefore(now) &&
      (!c.lastContactAt ||
        dayjs(c.lastContactAt).isBefore(dayjs(c.nextContactAt)));

    // 2. Trễ lịch giám định: Có ngày hẹn < hiện tại mà trạng thái vẫn chưa là INSPECTED
    const isInspectLate =
      c.inspectDate &&
      dayjs(c.inspectDate).isBefore(now) &&
      c.inspectStatus !== "INSPECTED";

    return isContactLate || isInspectLate || c.isLate; // Kết hợp cả flag hệ thống
  }).length;

  // TÍNH TOÁN PHÂN LOẠI THEO 12 THÁNG
  const monthlyUrgency = Array.from({ length: 12 }).map((_, i) => {
    const monthData = customers.filter((c) => dayjs(c.createdAt).month() === i);
    return {
      month: `T${i + 1}`,
      hot: monthData.filter((c) => c.urgencyLevel === "HOT").length,
      warm: monthData.filter((c) => c.urgencyLevel === "WARM").length,
      cool: monthData.filter((c) => c.urgencyLevel === "COOL").length,
      unknown: monthData.filter((c) => !c.urgencyLevel).length,
    };
  });

  return JSON.parse(
    JSON.stringify({
      role: user.role,
      isGlobal,
      stats: {
        yearStats: {
          total: customers.length,
          inspected: customers.filter((c) => c.inspectStatus === "INSPECTED")
            .length,
          notInspected: customers.filter(
            (c) => c.inspectStatus === "NOT_INSPECTED",
          ).length,
          appointed: customers.filter((c) => c.inspectStatus === "APPOINTED")
            .length,
          pendingView: customers.filter((c) =>
            ["PENDING_VIEW", "ASSIGNED", "NEW"].includes(c.status),
          ).length,
        },
        monthlyUrgency,
        todayStats: {
          // Số khách CẦN liên hệ hôm nay (có lịch hẹn trong ngày hôm nay)
          needContact: customers.filter(
            (c) =>
              c.nextContactAt &&
              dayjs(c.nextContactAt).isBetween(
                todayStart,
                todayEnd,
                null,
                "[]",
              ),
          ).length,
          // Số khách ĐÃ liên hệ thành công hôm nay
          contacted: customers.filter(
            (c) =>
              c.lastContactAt &&
              dayjs(c.lastContactAt).isBetween(
                todayStart,
                todayEnd,
                null,
                "[]",
              ),
          ).length,
          // Số khách ĐANG TRỄ (Tính thời gian thực)
          late: lateRealtimeCount,
        },
        growthChart: monthlyUrgency.map((m) => ({
          name: m.month,
          count: m.hot + m.warm + m.cool + m.unknown,
        })),
        inventoryStatus: inventory,
        staffPerformance: staff,
      },
    }),
  );
}
