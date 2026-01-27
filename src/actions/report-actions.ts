"use server"; // Cánh cửa bảo vệ
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
