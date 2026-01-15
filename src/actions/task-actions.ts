/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Hàm helper để lấy thông tin User từ Cookie
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("used-car")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET!) as any;
  } catch (err) {
    return null;
  }
}

// 1. Lấy danh sách khách hàng được phân bổ cho nhân viên hiện tại
export async function getMyAssignedLeads() {
  const user = await getAuthUser();
  if (!user || !user.id) return [];

  try {
    return await db.customer.findMany({
      where: {
        assignedToId: user.id,
        status: { in: ["ASSIGNED", "NEW"] },
      },
      include: {
        referrer: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Lỗi getMyAssignedLeads:", error);
    return [];
  }
}

// 2. Lấy danh sách xe đang sẵn sàng để bán (cho nghiệp vụ Sales)
export async function getAvailableCars() {
  try {
    return await db.car.findMany({
      where: {
        status: { in: ["READY_FOR_SALE", "PENDING"] },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Lỗi getAvailableCars:", error);
    return [];
  }
}

// 3. Xử lý THU MUA: Tạo xe mới và đóng trạng thái khách hàng
export async function processCarPurchase(leadId: string, values: any) {
  const user = await getAuthUser();
  if (!user) throw new Error("Bạn không có quyền thực hiện hành động này");

  try {
    await db.$transaction(async (tx) => {
      // Lấy thông tin khách hàng hiện tại
      const lead = await tx.customer.findUnique({
        where: { id: leadId },
      });

      // Tạo bản ghi xe mới vào kho (theo Schema Car của bạn)
      await tx.car.create({
        data: {
          modelName: values.modelName,
          vin: values.vin.toUpperCase(),
          licensePlate: values.licensePlate?.toUpperCase(),
          ownerName: lead?.fullName || "Khách vãng lai",
          status: "PENDING", // Xe mới thu về thường ở trạng thái chờ duyệt/dọn dẹp
          branchId: user.branchId || "clxb...", // ID chi nhánh của nhân viên
          referrerId: lead?.referrerId || user.id,
          purchaserId: user.id,
        },
      });

      // Cập nhật trạng thái khách hàng đã xử lý xong
      await tx.customer.update({
        where: { id: leadId },
        data: { status: "DEAL_DONE" },
      });
    });

    revalidatePath("/dashboard/assigned-tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi processCarPurchase:", error);
    throw new Error(error.message || "Lỗi khi xử lý thu mua");
  }
}

// 4. Xử lý BÁN XE: Giao xe trong kho cho khách và đóng trạng thái khách
export async function processCarSale(leadId: string, carId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await db.$transaction(async (tx) => {
      // Cập nhật trạng thái xe thành ĐÃ BÁN
      await tx.car.update({
        where: { id: carId },
        data: {
          status: "SOLD",
          soldAt: new Date(),
        },
      });

      // Cập nhật trạng thái khách hàng
      await tx.customer.update({
        where: { id: leadId },
        data: { status: "DEAL_DONE" },
      });
    });

    revalidatePath("/dashboard/assigned-tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi processCarSale:", error);
    throw new Error(error.message || "Lỗi khi xử lý bán xe");
  }
}

// actions/task-actions.ts

export async function processLeadFailed(leadId: string, reason: string) {
  try {
    await db.customer.update({
      where: { id: leadId },
      data: {
        status: "CANCELLED",
        note: reason, // Lưu lý do thất bại vào trường note
      },
    });
    revalidatePath("/dashboard/assigned-tasks");
    return { success: true };
  } catch (error: any) {
    throw new Error("Lỗi cập nhật trạng thái: " + error.message);
  }
}
