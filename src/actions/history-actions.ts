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
