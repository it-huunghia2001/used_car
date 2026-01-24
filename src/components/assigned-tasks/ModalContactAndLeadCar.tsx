/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Alert,
  Typography,
  Divider,
} from "antd";
import {
  MessageOutlined,
  CalendarOutlined,
  UserOutlined,
  BellOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface ModalContactProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  selectedLead: any;
}

export default function ModalContactAndLeadCar({
  isOpen,
  onClose,
  onFinish,
  loading,
  selectedLead,
}: ModalContactProps) {
  const [form] = Form.useForm();

  // Reset form mỗi khi mở modal để tránh lưu dữ liệu cũ
  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      form.setFieldsValue({
        nextContactAt: null,
      });
    }
  }, [isOpen, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onFinish(values);
    } catch (error) {
      console.error("Validate failed:", error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <MessageOutlined className="text-indigo-600" />
          <span className="font-bold">GHI NHẬN TƯƠNG TÁC & HẸN GIỜ</span>
        </Space>
      }
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Lưu nhật ký"
      cancelText="Hủy bỏ"
      centered
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        initialValues={{ nextContactAt: null }}
      >
        {/* Thông tin khách hàng tóm tắt */}
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <Space>
            <UserOutlined className="text-indigo-500" />
            <Text strong>{selectedLead?.fullName}</Text>
            <Divider type="vertical" />
            <Text type="secondary">{selectedLead?.phone}</Text>
          </Space>
        </div>

        {/* Nội dung tương tác */}
        <Form.Item
          name="note"
          label={<Text strong>Nội dung vừa trao đổi</Text>}
          rules={[
            { required: true, message: "Vui lòng nhập nội dung cuộc gọi" },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Khách đang cân nhắc giá, hẹn sáng mai gọi lại chốt cọc..."
          />
        </Form.Item>

        <Divider className="my-4" />

        {/* Phần hẹn giờ gọi lại */}
        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
          <div className="flex items-center gap-2 mb-3 text-indigo-600 font-medium">
            <BellOutlined />
            <span>Lên lịch hẹn gọi lại (Nếu có)</span>
          </div>

          <Form.Item name="nextContactAt" label="Thời gian hẹn">
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              className="w-full"
              placeholder="Chọn ngày và giờ"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            name="nextContactNote"
            label="Ghi chú nhắc hẹn"
            className="mb-0"
          >
            <Input placeholder="Cần chuẩn bị gì cho lần gọi tới?" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
