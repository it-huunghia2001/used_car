/* eslint-disable @typescript-eslint/no-explicit-any */
// src/actions/export-actions.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import dayjs from "dayjs";

export async function getExportCustomerData(
  startDate?: Date,
  endDate?: Date,
  branchId?: string, // Thêm tham số branchId từ filter giao diện
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Thiết lập điều kiện lọc thời gian
  const whereClause: any = {};

  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: dayjs(startDate).startOf("day").toDate(),
      lte: dayjs(endDate).endOf("day").toDate(),
    };
  }

  // 2. Phân quyền và Lọc theo chi nhánh
  if (
    user.role !== "ADMIN" &&
    !user.isGlobalManager &&
    user.role !== "SALE_MANAGER"
  ) {
    // Nếu là Manager/Sale: Chỉ được xuất dữ liệu chi nhánh mình
    whereClause.branchId = user.branchId;
  } else if (branchId && branchId !== "ALL") {
    // Nếu là Admin/Global: Có thể chọn xuất 1 chi nhánh cụ thể hoặc tất cả
    whereClause.branchId = branchId;
  }

  const customers = await db.customer.findMany({
    where: whereClause,
    select: {
      licensePlate: true,
      phone: true,
      id: true,
      fullName: true,
      status: true,
      type: true,
      createdAt: true,
      province: true,
      urgencyLevel: true,
      inspectStatus: true,
      lastContactAt: true,
      nextContactAt: true,
      firstContactAt: true,
      contactCount: true,
      lastContactResult: true, // Lấy trực tiếp trường này nếu đã có trong DB
      contracts: { select: { id: true } }, // Đếm số hợp đồng đã ký
      nextContactNote: true, // Ghi chú cuộc hẹn tiếp theo
      address: true, // Thêm trường địa chỉ để phân tích tỉnh thành
      inspectorId: true, // Thêm trường inspectorId để phân tích tình trạng kiểm tra xe
      inspectorRef: { select: { fullName: true } }, // Lấy tên người kiểm tra xe
      inspectLocation: true, // Thêm trường địa điểm kiểm tra xe
      inspectDate: true, // Thêm trường ngày kiểm tra xe
      // Quan hệ dữ liệu
      branch: { select: { name: true } },
      assignedTo: { select: { fullName: true } },
      referrer: {
        select: {
          fullName: true,
          department: { select: { name: true } },
        },
      },
      carModel: { select: { name: true, grade: true } },
      leadCar: {
        select: {
          modelName: true,
          grade: true,
          year: true,
          odo: true,
          tSurePrice: true,
          expectedPrice: true,
          finalPrice: true,
        },
      },

      // Lấy ghi chú mới nhất để điền vào cột "Kết quả LH" trong Excel
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { note: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Chuyển đổi Decimal thành Number và Format lại dữ liệu cho Excel
  const serializedData = customers.map((customer) => ({
    ...customer,
    // Gán trực tiếp ghi chú mới nhất vào một trường dễ dùng cho Excel helper
    lastContactResult: customer.lastContactResult || "",
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
          odo: customer.leadCar.odo ? Number(customer.leadCar.odo) : null,
        }
      : null,
  }));

  return serializedData;
}
