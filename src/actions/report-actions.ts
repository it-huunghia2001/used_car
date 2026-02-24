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

  // Lọc thời gian năm hiện tại
  const yearStart = dayjs().startOf("year").toDate();
  const yearEnd = dayjs().endOf("year").toDate();
  const yearQuery = {
    createdAt: { gte: yearStart, lte: yearEnd },
  };

  // --- 2. TRUY VẤN SONG SONG TẤT CẢ CÁC BÁO CÁO ---
  const [
    totalSales, // Tổng xe đã bán (Sales)
    totalPurchased, // Tổng xe đã mua (Purchase)
    lateSalesLeads, // Lead mua xe bị trễ
    latePurchaseLeads, // Lead bán xe bị trễ
    branchesForChart,
    staffSalesPerformance, // Top nhân viên bán hàng
    staffPurchasePerformance, // Top nhân viên thu mua
    inventoryStatus,
    allLeadsForMatrix, // Dữ liệu khách hàng để phân loại ma trận
  ] = await Promise.all([
    // 1. Tổng xe đã bán (Mảng Sales)
    db.car.count({
      where: {
        status: "SOLD",
        soldBy: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),
    // 2. Tổng xe đã mua vào (Mảng Purchase)
    db.car.count({
      where: {
        purchasedAt: { not: null },
        purchaser: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),
    // 3. Lead trễ của mảng Bán hàng (Type BUY)
    db.leadActivity.count({
      where: {
        isLate: true,
        customer: { type: { in: ["BUY", "SELL_TRADE_USED"] } },
        user: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),
    // 4. Lead trễ của mảng Thu mua (Type SELL)
    db.leadActivity.count({
      where: {
        isLate: true,
        customer: { type: { in: ["SELL", "VALUATION", "SELL_TRADE_NEW"] } },
        user: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),
    // 5. Danh sách chi nhánh
    db.branch.findMany({ select: { id: true, name: true } }),
    // 6. Hiệu suất nhân viên Bán hàng (Sắp xếp theo soldCars)
    db.user.findMany({
      where: {
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        role: { in: ["SALES_STAFF", "ADMIN", "MANAGER"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        _count: { select: { soldCars: true } },
      },
      orderBy: { soldCars: { _count: "desc" } },
      take: 5,
    }),
    // 7. Hiệu suất nhân viên Thu mua (Sắp xếp theo purchases)
    db.user.findMany({
      where: {
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        role: { in: ["PURCHASE_STAFF", "APPRAISER"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        _count: { select: { purchases: true } },
      },
      orderBy: { purchases: { _count: "desc" } },
      take: 5,
    }),
    // 8. Trạng thái kho xe
    db.car.groupBy({
      by: ["status"],
      where: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      _count: true,
    }),
    // 9. Dữ liệu thô cho Ma trận (Tách theo Type)
    db.customer.findMany({
      where: {
        ...yearQuery,
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        ...(effectiveUserId ? { userId: effectiveUserId } : {}),
      },
      select: {
        type: true, // Để phân biệt mua/bán
        status: true,
        inspectStatus: true,
        urgencyLevel: true,
        createdAt: true,
      },
    }),
  ]);

  // --- 3. XỬ LÝ TÁCH BIỆT MA TRẬN DỮ LIỆU ---
  const categories = {
    SUCCESS: [LeadStatus.DEAL_DONE],
    LOSE: [LeadStatus.LOSE, LeadStatus.CANCELLED, LeadStatus.REJECTED_APPROVAL],
    FROZEN: [LeadStatus.FROZEN],
  };

  const createEmptyMatrix = () => ({
    INSPECTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    APPOINTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    NOT_INSPECTED: { HOT: 0, WARM: 0, COOL: 0, total: 0 },
    total: 0,
  });

  const createEmptyMonth = (i: number) => ({
    monthIdx: i,
    monthName: `Tháng ${i + 1}`,
    SUCCESS: createEmptyMatrix(),
    LOSE: createEmptyMatrix(),
    FROZEN: createEmptyMatrix(),
    REMAINING: createEmptyMatrix(),
    trend: { SUCCESS: 0, LOSE: 0, FROZEN: 0, REMAINING: 0, HOT: 0 },
  });

  // Tách 2 luồng báo cáo
  const purchaseAnalytics = Array.from({ length: 12 }, (_, i) =>
    createEmptyMonth(i),
  );
  const salesAnalytics = Array.from({ length: 12 }, (_, i) =>
    createEmptyMonth(i),
  );

  allLeadsForMatrix.forEach((lead) => {
    const mIdx = dayjs(lead.createdAt).month();

    // Phân loại luồng dữ liệu
    const isPurchaseLead = ["SELL", "VALUATION", "SELL_TRADE_NEW"].includes(
      lead.type,
    );
    const mData = isPurchaseLead
      ? purchaseAnalytics[mIdx]
      : salesAnalytics[mIdx];

    // Xác định nhóm trạng thái
    let catKey: "SUCCESS" | "LOSE" | "FROZEN" | "REMAINING" = "REMAINING";
    if (categories.SUCCESS.includes(lead.status as any)) catKey = "SUCCESS";
    else if (categories.LOSE.includes(lead.status as any)) catKey = "LOSE";
    else if (categories.FROZEN.includes(lead.status as any)) catKey = "FROZEN";

    const insKey = (lead.inspectStatus as string) || "NOT_INSPECTED";
    const urgKey = (lead.urgencyLevel as string) || "COOL";

    // Cập nhật ma trận
    mData[catKey].total++;
    if (mData[catKey][insKey as keyof typeof mData.SUCCESS]) {
      (mData[catKey][insKey as keyof typeof mData.SUCCESS] as any).total++;
      (mData[catKey][insKey as keyof typeof mData.SUCCESS] as any)[urgKey]++;
    }
    mData.trend[catKey]++;
    if (urgKey === "HOT") mData.trend.HOT++;
  });

  return {
    role,
    isGlobal: isHighLevel,
    purchaseAnalytics, // Ma trận cho luồng Thu Mua
    salesAnalytics, // Ma trận cho luồng Bán Hàng
    branches: branchesForChart,
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
      inventoryStatus,
      // Dữ liệu biểu đồ tăng trưởng chung
      growthChart: salesAnalytics.map((m, idx) => ({
        name: m.monthName,
        sales: m.trend.SUCCESS,
        purchase: purchaseAnalytics[idx].trend.SUCCESS,
      })),
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
