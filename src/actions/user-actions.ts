/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

/**
 * 1. LẤY DANH SÁCH NGƯỜI DÙNG (Cập nhật hỗ trợ Filter & Pagination)
 */
export async function getUsersAction(params: {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string | null;
  departmentId?: string | null;
}) {
  try {
    const { page = 1, limit = 10, search, branchId, departmentId } = params;
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc động
    const where: any = {};

    // Lọc theo search (Mã NV, Tên, Email)
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Lọc theo chi nhánh
    if (branchId) {
      where.branchId = branchId;
    }

    // Lọc theo phòng ban
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Chạy song song: Lấy dữ liệu và Đếm tổng số bản ghi
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          department: { select: { name: true } },
          position: { select: { name: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    // Loại bỏ password bảo mật
    const safeUsers = users.map(
      ({ password, ...userWithoutPassword }) => userWithoutPassword,
    );

    return {
      data: safeUsers,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Fetch users error:", error);
    throw new Error("Không thể lấy danh sách người dùng");
  }
}

/**
 * 2. LẤY DANH SÁCH NHÂN VIÊN ĐỦ ĐIỀU KIỆN NHẬN KHÁCH (BUYER & MANAGER)
 * Dùng cho Select box ở trang phân bổ khách hàng
 */
export async function getEligibleStaffAction() {
  try {
    return await db.user.findMany({
      where: {
        active: true,
        role: {
          in: ["SALES_STAFF", "PURCHASE_STAFF", "MANAGER"], // Lọc theo yêu cầu của bạn
        },
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        branch: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });
  } catch (error) {
    throw new Error("Không thể lấy danh sách nhân viên thu mua/quản lý");
  }
}

/**
 * TẠO HOẶC CẬP NHẬT NGƯỜI DÙNG (UPSERT)
 * - Hỗ trợ Role
 * - Hỗ trợ Global Manager
 * - Chuẩn Prisma v6 (connect / disconnect)
 */
export async function upsertUserAction(data: any) {
  try {
    const {
      id,
      password,
      username,
      email,
      role,
      isGlobalManager,
      branchId,
      departmentId,
      positionId,

      // ⚠️ map lại đúng tên field Prisma
      extension,
      extensionPassword,

      // chỉ lấy field cho phép
      fullName,
      phone,
      active,
    } = data;

    // ==============================
    // 1. BASE DATA (WHITELIST)
    // ==============================
    const userData: any = {
      fullName,
      phone,
      active: active ?? true,
      extension,
      extensionPwd: extensionPassword, // ✅ FIX CHÍNH Ở ĐÂY
      username: username?.trim(),
      email: email?.trim().toLowerCase(),
      role: role ?? Role.REFERRER,
      isGlobalManager: Boolean(isGlobalManager),
    };

    // ==============================
    // 2. RELATIONS
    // ==============================
    if (isGlobalManager) {
      userData.branchId = null;
    } else if (branchId) {
      userData.branch = { connect: { id: branchId } };
    }

    if (departmentId) {
      userData.department = { connect: { id: departmentId } };
    }

    if (positionId) {
      userData.position = { connect: { id: positionId } };
    }

    // ==============================
    // 3. PASSWORD
    // ==============================
    if (password?.trim()) {
      userData.password = await bcrypt.hash(password.trim(), 10);
    }

    // ==============================
    // 4. UPDATE
    // ==============================
    if (id) {
      await db.user.update({
        where: { id },
        data: userData,
      });
    } else {
      // ==============================
      // 5. CREATE
      // ==============================
      const existing = await db.user.findUnique({
        where: { username: userData.username },
      });

      if (existing) {
        throw new Error("Mã nhân viên (Username) đã tồn tại");
      }

      await db.user.create({
        data: {
          ...userData,
          password: userData.password || (await bcrypt.hash("Toyota@123", 10)),
        },
      });
    }

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/customers");

    return { success: true };
  } catch (error: any) {
    console.error("Upsert user error:", error);
    throw new Error(error.message || "Lỗi xử lý dữ liệu người dùng");
  }
}
/**
 * 4. XÓA NGƯỜI DÙNG
 */
export async function deleteUserAction(id: string) {
  try {
    // Lưu ý: Prisma sẽ báo lỗi nếu User này đã có dữ liệu liên kết (khách hàng, v.v.)
    await db.user.delete({ where: { id } });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    throw new Error(
      "Không thể xóa người dùng này. Vui lòng chuyển trạng thái sang 'Ngừng hoạt động' nếu đã có dữ liệu liên kết.",
    );
  }
}

/**
 * 5. BẬT/TẮT TRẠNG THÁI HOẠT ĐỘNG
 */
export async function toggleUserStatusAction(
  id: string,
  currentStatus: boolean,
) {
  try {
    await db.user.update({
      where: { id },
      data: { active: !currentStatus },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    throw new Error("Lỗi khi thay đổi trạng thái người dùng");
  }
}
