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
  // Lưu ý: Sẽ lỗi nếu phòng ban đang có chức vụ/nhân viên
  await db.department.delete({ where: { id } });
  revalidatePath("/dashboard/settings/departments");
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
