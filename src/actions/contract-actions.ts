/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import { revalidatePath } from "next/cache";

// --- HELPER: BIẾN ĐỔI DECIMAL/DATE SANG JSON THUẦN ---
function serializeContract(contract: any) {
  if (!contract) return null;
  return {
    ...contract,
    // Chuyển Decimal sang Number
    totalAmount: contract.totalAmount ? Number(contract.totalAmount) : 0,
    depositAmount: contract.depositAmount ? Number(contract.depositAmount) : 0,
    // Chuyển Date sang ISO String
    createdAt: contract.createdAt?.toISOString(),
    updatedAt: contract.updatedAt?.toISOString(),
    signedAt: contract.signedAt?.toISOString() || null,
    expiredAt: contract.expiredAt?.toISOString() || null,
    // Xử lý đệ quy cho các quan hệ nếu có Decimal (như giá xe)
    car: contract.car
      ? {
          ...contract.car,
          costPrice: contract.car.costPrice
            ? Number(contract.car.costPrice)
            : 0,
          sellingPrice: contract.car.sellingPrice
            ? Number(contract.car.sellingPrice)
            : 0,
        }
      : null,
  };
}

export async function getContractsAction() {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Chưa đăng nhập");

  // 1. Khởi tạo điều kiện lọc (where clause)
  let where: any = {};

  // 2. Logic phân quyền
  const isGlobalManager = auth.role === "ADMIN" || auth.isGlobalManager;

  if (!isGlobalManager) {
    if (auth.role === "MANAGER") {
      // Manager chi nhánh: Thấy toàn bộ hợp đồng của chi nhánh mình
      // Lưu ý: Hợp đồng liên kết với Car, và Car có branchId
      where = {
        car: {
          branchId: auth.branchId,
        },
      };
    } else {
      // Nhân viên bình thường (PURCHASE_STAFF, SALES_STAFF): Chỉ thấy hợp đồng mình tạo
      where = {
        staffId: auth.id,
      };
    }
  }

  // 3. Thực hiện truy vấn với đầy đủ thông tin (bao gồm ảnh từ customer)
  const contracts = await db.contract.findMany({
    where,
    include: {
      customer: {
        select: {
          fullName: true,
          phone: true,
          address: true,
          type: true,
          carImages: true, // Lấy mảng ảnh xe
          documents: true, // Lấy mảng tài liệu gốc
        },
      },
      car: {
        select: {
          modelName: true,
          stockCode: true,
          licensePlate: true,
          vin: true,
          engineNumber: true,
          costPrice: true,
          sellingPrice: true,
          branchId: true,
        },
      },
      staff: {
        select: {
          fullName: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 4. Serialize dữ liệu (loại bỏ lỗi Decimal/Date của Prisma)
  return JSON.parse(JSON.stringify(contracts));
}

/**
 * Tương tự cho hàm lấy chi tiết, cũng nên kiểm tra quyền truy cập
 * để tránh việc nhân viên biết ID hợp đồng của người khác và truy cập lậu
 */
export async function getContractDetailAction(id: string) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Chưa đăng nhập");

  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      customer: true, // Lấy full thông tin khách hàng bao gồm ảnh/tài liệu
      car: true, // Lấy full thông tin xe
      staff: {
        select: { fullName: true, username: true },
      },
    },
  });

  if (!contract) throw new Error("Không tìm thấy hợp đồng");

  // Kiểm tra bảo mật cơ bản: Nếu không phải sếp và không phải chủ hợp đồng
  const isGlobalManager = auth.role === "ADMIN" || auth.isGlobalManager;
  if (!isGlobalManager && contract.staffId !== auth.id) {
    // Nếu là manager chi nhánh thì kiểm tra chi nhánh của xe
    if (auth.role === "MANAGER" && contract.car.branchId === auth.branchId) {
      // Hợp lệ
    } else {
      throw new Error("Bạn không có quyền xem hợp đồng này");
    }
  }

  return JSON.parse(JSON.stringify(contract));
}

export async function completeContractAction(contractId: string) {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Chưa đăng nhập");

    const result = await db.$transaction(
      async (tx) => {
        // 1. Lấy thông tin HĐ
        const contract = await tx.contract.findUnique({
          where: { id: contractId },
        });
        if (!contract) throw new Error("Hợp đồng không tồn tại");

        // 2. Cập nhật Hợp đồng thành COMPLETED
        const updatedContract = await tx.contract.update({
          where: { id: contractId },
          data: {
            status: "COMPLETED",
            signedAt: new Date(),
          },
        });

        // 3. Cập nhật Xe thành SOLD
        await tx.car.update({
          where: { id: contract.carId },
          data: {
            status: "SOLD",
            soldAt: new Date(),
            soldById: contract.staffId,
          },
        });

        // 4. Cập nhật Khách hàng thành DEAL_DONE
        await tx.customer.update({
          where: { id: contract.customerId },
          data: { status: "DEAL_DONE" },
        });

        // 5. Tạo Task nhắc bảo dưỡng sau 1 tháng
        await tx.task.create({
          data: {
            title: "📞 NHẮC BẢO DƯỠNG (1 THÁNG SAU MUA)",
            type: "MAINTENANCE",
            scheduledAt: dayjs().add(1, "month").toDate(),
            deadlineAt: dayjs().add(1, "month").add(3, "day").toDate(),
            customerId: contract.customerId,
            assigneeId: contract.staffId,
          },
        });

        return updatedContract;
      },
      {
        timeout: 20000, // Thêm cấu hình timeout ở đây
      },
    );

    revalidatePath("/dashboard/contracts");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Complete Contract Error:", error);
    return { success: false, error: error.message };
  }
}

// Cập nhật file hợp đồng
export async function uploadContractFileAction(
  contractId: string,
  fileUrl: string,
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Chưa đăng nhập");

    await db.contract.update({
      where: { id: contractId },
      data: { contractFile: fileUrl },
    });

    revalidatePath("/dashboard/contracts");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Không thể lưu file" };
  }
}
