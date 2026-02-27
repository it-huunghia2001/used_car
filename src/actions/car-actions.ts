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
    Now = dayjs().tz("Asia/Ho_Chi_Minh").toDate(); // Đảm bảo trả về đối tượng Date
  }

  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };

    const updated = await db.car.update({
      where: { id },
      data: {
        ...data,
        displayDate: data.isPublished ? Now : undefined,
        // Chuyển đổi an toàn: Nếu không có giá trị thì để undefined thay vì NaN
        year: data.year ? parseInt(data.year) : undefined,
        odo: data.odo ? parseInt(data.odo) : undefined,
        seats: data.seats ? parseInt(data.seats) : undefined,
        // Tránh lỗi khi chuỗi rỗng hoặc null gửi từ InputNumber
        sellingPrice:
          data.sellingPrice !== undefined && data.sellingPrice !== null
            ? parseFloat(data.sellingPrice)
            : undefined,
        costPrice:
          data.costPrice !== undefined && data.costPrice !== null
            ? parseFloat(data.costPrice)
            : undefined,
      },
    });

    revalidatePath("/dashboard/cars");
    return { success: true, data: serializeCar(updated) };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, message: "Không thể cập nhật thông tin xe" };
  }
}

export async function getInventory(filters?: {
  status?: string;
  search?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };
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
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };
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
    const user = await getCurrentUser();
    // Nếu lỗi, trả về mảng rỗng thay vì Object
    console.log(user);

    if (!user) {
      console.warn("getCarModelsAction: Unauthorized");
      return [];
    }

    const carModels = await db.carModel.findMany({
      select: { id: true, name: true, grade: true },
      orderBy: { name: "asc" },
    });

    return JSON.parse(JSON.stringify(carModels));
  } catch (error) {
    console.error("Error fetching car models:", error);
    return []; // Luôn trả về mảng
  }
}

// 2. Tạo mẫu xe mới
export async function createCarModelAction(name: string, grade: string | null) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };
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
  grade?: string | null,
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };
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
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };
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
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };

    const skip = (page - 1) * limit;

    // 1. ĐIỀU KIỆN LỌC TỔNG THỂ
    const whereCondition: any = {
      isPublished: true,
    };

    // 2. BỘ LỌC TRẠNG THÁI
    if (status && status !== "ALL" && status !== "SOLD") {
      whereCondition.status = status;
    } else {
      whereCondition.status = {
        in: ["REFURBISHING", "READY_FOR_SALE", "BOOKED", "NEW"],
      };
    }

    // 3. LỌC THEO MODEL
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
        // Bỏ 'select' và thay bằng 'include' để lấy toàn bộ trường của Car
        // + thông tin từ các bảng liên quan
        include: {
          carModel: true,
          branch: {
            select: { name: true }, // Chỉ lấy tên chi nhánh cho gọn, hoặc true để lấy hết
          },
          purchaser: {
            select: { fullName: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: skip,
        take: limit,
      }),
      db.car.count({ where: whereCondition }),
    ]);

    // Xử lý Decimal (sellingPrice, costPrice...) để tránh lỗi Serialization khi truyền qua Server Actions
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
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };
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

export async function getInventoryCarsAction() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Phiên đăng nhập hết hạn" };
    const cars = await db.car.findMany({
      where: {
        status: { in: ["READY_FOR_SALE", "REFURBISHING"] }, // Chỉ lấy xe sẵn sàng bán
      },
      select: {
        id: true,
        stockCode: true,
        modelName: true,
        year: true,
        sellingPrice: true,
        carModelId: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: cars };
  } catch (error) {
    return { success: false, error: "Không thể tải danh sách xe" };
  }
}
