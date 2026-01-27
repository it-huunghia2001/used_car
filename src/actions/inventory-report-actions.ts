/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";

export async function getInventoryReportAction(type: "SOLD" | "PURCHASED") {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Unauthorized");

    const whereClause: any = {
      status:
        type === "SOLD"
          ? "SOLD"
          : { in: ["READY_FOR_SALE", "REFURBISHING", "BOOKED"] },
    };

    // Phân quyền
    if (auth.role === "SALES_STAFF" || auth.role === "PURCHASE_STAFF") {
      whereClause.purchaserId = auth.id;
    } else if (auth.role === "MANAGER" && !auth.isGlobalManager) {
      whereClause.branchId = auth.branchId;
    }

    const cars = await db.car.findMany({
      where: whereClause,
      include: {
        branch: true,
        purchaser: { select: { fullName: true } },
        ownerHistory: {
          orderBy: { date: "desc" },
          take: 1,
          include: { customer: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Chuẩn hóa dữ liệu để UI luôn thấy r.customer và r.price
    const formattedData = cars.map((car) => ({
      ...car,
      customer: car.ownerHistory[0]?.customer || null,
      price: type === "SOLD" ? car.sellingPrice : car.costPrice,
      transactionDate: car.ownerHistory[0]?.date || car.updatedAt,
      type: type === "SOLD" ? "SALE" : "PURCHASE",
    }));

    return { success: true, data: JSON.parse(JSON.stringify(formattedData)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getContractHistoryAction() {
  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("Unauthorized");

    let whereClause: any = {};
    if (auth.role === "MANAGER" && !auth.isGlobalManager) {
      whereClause.car = { branchId: auth.branchId };
    }

    const histories = await db.carOwnerHistory.findMany({
      where: whereClause,
      include: {
        car: {
          include: { branch: true, purchaser: { select: { fullName: true } } },
        },
        customer: true,
      },
      orderBy: { date: "desc" },
    });

    const formattedData = histories.map((h) => ({
      ...h,
      modelName: h.car?.modelName,
      stockCode: h.car?.stockCode,
      vin: h.car?.vin,
      branch: h.car?.branch,
      purchaser: h.car?.purchaser,
    }));

    return { success: true, data: JSON.parse(JSON.stringify(formattedData)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
