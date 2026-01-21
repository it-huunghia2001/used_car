/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server"; // Hàm đã tách ở bước trước
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
function serializeLead(lead: any) {
  if (!lead) return null;

  return {
    ...lead,

    // Decimal → string
    budget: lead.budget?.toString() ?? null,
    expectedPrice: lead.expectedPrice?.toString() ?? null,

    // Date → ISO string
    createdAt: lead.createdAt?.toISOString(),
    updatedAt: lead.updatedAt?.toISOString(),
    assignedAt: lead.assignedAt?.toISOString(),
    firstContactAt: lead.firstContactAt?.toISOString(),
    lastContactAt: lead.lastContactAt?.toISOString(),
    nextContactAt: lead.nextContactAt?.toISOString(),
    displayDate: lead.displayDate?.toISOString(),

    // Serialize nested
    activities: lead.activities?.map((a: any) => ({
      ...a,
      createdAt: a.createdAt?.toISOString(),
    })),
  };
}

export async function getCurrentUserApi() {
  try {
    const payload = await getCurrentUser();
    if (!payload?.id) return null;

    const user = await db.user.findUnique({
      where: { id: payload.id },
      include: {
        branch: true,
        department: true,
        position: true,
      },
    });

    return user;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
export async function updateProfile(values: {
  email?: string;
  password?: string;
  oldPassword?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };

    const updateData: any = {};

    // 1. Nếu đổi Email
    if (values.email) {
      const existing = await db.user.findFirst({
        where: { email: values.email },
      });
      if (existing)
        return { success: false, message: "Email này đã được sử dụng" };
      updateData.email = values.email;
    }

    // 2. Nếu đổi Mật khẩu
    if (values.password) {
      if (!values.oldPassword)
        return { success: false, message: "Vui lòng nhập mật khẩu cũ" };

      const dbUser = await db.user.findUnique({ where: { id: user.id } });
      const isMatch = await bcrypt.compare(
        values.oldPassword,
        dbUser!.password,
      );

      if (!isMatch)
        return { success: false, message: "Mật khẩu cũ không chính xác" };

      updateData.password = await bcrypt.hash(values.password, 10);
    }

    if (Object.keys(updateData).length === 0)
      return { success: false, message: "Không có gì thay đổi" };

    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    revalidatePath("/dashboard/profile");
    return { success: true, message: "Cập nhật thông tin thành công" };
  } catch (error) {
    return { success: false, message: "Lỗi hệ thống" };
  }
}

export async function getLeadDetail(customerId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) return null;

    const lead = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        carModel: { select: { id: true, name: true } },
        referrer: { select: { id: true, fullName: true, phone: true } },
        assignedTo: { select: { id: true, fullName: true } },
        activities: {
          include: {
            user: { select: { fullName: true, role: true } },
            reason: { select: { content: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return serializeLead(lead); // ✅ QUAN TRỌNG
  } catch (error) {
    console.error("Error fetching lead detail:", error);
    return null;
  }
}
