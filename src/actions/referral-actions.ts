// actions/referral-actions.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";

export async function getMyReferralHistory(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: "Bạn chưa đăng nhập",
        data: [],
        total: 0,
      };
    }

    const { page = 1, pageSize = 10, search = "" } = params;
    const skip = (page - 1) * pageSize;

    // Xây dựng điều kiện tìm kiếm
    const searchCondition = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { phone: { contains: search } },
            { licensePlate: { contains: search } }, // Tìm ở bảng Customer (nếu có lưu)
            {
              leadCar: {
                licensePlate: { contains: search }, // Tìm biển số ở bảng LeadCar
              },
            },
          ],
        }
      : {};

    // 1. ĐẾM TỔNG SỐ BẢN GHI (Để phân trang)
    const totalCount = await db.customer.count({
      where: {
        referrerId: user.id,
        ...searchCondition,
      },
    });

    // 2. LẤY DỮ LIỆU CÓ PHÂN TRANG VÀ TÌM KIẾM
    const referrals = await db.customer.findMany({
      where: {
        referrerId: user.id,
        ...searchCondition,
      },
      include: {
        carModel: { select: { name: true, grade: true } },
        assignedTo: { select: { fullName: true, phone: true } },
        leadCar: { select: { licensePlate: true, modelName: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: pageSize,
    });

    // 3. XỬ LÝ DỮ LIỆU
    const processedData = referrals.map((item) => {
      const isSuccess = item.status === "DEAL_DONE";

      let groupLabel = "Đang xử lý";
      if (isSuccess) groupLabel = "Thành công";
      if (
        ["LOSE", "CANCELLED", "REJECTED_APPROVAL", "FROZEN"].includes(
          item.status,
        )
      ) {
        groupLabel = "Kết thúc/Từ chối";
      }

      return {
        ...item,
        groupLabel,
        isSuccess,
      };
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(processedData)),
      total: totalCount,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Lỗi lấy lịch sử giới thiệu:", error);
    return { success: false, message: "Lỗi hệ thống", data: [], total: 0 };
  }
}
