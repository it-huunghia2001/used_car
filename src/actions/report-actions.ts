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

  // --- 1. XỬ LÝ THỜI GIAN ---
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

  // --- 3. TRUY VẤN SONG SONG ---
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
  ] = await Promise.all([
    // Tính tổng xe bán dựa trên chi nhánh của NHÂN VIÊN BÁN (soldBy)
    db.car.count({
      where: {
        status: "SOLD",
        ...salesRange,
        soldBy: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),

    // Tính tổng xe mua dựa trên chi nhánh của NHÂN VIÊN MUA (purchaser)
    db.car.count({
      where: {
        purchasedAt: { not: null },
        ...purchaseRange,
        purchaser: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),

    // Đếm Lead trễ dựa trên chi nhánh của nhân viên tạo
    db.leadActivity.count({
      where: {
        ...timeQuery,
        isLate: true,
        user: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),

    // Đếm Task trễ dựa trên chi nhánh của người được giao
    db.task.count({
      where: {
        ...timeQuery,
        isLate: true,
        assignee: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    }),

    // Lấy danh sách chi nhánh để map biểu đồ
    db.branch.findMany({
      where: effectiveBranchId ? { id: effectiveBranchId } : {},
      select: { id: true, name: true },
    }),

    // Thống kê BÁN: GroupBy theo chi nhánh của User thực hiện soldCars
    db.user.groupBy({
      by: ["branchId"],
      where: {
        soldCars: { some: { status: "SOLD", ...salesRange } },
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      },
      _count: { id: true },
    }),

    // Thống kê MUA: GroupBy theo chi nhánh của User thực hiện purchases
    db.user.groupBy({
      by: ["branchId"],
      where: {
        purchases: { some: { purchasedAt: { not: null }, ...purchaseRange } },
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      },
      _count: { id: true },
    }),

    // Hiệu suất nhân viên
    db.user.findMany({
      where: {
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
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
      take: 20,
    }),

    // Tình trạng kho (Vẫn tính theo chi nhánh của XE vì xe đang nằm ở kho đó)
    db.car.groupBy({
      by: ["status"],
      where: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      _count: true,
    }),

    db.task.count({ where: { assigneeId: userId, status: "PENDING" } }),

    // Thống kê theo phòng ban
    isHighLevel || role === "MANAGER"
      ? db.department.findMany({
          select: {
            name: true,
            users: {
              where: effectiveBranchId ? { branchId: effectiveBranchId } : {},
              select: {
                _count: { select: { createdReferrals: { where: timeQuery } } },
              },
            },
          },
        })
      : [],
  ]);

  // --- 4. XỬ LÝ GỘP DỮ LIỆU BIỂU ĐỒ ---

  // Ghép dữ liệu dựa trên danh sách chi nhánh
  const branchStats = branchesForChart.map((b: any) => {
    // Đếm số lượng xe bán: lấy từ mảng groupBy của User
    // salesByBranchRaw trả về số lượng USER có giao dịch bán,
    // để chính xác số XE ta dùng sum hoặc đếm trực tiếp từ query xe ở trên nếu cần.
    // Ở đây dùng count từ query xe theo branch của user là chuẩn nhất:
    const sales =
      salesByBranchRaw.find((s: any) => s.branchId === b.id)?._count.id || 0;
    const buys =
      purchasesByBranchRaw.find((p: any) => p.branchId === b.id)?._count.id ||
      0;

    return {
      name: b.name,
      soldCount: sales,
      purchasedCount: buys,
    };
  });

  const departmentStats = allDepartments
    .map((d: any) => ({
      name: d.name,
      count: d.users.reduce(
        (sum: number, u: any) => sum + (u._count?.createdReferrals || 0),
        0,
      ),
    }))
    .filter((d: any) => d.count > 0);

  return {
    role,
    isGlobal: isHighLevel,
    stats: {
      totalSales,
      totalPurchased,
      lateLeads,
      lateTasks,
      branchStats,
      departmentStats,
      staffPerformance,
      inventoryStatus,
      myPending,
    },
  };
}
