/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Typography,
  Alert,
  Space,
  Button,
  Divider,
  Tabs,
  Timeline,
  Empty,
  Avatar,
  Badge,
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  InfoCircleFilled,
  QuestionCircleOutlined,
  UserOutlined,
  HistoryOutlined,
  FileTextOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "@/lib/dayjs";
import { getLeadStatusHelper } from "@/lib/status-helper";

const { Text } = Typography;

interface ModalApproveLoseProps {
  isOpen: boolean;
  onClose: () => void;
  selectedActivity: any;
  loading: boolean;
  onConfirm: (
    id: string,
    decision: "APPROVE" | "REJECT",
    targetStatus?: string,
  ) => void;
  history?: any[];
  historyLoading?: boolean;
}

export default function ModalApproveLose({
  isOpen,
  onClose,
  selectedActivity,
  loading,
  onConfirm,
  history = [],
  historyLoading = false,
}: ModalApproveLoseProps) {
  // --- GUARD CLAUSE ---
  if (!selectedActivity || selectedActivity.status !== "PENDING_LOSE_APPROVAL")
    return null;

  const rawNote = selectedActivity.note || "";

  // --- LOGIC BÓC TÁCH CHUỖI (REGEX) ---
  // 1. Tìm trạng thái sau chữ "ĐÍCH: " (Ví dụ: FROZEN, LOSE)
  const targetStatusMatch = rawNote.match(/ĐÍCH:\s*([A-Z_]+)/);
  const targetStatus = targetStatusMatch ? targetStatusMatch[1] : "LOSE";

  // 2. Tìm nội dung giải trình sau dấu "]: "
  const salesNote = rawNote.includes("]: ")
    ? rawNote.split("]: ").pop()?.trim()
    : rawNote;

  // Lấy cấu hình hiển thị (Màu sắc, Icon, Label) của trạng thái đích
  const { label, color, icon } = getLeadStatusHelper(targetStatus);

  // --- SUB-RENDERS ---

  // Tab 1: Nội dung yêu cầu
  const renderApprovalDetail = (
    <div className="py-2">
      <Alert
        title={
          <Space>
            <UserOutlined />
            <Text strong>
              Nhân viên đề xuất: {selectedActivity.user?.fullName}
            </Text>
          </Space>
        }
        description={
          <div className="text-xs">
            Yêu cầu được gửi lúc:{" "}
            {dayjs(selectedActivity.createdAt).format("HH:mm DD/MM/YYYY")}
            <br />
            Hệ thống sẽ chuyển khách hàng sang trạng thái <b>{label}</b> nếu bạn
            phê duyệt.
          </div>
        }
        type="warning"
        showIcon
        icon={<InfoCircleFilled />}
        className="mb-5 rounded-xl border-orange-100 bg-orange-50"
      />

      <Descriptions
        bordered
        column={1}
        size="small"
        labelStyle={{
          width: "160px",
          fontWeight: "bold",
          backgroundColor: "#f8fafc",
        }}
      >
        <Descriptions.Item label="Khách hàng">
          <Text strong className="text-blue-600">
            {selectedActivity.customer?.fullName}
          </Text>
          <div className="text-xs text-gray-400">
            {selectedActivity.customer?.phone}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Đề xuất chuyển">
          <Tag
            icon={icon}
            color={color}
            className="rounded-full px-3 font-medium uppercase text-[10px] py-1 m-0"
          >
            {label}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Lý do hệ thống">
          {selectedActivity.reason?.content || "Không xác định"}
        </Descriptions.Item>
      </Descriptions>

      <Divider titlePlacement="left" plain className="my-6!">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold text-slate-400"
        >
          Nội dung giải trình từ Sales
        </Text>
      </Divider>

      <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200 italic text-slate-700 shadow-inner min-h-[80px]">
        {salesNote || "Không có nội dung giải trình chi tiết."}
      </div>
    </div>
  );

  // Tab 2: Dòng thời gian tương tác (Bản nâng cấp dựa trên dữ liệu thật)
  const renderHistoryTimeline = (
    <div className="max-h-[500px] overflow-y-auto px-4 py-6 custom-scrollbar bg-slate-50/50 rounded-2xl">
      {historyLoading ? (
        <div className="py-20 text-center">
          <SyncOutlined spin className="text-3xl text-indigo-500 mb-2" />
          <div className="text-slate-400">Đang truy xuất lịch sử hồ sơ...</div>
        </div>
      ) : history.length > 0 ? (
        <Timeline
          mode="left"
          items={history.map((item) => {
            // Helper lấy cấu hình status của từng dòng lịch sử
            const statusCfg = getLeadStatusHelper(item.status);

            // Xác định màu sắc Timeline Dot
            let dotColor = "#3b82f6"; // Blue mặc định
            if (item.status === "PENDING_LOSE_APPROVAL") dotColor = "#f59e0b"; // Orange
            if (item.status === "LOSE" || item.status === "CANCELLED")
              dotColor = "#ef4444"; // Red
            if (item.status === "DEAL_DONE" || item.status === "FROZEN")
              dotColor = "#10b981"; // Green

            return {
              label: (
                <div className="flex flex-col items-end pr-2">
                  <Text strong className="text-[12px] text-slate-700">
                    {dayjs(item.createdAt).format("DD/MM")}
                  </Text>
                  <Text type="secondary" className="text-[10px] font-mono">
                    {dayjs(item.createdAt).format("HH:mm")}
                  </Text>
                </div>
              ),
              dot: (
                <div
                  style={{ background: dotColor }}
                  className="w-2 h-2 rounded-full ring-4 ring-white shadow-sm"
                />
              ),
              children: (
                <div className="mb-6 group">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag
                      color={statusCfg.color}
                      icon={statusCfg.icon}
                      className="text-[10px] font-bold gap-1 items-center m-0 flex! border-none px-2 rounded-md uppercase"
                    >
                      {statusCfg.label}
                    </Tag>
                    {item.isLate && (
                      <Badge
                        count="Trễ hạn"
                        style={{ backgroundColor: "#f5222d", fontSize: "10px" }}
                      />
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all group-hover:border-indigo-300 group-hover:shadow-md relative">
                    {/* Nội dung ghi chú */}
                    <div className="text-[13px] text-slate-700 leading-relaxed mb-3">
                      {item.note}
                    </div>

                    {/* Hiển thị Lý do nếu có (Dữ liệu từ JSON: item.reason.content) */}
                    {item.reason && (
                      <div className="mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-2">
                        <InfoCircleFilled className="text-indigo-400 mt-0.5" />
                        <div>
                          <Text className="text-[11px] font-bold text-indigo-600 block uppercase">
                            Lý do hệ thống:
                          </Text>
                          <Text className="text-xs text-indigo-800">
                            {item.reason.content}
                          </Text>
                        </div>
                      </div>
                    )}

                    {/* Thông tin nhân viên thực hiện */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                      <Space size={4}>
                        <Avatar
                          size={18}
                          icon={<UserOutlined />}
                          className="bg-slate-200 text-slate-500"
                        />
                        <Text className="text-[11px] font-semibold text-slate-500">
                          {item.user?.fullName}
                        </Text>
                        <Tag className="text-[9px] m-0 bg-slate-100 border-none text-slate-400 font-bold">
                          {item.user?.role}
                        </Tag>
                      </Space>
                    </div>
                  </div>
                </div>
              ),
            };
          })}
        />
      ) : (
        <Empty description="Không có lịch sử tương tác" className="py-20" />
      )}
    </div>
  );
  console.log("==================================");
  console.log(history);

  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined className="text-orange-500" />
          <span className="uppercase font-bold tracking-tight text-slate-700">
            Chi tiết phê duyệt & Lịch sử hồ sơ
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg"
        >
          Đóng
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseCircleFilled />}
          onClick={() => onConfirm(selectedActivity.id, "REJECT")}
          loading={loading}
          className="rounded-lg"
        >
          Từ chối (Yêu cầu chăm sóc tiếp)
        </Button>,
        <Button
          key="approve"
          type="primary"
          className="bg-emerald-600 border-none rounded-lg hover:bg-emerald-700"
          icon={<CheckCircleFilled />}
          onClick={() =>
            onConfirm(selectedActivity.id, "APPROVE", targetStatus)
          }
          loading={loading}
        >
          Đồng ý cho {label}
        </Button>,
      ]}
      width={700}
      centered
      destroyOnHidden
    >
      <Tabs
        defaultActiveKey="1"
        className="custom-tabs"
        items={[
          {
            key: "1",
            label: (
              <Space>
                <FileTextOutlined /> Chi tiết yêu cầu
              </Space>
            ),
            children: renderApprovalDetail,
          },
          {
            key: "2",
            label: (
              <Space>
                <HistoryOutlined /> Lịch sử chăm sóc
              </Space>
            ),
            children: renderHistoryTimeline,
          },
        ]}
      />
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </Modal>
  );
}
