// actions/referral-actions.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";

export async function getMyReferralHistory() {
  try {
    // 1. Lấy user từ session (JWT trong Cookie)
    const user = await getCurrentUser();
    console.log(user);

    if (!user) {
      return { success: false, message: "Bạn chưa đăng nhập", data: [] };
    }

    // 2. Truy vấn danh sách khách hàng dựa trên referrerId
    const referrals = await db.customer.findMany({
      where: {
        referrerId: user.id,
      },
      include: {
        carModel: true, // Lấy thông tin dòng xe
        assignedTo: {
          // Lấy tên nhân viên đang xử lý (nếu cần)
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(referrals)), // Đảm bảo data sạch cho Client Component
    };
  } catch (error) {
    console.error("Lỗi lấy lịch sử giới thiệu:", error);
    return { success: false, message: "Lỗi hệ thống", data: [] };
  }
}
