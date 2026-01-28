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
    allBranches,
    salesByBranch,
    purchasesByBranch,
    staffPerformance,
    inventoryStatus,
    myPending,
    // TRUY VẤN MỚI: Báo cáo phòng ban
    allDepartments,
  ] = await Promise.all([
    db.car.count({ where: { status: "SOLD", ...salesRange, ...branchFilter } }),
    db.car.count({
      where: { purchasedAt: { not: null }, ...purchaseRange, ...branchFilter },
    }),
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
    isHighLevel ? db.branch.findMany({ select: { id: true, name: true } }) : [],
    isHighLevel
      ? db.car.groupBy({
          by: ["branchId"],
          where: { status: "SOLD", ...salesRange },
          _count: { id: true },
        })
      : [],
    isHighLevel
      ? db.car.groupBy({
          by: ["branchId"],
          where: { purchasedAt: { not: null }, ...purchaseRange },
          _count: { id: true },
        })
      : [],
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
    db.car.groupBy({ by: ["status"], where: branchFilter, _count: true }),
    db.task.count({ where: { assigneeId: userId, status: "PENDING" } }),

    // Logic lấy dữ liệu phòng ban (Chỉ dành cho ADMIN hoặc MANAGER)
    isHighLevel || role === "MANAGER"
      ? db.department.findMany({
          select: {
            name: true,
            users: {
              // Nếu là Manager thì chỉ đếm nhân viên thuộc chi nhánh của mình
              where: {
                ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
              },
              select: {
                _count: {
                  select: {
                    createdReferrals: { where: timeQuery },
                  },
                },
              },
            },
          },
        })
      : [],
  ]);

  // --- 4. XỬ LÝ GỘP DỮ LIỆU ---

  // Gộp dữ liệu biểu đồ chi nhánh (Admin/Global)
  const branchStats = allBranches.map((b: any) => {
    const sales =
      salesByBranch.find((s: any) => s.branchId === b.id)?._count.id || 0;
    const buys =
      purchasesByBranch.find((p: any) => p.branchId === b.id)?._count.id || 0;
    return { name: b.name, soldCount: sales, purchasedCount: buys };
  });

  // Gộp dữ liệu biểu đồ phòng ban (Admin xem tổng, Manager xem chi nhánh mình)
  const departmentStats = allDepartments
    .map((d: any) => ({
      name: d.name,
      count: d.users.reduce(
        (sum: number, u: any) => sum + u._count.createdReferrals,
        0,
      ),
    }))
    .filter((d: any) => d.count > 0); // Chỉ hiện phòng ban có dữ liệu

  return {
    role,
    isGlobal: isHighLevel,
    stats: {
      totalSales,
      totalPurchased,
      lateLeads,
      lateTasks,
      branchStats,
      departmentStats, // Dữ liệu mới cho biểu đồ phòng ban
      staffPerformance,
      inventoryStatus,
      myPending,
    },
  };
}
