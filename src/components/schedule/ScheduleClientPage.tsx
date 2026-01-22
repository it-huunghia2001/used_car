/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Modal,
  Select,
  Card,
  message,
  Typography,
  Space,
  Tag,
  Popconfirm,
  Tooltip,
  Avatar,
  Empty,
  Button,
} from "antd";
import {
  CalendarOutlined,
  BankOutlined,
  DeleteOutlined,
  UserAddOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  getBranchSalesStaff,
  getMonthlySchedules,
  removeStaffFromSchedule,
  upsertSchedule,
} from "@/actions/schedule-service";

// Kích hoạt plugin
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const { Title, Text } = Typography;

export default function ScheduleClientPage({ currentUser, branches }: any) {
  const isPrivileged =
    currentUser.role === "ADMIN" || currentUser.isGlobalManager === true;
  const [selectedBranchId, setSelectedBranchId] = useState(
    isPrivileged ? branches[0]?.id : currentUser.branchId,
  );
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const [resSched, resStaff] = await Promise.all([
        getMonthlySchedules(selectedBranchId, selectedDate.toDate()),
        getBranchSalesStaff(selectedBranchId),
      ]);
      if (resSched.success) setSchedules(resSched.data);
      if (resStaff.success) setStaffList(resStaff.data);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onAddStaff = async (userId: string) => {
    const dateString = selectedDate.format("YYYY-MM-DD");
    const res = await upsertSchedule(
      dateString as any,
      selectedBranchId,
      userId,
    );
    if (res.success) {
      message.success({ content: "Đã cập nhật", duration: 2 });
      loadData();
    } else message.error(res.error);
  };

  const onDeleteStaff = async (id: string) => {
    const res = await removeStaffFromSchedule(id);
    if (res.success) {
      message.success({ content: "Đã gỡ", duration: 2 });
      loadData();
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const dayData = schedules.filter((s) => dayjs(s.date).isSame(value, "day"));
    return (
      <div className="flex flex-col gap-1 mt-1 max-h-20 sm:max-h-25 overflow-y-auto custom-scrollbar">
        {dayData.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between bg-indigo-50/50 p-1 sm:p-1.5 rounded border border-blue-100 transition-all hover:bg-blue-100"
          >
            <div className="flex items-center gap-1 overflow-hidden">
              <Avatar
                size={14}
                className="bg-indigo-500 text-[6px] sm:text-[8px] shrink-0 uppercase"
              >
                {item.user.fullName?.charAt(0)}
              </Avatar>
              <Text className="text-[9px] sm:text-[11px] font-medium truncate text-indigo-900">
                {item.user.fullName}
              </Text>
            </div>
            <Popconfirm
              title="Gỡ?"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDeleteStaff(item.id);
              }}
            >
              <DeleteOutlined className="text-red-400 hover:text-red-600 transition-opacity sm:opacity-0 group-hover:opacity-100 text-[10px] cursor-pointer" />
            </Popconfirm>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <Card
        className="mx-auto shadow-xl border-0 rounded-2xl sm:rounded-3xl overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        {/* Header Ribbon - Responsive Stack */}
        <div className="bg-white px-4 py-5 sm:px-8 sm:py-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <Space direction="vertical" size={0}>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100 shrink-0">
                <CalendarOutlined className="text-white text-xl sm:text-2xl" />
              </div>
              <Title
                level={3}
                className="m-0! tracking-tight text-slate-800 text-lg sm:text-2xl"
              >
                Lịch Trực Sales
              </Title>
            </div>
            <Text className="text-slate-400 text-xs sm:text-sm mt-1 flex items-center gap-2">
              <ClockCircleOutlined className="hidden sm:inline" />
              Tự động chia khách theo danh sách trực
            </Text>
          </Space>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 w-full lg:w-auto">
            {isPrivileged ? (
              <div className="flex items-center w-full">
                <BankOutlined className="text-indigo-500 text-base ml-2" />
                <Select
                  variant="borderless"
                  className="w-full! lg:w-64 font-semibold text-slate-700"
                  value={selectedBranchId}
                  onChange={setSelectedBranchId}
                  options={branches.map((b: any) => ({
                    label: b.name,
                    value: b.id,
                  }))}
                />
              </div>
            ) : (
              <Tag
                color="indigo"
                className="m-0 border-0 px-3 py-1 text-xs sm:text-sm rounded-lg font-bold flex items-center gap-2 w-full justify-center lg:justify-start"
              >
                <BankOutlined />{" "}
                {branches.find((b: any) => b.id === selectedBranchId)?.name}
              </Tag>
            )}
          </div>
        </div>

        {/* Calendar Body - Responsive Padding & Overflow */}
        <div className="p-2 sm:p-4 md:p-8 overflow-x-auto">
          <div className="min-w-175 lg:min-w-full">
            <Calendar
              className="premium-calendar"
              cellRender={dateCellRender}
              onSelect={(d) => {
                setSelectedDate(d);
                setIsModalOpen(true);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Responsive Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-green-100 p-2 rounded-lg text-green-600 shrink-0">
              <UserAddOutlined />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold">
                Cấu hình lịch trực
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-normal">
                Ngày {selectedDate.format("DD [tháng] MM, YYYY")}
              </div>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={450}
        style={{ padding: "0 10px" }} // Thêm padding cho mobile
        className="premium-modal"
      >
        <div className="py-4">
          <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">
            Chọn nhân viên tiếp khách
          </label>
          <Select
            className="w-full custom-select"
            placeholder="Tìm theo tên..."
            onChange={onAddStaff}
            value={null}
            showSearch
            size="large"
            optionFilterProp="label"
            suffixIcon={<TeamOutlined className="text-indigo-400" />}
          >
            {staffList.map((s) => (
              <Select.Option key={s.id} value={s.id} label={s.fullName}>
                <div className="flex items-center gap-3">
                  <Avatar
                    size="small"
                    className="bg-slate-200 text-slate-600 text-[10px]"
                  >
                    {s.fullName?.charAt(0)}
                  </Avatar>
                  <span className="font-medium text-slate-700">
                    {s.fullName}
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <Text
                strong
                className="text-slate-700 text-xs sm:text-sm uppercase tracking-wide"
              >
                Đang trực hôm nay
              </Text>
              <Tag className="rounded-full border-0 bg-indigo-50 text-indigo-600 font-bold">
                {
                  schedules.filter((s) =>
                    dayjs(s.date).isSame(selectedDate, "day"),
                  ).length
                }{" "}
                người
              </Tag>
            </div>

            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {schedules.filter((s) =>
                dayjs(s.date).isSame(selectedDate, "day"),
              ).length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-xs text-slate-400">
                      Chưa có ai trực
                    </span>
                  }
                />
              ) : (
                schedules
                  .filter((s) => dayjs(s.date).isSame(selectedDate, "day"))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                        <Avatar className="bg-white text-indigo-600 border border-indigo-100 shrink-0">
                          {s.user.fullName?.charAt(0)}
                        </Avatar>
                        <Text className="font-semibold text-slate-700 truncate text-xs sm:text-sm">
                          {s.user.fullName}
                        </Text>
                      </div>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => onDeleteStaff(s.id)}
                      />
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .premium-calendar .ant-picker-calendar-date {
          border-top: 2px solid #f1f5f9 !important;
          margin: 2px !important;
          border-radius: 8px !important;
          padding: 4px !important;
        }
        @media (min-width: 640px) {
          .premium-calendar .ant-picker-calendar-date {
            margin: 4px !important;
            border-radius: 12px !important;
          }
        }
        .premium-calendar .ant-picker-calendar-date-value {
          font-weight: bold;
          font-size: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .premium-modal .ant-modal-content {
          border-radius: 20px !important;
          padding: 16px !important;
        }
        @media (min-width: 640px) {
          .premium-modal .ant-modal-content {
            border-radius: 28px !important;
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
