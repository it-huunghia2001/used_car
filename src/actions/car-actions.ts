/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// --- HELPER FUNCTION: Biến đổi dữ liệu Prisma sang Plain Object ---
function serializeCar(car: any) {
  return {
    ...car,
    // Biến Decimal thành Number để Client Component đọc được
    sellingPrice: car.sellingPrice ? Number(car.sellingPrice) : null,
    costPrice: car.costPrice ? Number(car.costPrice) : null,
    // Biến Date thành ISO String để tránh lỗi Serialization
    createdAt: car.createdAt?.toISOString(),
    updatedAt: car.updatedAt?.toISOString(),
    purchasedAt: car.purchasedAt?.toISOString() || null,
    refurbishedAt: car.refurbishedAt?.toISOString() || null,
    soldAt: car.soldAt?.toISOString() || null,
    // Nếu có quan hệ branch, cũng phải đảm bảo nó là plain object
    branch: car.branch ? { ...car.branch } : null,
  };
}

export async function updateCarAction(id: string, data: any) {
  let Now;
  if (data.isPublished) {
    Now = dayjs().tz("Asia/Ho_Chi_Minh");
  }
  try {
    const updated = await db.car.update({
      where: { id },
      data: {
        ...data,
        displayDate: data.isPublished ? Now : undefined,
        // Ép kiểu dữ liệu để phù hợp với Prisma Schema
        year: data.year ? parseInt(data.year) : undefined,
        odo: data.odo ? parseInt(data.odo) : undefined,
        seats: data.seats ? parseInt(data.seats) : undefined,
        sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
      },
    });
    revalidatePath("/dashboard/cars");
    return serializeCar(updated);
  } catch (error) {
    console.error("Update Error:", error);
    throw new Error("Không thể cập nhật thông tin xe");
  }
}

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

    const cars = await db.car.findMany({
      where: whereCondition,
      include: {
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // TRƯỚC KHI RETURN: Phải chạy qua hàm serialize
    return cars.map(serializeCar);
  } catch (error) {
    console.error("Inventory Error:", error);
    return [];
  }
}

// --- LOGIC DUYỆT XE RA SHOWROOM (MỚI) ---
export async function publishCarAction(carId: string, price: number) {
  try {
    const updatedCar = await db.car.update({
      where: { id: carId },
      data: {
        sellingPrice: price,
        status: "READY_FOR_SALE", // Chuyển trạng thái sang sẵn sàng bán
        // Bạn có thể thêm trường isPublished: true vào schema nếu muốn kiểm soát sâu hơn
      },
    });

    revalidatePath("/dashboard/cars");
    return serializeCar(updatedCar);
  } catch (error) {
    console.error("Publish Car Error:", error);
    throw new Error("Không thể cập nhật giá và xuất bản xe");
  }
}

// --- LOGIC QUẢN LÝ MẪU XE (Giữ nguyên và bọc try-catch) ---
export async function getCarModelsAction() {
  try {
    const carModels = await db.carModel.findMany({
      select: { id: true, name: true, grade: true },
      orderBy: { name: "asc" },
    });
    return carModels;
  } catch (error) {
    console.error("Error fetching car models:", error);
    return [];
  }
}

// 2. Tạo mẫu xe mới
export async function createCarModelAction(name: string, grade: string) {
  try {
    const newModel = await db.carModel.create({
      data: { name, grade },
    });
    revalidatePath("/admin/car-setup"); // Làm mới dữ liệu trang setup
    return newModel;
  } catch (error) {
    console.error("Create Car Model Error:", error);
    throw new Error("Không thể tạo mẫu xe mới");
  }
}

// 3. Cập nhật tên mẫu xe
export async function updateCarModelAction(
  id: string,
  name: string,
  grade: string,
) {
  try {
    const updated = await db.carModel.update({
      where: { id },
      data: { name, grade },
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

export async function getInventoryAdvancedAction({
  page = 1,
  limit = 8,
  carModelId,
  status,
  search,
}: {
  page?: number;
  limit?: number;
  carModelId?: string;
  status?: string;
  search?: string;
}) {
  try {
    const skip = (page - 1) * limit;
    const whereCondition: any = {};

    // 1. Bộ lọc trạng thái
    if (status && status !== "ALL") {
      whereCondition.status = status;
    } else {
      whereCondition.status = {
        in: ["REFURBISHING", "READY_FOR_SALE", "BOOKED", "SOLD"],
      };
    }

    // 2. Bộ lọc Model
    if (carModelId && carModelId !== "ALL") {
      whereCondition.carModelId = carModelId;
    }

    // 3. Tìm kiếm theo tên, biển số hoặc số khung (VIN)
    if (search) {
      whereCondition.OR = [
        { modelName: { contains: search } },
        { licensePlate: { contains: search } },
        { vin: { contains: search } },
      ];
    }

    const [cars, total] = await Promise.all([
      db.car.findMany({
        where: whereCondition,
        select: {
          // --- THÔNG TIN ĐỊNH DANH ---
          id: true,
          modelName: true,
          vin: true,
          engineNumber: true,
          licensePlate: true,
          year: true,

          // --- THÔNG SỐ KỸ THUẬT (Đã bổ sung đầy đủ) ---
          odo: true,
          transmission: true,
          fuelType: true,
          carType: true,
          engineSize: true,
          driveTrain: true,
          color: true,
          interiorColor: true,
          seats: true,
          origin: true,
          ownerType: true,

          // --- THÔNG TIN THƯƠNG MẠI (Bỏ costPrice) ---
          sellingPrice: true,
          isPromoted: true,
          promotionNote: true,

          // --- NỘI DUNG CMS ---
          images: true,
          videoUrl: true,
          description: true,
          features: true,

          // --- TRẠNG THÁI & QUẢN LÝ ---
          status: true,
          branchId: true,
          referrerId: true,
          purchaserId: true,
          updatedAt: true,
          createdAt: true,

          // --- QUAN HỆ (Relations) ---
          branch: { select: { id: true, name: true } },
          carModel: { select: { id: true, name: true, grade: true } },
          referrer: { select: { id: true, fullName: true } },
          purchaser: { select: { id: true, fullName: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: skip,
        take: limit,
      }),
      db.car.count({ where: whereCondition }),
    ]);

    return {
      data: cars.map(serializeCar),
      total,
      hasMore: skip + cars.length < total,
    };
  } catch (error) {
    console.error("Advanced Inventory Error:", error);
    return { data: [], total: 0, hasMore: false };
  }
}
