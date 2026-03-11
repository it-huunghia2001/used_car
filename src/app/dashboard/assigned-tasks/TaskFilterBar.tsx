/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input, Button, DatePicker, Select } from "antd";
import { SearchOutlined, CarOutlined, FilterOutlined } from "@ant-design/icons";

interface FilterProps {
  type: "TASKS" | "CUSTOMERS";
  filters: any;
  setFilters: (filters: any) => void;
  onSearch: () => void;
  loading?: boolean;
}

export const TaskFilterBar = ({
  type,
  filters,
  setFilters,
  onSearch,
  loading,
}: FilterProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-2xl mb-4">
      {/* Search chung cho cả 2 */}
      <div className="md:col-span-3">
        <span className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">
          Tìm kiếm
        </span>
        <Input
          placeholder="Tên hoặc SĐT..."
          prefix={<SearchOutlined className="text-blue-500" />}
          className="rounded-xl h-10 border-none shadow-sm"
          value={filters.searchText}
          onChange={(e) =>
            setFilters({ ...filters, searchText: e.target.value })
          }
        />
      </div>

      {/* Filter riêng cho CUSTOMERS: Biển số */}
      {type === "CUSTOMERS" && (
        <div className="md:col-span-3">
          <span className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">
            Biển số
          </span>
          <Input
            placeholder="30H-123.45"
            prefix={<CarOutlined />}
            className="rounded-xl h-10 border-none shadow-sm uppercase font-mono"
            value={filters.licensePlate}
            onChange={(e) =>
              setFilters({ ...filters, licensePlate: e.target.value })
            }
          />
        </div>
      )}

      {/* Filter riêng cho TASKS: Trạng thái xem xe */}
      {type === "TASKS" && (
        <div className="md:col-span-3">
          <span className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">
            Trạng thái GĐ
          </span>
          <Select
            className="w-full h-10"
            value={filters.inspectStatus}
            onChange={(val) => setFilters({ ...filters, inspectStatus: val })}
            options={[
              { label: "Tất cả", value: "ALL" },
              { label: "✅ Đã xem xe", value: "INSPECTED" },
              { label: "📅 Hẹn xem xe", value: "APPOINTED" },
            ]}
          />
        </div>
      )}

      <div className="md:col-span-3">
        <span className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">
          Ngày nhận
        </span>
        <DatePicker.RangePicker
          className="w-full h-10 rounded-xl border-none shadow-sm"
          format="DD/MM"
          onChange={(val) => setFilters({ ...filters, dateRange: val })}
        />
      </div>

      <div className="md:col-span-3 flex gap-2">
        <Button
          type="primary"
          icon={<FilterOutlined />}
          loading={loading}
          onClick={onSearch}
          className="flex-1 h-10 rounded-xl bg-slate-800 border-none font-bold"
        >
          LỌC
        </Button>
      </div>
    </div>
  );
};
