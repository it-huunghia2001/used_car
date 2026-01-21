"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";

export async function getCurrentUserAction() {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Bạn cần đăng nhập để thực hiện hành động này");

    const user = await db.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        fullName: true,
        role: true, // Lấy role: SALES_STAFF, PURCHASE_STAFF, v.v.
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching user session:", error);
    return null;
  }
}
