/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Modal,
  Button,
  Space,
  Avatar,
  Typography,
  Popconfirm,
  Empty,
  Badge,
} from "antd";
import {
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface ApprovalModalProps {
  isOpen: boolean;
  onCancel: () => void;
  pendingUsers: any[];
  onProcess: (userId: string, status: "APPROVED" | "REJECTED") => void;
  loading: boolean;
}

export default function ApprovalModal({
  isOpen,
  onCancel,
  pendingUsers,
  onProcess,
  loading,
}: ApprovalModalProps) {
  return (
    <Modal
      title={
        <Space>
          <div className="bg-orange-500 p-2 rounded-lg flex items-center justify-center">
            <CheckCircleOutlined className="text-white" />
          </div>
          <Title level={4} className="!m-0 font-bold uppercase tracking-tight">
            Phê duyệt tài khoản mới
          </Title>
          <Badge count={pendingUsers.length} color="#f59e0b" />
        </Space>
      }
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      width={750}
      centered
      className="approval-modal"
    >
      <div className="py-2 max-h-[65vh] overflow-y-auto custom-scrollbar">
        {pendingUsers.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text className="text-slate-400">
                Hiện tại không có yêu cầu nào cần xử lý
              </Text>
            }
            className="py-10"
          />
        ) : (
          pendingUsers.map((user) => (
            <div
              key={user.id}
              className="group p-5 mb-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex justify-between items-center"
            >
              <Space size="middle">
                <Avatar
                  size={54}
                  className="bg-orange-100 text-orange-600 border-2 border-white shadow-sm"
                  icon={<UserOutlined />}
                />
                <div className="flex flex-col">
                  <Text
                    strong
                    className="text-base text-slate-800 leading-tight"
                  >
                    {user.fullName}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                    {user.username} • {user.branch?.name || "Chi nhánh mới"}
                  </Text>
                  <Text className="text-[11px] text-blue-500 font-semibold italic mt-0.5">
                    Đăng ký lúc:{" "}
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </Text>
                </div>
              </Space>

              <Space size="small">
                <Popconfirm
                  title="Từ chối yêu cầu này?"
                  description="Tài khoản này sẽ không thể đăng nhập hệ thống."
                  onConfirm={() => onProcess(user.id, "REJECTED")}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    className="hover:bg-red-50 rounded-xl px-4 font-bold"
                  >
                    Từ chối
                  </Button>
                </Popconfirm>

                <Button
                  type="primary"
                  loading={loading}
                  icon={<CheckOutlined />}
                  className="bg-green-600 hover:bg-green-700 border-none rounded-xl px-6 font-bold shadow-lg shadow-green-100 h-10"
                  onClick={() => onProcess(user.id, "APPROVED")}
                >
                  PHÊ DUYỆT
                </Button>
              </Space>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
