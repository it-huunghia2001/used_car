/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import { LeadStatus } from "@prisma/client";

// --- INTERFACES CHUẨN CHO MA TRẬN LEAD ---
interface UrgencyMatrix {
  HOT: number;
  WARM: number;
  COOL: number;
  total: number;
}
interface InspectionMatrix {
  INSPECTED: UrgencyMatrix;
  APPOINTED: UrgencyMatrix;
  NOT_INSPECTED: UrgencyMatrix;
  total: number;
}
interface MonthReport {
  monthIdx: number;
  monthName: string;
  SUCCESS: InspectionMatrix;
  LOSE: InspectionMatrix;
  FROZEN: InspectionMatrix;
  REMAINING: InspectionMatrix;
  trend: {
    SUCCESS: number;
    LOSE: number;
    FROZEN: number;
    REMAINING: number;
    HOT: number;
  };
}

export async function getAdvancedReportAction(
  month?: number,
  year?: number,
  selectedBranchId?: string,
  selectedUserId?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { role, id: authId, branchId: userBranchId, isGlobalManager } = user;
  const isHighLevel = role === "ADMIN" || isGlobalManager;

  // --- 1. XỬ LÝ PHÂN QUYỀN VÀ PHẠM VI (SCOPE) ---
  const effectiveBranchId = isHighLevel ? selectedBranchId : userBranchId;
  let effectiveUserId = selectedUserId;

  if (!isHighLevel) {
    if (role === "MANAGER") {
      effectiveUserId = selectedUserId || undefined;
    } else {
      effectiveUserId = authId; // Nhân viên chỉ xem chính mình
    }
  }

  // Lọc thời gian năm hiện tại cho ma trận
  const yearQuery = {
    createdAt: {
      gte: dayjs().startOf("year").toDate(),
      lte: dayjs().endOf("year").toDate(),
    },
  };

  // --- 2. TRUY VẤN SONG SONG TẤT CẢ CÁC BÁO CÁO ---
  const [
    totalSales,
    totalPurchased,
    lateLeads,
    lateTasks,
    branchesForChart,
    salesByBranchRaw,
    purchasesByBranchRaw,
    staffPerformance,
    inventoryStatus,
    myPending,
    allDepartments,
    allLeadsForMatrix,
  ] = await Promise.all([
    db.car.count({
      where: {
        status: "SOLD",
        soldBy: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),
    db.car.count({
      where: {
        purchasedAt: { not: null },
        purchaser: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),
    db.leadActivity.count({
      where: {
        isLate: true,
        user: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),
    db.task.count({
      where: {
        isLate: true,
        assignee: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),
    db.branch.findMany({ select: { id: true, name: true } }),
    db.user.groupBy({
      by: ["branchId"],
      where: { soldCars: { some: { status: "SOLD" } } },
      _count: { id: true },
    }),
    db.user.groupBy({
      by: ["branchId"],
      where: { purchases: { some: { purchasedAt: { not: null } } } },
      _count: { id: true },
    }),
    db.user.findMany({
      where: {
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        _count: { select: { soldCars: true, purchases: true } },
      },
      orderBy: { soldCars: { _count: "desc" } },
      take: 10,
    }),
    db.car.groupBy({
      by: ["status"],
      where: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      _count: true,
    }),
    db.task.count({ where: { assigneeId: authId, status: "PENDING" } }),
    isHighLevel || role === "MANAGER"
      ? db.department.findMany({
          select: {
            name: true,
            users: {
              where: effectiveBranchId ? { branchId: effectiveBranchId } : {},
              select: { _count: { select: { createdReferrals: true } } },
            },
          },
        })
      : [],

    // TRUY VẤN CHÍNH CHO MA TRẬN 3 TẦNG (Sửa lỗi createdById -> userId)
    db.customer.findMany({
      where: {
        ...yearQuery,
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        ...(effectiveUserId ? { userId: effectiveUserId } : {}),
      },
      select: {
        status: true,
        inspectStatus: true,
        urgencyLevel: true,
        createdAt: true,
      },
    }),
  ]);

  // --- 3. XỬ LÝ MA TRẬN DỮ LIỆU ---
  const categories = {
    SUCCESS: [LeadStatus.DEAL_DONE] as LeadStatus[],
    LOSE: [
      LeadStatus.LOSE,
      LeadStatus.CANCELLED,
      LeadStatus.REJECTED_APPROVAL,
    ] as LeadStatus[],
    FROZEN: [LeadStatus.FROZEN] as LeadStatus[],
  };

  const createEmptyMatrix = (): InspectionMatrix => ({
    INSPECTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    APPOINTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    NOT_INSPECTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    total: 0,
  });

  const monthlyData: MonthReport[] = Array.from({ length: 12 }, (_, i) => ({
    monthIdx: i,
    monthName: `Tháng ${i + 1}`,
    SUCCESS: createEmptyMatrix(),
    LOSE: createEmptyMatrix(),
    FROZEN: createEmptyMatrix(),
    REMAINING: createEmptyMatrix(),
    trend: { SUCCESS: 0, LOSE: 0, FROZEN: 0, REMAINING: 0, HOT: 0 },
  }));

  allLeadsForMatrix.forEach((lead) => {
    const mIdx = dayjs(lead.createdAt).month();
    const mData = monthlyData[mIdx];
    let catKey: "SUCCESS" | "LOSE" | "FROZEN" | "REMAINING" = "REMAINING";

    if (categories.SUCCESS.includes(lead.status)) catKey = "SUCCESS";
    else if (categories.LOSE.includes(lead.status)) catKey = "LOSE";
    else if (categories.FROZEN.includes(lead.status)) catKey = "FROZEN";

    const insKey =
      (lead.inspectStatus as keyof InspectionMatrix) || "NOT_INSPECTED";
    const urgKey = (lead.urgencyLevel as keyof UrgencyMatrix) || "COOL";

    mData[catKey].total++;
    (mData[catKey][insKey] as UrgencyMatrix).total++;
    (mData[catKey][insKey] as any)[urgKey]++;
    mData.trend[catKey]++;
    if (urgKey === "HOT") mData.trend.HOT++;
  });

  return {
    role,
    isGlobal: isHighLevel,
    leadAnalytics: monthlyData,
    branches: branchesForChart,
    stats: {
      totalSales,
      totalPurchased,
      lateLeads,
      staffPerformance,
      inventoryStatus,
      yearStats: {
        inspected: totalSales,
        notInspected: lateLeads,
        appointed: myPending,
      },
      growthChart: monthlyData.map((m) => ({
        name: m.monthName,
        count: m.trend.SUCCESS + m.trend.REMAINING,
      })),
    },
  };
}
