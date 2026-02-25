/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Helper: Chuẩn hóa date về đầu ngày (00:00:00)
function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

// 1. Tạo hoặc cập nhật số lượng xe nhập trong ngày (Upsert)
export async function upsertDailyInbound({
  date, // Date object hoặc string ISO
  totalCars, // Số lượng xe nhập ngày đó
  note = "", // Ghi chú tùy chọn
}: {
  date: Date | string;
  totalCars: number;
  note?: string;
}) {
  try {
    const session = await getCurrentUser();
    if (!session?.id || !session.branchId) {
      return {
        success: false,
        message: "Không tìm thấy thông tin người dùng hoặc chi nhánh",
      };
    }

    const normalizedDate = normalizeDate(new Date(date));

    // Kiểm tra quyền: chỉ cho phép nhập cho chi nhánh của mình (trừ global manager)
    const isGlobalManager = session.isGlobalManager || session.role === "ADMIN";
    const targetBranchId = isGlobalManager ? undefined : session.branchId;

    // Nếu không phải global manager, phải khớp branchId
    if (!isGlobalManager && targetBranchId !== session.branchId) {
      return {
        success: false,
        message: "Bạn không có quyền nhập cho chi nhánh này",
      };
    }

    const result = await db.dailyCarInbound.upsert({
      where: {
        date_branchId: {
          date: normalizedDate,
          branchId: session.branchId, // Luôn dùng branch của user hiện tại
        },
      },
      update: {
        totalCars,
        note: note || undefined,
        updatedAt: new Date(),
        // Nếu muốn ghi log ai sửa cuối: có thể thêm field lastUpdatedById sau
      },
      create: {
        date: normalizedDate,
        branchId: session.branchId,
        totalCars,
        note,
        createdById: session.id,
      },
    });

    revalidatePath("/dashboard/inbound"); // Thay bằng path trang nhập xe của bạn
    revalidatePath("/dashboard/inbound/report"); // Nếu có trang báo cáo

    return {
      success: true,
      data: result,
      message: "Cập nhật nhập xe thành công",
    };
  } catch (error) {
    console.error("upsertDailyInbound error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, message: "Lỗi cơ sở dữ liệu: " + error.message };
    }
    return { success: false, message: "Lỗi hệ thống khi cập nhật nhập xe" };
  }
}

// 2. Lấy danh sách nhập xe (theo khoảng thời gian, chi nhánh)
export async function getDailyInbounds({
  startDate,
  endDate,
  branchId, // optional, nếu không truyền thì lấy theo branch user
}: {
  startDate?: Date | string;
  endDate?: Date | string;
  branchId?: string;
} = {}) {
  try {
    const session = await getCurrentUser();
    if (!session?.id) {
      return {
        success: false,
        message: "Phiên đăng nhập không hợp lệ",
        data: [],
      };
    }

    const where: any = {};

    // Quyền xem: global manager / admin xem tất cả, còn lại chỉ xem chi nhánh mình
    const isGlobal = session.isGlobalManager || session.role === "ADMIN";
    if (!isGlobal) {
      where.branchId = session.branchId;
    } else if (branchId) {
      where.branchId = branchId; // admin có thể lọc theo branch cụ thể
    }

    if (startDate) {
      where.date = { ...where.date, gte: normalizeDate(new Date(startDate)) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: normalizeDate(new Date(endDate)) };
    }

    const inbounds = await db.dailyCarInbound.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        createdBy: { select: { fullName: true, username: true } },
      },
      orderBy: { date: "desc" },
    });

    return { success: true, data: inbounds };
  } catch (error) {
    console.error("getDailyInbounds error:", error);
    return {
      success: false,
      message: "Lỗi khi lấy danh sách nhập xe",
      data: [],
    };
  }
}

// 3. Lấy chi tiết 1 ngày nhập (theo ID hoặc theo date + branch)
export async function getDailyInboundDetail({
  id,
  date,
}: {
  id?: string;
  date?: Date | string;
}) {
  try {
    const session = await getCurrentUser();
    if (!session?.id)
      return { success: false, message: "Không có phiên đăng nhập" };

    const where: any = {};

    if (id) {
      where.id = id;
    } else if (date) {
      where.date = normalizeDate(new Date(date));
      where.branchId = session.branchId; // an toàn hơn
    } else {
      return { success: false, message: "Cần cung cấp id hoặc date" };
    }

    const detail = await db.dailyCarInbound.findFirst({
      where,
      include: {
        branch: { select: { name: true, address: true } },
        createdBy: { select: { fullName: true, phone: true } },
      },
    });

    if (!detail) {
      return { success: false, message: "Không tìm thấy bản ghi nhập xe" };
    }

    // Kiểm tra quyền xem
    const isGlobal = session.isGlobalManager || session.role === "ADMIN";
    if (!isGlobal && detail.branchId !== session.branchId) {
      return { success: false, message: "Bạn không có quyền xem dữ liệu này" };
    }

    return { success: true, data: detail };
  } catch (error) {
    console.error("getDailyInboundDetail error:", error);
    return { success: false, message: "Lỗi hệ thống" };
  }
}

// 4. Xóa bản ghi nhập xe (nên hạn chế dùng, hoặc chỉ admin)
export async function deleteDailyInbound(id: string) {
  try {
    const session = await getCurrentUser();
    if (
      !session?.id ||
      !(session.isGlobalManager || session.role === "ADMIN")
    ) {
      return { success: false, message: "Bạn không có quyền xóa" };
    }

    const existing = await db.dailyCarInbound.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, message: "Không tìm thấy bản ghi" };
    }

    await db.dailyCarInbound.delete({ where: { id } });

    revalidatePath("/dashboard/inbound");
    revalidatePath("/dashboard/inbound/report");

    return { success: true, message: "Xóa thành công" };
  } catch (error) {
    console.error("deleteDailyInbound error:", error);
    return { success: false, message: "Lỗi khi xóa bản ghi nhập xe" };
  }
}
