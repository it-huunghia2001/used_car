/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Modal, Form, Select, Input, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { LeadStatus } from "@prisma/client";

const { Text } = Typography;

interface ModalLoseLeadProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  selectedLead: any;
  reasons: any[];
  onStatusChange: (status: LeadStatus) => void; // Để load lại lý do khi đổi LOSE/FROZEN
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

  return (
    <Modal
      open={isOpen}
      onOk={() => form.submit()}
      onCancel={onClose}
      confirmLoading={loading}
      okButtonProps={{ danger: true }}
      okText="Xác nhận dừng"
      title="Dừng xử lý khách hàng"
      centered
      destroyOnClose
      width={450}
    >
      <div className="text-center mb-6 pt-4">
        <ExclamationCircleOutlined className="text-red-500 text-5xl mb-3" />
        <div>
          <Text strong className="text-lg block">
            Dừng chăm sóc: {selectedLead?.fullName}
          </Text>
          <Text type="secondary">
            Hành động này sẽ gửi yêu cầu lưu trữ hồ sơ và cần cấp trên phê
            duyệt.
          </Text>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ status: "LOSE" }}
      >
        <Form.Item name="status" label="Phân loại trạng thái">
          <Select
            onChange={onStatusChange}
            options={[
              { label: "Thất bại (Lose)", value: "LOSE" },
              { label: "Tạm dừng (Frozen)", value: "FROZEN" },
              { label: "Chưa xem xe được", value: "PENDING_VIEW" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="reasonId"
          label="Lý do chi tiết"
          rules={[{ required: true, message: "Vui lòng chọn lý do" }]}
        >
          <Select
            placeholder="Chọn lý do cụ thể..."
            options={reasons.map((r) => ({ label: r.content, value: r.id }))}
          />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú thêm">
          <Input.TextArea
            rows={3}
            placeholder="Nhập thêm chi tiết nếu cần..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
