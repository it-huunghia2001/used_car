/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"; // Cánh cửa bảo vệ

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server"; // Đưa nó vào lại đây
import { revalidatePath } from "next/cache";

export async function getBranchesAction() {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Chưa đăng nhập");

    // Nếu là Admin hoặc Quản lý toàn cầu -> Lấy tất cả
    if (auth.role === "ADMIN" || auth.isGlobalManager) {
      return await db.branch.findMany({
        select: {
          id: true,
          name: true,
          address: true,
        },
        orderBy: { name: "asc" },
      });
    }

    // Nếu là Manager hoặc Nhân viên thường -> Chỉ lấy chi nhánh của họ
    // Chúng ta vẫn dùng findMany để trả về mảng [], giúp Frontend không bị lỗi map
    return await db.branch.findMany({
      where: {
        id: auth.branchId || "undefined", // Tránh trường hợp branchId null
      },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });
  } catch (error) {
    console.error("Fetch Branches Error:", error);
    return [];
  }
}

export async function createBranchAction(data: {
  name: string;
  address: string;
}) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Chưa đăng nhập");
  const branch = await db.branch.create({ data });
  revalidatePath("/admin/branch-setup");
  return branch;
}

export async function updateBranchAction(
  id: string,
  data: { name: string; address?: string },
) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Chưa đăng nhập");
  const branch = await db.branch.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/branch-setup");
  return branch;
}

export async function deleteBranchAction(id: string) {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Chưa đăng nhập");
    await db.branch.delete({ where: { id } });
    revalidatePath("/admin/branch-setup");
    return { success: true };
  } catch (error) {
    throw new Error("Không thể xóa chi nhánh đang có xe hoặc nhân sự.");
  }
}

// ✅ API MỚI: Chỉ dùng cho trang Đăng ký (Public)
export async function getBranchesForRegisterAction() {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Chưa đăng nhập");
    // Không check auth ở đây vì người dùng chưa có tài khoản
    return await db.branch.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        // Không trả về address nếu không cần thiết để tăng bảo mật
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Public Fetch Branches Error:", error);
    return [];
  }
}
