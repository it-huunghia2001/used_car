/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";

export async function getStaffHistoryAction() {
  const payload = await getCurrentUser();
  if (!payload?.id) return null;
  try {
    const activities = await db.leadActivity.findMany({
      where: {
        createdById: payload.id,
      },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
            type: true,
            licensePlate: true,
          },
        },
        reason: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Lấy 50 hoạt động gần nhất
    });

    return { success: true, data: activities };
  } catch (error) {
    console.error("Lỗi lấy lịch sử:", error);
    return { success: false, error: "Không thể tải lịch sử hoạt động." };
  }
}

export async function getMyWorkHistoryAction(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { search, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    // Tự động xác định điều kiện lọc dựa trên Role của nhân viên
    let whereClause: any = {};

    if (user.role === "SALES_STAFF") {
      // Nhân viên Sale: Chỉ lấy những xe mình đã chốt bán thành công
      whereClause = {
        soldById: user.id,
        status: "SOLD",
      };
    } else if (user.role === "PURCHASE_STAFF") {
      // Nhân viên Thu mua: Lấy tất cả xe mình đã thực hiện thu mua
      whereClause = {
        purchaserId: user.id,
      };
    } else {
      // Các Role khác (Admin/Manager) có thể trả về mảng rỗng hoặc xử lý riêng
      return { success: true, data: [], total: 0 };
    }

    // Tìm kiếm (Biển số, Tên xe, Mã kho)
    if (search) {
      whereClause.AND = [
        {
          OR: [
            { modelName: { contains: search } },
            { licensePlate: { contains: search } },
            { stockCode: { contains: search } },
          ],
        },
      ];
    }

    const [data, total] = await Promise.all([
      db.car.findMany({
        where: whereClause,
        include: {
          carModel: { select: { name: true, grade: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.car.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(data)),
      total,
    };
  } catch (error: any) {
    console.error("History Error:", error);
    return { success: false, error: error.message };
  }
}
