"use server"; // Cánh cửa bảo vệ
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role, UserStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/session-server";
import { accountApprovedEmailTemplate } from "@/lib/mail-templates";
import { sendMail } from "@/lib/mail-service";

/**
 * 1. LẤY DANH SÁCH NGƯỜI DÙNG (Cập nhật hỗ trợ Filter & Pagination)
 */
export async function getUsersAction(params: {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string | null;
  departmentId?: string | null;
  role?: string;
  active?: boolean;
  status?: UserStatus | "ALL"; // THÊM DÒNG NÀY ĐỂ HẾT LỖI TS
}) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      branchId,
      departmentId,
      active,
      status,
    } = params;
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc động
    const where: any = {};

    // Lọc theo search (Mã NV, Tên, Email)
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
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

    if (status && status !== "ALL") {
      where.status = status;
    } else if (active !== undefined) {
      // Giữ lại logic active cũ nếu vẫn muốn dùng song song
      where.active = active;
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
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Chưa đăng nhập");

    // Khởi tạo bộ lọc mặc định
    const whereClause: any = {
      active: true,
      id:
        auth.role === "SALES_STAFF" || auth.role === "PURCHASE_STAFF"
          ? auth.id
          : undefined,
      role: {
        in: ["SALES_STAFF", "PURCHASE_STAFF", "MANAGER"],
      },
    };

    // LOGIC PHÂN QUYỀN:
    // Nếu KHÔNG PHẢI Admin và KHÔNG PHẢI Global Manager
    if (auth.role !== "ADMIN" && !auth.isGlobalManager) {
      // Chỉ lấy những nhân viên cùng chi nhánh với người đang đăng nhập
      whereClause.branchId = auth.branchId;
    }

    return await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        role: true,
        branchId: true,
        branch: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });
  } catch (error) {
    console.error("Staff fetch error:", error);
    throw new Error("Không thể lấy danh sách nhân viên");
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
    if (branchId) {
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
          extension: extension || null,
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

// lấy nhân viên trong chi nhánh
export async function getStaffByBranchAction() {
  const auth = await getCurrentUser();

  if (!auth) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  // Quyền Admin hoặc Quản trị toàn cầu
  const isSuperUser = auth.role === "ADMIN" || auth.isGlobalManager === true;

  try {
    const staff = await db.user.findMany({
      where: {
        role: "PURCHASE_STAFF",
        active: true,
        // Nếu không phải SuperUser thì mới lọc theo chi nhánh
        ...(isSuperUser ? {} : { branchId: auth.branchId }),
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        // Thêm thông tin chi nhánh để Admin biết nhân viên đó thuộc đâu
        branch: {
          select: { name: true },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    });

    return { success: true, data: staff };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function approveUserAction(
  userId: string,
  status: "APPROVED" | "REJECTED",
) {
  try {
    // 1. Cập nhật trạng thái trong Database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        status: status,
        active: status === "APPROVED",
      },
      include: {
        branch: true, // Lấy tên chi nhánh để gửi mail
      },
    });

    // 2. Nếu là APPROVED, gửi mail chúc mừng cho nhân viên
    if (status === "APPROVED") {
      try {
        const emailHtml = accountApprovedEmailTemplate({
          fullName: updatedUser.fullName || "Thành viên mới",
          username: updatedUser.username,
          roleLabel: "Nhân viên hệ thống",
          branchName: updatedUser.branch?.name || "Hệ thống chung",
        });

        await sendMail({
          to: updatedUser.email,
          subject: "🎉 TÀI KHOẢN TOYOTA BÌNH DƯƠNG CỦA BẠN ĐÃ ĐƯỢC PHÊ DUYỆT",
          html: emailHtml,
        });
      } catch (mailError) {
        console.error("Lỗi gửi mail phê duyệt:", mailError);
        // Không throw lỗi ở đây để tránh rollback transaction database
      }
    }

    revalidatePath("/dashboard/users");
    return {
      success: true,
      message: status === "APPROVED" ? "Đã duyệt & gửi mail" : "Đã từ chối",
    };
  } catch (error: any) {
    console.error("Lỗi Action approveUser:", error);
    return { success: false, error: "Không thể xử lý yêu cầu này." };
  }
}
