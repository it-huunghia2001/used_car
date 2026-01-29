/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Modal,
  Descriptions,
  Typography,
  Divider,
  Button,
  Alert,
  Form,
  Input,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedActivity: any;
  loading: boolean;
  onApprove: (data: any) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export default function ModalApprovalSalesDetail({
  isOpen,
  onClose,
  selectedActivity,
  loading,
  onApprove,
  onReject,
}: Props) {
  const [form] = Form.useForm();

  if (!selectedActivity) return null;

  const { customer, note } = selectedActivity;
  const leadCar = customer?.leadCar;

  // Xử lý khi bấm nút Phê duyệt
  const handleApprove = async () => {
    try {
      const values = await form.validateFields();
      await onApprove({
        ...values, // Gửi contractNo và adminNote
        isReject: false,
      });
    } catch (error) {
      console.log("Validation failed:", error);
    }
  };

  // Xử lý khi bấm nút Từ chối
  const handleReject = async () => {
    const adminNote = form.getFieldValue("adminNote");
    if (!adminNote) {
      form.setFields([
        {
          name: "adminNote",
          errors: ["Vui lòng nhập lý do từ chối vào ô Ghi chú"],
        },
      ]);
      return;
    }
    await onReject(adminNote);
  };

  return (
    <Modal
      title={
        <Title level={4} className="m-0!">
          <CheckCircleOutlined className="text-cyan-600 mr-2" />
          PHÊ DUYỆT CHỐT BÁN XE
        </Title>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseCircleOutlined />}
          onClick={handleReject}
        >
          Từ chối
        </Button>,
        <Button
          key="approve"
          type="primary"
          className="bg-cyan-600"
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={handleApprove}
        >
          Xác nhận chốt bán & Xuất kho
        </Button>,
      ]}
      width={800}
      className="top-10"
      destroyOnHidden
    >
      <Alert
        message={
          <Text strong>
            Đề xuất từ Sales: {selectedActivity.user?.fullName}
          </Text>
        }
        description={note}
        type="info"
        showIcon
        className="mb-4 rounded-xl"
      />

      <Descriptions
        title="Thông tin khách mua"
        bordered
        column={2}
        size="small"
      >
        <Descriptions.Item label="Khách hàng">
          {customer.fullName}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {customer.phone}
        </Descriptions.Item>
        <Descriptions.Item label="Ngân sách khách">
          {Number(customer.budget).toLocaleString()}đ
        </Descriptions.Item>
      </Descriptions>

      <Divider titlePlacement="left" className="m-4!">
        <CarOutlined /> THÔNG TIN XE CHỐT BÁN
      </Divider>

      {leadCar ? (
        <Descriptions bordered column={2} size="small" className="mb-4">
          <Descriptions.Item label="Mẫu xe" span={2}>
            <Text strong className="text-blue-600 uppercase">
              {leadCar.modelName}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Năm sản xuất">
            {leadCar.year}
          </Descriptions.Item>
          <Descriptions.Item label="Màu sắc">
            {leadCar.color || "---"}
          </Descriptions.Item>
          <Descriptions.Item label="Giá chốt bán" span={2}>
            <Title level={4} className="m-0! text-red-600 font-black">
              {Number(leadCar.finalPrice).toLocaleString()} VNĐ
            </Title>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert
          message="Không tìm thấy thông tin xe liên kết"
          type="warning"
          className="mb-4"
        />
      )}

      {/* PHẦN NHẬP LIỆU CỦA QUẢN LÝ */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <Title level={5} className="mt-0! mb-3!">
          <FileTextOutlined className="mr-2 text-cyan-600" /> THÔNG TIN HỢP ĐỒNG
          & PHÊ DUYỆT
        </Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ adminNote: "Đồng ý chốt bán." }}
        >
          <Form.Item
            name="contractNo"
            label={<Text strong>Số hợp đồng bán lẻ</Text>}
            rules={[
              {
                required: true,
                message: "Vui lòng nhập số hợp đồng để chốt xe!",
              },
            ]}
          >
            <Input
              placeholder="Ví dụ: 123/2026/HĐB-TBD"
              className="rounded-lg h-10 font-bold text-blue-700"
            />
          </Form.Item>

          <Form.Item
            name="adminNote"
            label={<Text strong>Ghi chú của Quản lý</Text>}
          >
            <TextArea
              rows={2}
              placeholder="Nhập lý do nếu từ chối hoặc chỉ dẫn thêm cho nhân viên..."
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
