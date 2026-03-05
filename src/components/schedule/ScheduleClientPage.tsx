/* eslint-disable react/jsx-key */
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
  Avatar,
  Empty,
  Button,
  Badge,
  Spin,
  DatePicker,
} from "antd";
import {
  CalendarOutlined,
  BankOutlined,
  DeleteOutlined,
  UserAddOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import {
  getBranchSalesStaff,
  getMonthlySchedules,
  removeStaffFromSchedule,
  upsertSchedule,
} from "@/actions/schedule-service";
import dayjs from "@/lib/dayjs";
import { Dayjs } from "dayjs";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      // Chuẩn hóa ngày đầu tháng theo giờ VN
      const startOfMonth = selectedDate.startOf("month").toDate();

      const [resSched, resStaff] = await Promise.all([
        getMonthlySchedules(selectedBranchId, startOfMonth),
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
    if (!isPrivileged) return;
    setActionLoading("adding");

    try {
      // Ép ngày về 00:00:00 theo múi giờ VN để Server không bị lệch 7 tiếng
      const vnDate = selectedDate.startOf("day").toDate();

      const res = await upsertSchedule(
        vnDate as any, // Truyền trực tiếp Object Date đã chuẩn hóa
        selectedBranchId,
        userId,
      );

      if (res.success) {
        message.success("Đã cập nhật lịch trực");
        loadData();
      } else {
        message.error(res.error);
      }
    } catch (error) {
      message.error("Lỗi kết nối hệ thống");
    } finally {
      setActionLoading(null);
    }
  };

  const onDeleteStaff = async (id: string) => {
    if (!isPrivileged) return; // Chặn thực thi
    setActionLoading(id);
    try {
      const res = await removeStaffFromSchedule(id);
      if (res.success) {
        message.success("Đã gỡ nhân viên");
        loadData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Render cho máy tính (Lưới lịch)
  const dateCellRender = (value: Dayjs) => {
    // So sánh chỉ ngày/tháng/năm, bỏ qua giờ phút giây
    const dayData = schedules.filter((s) =>
      dayjs(s.date).tz("Asia/Ho_Chi_Minh").isSame(value, "day"),
    );

    return (
      <div className="flex flex-col gap-1 mt-1 overflow-hidden">
        {dayData.slice(0, 2).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-1 bg-indigo-50 px-1 py-0.5 rounded text-[10px] truncate shadow-sm"
          >
            <Badge status="processing" color="#4f46e5" />
            <span className="truncate text-indigo-700 font-medium">
              {item.user.fullName}
            </span>
          </div>
        ))}
        {dayData.length > 2 && (
          <Text className="text-[9px] text-slate-400 font-bold ml-1">
            +{dayData.length - 2} người
          </Text>
        )}
      </div>
    );
  };
  // Render cho điện thoại (Danh sách Card)
  const renderMobileListView = () => {
    const daysInMonth = selectedDate.daysInMonth();
    const items = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = selectedDate.date(i);
      const dayData = schedules.filter((s) =>
        dayjs(s.date).isSame(date, "day"),
      );
      const isToday = dayjs().isSame(date, "day");

      items.push(
        <div
          key={i}
          onClick={() => {
            setSelectedDate(date);
            setIsModalOpen(true);
          }}
          className={`p-4 rounded-2xl mb-3 border transition-all active:scale-95 ${isToday ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white border-slate-100 shadow-sm"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`text-center min-w-[40px] ${isToday ? "text-white" : "text-slate-800"}`}
              >
                <div className="text-[10px] uppercase font-bold opacity-70">
                  {date.format("ddd")}
                </div>
                <div className="text-lg font-black">{i}</div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 opacity-50 mx-1"></div>
              <div className="flex -space-x-2 overflow-hidden">
                {dayData.length > 0 ? (
                  dayData.map((s) => (
                    <div>
                      <Avatar
                        key={s.id}
                        size="small"
                        className="border-2 border-white bg-slate-200 text-slate-700 text-[10px] font-bold mr-1"
                      >
                        {s.user.fullName?.charAt(0)}
                      </Avatar>
                      <Text
                        className={`text-[9px]! font-medium ${isToday ? "text-white" : "text-slate-800"}`}
                      >
                        {s.user.fullName}
                      </Text>
                    </div>
                  ))
                ) : (
                  <Text
                    className={`text-xs ${isToday ? "text-indigo-100" : "text-slate-400"}`}
                  >
                    Chưa có lịch trực
                  </Text>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dayData.length > 0 && (
                <Tag
                  color={isToday ? "blue" : "default"}
                  className="m-0 rounded-full border-0 font-bold px-3"
                >
                  {dayData.length} Sales
                </Tag>
              )}
              {isPrivileged ? (
                <PlusOutlined
                  className={isToday ? "text-white" : "text-slate-300"}
                />
              ) : (
                <RightOutlined
                  className={isToday ? "text-white" : "text-slate-300"}
                />
              )}
            </div>
          </div>
        </div>,
      );
    }
    return <div className="md:hidden mt-4">{items}</div>;
  };

  return (
    <div className="p-3 sm:p-6 lg:p-10 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Ribbon */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-100 shadow-lg shrink-0">
              <CalendarOutlined className="text-white text-2xl" />
            </div>
            <div>
              <Title level={4} className="m-0! font-extrabold text-slate-800">
                Lịch Trực Sales
              </Title>
              <Text className="text-slate-400 text-xs sm:text-sm">
                Phân bổ khách hàng tự động
              </Text>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <DatePicker
              picker="month"
              format="MMMM-YYYY"
              value={selectedDate}
              onChange={(d) => d && setSelectedDate(d)}
              allowClear={false}
              className="w-full sm:w-48 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold text-indigo-600"
            />

            {isPrivileged && (
              <Select
                className="w-full sm:w-64 h-12 custom-select"
                value={selectedBranchId}
                onChange={setSelectedBranchId}
                suffixIcon={<BankOutlined className="text-indigo-500" />}
                options={branches.map((b: any) => ({
                  label: b.name,
                  value: b.id,
                }))}
              />
            )}
          </div>
        </div>

        {/* Desktop View */}
        <Card
          className="hidden md:block shadow-xl border-0 rounded-3xl overflow-hidden p-2"
          styles={{ body: { padding: 0 } }}
        >
          <Spin spinning={loading}>
            <Calendar
              className="premium-calendar"
              value={selectedDate}
              cellRender={dateCellRender}
              headerRender={() => null} // Đã có bộ lọc ở trên
              onSelect={(d, info) => {
                if (info.source === "date") {
                  setSelectedDate(d);
                  setIsModalOpen(true);
                }
              }}
            />
          </Spin>
        </Card>

        {/* Mobile View */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <Text
              strong
              className="text-slate-500 uppercase tracking-widest text-[10px]"
            >
              Danh sách ngày trực
            </Text>
            <Badge
              count={schedules.length}
              overflowCount={999}
              style={{ backgroundColor: "#4f46e5" }}
            />
          </div>
          <Spin spinning={loading}>{renderMobileListView()}</Spin>
        </div>
      </div>

      {/* Modal Cấu hình */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={480}
        closeIcon={null}
        className="premium-modal"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <Text className="text-indigo-600 font-bold uppercase tracking-tighter text-xs">
                {selectedDate.format("dddd")}
              </Text>
              <Title level={3} className="m-0!">
                Ngày {selectedDate.format("DD/MM")}
              </Title>
            </div>
            <Button
              shape="circle"
              icon={<PlusOutlined />}
              className="bg-slate-50 border-none"
              onClick={() => setIsModalOpen(false)}
            />
          </div>

          {/* Thay thế đoạn label và Select thêm nhân viên */}
          {isPrivileged && (
            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase mb-2 block">
                Thêm nhân viên trực
              </label>
              <Select
                className="w-full h-12 rounded-xl"
                placeholder="Tìm tên nhân viên..."
                onChange={onAddStaff}
                value={null}
                showSearch
                loading={actionLoading === "adding"}
              >
                {staffList.map((s) => (
                  <Select.Option key={s.id} value={s.id} label={s.fullName}>
                    <Space>
                      <Avatar size="small">{s.fullName?.charAt(0)}</Avatar>
                      {s.fullName}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
            <Text
              strong
              className="text-slate-600 text-xs uppercase tracking-wide"
            >
              Đang trực (
              {
                schedules.filter((s) =>
                  dayjs(s.date).isSame(selectedDate, "day"),
                ).length
              }
              )
            </Text>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {schedules
                .filter((s) => dayjs(s.date).isSame(selectedDate, "day"))
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <Space>
                      <Avatar className="bg-indigo-50 text-indigo-600 font-bold">
                        {s.user.fullName?.charAt(0)}
                      </Avatar>
                      <Text className="font-bold">{s.user.fullName}</Text>
                    </Space>
                    {isPrivileged && (
                      <Popconfirm
                        title="Gỡ lịch trực?"
                        onConfirm={() => onDeleteStaff(s.id)}
                        okButtonProps={{ loading: actionLoading === s.id }}
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </div>
                ))}
              {schedules.filter((s) =>
                dayjs(s.date).isSame(selectedDate, "day"),
              ).length === 0 && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Trống"
                />
              )}
            </div>
          </div>
          <Button
            block
            h-12
            className="bg-slate-900 text-white rounded-2xl h-12 font-bold"
            onClick={() => setIsModalOpen(false)}
          >
            Đóng
          </Button>
        </div>
      </Modal>

      <style jsx global>{`
        .premium-calendar .ant-picker-calendar-date {
          border-top: 2px solid #f1f5f9 !important;
          margin: 4px !important;
          border-radius: 12px !important;
        }
        .premium-calendar .ant-picker-cell-selected .ant-picker-calendar-date {
          background: #eef2ff !important;
          border-top-color: #4f46e5 !important;
        }
        .premium-modal .ant-modal-content {
          border-radius: 32px !important;
          padding: 28px !important;
        }
        .custom-select .ant-select-selector {
          border-radius: 16px !important;
          background: #f8fafc !important;
          border: 1px solid #f1f5f9 !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
