// src/actions/export-actions.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";

export async function getExportCustomerData() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const customers = await db.customer.findMany({
    where: {
      branchId:
        user.role !== "ADMIN" && !user.isGlobalManager
          ? user.branchId
          : undefined,
    },
    include: {
      assignedTo: { include: { department: true } },
      referrer: { include: { department: true } },
      inspectorRef: true,
      carModel: true,
      leadCar: { include: { carModel: true } },
      notSeenReasonRef: true,
      buyReasonRef: true,
      branch: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // ✅ XỬ LÝ LỖI DECIMAL TẠI ĐÂY
  // Chuyển đổi tất cả Decimal thành Number để Client Component có thể nhận được
  const serializedData = customers.map((customer) => ({
    ...customer,
    // Convert Decimal trong LeadCar (nếu có)
    leadCar: customer.leadCar
      ? {
          ...customer.leadCar,
          tSurePrice: customer.leadCar.tSurePrice
            ? Number(customer.leadCar.tSurePrice)
            : null,
          expectedPrice: customer.leadCar.expectedPrice
            ? Number(customer.leadCar.expectedPrice)
            : null,
          finalPrice: customer.leadCar.finalPrice
            ? Number(customer.leadCar.finalPrice)
            : null,
        }
      : null,
    // Convert Decimal trực tiếp trong Customer (nếu có trường budget/price là Decimal)
    // Nếu budget của bạn là String trong Prisma thì không cần
  }));

  return serializedData;
}
