/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// --- LOGIC KHO XE (INVENTORY) ---
export async function getInventory() {
  const cookieStore = await cookies();
  const token = cookieStore.get("used-car")?.value;
  if (!token) return [];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const whereCondition = decoded.isGlobalManager
      ? {}
      : { branchId: decoded.branchId };

    return await db.car.findMany({
      where: whereCondition,
      include: {
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Inventory Error:", error);
    return [];
  }
}

// --- LOGIC QUẢN LÝ MẪU XE (CAR MODELS) ---

// 1. Lấy danh sách mẫu xe (Giữ nguyên logic cũ của bạn)
export async function getCarModelsAction() {
  try {
    const carModels = await db.carModel.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return carModels;
  } catch (error) {
    console.error("Error fetching car models:", error);
    return [];
  }
}

// 2. Tạo mẫu xe mới
export async function createCarModelAction(name: string) {
  try {
    const newModel = await db.carModel.create({
      data: { name },
    });
    revalidatePath("/admin/car-setup"); // Làm mới dữ liệu trang setup
    return newModel;
  } catch (error) {
    console.error("Create Car Model Error:", error);
    throw new Error("Không thể tạo mẫu xe mới");
  }
}

// 3. Cập nhật tên mẫu xe
export async function updateCarModelAction(id: string, name: string) {
  try {
    const updated = await db.carModel.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/admin/car-setup");
    return updated;
  } catch (error) {
    console.error("Update Car Model Error:", error);
    throw new Error("Không thể cập nhật mẫu xe");
  }
}

// 4. Xóa mẫu xe
export async function deleteCarModelAction(id: string) {
  try {
    // Lưu ý: Nếu có khách hàng đang chọn mẫu xe này, Prisma sẽ báo lỗi liên kết (Foreign Key)
    await db.carModel.delete({
      where: { id },
    });
    revalidatePath("/admin/car-setup");
    return { success: true };
  } catch (error) {
    console.error("Delete Car Model Error:", error);
    throw new Error("Không thể xóa mẫu xe đang có dữ liệu khách hàng liên kết");
  }
}
