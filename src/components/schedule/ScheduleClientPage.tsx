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
  ConfigProvider,
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
import {
  getBranchSalesStaff,
  getMonthlySchedules,
  removeStaffFromSchedule,
  upsertSchedule,
} from "@/actions/schedule-service";

dayjs.locale("vi");

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
    const res = await upsertSchedule(
      selectedDate.toDate(),
      selectedBranchId,
      userId,
    );
    if (res.success) {
      message.success({ content: "Đã cập nhật lịch trực", duration: 2 });
      loadData();
    } else message.error(res.error);
  };

  const onDeleteStaff = async (id: string) => {
    const res = await removeStaffFromSchedule(id);
    if (res.success) {
      message.success({ content: "Đã gỡ nhân viên khỏi lịch", duration: 2 });
      loadData();
    }
  };

  // Custom hiển thị từng ô ngày
  const dateCellRender = (value: Dayjs) => {
    const dayData = schedules.filter((s) => dayjs(s.date).isSame(value, "day"));
    return (
      <div className="flex flex-col gap-1 mt-1 max-h-25 overflow-y-auto custom-scrollbar">
        {dayData.map((item) => (
          <Tooltip title={`Nhân viên: ${item.user.fullName}`} key={item.id}>
            <div className="group flex items-center justify-between bg-linear-to-r from-blue-50 to-indigo-50 p-1.5 rounded-md border border-blue-100 transition-all hover:shadow-md hover:scale-[1.02]">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Avatar size={16} className="bg-indigo-500 text-[8px] shrink-0">
                  {item.user.fullName?.charAt(0)}
                </Avatar>
                <Text className="text-[11px] font-medium truncate text-indigo-900">
                  {item.user.fullName}
                </Text>
              </div>
              <Popconfirm
                title="Gỡ lịch trực?"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  onDeleteStaff(item.id);
                }}
                okText="Gỡ"
                cancelText="Hủy"
              >
                <DeleteOutlined
                  className="text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer text-[10px] hover:text-red-600 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </div>
          </Tooltip>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 bg-[#f8fafc] min-h-screen">
      <Card
        className=" mx-auto shadow-2xl border-0 rounded-3xl overflow-hidden"
        style={{ padding: 0 }}
      >
        {/* Header Ribbon */}
        <div className="bg-white px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <Space direction="vertical" size={2}>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                <CalendarOutlined className="text-white text-2xl" />
              </div>
              <Title level={2} className="m-0! tracking-tight text-slate-800">
                Lịch Trực Sales
              </Title>
            </div>
            <Text className="text-slate-400 ml-14 flex items-center gap-2">
              <ClockCircleOutlined /> Hệ thống tự động chia khách theo danh sách
              trực hàng ngày
            </Text>
          </Space>

          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full md:w-auto">
            {isPrivileged ? (
              <Space className="w-full">
                <BankOutlined className="text-indigo-500 text-lg ml-2" />
                <Select
                  variant="borderless"
                  className="w-full md:w-64 font-semibold text-slate-700"
                  value={selectedBranchId}
                  onChange={setSelectedBranchId}
                  options={branches.map((b: any) => ({
                    label: b.name,
                    value: b.id,
                  }))}
                />
              </Space>
            ) : (
              <Tag
                color="indigo"
                className="m-0 border-0 px-4 py-1.5 text-sm rounded-xl font-bold flex items-center gap-2"
              >
                <BankOutlined />{" "}
                {branches.find((b: any) => b.id === selectedBranchId)?.name}
              </Tag>
            )}
          </div>
        </div>

        {/* Calendar Body */}
        <div className="p-4 md:p-8">
          <Calendar
            className="premium-calendar"
            cellRender={dateCellRender}
            onSelect={(d) => {
              setSelectedDate(d);
              setIsModalOpen(true);
            }}
          />
        </div>
      </Card>

      {/* Modern Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="bg-green-100 p-2 rounded-xl text-green-600">
              <UserAddOutlined />
            </div>
            <div>
              <div className="text-lg font-bold">Cấu hình lịch trực</div>
              <div className="text-xs text-slate-400 font-normal">
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
        className="premium-modal"
      >
        <div className="py-6">
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 block">
            Chọn nhân viên tiếp khách
          </label>
          <Select
            className="w-full custom-select"
            placeholder="Tìm kiếm theo tên nhân viên..."
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

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <Text strong className="text-slate-700">
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

            <div className="space-y-2 max-h-50 overflow-y-auto pr-2 custom-scrollbar">
              {schedules.filter((s) =>
                dayjs(s.date).isSame(selectedDate, "day"),
              ).length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có nhân viên trực"
                />
              ) : (
                schedules
                  .filter((s) => dayjs(s.date).isSame(selectedDate, "day"))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="bg-white text-indigo-600 border border-indigo-100">
                          {s.user.fullName?.charAt(0)}
                        </Avatar>
                        <Text className="font-semibold text-slate-700">
                          {s.user.fullName}
                        </Text>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDeleteStaff(s.id)}
                        className="hover:bg-red-50 rounded-lg"
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
          margin: 4px !important;
          border-radius: 12px !important;
          transition: all 0.3s !important;
        }
        .premium-calendar .ant-picker-calendar-date:hover {
          background: #fdfdff !important;
          border-top-color: #6366f1 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
        }
        .premium-calendar .ant-picker-cell-selected .ant-picker-calendar-date {
          background: #f5f7ff !important;
          border-top-color: #4f46e5 !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .premium-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 24px !important;
        }
        .custom-select .ant-select-selector {
          border-radius: 12px !important;
          border: 1px solid #e2e8f0 !important;
          background: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}
