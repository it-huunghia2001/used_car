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

    const searchCondition = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { phone: { contains: search } },
            { licensePlate: { contains: search } },
            {
              leadCar: {
                licensePlate: { contains: search },
              },
            },
          ],
        }
      : {};

    const totalCount = await db.customer.count({
      where: {
        referrerId: user.id,
        ...searchCondition,
      },
    });

    const referrals = await db.customer.findMany({
      where: {
        referrerId: user.id,
        ...searchCondition,
      },
      include: {
        carModel: { select: { name: true, grade: true } },
        assignedTo: { select: { fullName: true, phone: true } },
        leadCar: { select: { licensePlate: true, modelName: true } },
        // --- THÊM PHẦN NÀY ĐỂ LẤY LỊCH SỬ CHĂM SÓC ---
        activities: {
          orderBy: {
            createdAt: "desc", // Sắp xếp mới nhất lên đầu
          },
          include: {
            user: { select: { fullName: true } }, // Để biết ai là người ghi chú (nếu cần)
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: pageSize,
    });

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
        // Chuyển mảng activities thành careHistory để khớp với code UI ở bước trước
        careHistory: item.activities.map((act) => ({
          createdAt: act.createdAt,
          result: act.note,
          status: act.status,
          staffName: act.user?.fullName,
        })),
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
