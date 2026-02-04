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

  const contracts = await db.contract.findMany({
    include: {
      customer: { select: { fullName: true, phone: true } },
      car: {
        select: {
          modelName: true,
          stockCode: true,
          licensePlate: true,
          costPrice: true, // Thêm vào để tránh undefined khi serialize
          sellingPrice: true,
        },
      },
      staff: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return contracts.map(serializeContract);
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

// Lấy chi tiết hợp đồng đầy đủ
export async function getContractDetailAction(id: string) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("Chưa đăng nhập");

  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      customer: true,
      car: { include: { branch: true } },
      staff: { select: { fullName: true, phone: true, email: true } },
    },
  });

  return serializeContract(contract);
}
