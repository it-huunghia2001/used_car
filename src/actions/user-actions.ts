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
  status?: UserStatus | "ALL";
}) {
  try {
    // 1. KIỂM TRA QUYỀN CỦA NGƯỜI ĐANG ĐĂNG NHẬP
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

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

    const where: any = {};

    // --- LOGIC PHÂN QUYỀN PHẠM VI DỮ LIỆU ---
    // Nếu không phải Admin hoặc Global Manager, bắt buộc chỉ lấy trong chi nhánh của họ
    const isGlobalPower =
      currentUser.role === "ADMIN" || currentUser.isGlobalManager;

    if (!isGlobalPower) {
      // Quản lý chi nhánh chỉ được xem người dùng thuộc chi nhánh của mình
      where.branchId = currentUser.branchId;
    } else {
      // Admin/Global Manager có thể xem chi nhánh cụ thể theo params truyền lên
      if (branchId) {
        where.branchId = branchId;
      }
    }

    // 2. CÁC ĐIỀU KIỆN LỌC KHÁC
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    } else if (active !== undefined) {
      where.active = active;
    }

    // 3. THỰC THI TRUY VẤN
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
    const { id, email, password, ...rest } = data; // Bóc tách password ra riêng

    // 1. KIỂM TRA TRÙNG EMAIL
    const existingUser = await db.user.findFirst({
      where: {
        email: email,
        NOT: id ? { id: id } : undefined,
      },
    });

    if (existingUser) {
      throw new Error(
        `Email "${email}" đã được sử dụng. Vui lòng kiểm tra lại.`,
      );
    }

    // 2. XỬ LÝ MẬT KHẨU
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (!id) {
      // TRƯỜNG HỢP TẠO MỚI
      // Nếu không nhập mật khẩu khi tạo mới, dùng mặc định
      const finalPassword =
        hashedPassword || (await bcrypt.hash("Toyota@123", 10));

      return await db.user.create({
        data: {
          ...rest,
          email,
          password: finalPassword,
          tokenVersion: 0,
        },
      });
    } else {
      // TRƯỜNG HỢP CẬP NHẬT
      const updateData: any = { ...rest, email };

      // Nếu có nhập mật khẩu mới thì mới cập nhật và tăng version
      if (hashedPassword) {
        updateData.password = hashedPassword;
        updateData.tokenVersion = { increment: 1 }; // Đá các thiết bị khác ra nếu Admin đổi pass
      }

      return await db.user.update({
        where: { id: id },
        data: updateData,
      });
    }
  } catch (error: any) {
    if (error.message.includes("đã được sử dụng")) throw error;
    if (error.code === "P2002") {
      throw new Error("Dữ liệu bị trùng lặp (Email hoặc Username đã tồn tại).");
    }
    throw new Error("Lỗi hệ thống khi lưu nhân sự.");
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

export async function getStaffByBranchAction() {
  const auth = await getCurrentUser();

  if (!auth) {
    return { success: false, error: "Phiên đăng nhập hết hạn", data: [] };
  }

  // Quyền Admin hoặc Quản trị toàn cầu
  const isSuperUser = auth.role === "ADMIN" || auth.isGlobalManager === true;

  try {
    const staff = await db.user.findMany({
      where: {
        active: true,
        // 1. Lấy cả nhân viên Sale và Thu mua vì khách đóng băng có thể là khách Mua hoặc Bán
        role: {
          in: ["SALES_STAFF", "PURCHASE_STAFF"],
        },
        // 2. Nếu không phải SuperUser, chỉ lấy nhân viên cùng chi nhánh
        ...(isSuperUser
          ? {}
          : {
              branchId: auth.branchId || "UNDEFINED", // Tránh trường hợp branchId null gây lỗi logic
            }),
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true, // Thêm role để UI hiển thị phân biệt
        branch: {
          select: { name: true },
        },
      },
      orderBy: [
        { branchId: "asc" }, // Sắp xếp theo chi nhánh trước để Admin dễ nhìn
        { fullName: "asc" },
      ],
    });

    // 3. Serialize dữ liệu trước khi trả về Client
    const serializedStaff = JSON.parse(JSON.stringify(staff));

    return { success: true, data: serializedStaff };
  } catch (error: any) {
    console.error("Lỗi lấy danh sách nhân viên:", error);
    return {
      success: false,
      error: "Không thể lấy danh sách nhân viên",
      data: [],
    };
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

export async function getMeAction() {
  try {
    // 1. Lấy thông tin cơ bản (id) từ Session/Cookie
    const sessionUser = await getCurrentUser();

    if (!sessionUser || !sessionUser.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    // 2. Truy vấn chi tiết từ Database để lấy extension và các trường khác
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        extension: true, // Trường bạn cần cho cuộc gọi
        extensionPwd: true,
        branchId: true,
        departmentId: true,
        isGlobalManager: true,
        branch: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Người dùng không tồn tại" };
    }

    // 3. Trả về dữ liệu sạch (Plain Object)
    return {
      success: true,
      data: JSON.parse(JSON.stringify(user)),
    };
  } catch (error: any) {
    console.error("getMeAction Error:", error);
    return { success: false, error: "Lỗi hệ thống" };
  }
}

/**
 * 7. ĐỔI MẬT KHẨU & VÔ HIỆU HÓA TOKEN CŨ
 */
export async function changePasswordAction(data: any) {
  try {
    const { userId, oldPassword, newPassword } = data;
    const auth = await getCurrentUser();

    // 1. Kiểm tra quyền (Phải là chính chủ hoặc Admin mới được đổi)
    if (!auth || (auth.id !== userId && auth.role !== "ADMIN")) {
      throw new Error("Bạn không có quyền thực hiện hành động này.");
    }

    // 2. Tìm User
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Người dùng không tồn tại.");

    // 3. Nếu là chính chủ tự đổi, bắt buộc kiểm tra mật khẩu cũ
    if (auth.id === userId) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) throw new Error("Mật khẩu hiện tại không chính xác.");
    }

    // 4. Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. CẬP NHẬT DATABASE
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        // Tăng số phiên bản lên 1.
        // Khi Middleware thấy số này khác với số trong Token cũ, nó sẽ bắt login lại.
        tokenVersion: {
          increment: 1,
        },
      },
    });

    revalidatePath("/dashboard/users");
    return {
      success: true,
      message: "Đổi mật khẩu thành công. Các thiết bị khác sẽ bị đăng xuất.",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
