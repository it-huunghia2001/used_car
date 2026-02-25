/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import { LeadStatus, ReferralType } from "@prisma/client";

// ── INTERFACES TYPE-SAFE CHO DỮ LIỆU TRẢ VỀ ──
interface UrgencyStats {
  HOT: number;
  WARM: number;
  COOL: number;
  total: number;
}

interface InspectionMatrix {
  INSPECTED: UrgencyStats;
  APPOINTED: UrgencyStats;
  NOT_INSPECTED: UrgencyStats;
  total: number;
}

interface MonthlyAnalytics {
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

interface BranchYearlyStats {
  branchId: string;
  branchName: string;
  totalSales: number;
  totalPurchase: number;
  totalTrade: number;
  totalNewCars: number;
}

export interface ReportResponse {
  role: string;
  isGlobal: boolean;
  salesAnalytics: MonthlyAnalytics[];
  purchaseAnalytics: MonthlyAnalytics[];
  tradeAnalytics: MonthlyAnalytics[];
  interestedModelsByMonth: Array<{ modelName: string; count: number }>;
  branches: Array<{ id: string; name: string }>;
  newCarSalesByMonth: Array<{ month: number; totalNewCars: number }>;
  totalNewCarsYear: number;
  newCarPerBranch: Array<BranchYearlyStats> | null;
  stats: {
    sales: { total: number; late: number; performance: any[] };
    purchase: { total: number; late: number; performance: any[] };
    trade: { total: number; late: number; performance: any[] };
    inventoryStatus: any[];
    yearlyTotals: {
      system: {
        totalSales: number;
        totalPurchase: number;
        totalTrade: number;
        totalNewCars: number;
      };
      perBranch: BranchYearlyStats[];
    };
    growthChart: Array<{
      name: string;
      sales: number;
      purchase: number;
      trade: number;
    }>;
  };
}

// ── HÀM CHÍNH ──
export async function getAdvancedReportAction(
  month?: number,
  year?: number,
  selectedBranchId?: string,
  selectedUserId?: string,
): Promise<ReportResponse> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { role, id: authId, branchId: userBranchId, isGlobalManager } = user;
  const isHighLevel = role === "ADMIN" || isGlobalManager;

  // 1. Phân quyền & phạm vi dữ liệu
  const effectiveBranchId = isHighLevel ? selectedBranchId : userBranchId;
  const effectiveUserId = !isHighLevel
    ? role === "MANAGER"
      ? selectedUserId || undefined
      : authId
    : selectedUserId;

  // 2. Xử lý khoảng thời gian báo cáo
  const reportYear = year ?? dayjs().year();
  let dateFilter: { gte: Date; lte: Date } | undefined;

  if (month !== undefined) {
    dateFilter = {
      gte: dayjs()
        .year(reportYear)
        .month(month - 1)
        .startOf("month")
        .toDate(),
      lte: dayjs()
        .year(reportYear)
        .month(month - 1)
        .endOf("month")
        .toDate(),
    };
  } else {
    dateFilter = {
      gte: dayjs().year(reportYear).startOf("year").toDate(),
      lte: dayjs().year(reportYear).endOf("year").toDate(),
    };
  }

  const timeWhere = dateFilter ? { createdAt: dateFilter } : {};
  const branchFilter = effectiveBranchId ? { branchId: effectiveBranchId } : {};
  const userFilter = effectiveUserId ? { userId: effectiveUserId } : {};

