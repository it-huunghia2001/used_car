/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Typography,
  Divider,
  Button,
  Space,
  Alert,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  CarOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

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
  if (!selectedActivity) return null;

  const { customer, note } = selectedActivity;
  const leadCar = customer?.leadCar;

  console.log(customer);

  return (
    <Modal
      title={
        <Title level={4}>
          <CheckCircleOutlined className="text-cyan-600" /> CHI TIẾT PHÊ DUYỆT
          BÁN XE
        </Title>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button
          key="reject"
          danger
          icon={<CloseCircleOutlined />}
          onClick={() =>
            onReject("Không đồng ý giá bán/phương thức thanh toán")
          }
        >
          Từ chối
        </Button>,
        <Button
          key="approve"
          type="primary"
          className="bg-cyan-600"
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={() => onApprove(selectedActivity)}
        >
          Phê duyệt chốt bán
        </Button>,
      ]}
      width={800}
    >
      <Alert
        title={
          <Text strong>
            Đề xuất từ Sales: {selectedActivity.user?.fullName}
          </Text>
        }
        description={note} // Hiển thị chi tiết giá chốt và PTTT từ log
        type="info"
        showIcon
        className="mb-4"
      />

      <Descriptions title="Thông tin khách mua" bordered column={2}>
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

      <Divider titlePlacement="left">
        <CarOutlined /> THÔNG TIN XE CHỐT BÁN
      </Divider>

      {leadCar ? (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mẫu xe" span={2}>
            <Text strong className="text-blue-600">
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
            <Title level={3} className="m-0! text-red-600">
              {Number(leadCar.finalPrice).toLocaleString()} VNĐ
            </Title>
          </Descriptions.Item>
          <Descriptions.Item label="Ghi chú xe">
            {leadCar.description}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert message="Không tìm thấy thông tin xe liên kết" type="warning" />
      )}
    </Modal>
  );
}
