/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getDepartmentsAction() {
  return await db.department.findMany({
    include: { positions: true },
    orderBy: { name: "asc" },
  });
}

export async function createDepartmentAction(name: string) {
  const dept = await db.department.create({ data: { name } });
  revalidatePath("/dashboard/settings/departments");
  return dept;
}

export async function createPositionAction(name: string, departmentId: string) {
  const pos = await db.position.create({ data: { name, departmentId } });
  revalidatePath("/dashboard/settings/departments");
  return pos;
}

export async function deleteDepartmentAction(id: string) {
  try {
    // 1. Kiểm tra xem có nhân viên nào đang thuộc phòng ban này không
    const userCount = await db.user.count({
      where: { departmentId: id },
    });

    if (userCount > 0) {
      return {
        success: false,
        error: `Không thể xóa. Đang có ${userCount} nhân viên thuộc phòng ban này. Hãy chuyển họ sang phòng khác trước.`,
      };
    }

    // 2. Tiến hành xóa (Lúc này các Position liên quan sẽ tự động bị xóa nhờ Cascade)
    await db.department.delete({
      where: { id },
    });

    revalidatePath("/dashboard/settings/departments");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi xóa phòng ban:", error);
    return {
      success: false,
      error: "Lỗi hệ thống khi xóa phòng ban.",
    };
  }
}

export async function getBranchesAction() {
  try {
    const branches = await db.branch.findMany({
      where: {
        // Bạn có thể thêm điều kiện active: true nếu có trường này
      },
      orderBy: {
        name: "asc",
      },
    });
    return branches;
  } catch (error) {
    console.error("Fetch branches error:", error);
    throw new Error("Không thể lấy danh sách chi nhánh");
  }
}

// 1. Cập nhật tên phòng ban
export async function updateDepartmentAction(id: string, name: string) {
  try {
    const updated = await db.department.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/dashboard/settings/departments");
    return { success: true, data: updated };
  } catch (error: any) {
    if (error.code === "P2002")
      return { success: false, error: "Tên phòng ban đã tồn tại." };
    return { success: false, error: "Lỗi khi cập nhật phòng ban." };
  }
}

// 2. Cập nhật tên chức vụ
export async function updatePositionAction(id: string, name: string) {
  try {
    const updated = await db.position.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/dashboard/settings/departments");
    return { success: true, data: updated };
  } catch (error: any) {
    if (error.code === "P2002")
      return {
        success: false,
        error: "Tên chức vụ trong phòng này đã tồn tại.",
      };
    return { success: false, error: "Lỗi khi cập nhật chức vụ." };
  }
}

// 3. Xóa chức vụ
export async function deletePositionAction(id: string) {
  try {
    // Kiểm tra xem có nhân viên nào đang giữ chức vụ này không
    const userCount = await db.user.count({
      where: { positionId: id },
    });

    if (userCount > 0) {
      return {
        success: false,
        error: `Không thể xóa. Đang có ${userCount} nhân viên giữ chức vụ này.`,
      };
    }

    await db.position.delete({
      where: { id },
    });

    revalidatePath("/dashboard/settings/departments");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi xóa chức vụ:", error);
    return {
      success: false,
      error: "Lỗi hệ thống khi xóa chức vụ.",
    };
  }
}
