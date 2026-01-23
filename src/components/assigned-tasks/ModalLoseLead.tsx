/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import { Modal, Form, Select, Input, Typography, Divider, Space } from "antd";
import {
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { LeadStatus } from "@prisma/client";

const { Text } = Typography;

interface ModalLoseLeadProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  selectedLead: any;
  reasons: any[];
  onStatusChange: (status: LeadStatus) => void;
}

export default function ModalLoseLead({
  isOpen,
  onClose,
  onFinish,
  loading,
  selectedLead,
  reasons,
  onStatusChange,
}: ModalLoseLeadProps) {
  const [form] = Form.useForm();

  // Tự động load lý do mặc định khi mở Modal
  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({ status: "LOSE" });
      onStatusChange("LOSE" as LeadStatus);
    } else {
      form.resetFields();
    }
  }, [isOpen, form, onStatusChange]);

  return (
    <Modal
      open={isOpen}
      onOk={() => form.submit()}
      onCancel={onClose}
      confirmLoading={loading}
      okButtonProps={{ danger: true, className: "rounded-lg" }}
      cancelButtonProps={{ className: "rounded-lg" }}
      okText="Gửi yêu cầu phê duyệt"
      title={
        <Space>
          <ExclamationCircleOutlined className="text-red-500" />
          <span>Dừng xử lý khách hàng</span>
        </Space>
      }
      centered
      width={480}
    >
      <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 mt-2">
        <div className="flex gap-3">
          <InfoCircleOutlined className="text-red-500 mt-1" />
          <div>
            <Text strong className="text-red-800 block">
              Yêu cầu lưu trữ: {selectedLead?.fullName}
            </Text>
            <Text className="text-red-600 text-xs">
              Hồ sơ sẽ chuyển sang trạng thái <b>Chờ phê duyệt</b>. Bạn sẽ tạm
              thời không thể thao tác cho đến khi Quản lý phản hồi.
            </Text>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item
          name="status"
          label={<Text strong>Bạn muốn chuyển khách vào mục:</Text>}
        >
          <Select
            size="large"
            onChange={onStatusChange}
            className="w-full"
            options={[
              {
                label: "🔴 Thất bại (Lose) - Khách không mua nữa",
                value: "LOSE",
              },
              {
                label: "🟣 Đóng băng (Frozen) - Tạm dừng chăm sóc",
                value: "FROZEN",
              },
              {
                label: "🟡 Chờ xem xe (Pending View) - Chưa gặp được",
                value: "PENDING_VIEW",
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="reasonId"
          label={<Text strong>Lý do chi tiết:</Text>}
          rules={[{ required: true, message: "Vui lòng chọn lý do cụ thể" }]}
        >
          <Select
            size="large"
            placeholder="Chọn lý do từ danh sách..."
            options={reasons.map((r) => ({ label: r.content, value: r.id }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Divider className="my-4" />

        <Form.Item
          name="note"
          label={<Text strong>Giải trình thêm cho Quản lý:</Text>}
        >
          <Input.TextArea
            rows={4}
            placeholder="Nhập ghi chú chi tiết về tình trạng khách hàng để Quản lý dễ dàng phê duyệt..."
            className="rounded-lg"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
