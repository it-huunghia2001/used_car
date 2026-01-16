/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getBranchesAction() {
  try {
    return await db.branch.findMany({
      orderBy: { name: "asc" },
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
  const branch = await db.branch.create({ data });
  revalidatePath("/admin/branch-setup");
  return branch;
}

export async function updateBranchAction(
  id: string,
  data: { name: string; address?: string }
) {
  const branch = await db.branch.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/branch-setup");
  return branch;
}

export async function deleteBranchAction(id: string) {
  try {
    await db.branch.delete({ where: { id } });
    revalidatePath("/admin/branch-setup");
    return { success: true };
  } catch (error) {
    throw new Error("Không thể xóa chi nhánh đang có xe hoặc nhân sự.");
  }
}
