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
  // Bổ sung thêm props để nhận dữ liệu lịch sử từ Page cha
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
  if (!selectedActivity || selectedActivity.status !== "PENDING_LOSE_APPROVAL")
    return null;

  const rawNote = selectedActivity.note || "";
  const parts = rawNote.split("]: ");
  const targetStatus =
    parts.length > 1 ? parts[parts.length - 1].trim() : "LOSE";

  let salesNote = "";
  const matchNote = rawNote.match(/MỤC TIÊU: ([\s\S]*?)\]:/);
  if (matchNote && matchNote[1]) {
    salesNote = matchNote[1].replace(/\\n/g, "").trim();
  } else {
    salesNote = rawNote;
  }

  const { label, color, icon } = getLeadStatusHelper(targetStatus);
  // Nội dung Tab 1: Chi tiết phê duyệt
  const renderApprovalDetail = (
    <>
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
            Hệ thống sẽ cập nhật trạng thái khách hàng sang{" "}
            <b>{targetStatus}</b> nếu được duyệt.
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
        <Descriptions.Item label="Đề xuất sang">
          <Tag
            icon={icon}
            color={color}
            className="rounded-full px-3 font-medium uppercase text-[10px] flex! gap-2 py-2 w-fit"
          >
            {label}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Lý do hệ thống">
          {selectedActivity.reason?.content ||
            `Mã: ${selectedActivity.reasonId}`}
        </Descriptions.Item>
      </Descriptions>

      <Divider titlePlacement="left" plain className="my-6!">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold text-slate-400"
        >
          Giải trình từ Sales
        </Text>
      </Divider>

      <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200 italic text-slate-700 shadow-inner">
        {salesNote || "Không có nội dung giải trình chi tiết."}
      </div>
    </>
  );

  // Nội dung Tab 2: Lịch sử chăm sóc
  const renderHistoryTimeline = (
    <div className="max-h-[450px] overflow-y-auto px-2 py-4">
      {history.length > 0 ? (
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
                <Tag className="text-[10px] mb-1">{item.status}</Tag>
                <div className="text-sm text-slate-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {item.note || "Cập nhật trạng thái"}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  <UserOutlined className="mr-1" /> {item.user?.fullName}
                </div>
              </div>
            ),
          }))}
        />
      ) : (
        <Empty description="Không có lịch sử tương tác" />
      )}
    </div>
  );

  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined className="text-orange-500" />
          <span className="uppercase font-bold tracking-tight text-slate-700">
            Phê duyệt & Lịch sử hồ sơ
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
          Hủy bỏ
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseCircleFilled />}
          onClick={() => onConfirm(selectedActivity.id, "REJECT")}
          loading={loading}
          className="rounded-lg"
        >
          Từ chối
        </Button>,
        <Button
          key="approve"
          type="primary"
          className="bg-green-600 border-none rounded-lg"
          icon={<CheckCircleFilled />}
          onClick={() =>
            onConfirm(selectedActivity.id, "APPROVE", targetStatus)
          }
          loading={loading}
        >
          Đồng ý cho {targetStatus}
        </Button>,
      ]}
      width={650}
      centered
      destroyOnHidden
    >
      <Tabs
        defaultActiveKey="1"
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
    </Modal>
  );
}
