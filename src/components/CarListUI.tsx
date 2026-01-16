/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function CarListUI({
  initialCars,
  user,
}: {
  initialCars: any[];
  user: any;
}) {
  const [filterBranch, setFilterBranch] = useState("all");

  // Lọc dữ liệu tại Client dựa trên lựa chọn của Quản lý tổng
  const filteredCars = initialCars.filter((car) => {
    if (filterBranch === "all") return true;
    return car.branchId === filterBranch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase">Kho xe hệ thống</h1>
          <p className="text-gray-500 text-sm">
            {user.isGlobalManager
              ? "Chế độ: Quản lý hệ thống (Toàn quyền)"
              : `Chi nhánh: ${user.branch?.name || "N/A"}`}
          </p>
        </div>

        {/* Chỉ hiện nút lọc nếu là Quản lý tổng */}
        {user.isGlobalManager && (
          <div className="inline-flex p-1 bg-gray-100 rounded-lg border">
            <button
              onClick={() => setFilterBranch("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterBranch === "all"
                  ? "bg-white shadow text-red-600"
                  : "text-gray-600"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterBranch("TBD_ID")} // Thay bằng ID thực tế của chi nhánh
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterBranch === "TBD_ID"
                  ? "bg-white shadow text-red-600"
                  : "text-gray-600"
              }`}
            >
              Bình Dương
            </button>
            <button
              onClick={() => setFilterBranch("TMP_ID")} // Thay bằng ID thực tế của chi nhánh
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterBranch === "TMP_ID"
                  ? "bg-white shadow text-red-600"
                  : "text-gray-600"
              }`}
            >
              Mỹ Phước
            </button>
          </div>
        )}
      </div>

      {/* GRID DANH SÁCH XE */}
      {filteredCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCars.map((car) => (
            <div
              key={car.id}
              className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition"
            >
              {/* UI Card Xe như đã thiết kế ở trên */}
              <div className="p-4">
                <div className="text-xs font-bold text-blue-600 mb-1">
                  {car.branch?.name}
                </div>
                <h3 className="font-bold uppercase truncate">
                  {car.modelName}
                </h3>
                <div className="text-red-600 font-bold mt-2">
                  {new Intl.NumberFormat("vi-VN").format(car.sellingPrice)} VNĐ
                </div>
                <div className="flex justify-between mt-4 text-[11px] text-gray-400">
                  <span>ODO: {car.odo}km</span>
                  <span>Năm: {car.year}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500 italic border-2 border-dashed rounded-xl">
          Không có xe nào trong danh mục này.
        </div>
      )}
    </div>
  );
}
