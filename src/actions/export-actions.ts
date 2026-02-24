// src/actions/export-actions.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import dayjs from "dayjs";

export async function getExportCustomerData(startDate?: Date, endDate?: Date) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Thiết lập điều kiện lọc thời gian
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        gte: dayjs(startDate).startOf("day").toDate(),
        lte: dayjs(endDate).endOf("day").toDate(),
      },
    };
  }

  const customers = await db.customer.findMany({
    where: {
      ...dateFilter, // Áp dụng lọc ngày tiếp nhận
      branchId:
        user.role !== "ADMIN" &&
        !user.isGlobalManager &&
        user.role !== "SALE_MANAGER"
          ? user.branchId
          : undefined,
    },
    include: {
      assignedTo: { include: { department: true } },
      referrer: { include: { department: true } },
      inspectorRef: true,
      carModel: true,
      leadCar: true,
      notSeenReasonRef: true,
      sellReason: true,
      branch: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Chuyển đổi Decimal thành Number (giữ nguyên logic cũ của bạn)
  const serializedData = customers.map((customer) => ({
    ...customer,
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
  }));

  return serializedData;
}