  // 3. Truy vấn song song (tối ưu hiệu suất, tránh N+1)
  const [
    totalSales,
    totalPurchased,
    totalTrades,
    lateSalesLeads,
    latePurchaseLeads,
    lateTradeLeads,
    branches,
    staffSalesPerformance,
    staffPurchasePerformance,
    staffTradePerformance,
    inventoryStatus,
    allLeadsForMatrix,
    interestedModelsRaw,
    newCarSalesMonthlyRaw,
    totalNewCarsAgg,
    salesByBranch,
    purchaseByBranch,
    tradeByBranch,
    newCarByBranchRaw,
  ] = await Promise.all([
    // Tổng giao dịch thành công
    db.car.count({
      where: {
        status: "SOLD",
        ...timeWhere,
        ...branchFilter,
        contracts: { some: { type: "SALE" } },
      },
    }),
    db.car.count({
      where: {
        purchasedAt: { not: null },
        ...timeWhere,
        ...branchFilter,
        contracts: { some: { type: "PURCHASE" } },
      },
    }),
    db.customer.count({
      where: {
        type: ReferralType.SELL_TRADE_NEW,
        status: LeadStatus.DEAL_DONE,
        ...timeWhere,
        ...branchFilter,
      },
    }),

    // Lead trễ theo luồng
    db.leadActivity.count({
      where: {
        isLate: true,
        customer: {
          type: { in: [ReferralType.BUY, ReferralType.SELL_TRADE_USED] },
          ...timeWhere,
          ...branchFilter,
        },
      },
    }),
    db.leadActivity.count({
      where: {
        isLate: true,
        customer: {
          type: {
            in: [
              ReferralType.SELL,
              ReferralType.VALUATION,
              ReferralType.SELL_TRADE_USED,
            ],
          },
          ...timeWhere,
          ...branchFilter,
        },
      },
    }),
    db.leadActivity.count({
      where: {
        isLate: true,
        customer: {
          type: ReferralType.SELL_TRADE_NEW,
          ...timeWhere,
          ...branchFilter,
        },
      },
    }),

    // Danh sách chi nhánh
    db.branch.findMany({ select: { id: true, name: true } }),

    // Top 5 nhân viên theo luồng
    db.user.findMany({
      where: {
        ...branchFilter,
        role: { in: ["SALES_STAFF", "ADMIN", "MANAGER"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        _count: { select: { soldCars: { where: timeWhere } } },
      },
      orderBy: { soldCars: { _count: "desc" } },
      take: 5,
    }),
    db.user.findMany({
      where: {
        ...branchFilter,
        role: { in: ["PURCHASE_STAFF", "APPRAISER"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        _count: { select: { purchases: { where: timeWhere } } },
      },
      orderBy: { purchases: { _count: "desc" } },
      take: 5,
    }),
    db.user.findMany({
      where: {
        ...branchFilter,
        role: { in: ["SALES_STAFF", "PURCHASE_STAFF"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        _count: {
          select: {
            assignedLeads: {
              where: { type: ReferralType.SELL_TRADE_NEW, ...timeWhere },
            },
          },
        },
      },
      orderBy: { assignedLeads: { _count: "desc" } },
      take: 5,
    }),

    // Trạng thái kho xe
    db.car.groupBy({
      by: ["status"],
      where: { ...branchFilter, ...timeWhere },
      _count: true,
    }),

    // Dữ liệu lead thô để tính ma trận
    db.customer.findMany({
      where: { ...timeWhere, ...branchFilter, ...userFilter },
      select: {
        type: true,
        status: true,
        inspectStatus: true,
        urgencyLevel: true,
        createdAt: true,
      },
    }),

    // Model xe được quan tâm (groupBy tối ưu)
    db.customer.groupBy({
      by: ["carModelId"],
      where: { carModelId: { not: null }, ...timeWhere, ...branchFilter },
      _count: true,
    }),

    // Xe mới theo tháng
    db.dailyCarInbound.groupBy({
      by: ["date"],
      where: { date: dateFilter, ...branchFilter },
      _sum: { totalCars: true },
      orderBy: { date: "asc" },
    }),

    // Tổng xe mới trong năm
    db.dailyCarInbound.aggregate({
      where: { date: dateFilter, ...branchFilter },
      _sum: { totalCars: true },
    }),

    // GroupBy theo chi nhánh để tránh N+1 loop
    db.car.groupBy({
      by: ["branchId"],
      where: { status: "SOLD", ...timeWhere },
      _count: true,
    }),
    db.car.groupBy({
      by: ["branchId"],
      where: { purchasedAt: { not: null }, ...timeWhere },
      _count: true,
    }),
    db.customer.groupBy({
      by: ["branchId"],
      where: {
        type: ReferralType.SELL_TRADE_NEW,
        status: LeadStatus.DEAL_DONE,
        ...timeWhere,
      },
      _count: true,
    }),
    db.dailyCarInbound.groupBy({
      by: ["branchId"],
      where: { date: dateFilter },
      _sum: { totalCars: true },
    }),
  ]);

  // 4. Xử lý dữ liệu sau truy vấn

  // 4.1. Map tên model xe quan tâm
  const modelIds = [
    ...new Set(interestedModelsRaw.map((g: any) => g.carModelId)),
  ].filter(Boolean) as string[];
  const models = await db.carModel.findMany({
    where: { id: { in: modelIds } },
    select: { id: true, name: true },
  });
  const modelMap = new Map(models.map((m) => [m.id, m.name]));

  const interestedModelsByMonth = interestedModelsRaw.map((g: any) => ({
    modelName: modelMap.get(g.carModelId) || "Unknown",
    count: g._count,
  }));

  // 4.2. Yearly totals per branch (join in-memory)
  const perBranchStats = branches.map((b) => {
    const salesCount =
      salesByBranch.find((g) => g.branchId === b.id)?._count ?? 0;
    const purchaseCount =
      purchaseByBranch.find((g) => g.branchId === b.id)?._count ?? 0;
    const tradeCount =
      tradeByBranch.find((g) => g.branchId === b.id)?._count ?? 0;
    const newCarCount =
      newCarByBranchRaw.find((g) => g.branchId === b.id)?._sum.totalCars ?? 0;

    return {
      branchId: b.id,
      branchName: b.name,
      totalSales: salesCount,
      totalPurchase: purchaseCount,
      totalTrade: tradeCount,
      totalNewCars: newCarCount,
    };
  });

  // 4.3. Xử lý ma trận analytics (type-safe)
  const categories = {
    SUCCESS: [LeadStatus.DEAL_DONE],
    LOSE: [LeadStatus.LOSE, LeadStatus.CANCELLED, LeadStatus.REJECTED_APPROVAL],
    FROZEN: [LeadStatus.FROZEN],
  };

  const createEmptyMatrix = (): InspectionMatrix => ({
    INSPECTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    APPOINTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    NOT_INSPECTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    total: 0,
  });

  const createEmptyMonth = (i: number): MonthlyAnalytics => ({
    monthIdx: i,
    monthName: `Tháng ${i + 1}`,
    SUCCESS: createEmptyMatrix(),
    LOSE: createEmptyMatrix(),
    FROZEN: createEmptyMatrix(),
    REMAINING: createEmptyMatrix(),
    trend: { SUCCESS: 0, LOSE: 0, FROZEN: 0, REMAINING: 0, HOT: 0 },
  });

  const salesAnalyticsResult = Array.from({ length: 12 }, (_, i) =>
    createEmptyMonth(i),
  );
  const purchaseAnalyticsResult = Array.from({ length: 12 }, (_, i) =>
    createEmptyMonth(i),
  );
  const tradeAnalyticsResult = Array.from({ length: 12 }, (_, i) =>
    createEmptyMonth(i),
  );

  allLeadsForMatrix.forEach((lead: any) => {
    const monthIndex = dayjs(lead.createdAt).month();
    let targetArray: MonthlyAnalytics[];

    switch (lead.type) {
      case ReferralType.BUY:
        targetArray = salesAnalyticsResult;
        break;
      case ReferralType.SELL:
      case ReferralType.VALUATION:
      case ReferralType.SELL_TRADE_USED:
        targetArray = purchaseAnalyticsResult;
        break;
      case ReferralType.SELL_TRADE_NEW:
        targetArray = tradeAnalyticsResult;
        break;
      default:
        return;
    }

    const monthData = targetArray[monthIndex];
    let categoryKey: keyof Pick<
      MonthlyAnalytics,
      "SUCCESS" | "LOSE" | "FROZEN" | "REMAINING"
    > = "REMAINING";

    if (categories.SUCCESS.includes(lead.status)) categoryKey = "SUCCESS";
    else if (categories.LOSE.includes(lead.status)) categoryKey = "LOSE";
    else if (categories.FROZEN.includes(lead.status)) categoryKey = "FROZEN";
    type InspectStatusKey = "INSPECTED" | "APPOINTED" | "NOT_INSPECTED";
    type UrgencyKey = "HOT" | "WARM" | "COOL";

    const inspectKey = (lead.inspectStatus ||
      "NOT_INSPECTED") as InspectStatusKey;
    const urgencyKey = (lead.urgencyLevel || "COOL") as UrgencyKey;

    monthData[categoryKey].total++;
    const inspectData = monthData[categoryKey][inspectKey];
    if (
      inspectData &&
      typeof inspectData === "object" &&
      "total" in inspectData
    ) {
      inspectData.total++;
      (inspectData as UrgencyStats)[urgencyKey]++;
    }
    monthData.trend[categoryKey]++;
    if (urgencyKey === "HOT") monthData.trend.HOT++;
  });

  // 4.4. Growth chart (tổng quan 3 luồng)
  const growthChart = salesAnalyticsResult.map((m, idx) => ({
    name: m.monthName,
    sales: m.trend.SUCCESS,
    purchase: purchaseAnalyticsResult[idx].trend.SUCCESS,
    trade: tradeAnalyticsResult[idx].trend.SUCCESS,
  }));

  // 5. Trả về dữ liệu đầy đủ
  return {
    role,
    isGlobal: isHighLevel,
    salesAnalytics: salesAnalyticsResult,
    purchaseAnalytics: purchaseAnalyticsResult,
    tradeAnalytics: tradeAnalyticsResult,
    interestedModelsByMonth,
    branches,
    newCarSalesByMonth: newCarSalesMonthlyRaw.map((g: any) => ({
      month: dayjs(g.date).month() + 1,
      totalNewCars: g._sum.totalCars || 0,
    })),
    totalNewCarsYear: totalNewCarsAgg._sum.totalCars || 0,
    newCarPerBranch: newCarByBranchRaw.length > 0 ? perBranchStats : null,
    stats: {
      sales: {
        total: totalSales,
        late: lateSalesLeads,
        performance: staffSalesPerformance,
      },
      purchase: {
        total: totalPurchased,
        late: latePurchaseLeads,
        performance: staffPurchasePerformance,
      },
      trade: {
        total: totalTrades,
        late: lateTradeLeads,
        performance: staffTradePerformance,
      },
      inventoryStatus,
      yearlyTotals: {
        system: {
          totalSales,
          totalPurchase: totalPurchased,
          totalTrade: totalTrades,
          totalNewCars: totalNewCarsAgg._sum.totalCars || 0,
        },
        perBranch: perBranchStats,
      },
      growthChart,
    },
  };
}

export async function getLateReportAction(filters: {
  fromDate?: Date;
  toDate?: Date;
  userId?: string;
  branchId?: string;
}) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Chưa đăng nhập");
  const whereClause: any = {
    isLate: true,
    createdAt: { gte: filters.fromDate, lte: filters.toDate },
  };

  if (auth.role === "ADMIN" || auth.isGlobalManager) {
    if (filters.branchId) whereClause.user = { branchId: filters.branchId };
  } else if (auth.role === "MANAGER") {
    whereClause.user = { branchId: auth.branchId };
  } else {
    whereClause.createdById = auth.id;
  }
  if (filters.userId) whereClause.createdById = filters.userId;

  return await db.leadActivity.findMany({
    where: whereClause,
    select: {
      id: true,
      lateMinutes: true,
      note: true,
      createdAt: true,
      customer: { select: { fullName: true, phone: true } },
      user: {
        select: {
          id: true,
          fullName: true,
          branch: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ── INTERFACE CHUNG CHO TẤT CẢ TAB ──
interface UrgencyStats {
  HOT: number;
  WARM: number;
  COOL: number;
  total: number;
}

interface InspectionMatrix {
  INSPECTED: UrgencyStats;
  APPOINTED: UrgencyStats;
  NOT_INSPECTED: UrgencyStats;
  total: number;
}

interface MonthlyAnalytics {
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

interface TabReportData {
  analytics: MonthlyAnalytics[];
  stats: {
    total: number;
    late: number;
    performance: Array<{ id: string; fullName: string | null; _count: any }>;
  };
}

// ── HÀM CHUNG XỬ LÝ MA TRẬN LEAD (TYPE-SAFE) ──
function processLeadMatrix(leads: any[]): MonthlyAnalytics[] {
  const categories = {
    SUCCESS: [LeadStatus.DEAL_DONE],
    LOSE: [LeadStatus.LOSE, LeadStatus.CANCELLED, LeadStatus.REJECTED_APPROVAL],
    FROZEN: [LeadStatus.FROZEN],
  };

  const createEmptyMatrix = (): InspectionMatrix => ({
    INSPECTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    APPOINTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    NOT_INSPECTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    total: 0,
  });

  const createEmptyMonth = (i: number): MonthlyAnalytics => ({
    monthIdx: i,
    monthName: `Tháng ${i + 1}`,
    SUCCESS: createEmptyMatrix(),
    LOSE: createEmptyMatrix(),
    FROZEN: createEmptyMatrix(),
    REMAINING: createEmptyMatrix(),
    trend: { SUCCESS: 0, LOSE: 0, FROZEN: 0, REMAINING: 0, HOT: 0 },
  });

  const analytics = Array.from({ length: 12 }, (_, i) => createEmptyMonth(i));

  leads.forEach((lead: any) => {
    const monthIndex = dayjs(lead.createdAt).month();
    const monthData = analytics[monthIndex];

    let categoryKey: keyof Pick<
      MonthlyAnalytics,
      "SUCCESS" | "LOSE" | "FROZEN" | "REMAINING"
    > = "REMAINING";
    if (categories.SUCCESS.includes(lead.status)) categoryKey = "SUCCESS";
    else if (categories.LOSE.includes(lead.status)) categoryKey = "LOSE";
    else if (categories.FROZEN.includes(lead.status)) categoryKey = "FROZEN";

    const inspectKey = (lead.inspectStatus ||
      "NOT_INSPECTED") as keyof InspectionMatrix;
    const urgencyKey = (lead.urgencyLevel || "COOL") as keyof UrgencyStats;

    monthData[categoryKey].total++;
    const inspectData = monthData[categoryKey][inspectKey];
    if (
      inspectData &&
      typeof inspectData === "object" &&
      "total" in inspectData
    ) {
      (inspectData as UrgencyStats).total++;
      (inspectData as UrgencyStats)[urgencyKey]++;
    }

    monthData.trend[categoryKey]++;
    if (urgencyKey === "HOT") monthData.trend.HOT++;
  });

  return analytics;
}

// ── API 1: BÁN HÀNG ──
export async function getSalesReportAction(
  month?: number,
  year?: number,
  selectedBranchId?: string,
  selectedUserId?: string,
): Promise<TabReportData> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { role, id: authId, branchId: userBranchId, isGlobalManager } = user;
  const isHighLevel = role === "ADMIN" || isGlobalManager;

  const effectiveBranchId = isHighLevel ? selectedBranchId : userBranchId;
  const effectiveUserId = !isHighLevel
    ? role === "MANAGER"
      ? selectedUserId || undefined
      : authId
    : selectedUserId;

  const reportYear = year ?? dayjs().year();
  let dateFilter: { gte: Date; lte: Date } | undefined;

  if (month !== undefined) {
    dateFilter = {
      gte: dayjs()
        .year(reportYear)
        .month(month - 1)
        .startOf("month")
        .toDate(),
      lte: dayjs()
        .year(reportYear)
        .month(month - 1)
        .endOf("month")
        .toDate(),
    };
  } else {
    dateFilter = {
      gte: dayjs().year(reportYear).startOf("year").toDate(),
      lte: dayjs().year(reportYear).endOf("year").toDate(),
    };
  }

  const timeWhere = dateFilter ? { createdAt: dateFilter } : {};
  const branchFilter = effectiveBranchId ? { branchId: effectiveBranchId } : {};
  const userFilter = effectiveUserId ? { userId: effectiveUserId } : {};

  const [total, lateLeads, performance, allLeads] = await Promise.all([
    // Tổng xe bán ra (thành công)
    db.car.count({
      where: {
        status: "SOLD",
        ...timeWhere,
        ...branchFilter,
        contracts: { some: { type: "SALE" } },
      },
    }),
    // Lead trễ
    db.leadActivity.count({
      where: {
        isLate: true,
        customer: {
          type: { in: [ReferralType.BUY, ReferralType.SELL_TRADE_USED] },
          ...timeWhere,
          ...branchFilter,
        },
      },
    }),
    // Top nhân viên bán hàng
    db.user.findMany({
      where: {
        ...branchFilter,
        role: { in: ["SALES_STAFF", "ADMIN", "MANAGER"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        _count: { select: { soldCars: { where: timeWhere } } },
      },
      orderBy: { soldCars: { _count: "desc" } },
      take: 5,
    }),
    // Dữ liệu lead để tính ma trận
    db.customer.findMany({
      where: {
        type: ReferralType.BUY,
        ...timeWhere,
        ...branchFilter,
        ...userFilter,
      },
      select: {
        status: true,
        inspectStatus: true,
        urgencyLevel: true,
        createdAt: true,
      },
    }),
  ]);

  const analytics = processLeadMatrix(allLeads);

  return {
    analytics,
    stats: {
      total,
      late: lateLeads,
      performance,
    },
  };
}

// ── API 2: THU MUA ──
export async function getPurchaseReportAction(
  month?: number,
  year?: number,
  selectedBranchId?: string,
  selectedUserId?: string,
): Promise<TabReportData> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { role, id: authId, branchId: userBranchId, isGlobalManager } = user;
  const isHighLevel = role === "ADMIN" || isGlobalManager;

  const effectiveBranchId = isHighLevel ? selectedBranchId : userBranchId;
  const effectiveUserId = !isHighLevel
    ? role === "MANAGER"
      ? selectedUserId || undefined
      : authId
    : selectedUserId;

  const reportYear = year ?? dayjs().year();
  let dateFilter: { gte: Date; lte: Date } | undefined;

  if (month !== undefined) {
    dateFilter = {
      gte: dayjs()
        .year(reportYear)
        .month(month - 1)
        .startOf("month")
        .toDate(),
      lte: dayjs()
        .year(reportYear)
        .month(month - 1)
        .endOf("month")
        .toDate(),
    };
  } else {
    dateFilter = {
      gte: dayjs().year(reportYear).startOf("year").toDate(),
      lte: dayjs().year(reportYear).endOf("year").toDate(),
    };
  }

  const timeWhere = dateFilter ? { createdAt: dateFilter } : {};
  const branchFilter = effectiveBranchId ? { branchId: effectiveBranchId } : {};
  const userFilter = effectiveUserId ? { userId: effectiveUserId } : {};

  const [total, lateLeads, performance, allLeads] = await Promise.all([
    db.car.count({
      where: {
        purchasedAt: { not: null },
        ...timeWhere,
        ...branchFilter,
        contracts: { some: { type: "PURCHASE" } },
      },
    }),
    db.leadActivity.count({
      where: {
        isLate: true,
        customer: {
          type: {
            in: [
              ReferralType.SELL,
              ReferralType.VALUATION,
              ReferralType.SELL_TRADE_USED,
            ],
          },
          ...timeWhere,
          ...branchFilter,
        },
      },
    }),
    db.user.findMany({
      where: {
        ...branchFilter,
        role: { in: ["PURCHASE_STAFF", "APPRAISER"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        _count: { select: { purchases: { where: timeWhere } } },
      },
      orderBy: { purchases: { _count: "desc" } },
      take: 5,
    }),
    db.customer.findMany({
      where: {
        type: {
          in: [
            ReferralType.SELL,
            ReferralType.VALUATION,
            ReferralType.SELL_TRADE_USED,
          ],
        },
        ...timeWhere,
        ...branchFilter,
        ...userFilter,
      },
      select: {
        status: true,
        inspectStatus: true,
        urgencyLevel: true,
        createdAt: true,
      },
    }),
  ]);

  const analytics = processLeadMatrix(allLeads);

  return {
    analytics,
    stats: {
      total,
      late: lateLeads,
      performance,
    },
  };
}

// ── API 3: TRAO ĐỔI XE (có thêm xe mới) ──
export async function getTradeReportAction(
  month?: number,
  year?: number,
  selectedBranchId?: string,
  selectedUserId?: string,
): Promise<
  TabReportData & {
    newCarSalesByMonth: Array<{ month: number; totalNewCars: number }>;
    totalNewCarsYear: number;
    newCarPerBranch: Array<{
      branchId: string;
      branchName: string;
      totalNewCars: number;
    }> | null;
  }
> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { role, id: authId, branchId: userBranchId, isGlobalManager } = user;
  const isHighLevel = role === "ADMIN" || isGlobalManager;

  const effectiveBranchId = isHighLevel ? selectedBranchId : userBranchId;
  const effectiveUserId = !isHighLevel
    ? role === "MANAGER"
      ? selectedUserId || undefined
      : authId
    : selectedUserId;

  const reportYear = year ?? dayjs().year();
  let dateFilter: { gte: Date; lte: Date } | undefined;

  if (month !== undefined) {
    dateFilter = {
      gte: dayjs()
        .year(reportYear)
        .month(month - 1)
        .startOf("month")
        .toDate(),
      lte: dayjs()
        .year(reportYear)
        .month(month - 1)
        .endOf("month")
        .toDate(),
    };
  } else {
    dateFilter = {
      gte: dayjs().year(reportYear).startOf("year").toDate(),
      lte: dayjs().year(reportYear).endOf("year").toDate(),
    };
  }

  const timeWhere = dateFilter ? { createdAt: dateFilter } : {};
  const branchFilter = effectiveBranchId ? { branchId: effectiveBranchId } : {};
  const userFilter = effectiveUserId ? { userId: effectiveUserId } : {};

  const [
    total,
    lateLeads,
    performance,
    allLeads,
    newCarSalesMonthlyRaw,
    totalNewCarsAgg,
    newCarByBranchRaw,
    branches, // cần để map tên chi nhánh
  ] = await Promise.all([
    db.customer.count({
      where: {
        type: ReferralType.SELL_TRADE_NEW,
        status: LeadStatus.DEAL_DONE,
        ...timeWhere,
        ...branchFilter,
      },
    }),
    db.leadActivity.count({
      where: {
        isLate: true,
        customer: {
          type: ReferralType.SELL_TRADE_NEW,
          ...timeWhere,
          ...branchFilter,
        },
      },
    }),
    db.user.findMany({
      where: {
        ...branchFilter,
        role: { in: ["SALES_STAFF", "PURCHASE_STAFF"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        _count: {
          select: {
            assignedLeads: {
              where: { type: ReferralType.SELL_TRADE_NEW, ...timeWhere },
            },
          },
        },
      },
      orderBy: { assignedLeads: { _count: "desc" } },
      take: 5,
    }),
    db.customer.findMany({
      where: {
        type: ReferralType.SELL_TRADE_NEW,
        ...timeWhere,
        ...branchFilter,
        ...userFilter,
      },
      select: {
        status: true,
        inspectStatus: true,
        urgencyLevel: true,
        createdAt: true,
      },
    }),
    db.dailyCarInbound.groupBy({
      by: ["date"],
      where: { date: dateFilter, ...branchFilter },
      _sum: { totalCars: true },
      orderBy: { date: "asc" },
    }),
    db.dailyCarInbound.aggregate({
      where: { date: dateFilter, ...branchFilter },
      _sum: { totalCars: true },
    }),
    db.dailyCarInbound.groupBy({
      by: ["branchId"],
      where: { date: dateFilter },
      _sum: { totalCars: true },
    }),
    db.branch.findMany({ select: { id: true, name: true } }),
  ]);

  const analytics = processLeadMatrix(allLeads);

  // Xe mới theo tháng
  const newCarSalesByMonth = newCarSalesMonthlyRaw.map((g: any) => ({
    month: dayjs(g.date).month() + 1,
    totalNewCars: g._sum.totalCars || 0,
  }));

  // Xe mới theo chi nhánh
  const newCarPerBranch =
    newCarByBranchRaw.length > 0
      ? branches.map((b) => {
          const nc = newCarByBranchRaw.find((g) => g.branchId === b.id);
          return {
            branchId: b.id,
            branchName: b.name,
            totalNewCars: nc?._sum.totalCars ?? 0,
          };
        })
      : null;

  return {
    analytics,
    stats: {
      total,
      late: lateLeads,
      performance,
    },
    newCarSalesByMonth,
    totalNewCarsYear: totalNewCarsAgg._sum.totalCars || 0,
    newCarPerBranch,
  };
}
