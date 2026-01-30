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
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  InfoCircleFilled,
  QuestionCircleOutlined,
  UserOutlined,
  HistoryOutlined,
  FileTextOutlined,
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

  // Tab 2: Dòng thời gian tương tác
  const renderHistoryTimeline = (
    <div className="max-h-[450px] overflow-y-auto px-2 py-4 custom-scrollbar">
      {historyLoading ? (
        <div className="py-10 text-center text-slate-400">
          Đang tải lịch sử...
        </div>
      ) : history.length > 0 ? (
        <Timeline
          mode="left"
          items={history.map((item) => ({
            label: (
              <Text type="secondary" className="text-[11px]">
                {dayjs(item.createdAt).format("DD/MM HH:mm")}
              </Text>
            ),
            color: item.status === "PENDING_LOSE_APPROVAL" ? "orange" : "blue",
            children: (
              <div className="mb-4">
                <Tag className="text-[10px] mb-1 rounded-md">{item.status}</Tag>
                <div className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  {item.note || "Cập nhật trạng thái"}
                </div>
                <div className="text-[10px] text-gray-400 mt-1 pl-1">
                  <UserOutlined className="mr-1" /> {item.user?.fullName}
                </div>
              </div>
            ),
          }))}
        />
      ) : (
        <Empty description="Không có lịch sử tương tác" className="py-10" />
      )}
    </div>
  );

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
