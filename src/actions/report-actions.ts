"use server"; // Cánh cửa bảo vệ
import dayjs from "@/lib/dayjs";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";

// actions/report-actions.ts
export async function getLateReportAction(filters: {
  fromDate?: Date;
  toDate?: Date;
  userId?: string;
  branchId?: string; // Thêm lọc theo chi nhánh
}) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Chưa đăng nhập");

  const whereClause: any = {
    isLate: true,
    createdAt: { gte: filters.fromDate, lte: filters.toDate },
  };

  // --- LOGIC PHÂN QUYỀN VÀ LỌC CHI NHÁNH ---

  if (auth.role === "ADMIN" || auth.isGlobalManager) {
    // Admin & Toàn cầu: Có quyền lọc theo chi nhánh bất kỳ nếu được truyền lên
    if (filters.branchId) {
      whereClause.user = { branchId: filters.branchId };
    }
  } else if (auth.role === "MANAGER") {
    // Manager: Ép buộc chỉ được xem chi nhánh của mình, không cho phép lọc branchId khác
    whereClause.user = { branchId: auth.branchId };
  } else {
    // Nhân viên thường: Chỉ thấy của chính mình
    whereClause.createdById = auth.id;
  }

  // Lọc theo nhân viên cụ thể (nếu có và nằm trong phạm vi quyền hạn đã set ở trên)
  if (filters.userId) {
    whereClause.createdById = filters.userId;
  }

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

export async function getAdvancedReportAction(
  month?: number,
  year?: number,
  selectedBranchId?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { role, id: userId, branchId: userBranchId, isGlobalManager } = user;
  const isHighLevel = role === "ADMIN" || isGlobalManager;

  // --- 1. XỬ LÝ THỜI GIAN (ALL-TIME HOẶC THEO THÁNG) ---
  let timeQuery: any = {};
  let salesRange: any = {};
  let purchaseRange: any = {};

  if (month && year) {
    const start = dayjs(`${year}-${month}-01`).startOf("month").toDate();
    const end = dayjs(start).endOf("month").toDate();
    timeQuery = { createdAt: { gte: start, lte: end } };
    salesRange = { soldAt: { gte: start, lte: end } };
    purchaseRange = { purchasedAt: { gte: start, lte: end } };
  }

  // --- 2. XỬ LÝ SCOPE PHÂN QUYỀN ---
  const effectiveBranchId = isHighLevel ? selectedBranchId : userBranchId;
  const branchFilter: any = effectiveBranchId
    ? { branchId: effectiveBranchId }
    : {};

  const staffFilter: any = isHighLevel
    ? selectedBranchId
      ? { branchId: selectedBranchId }
      : {}
    : role === "MANAGER"
      ? { branchId: userBranchId }
      : { id: userId };

  // --- 3. TRUY VẤN SONG SONG ---
  const [
    totalSales,
    totalPurchased,
    lateLeads,
    lateTasks,
    allBranches, // Lấy danh sách chi nhánh
    salesByBranch, // Group xe bán theo chi nhánh
    purchasesByBranch, // Group xe mua theo chi nhánh
    staffPerformance,
    inventoryStatus,
    myPending,
  ] = await Promise.all([
    // A. Tổng xe bán ra
    db.car.count({ where: { status: "SOLD", ...salesRange, ...branchFilter } }),

    // B. Tổng xe mua vào
    db.car.count({
      where: { purchasedAt: { not: null }, ...purchaseRange, ...branchFilter },
    }),

    // C. KPI Trễ Leads
    db.leadActivity.count({
      where: {
        ...timeQuery,
        isLate: true,
        user: isHighLevel
          ? selectedBranchId
            ? { branchId: selectedBranchId }
            : {}
          : role === "MANAGER"
            ? { branchId: userBranchId as string }
            : { id: userId },
      },
    }),

    // D. KPI Trễ Tasks
    db.task.count({
      where: {
        ...timeQuery,
        isLate: true,
        assignee: isHighLevel
          ? selectedBranchId
            ? { branchId: selectedBranchId }
            : {}
          : role === "MANAGER"
            ? { branchId: userBranchId as string }
            : { id: userId },
      },
    }),

    // E1. Lấy danh sách tên chi nhánh (Dành cho Admin/Global)
    isHighLevel ? db.branch.findMany({ select: { id: true, name: true } }) : [],

    // E2. Group By chi nhánh - Xe Bán
    isHighLevel
      ? db.car.groupBy({
          by: ["branchId"],
          where: { status: "SOLD", ...salesRange },
          _count: { id: true },
        })
      : [],

    // E3. Group By chi nhánh - Xe Mua
    isHighLevel
      ? db.car.groupBy({
          by: ["branchId"],
          where: { purchasedAt: { not: null }, ...purchaseRange },
          _count: { id: true },
        })
      : [],

    // F. Bảng hiệu suất nhân sự
    db.user.findMany({
      where: {
        ...staffFilter,
        role: { in: ["SALES_STAFF", "PURCHASE_STAFF", "MANAGER"] },
        active: true,
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        branch: { select: { name: true } },
        _count: {
          select: {
            assignedLeads: { where: timeQuery },
            leadActivities: { where: { ...timeQuery, isLate: true } },
            tasks: { where: { ...timeQuery, isLate: true } },
            soldCars: { where: { status: "SOLD", ...salesRange } },
            purchases: {
              where: { purchasedAt: { not: null }, ...purchaseRange },
            },
          },
        },
      },
      orderBy: { soldCars: { _count: "desc" } },
    }),

    // G. Kho xe & Cá nhân
    db.car.groupBy({ by: ["status"], where: branchFilter, _count: true }),
    db.task.count({ where: { assigneeId: userId, status: "PENDING" } }),
  ]);

  // --- 4. GỘP DỮ LIỆU BIỂU ĐỒ (DÀNH CHO ADMIN) ---
  const branchStats = allBranches.map((b: any) => {
    const sales =
      salesByBranch.find((s: any) => s.branchId === b.id)?._count.id || 0;
    const buys =
      purchasesByBranch.find((p: any) => p.branchId === b.id)?._count.id || 0;
    return {
      name: b.name,
      soldCount: sales,
      purchasedCount: buys,
    };
  });

  return {
    role,
    isGlobal: isHighLevel,
    stats: {
      totalSales,
      totalPurchased,
      lateLeads,
      lateTasks,
      branchStats, // Dữ liệu đã gộp sẵn soldCount và purchasedCount
      staffPerformance,
      inventoryStatus,
      myPending,
    },
  };
}
