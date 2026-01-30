// actions/referral-actions.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";

export async function getMyReferralHistory() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, message: "Bạn chưa đăng nhập", data: [] };
    }

    const referrals = await db.customer.findMany({
      where: {
        referrerId: user.id,
      },
      include: {
        carModel: { select: { name: true, grade: true } },
        assignedTo: { select: { fullName: true } },
        // Thêm leadCar để hiển thị biển số hoặc tên xe khách gửi nếu có
        leadCar: { select: { licensePlate: true, modelName: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3. PHÂN LOẠI VÀ XỬ LÝ DỮ LIỆU TRƯỚC KHI TRẢ VỀ
    const processedData = referrals.map((item) => {
      const isSuccess = item.status === "DEAL_DONE";

      // Xác định nhãn nhóm trạng thái
      let groupLabel = "Đang xử lý";
      if (isSuccess) groupLabel = "Thành công";
      if (["LOSE", "CANCELLED", "REJECTED_APPROVAL"].includes(item.status)) {
        groupLabel = "Kết thúc/Từ chối";
      }

      return {
        ...item,
        groupLabel, // Frontend dùng cái này để filter hoặc chia Tab
        isSuccess,
      };
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(processedData)),
    };
  } catch (error) {
    console.error("Lỗi lấy lịch sử giới thiệu:", error);
    return { success: false, message: "Lỗi hệ thống", data: [] };
  }
}
