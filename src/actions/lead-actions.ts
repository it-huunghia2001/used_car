/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import { revalidatePath } from "next/cache";

// Lấy cấu hình duy nhất
export async function getLeadSettings() {
  const settings = await db.leadSetting.findUnique({
    where: { id: "lead_config" },
  });

  // Nếu chưa có (lần đầu chạy), tạo mặc định
  if (!settings) {
    return await db.leadSetting.create({
      data: { id: "lead_config", hotDays: 3, warmDays: 7 },
    });
  }
  return settings;
}

// Cập nhật cấu hình
export async function updateLeadSettings(hotDays: number, warmDays: number) {
  try {
    if (hotDays >= warmDays) {
      throw new Error("Số ngày mức HOT phải nhỏ hơn số ngày mức WARM");
    }

    const result = await db.leadSetting.update({
      where: { id: "lead_config" },
      data: { hotDays, warmDays },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: result };
  } catch (error: any) {
    throw new Error(error.message || "Không thể cập nhật cấu hình");
  }
}

// 1. Lấy danh sách khách hàng FROZEN theo phân quyền
export async function getFrozenLeadsAction() {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: "Unauthorized" };

  try {
    const whereCondition: any = { status: "FROZEN" };

    // Phân quyền: Manager chỉ thấy chi nhánh mình, Admin/Global thấy tất cả
    if (auth.role === "MANAGER" && !auth.isGlobalManager) {
      whereCondition.referrer = { branchId: auth.branchId };
    }

    const leads = await db.customer.findMany({
      where: whereCondition,
      include: {
        referrer: {
          select: { fullName: true, branch: { select: { name: true } } },
        },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: leads };
  } catch (error) {
    return { success: false, error: "Lỗi lấy danh sách khách đóng băng" };
  }
}

// 2. Thực hiện rã băng
export async function unfreezeLeadAction(customerId: string) {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: "Unauthorized" };

  try {
    return await db.$transaction(async (tx) => {
      const lead = await tx.customer.findUnique({
        where: { id: customerId },
        select: { fullName: true, status: true },
      });

      if (!lead || lead.status !== "FROZEN") {
        throw new Error("Khách hàng không ở trạng thái đóng băng");
      }

      // Cập nhật trạng thái khách
      const updated = await tx.customer.update({
        where: { id: customerId },
        data: {
          status: "CONTACTED",
          lastContactAt: new Date(),
        },
      });

      // Ghi lịch sử hoạt động (Log History)
      await tx.leadActivity.create({
        data: {
          customerId: customerId,
          status: "CONTACTED",
          note: `🔓 Đã rã băng bởi ${auth.fullName} (${auth.role}). Hệ thống chuyển trạng thái về Đã liên hệ.`,
          createdById: auth.id,
        },
      });

      return { success: true, name: updated.fullName };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    revalidatePath("/dashboard/frozen-leads");
  }
}

// 3. Lấy lịch sử chi tiết của một khách hàng
export async function getCustomerHistoryAction(customerId: string) {
  try {
    const activities = await db.leadActivity.findMany({
      where: { customerId },
      include: {
        user: { select: { fullName: true, role: true } },
        reason: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: activities };
  } catch (error) {
    return { success: false, error: "Không thể tải lịch sử khách hàng" };
  }
}

export async function updateLeadCarSpecs(customerId: string, data: any) {
  try {
    // 1. Kiểm tra Customer có tồn tại không (Trong schema của bạn là Customer)
    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return { success: false, error: "Không tìm thấy khách hàng" };
    }

    // 2. Cập nhật hoặc Tạo mới LeadCar thông qua quan hệ 1-1 với Customer
    const updated = await db.customer.update({
      where: { id: customerId },
      data: {
        leadCar: {
          upsert: {
            create: {
              modelName: data.modelName,
              year: data.year,
              odo: data.odo,
              vin: data.vin,
              licensePlate: data.licensePlate,
              transmission: data.transmission,
              fuelType: data.fuelType,
              expectedPrice: data.expectedPrice,
              registrationDeadline: data.registrationDeadline,
              insuranceTNDS: data.insuranceTNDS || false,
              insuranceTNDSDeadline: data.insuranceTNDSDeadline,
              insuranceVC: data.insuranceVC || false,
              insuranceVCCorp: data.insuranceVCCorp,
              insuranceVCDeadline: data.insuranceVCDeadline,
              note: data.note,
              tradeInModel: data.tradeInModel,
            },
            update: {
              modelName: data.modelName,
              year: data.year,
              odo: data.odo,
              vin: data.vin,
              licensePlate: data.licensePlate,
              transmission: data.transmission,
              fuelType: data.fuelType,
              expectedPrice: data.expectedPrice,
              registrationDeadline: data.registrationDeadline,
              insuranceTNDS: data.insuranceTNDS,
              insuranceTNDSDeadline: data.insuranceTNDSDeadline,
              insuranceVC: data.insuranceVC,
              insuranceVCCorp: data.insuranceVCCorp,
              insuranceVCDeadline: data.insuranceVCDeadline,
              note: data.note,
              tradeInModel: data.tradeInModel,
            },
          },
        },
      },
    });

    revalidatePath("/assigned-tasks");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Lỗi Prisma:", error);
    return { success: false, error: "Không thể cập nhật thông số xe" };
  }
}

export async function updateLeadDetailAction(customerId: string, values: any) {
  try {
    const {
      fullName,
      phone,
      licensePlate,
      carYear, // Thông tin bảng Customer
      carModelId,
      modelName,
      year,
      vin,
      odo,
      transmission,
      fuelType,
      expectedPrice,
      tSurePrice, // Thông tin bảng LeadCar
    } = values;

    await db.$transaction(async (tx) => {
      // 1. Cập nhật bảng Customer
      await tx.customer.update({
        where: { id: customerId },
        data: {
          fullName,
          phone,
          licensePlate,
          carYear: carYear ? String(carYear) : null,
          carModelId, // Cập nhật cả model ở bảng customer
        },
      });

      // 2. Cập nhật hoặc Tạo mới bảng LeadCar
      await tx.leadCar.upsert({
        where: { customerId: customerId },
        update: {
          carModelId,
          modelName,
          year: year ? Number(year) : null,
          vin,
          odo: odo ? Number(odo) : null,
          transmission,
          fuelType,
          expectedPrice: expectedPrice ? Number(expectedPrice) : null,
          tSurePrice: tSurePrice ? Number(tSurePrice) : null,
        },
        create: {
          customerId: customerId,
          carModelId,
          modelName,
          year: year ? Number(year) : null,
          vin,
          odo: odo ? Number(odo) : null,
          transmission,
          fuelType,
          expectedPrice: expectedPrice ? Number(expectedPrice) : null,
          tSurePrice: tSurePrice ? Number(tSurePrice) : null,
        },
      });
    });

    revalidatePath("/admin/tasks");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function updateFullLeadDetail(customerId: string, values: any) {
  try {
    const {
      fullName,
      phone,
      ...restValues // Chứa carModelId, color, odo, v.v.
    } = values;

    await db.$transaction(async (tx) => {
      // 1. Cập nhật Customer
      await tx.customer.update({
        where: { id: customerId },
        data: { fullName, phone },
      });

      // 2. Chuẩn hóa dữ liệu cho LeadCar
      // Loại bỏ những trường không thuộc Schema LeadCar nếu cần
      const carPayload = {
        carModelId: restValues.carModelId,
        modelName: restValues.modelName,
        year: restValues.year ? Number(restValues.year) : null,
        color: restValues.color,
        licensePlate: restValues.licensePlate,
        odo: restValues.odo ? Number(restValues.odo) : null,
        transmission: restValues.transmission,
        seats: restValues.seats ? Number(restValues.seats) : 5,
        expectedPrice: restValues.expectedPrice
          ? Number(restValues.expectedPrice)
          : null,
        tSurePrice: restValues.tSurePrice
          ? Number(restValues.tSurePrice)
          : null,
        note: restValues.note,
        engineNumber: restValues.engineNumber,
        vin: restValues.vin,
        interiorColor: restValues.interiorColor,
        engineSize: restValues.engineSize,
        driveTrain: restValues.driveTrain,
        carType: restValues.carType,

        // ÉP KIỂU DATE Ở ĐÂY
        registrationDeadline: restValues.registrationDeadline
          ? new Date(restValues.registrationDeadline)
          : null,
        insuranceTNDS: restValues.insuranceTNDSDeadline ? true : false,
        insuranceVC: restValues.insuranceVCDeadline ? true : false,
        insuranceVCDeadline: restValues.insuranceVCDeadline
          ? new Date(restValues.insuranceVCDeadline)
          : null,
        insuranceTNDSDeadline: restValues.insuranceTNDSDeadline
          ? new Date(restValues.insuranceTNDSDeadline)
          : null,

        insuranceDeadline: restValues.insuranceDeadline
          ? new Date(restValues.insuranceDeadline)
          : null,
      };
      await tx.customer.update({
        where: { id: customerId },
        data: {
          carModelId: restValues.carModelId, // Cập nhật luôn ở đây
        },
      });
      // 3. Upsert LeadCar
      await tx.leadCar.upsert({
        where: { customerId: customerId },
        update: carPayload,
        create: {
          customerId: customerId,
          ...carPayload,
        },
      });
    });

    revalidatePath("/dashboard/assigned-tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Update Error Chi Tiết:", error);
    return { success: false, error: error.message };
  }
}
