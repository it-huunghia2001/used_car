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
import { getCurrentUser } from "@/lib/session-server";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

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

export async function getInventory(filters?: {
  status?: string;
  search?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { role, isGlobalManager, branchId } = user;
    const isHighLevel = role === "ADMIN" || isGlobalManager;

    // Khởi tạo điều kiện lọc
    const whereCondition: any = {};

    // 1. Phân quyền chi nhánh
    if (!isHighLevel) {
      whereCondition.branchId = branchId;
    }

    // 2. Lọc theo trạng thái xe (nếu có)
    if (filters?.status && filters.status !== "ALL") {
      whereCondition.status = filters.status;
    }

    // 3. Lọc theo từ khóa tìm kiếm (nếu có)
    if (filters?.search) {
      whereCondition.OR = [
        { modelName: { contains: filters.search } },
        { vin: { contains: filters.search } },
        { stockCode: { contains: filters.search } },
        { licensePlate: { contains: filters.search } },
      ];
    }

    const cars = await db.car.findMany({
      where: whereCondition,
      include: {
        branch: { select: { name: true } },
        purchaser: { select: { fullName: true } },
        soldBy: { select: { fullName: true } },
        carModel: { select: { name: true, grade: true } },
        ownerHistory: {
          include: {
            customer: { select: { fullName: true, phone: true } },
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return JSON.parse(JSON.stringify(cars));
  } catch (error) {
    console.error("Inventory Fetch Error:", error);
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

    // Đảm bảo trả về Plain Object thuần túy
    return JSON.parse(JSON.stringify(carModels));
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

    // 1. ĐIỀU KIỆN LỌC TỔNG THỂ
    const whereCondition: any = {
      // CHỈ lấy những xe đã được bấm "Công bố" (isPublished = true)
      isPublished: true,
    };

    // 2. BỘ LỌC TRẠNG THÁI (LOẠI BỎ SOLD)
    if (status && status !== "ALL" && status !== "SOLD") {
      whereCondition.status = status;
    } else {
      // Mặc định cho Showroom: Không hiện xe đã bán (SOLD)
      // và xe mới thu chưa duyệt (PENDING)
      whereCondition.status = {
        in: ["REFURBISHING", "READY_FOR_SALE", "BOOKED"],
      };
    }

    // 3. LỌC THEO MODEL (Nếu có chọn từ Dropdown)
    if (carModelId && carModelId !== "ALL") {
      whereCondition.carModelId = carModelId;
    }

    // 4. TÌM KIẾM
    if (search) {
      whereCondition.AND = [
        {
          OR: [
            { modelName: { contains: search } },
            { licensePlate: { contains: search } },
            { stockCode: { contains: search } },
          ],
        },
      ];
    }

    const [cars, total] = await Promise.all([
      db.car.findMany({
        where: whereCondition,
        select: {
          id: true,
          modelName: true,
          stockCode: true,
          year: true,
          odo: true,
          transmission: true,
          fuelType: true,
          sellingPrice: true,
          images: true,
          status: true,
          isPromoted: true,
          promotionNote: true,
          carModel: { select: { name: true, grade: true } },
          branch: { select: { name: true } },
          // ... lấy các trường khác nếu cần
        },
        orderBy: { updatedAt: "desc" },
        skip: skip,
        take: limit,
      }),
      db.car.count({ where: whereCondition }),
    ]);

    // Xử lý Decimal để tránh lỗi Serialization
    const serializedCars = JSON.parse(JSON.stringify(cars));

    return {
      data: serializedCars,
      total,
      hasMore: skip + cars.length < total,
    };
  } catch (error) {
    console.error("Advanced Inventory Error:", error);
    return { data: [], total: 0, hasMore: false };
  }
}
export async function getAvailableCarsAction() {
  try {
    const cars = await db.car.findMany({
      where: {
        status: { in: ["READY_FOR_SALE", "REFURBISHING"] },
        isPublished: true,
      },
      select: {
        id: true,
        stockCode: true,
        modelName: true,
        year: true,
        sellingPrice: true, // Đây là kiểu Decimal gây lỗi
        carModelId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // QUAN TRỌNG: Chuyển đổi Decimal/Date sang chuỗi/số thuần JSON
    // để tránh lỗi "Only plain objects can be passed to Client Components"
    return JSON.parse(JSON.stringify(cars));
  } catch (error) {
    console.error("Lỗi getAvailableCarsAction:", error);
    return [];
  }
}
