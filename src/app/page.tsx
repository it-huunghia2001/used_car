"use client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { increment, decrement } from "@/store/slices/counterSlice";
import { useApiRequest } from "@/lib/hooks/useApiRequest";
import { KPIService } from "@/services/template-call-kpi";
import { useState } from "react";
import { useLazyApiRequest } from "@/lib/hooks/useLazyApiRequest";

export default function HomePage() {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  const {
    trigger: refetch, // Hàm để gọi lại API với tham số mới
    data: lazyData, // Dữ liệu trả về từ API tên biến là lazyData,
    loading: lazyLoading, // Trạng thái tải dữ liệu từ API
    error: lazyError, // Lỗi nếu có khi gọi API,
  } = useLazyApiRequest({
    requestFn: KPIService.deleteByDate,
  });

  const [month, setMonth] = useState("2025-06");

  const handleSearch = () => {
    refetch(month).catch(() => {});
  };

  const {
    data: kpiData,
    loading: loadingKPI,
    error: errorKPI,
    params: paramsKPI, // Tham số đã sử dụng để gọi API
  } = useApiRequest({
    requestFn: KPIService.deleteByDate,
    initialParams: "2025-06",
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-600">
        Welcome to Fullstack Next.js!
      </h1>
      <div className="mt-4">
        <p className="text-lg">Counter: {count}</p>
        <button
          onClick={() => dispatch(increment())}
          className="px-4 py-2 bg-green-500 text-white rounded mr-2"
        >
          +1
        </button>
        <button
          onClick={() => dispatch(decrement())}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          -1
        </button>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-semibold">Dữ liệu KPI tháng {paramsKPI}</h2>
        {loadingKPI && <p>Đang tải...</p>}
        {errorKPI && <p className="text-red-500">{errorKPI}</p>}
        {kpiData && (
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(kpiData, null, 2)}
          </pre>
        )}

        <button
          onClick={() => refetch("2025-07")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Tải lại tháng 07
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Tìm
          </button>
        </div>

        {lazyLoading && <p>Đang tải...</p>}
        {lazyError && <p className="text-red-500">{lazyError}</p>}
        {lazyData && (
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(lazyData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
