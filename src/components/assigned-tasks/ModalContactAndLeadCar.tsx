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
  Typography,
  Divider,
  message,
} from "antd";
import { MessageOutlined, UserOutlined, BellOutlined } from "@ant-design/icons";
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

  // Reset form khi đóng/mở
  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // CHUẨN HÓA DỮ LIỆU TRƯỚC KHI GỬI (Quan trọng để tránh lỗi Server Action)
      const payload = {
        ...values,
        // Nếu có chọn ngày hẹn, convert sang ISO String, nếu không thì để null
        nextContactAt: values.nextContactAt
          ? values.nextContactAt.toISOString()
          : null,
        // Đảm bảo các field khác không bị undefined
        note: values.note || "",
        nextContactNote: values.nextContactNote || "",
      };

      onFinish(payload);
    } catch (error) {
      console.error("Validate failed:", error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <div className="p-2 bg-indigo-100 rounded-lg">
            <MessageOutlined className="text-indigo-600 flex" />
          </div>
          <span className="font-bold text-slate-700">GHI NHẬN TƯƠNG TÁC</span>
        </Space>
      }
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Lưu nhật ký"
      cancelText="Hủy bỏ"
      okButtonProps={{ className: "bg-indigo-600" }}
      centered
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        initialValues={{ nextContactAt: null }}
      >
        {/* Box thông tin khách hàng nhanh */}
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
          <Space>
            <UserOutlined className="text-slate-400" />
            <div>
              <div className="text-[12px] text-slate-400 uppercase font-bold tracking-wider">
                Khách hàng
              </div>
              <Text strong className="text-indigo-900">
                {selectedLead?.customer?.fullName || "Chưa có tên"}
              </Text>
            </div>
          </Space>
          <div className="text-right">
            <div className="text-[12px] text-slate-400 uppercase font-bold tracking-wider">
              Số điện thoại
            </div>
            <Text className="text-slate-600">
              {selectedLead?.customer?.phone || "---"}
            </Text>
          </div>
        </div>

        {/* Nội dung tương tác */}
        <Form.Item
          name="note"
          label={
            <span className="font-bold text-slate-700">
              Nội dung cuộc trao đổi
            </span>
          }
          rules={[
            {
              required: true,
              message: "Vui lòng nhập nội dung đã trao đổi với khách",
            },
            { min: 5, message: "Nội dung quá ngắn" },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Khách quan tâm dòng xe nào? Tình trạng tài chính? Hẹn khi nào xem xe?..."
            className="rounded-lg"
          />
        </Form.Item>

        <Divider className="my-6">
          <Text
            type="secondary"
            className="text-[12px] uppercase font-bold px-2"
          >
            Nhắc hẹn gọi lại
          </Text>
        </Divider>

        {/* Phần hẹn giờ gọi lại */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-dashed border-amber-200">
          <div className="flex items-center gap-2 mb-4 text-amber-700 font-bold">
            <BellOutlined />
            <span>Lên lịch chăm sóc tiếp theo</span>
          </div>

          <Form.Item
            name="nextContactAt"
            label="Thời gian hẹn gọi lại"
            extra="Hệ thống sẽ thông báo cho bạn vào thời gian này"
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              className="w-full h-10 rounded-lg"
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
            <Input
              placeholder="Cần chuẩn bị tài liệu gì? Báo giá xe nào?..."
              className="h-10 rounded-lg"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
