/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Divider,
  Row,
  Col,
  Alert,
  Typography,
  Space,
  Tag,
} from "antd";
import {
  FileDoneOutlined,
  DollarOutlined,
  CarOutlined,
  InfoCircleOutlined,
  UserOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

interface ModalSaleTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  selectedLead: any;
  inventory: any[];
}

export default function ModalSaleTransaction({
  isOpen,
  onClose,
  onFinish,
  loading,
  selectedLead,
  inventory,
}: ModalSaleTransactionProps) {
  const [form] = Form.useForm();
  console.log(inventory);

  // Tự động điền giá dự kiến của khách vào ô giá bán khi mở modal
  useEffect(() => {
    if (isOpen && selectedLead) {
      form.setFieldsValue({
        actualPrice: selectedLead.expectedPrice || 0,
      });
    } else {
      form.resetFields();
    }
  }, [isOpen, selectedLead, form]);

  return (
    <Modal
      title={
        <Space>
          <div className="bg-blue-500 p-2 rounded-lg flex items-center justify-center">
            <FileDoneOutlined className="text-white" />
          </div>
          <span className="font-bold text-lg uppercase">
            Phê duyệt hợp đồng bán xe
          </span>
        </Space>
      }
      open={isOpen}
      onOk={() => form.submit()}
      onCancel={onClose}
      confirmLoading={loading}
      width={650}
      okText="Xác nhận & Gửi duyệt"
      cancelText="Đóng"
      centered
      destroyOnClose
    >
      <div className="mb-6">
        <Alert
          className="border-blue-100 bg-blue-50"
          message={
            <div className="py-1">
              <Space direction="vertical" size={0}>
                <Text strong className="text-blue-800">
                  Khách hàng: {selectedLead?.fullName}
                </Text>
                <Text type="secondary">SĐT: {selectedLead?.phone}</Text>
              </Space>
            </div>
          }
          type="info"
          showIcon
          icon={<UserOutlined className="text-blue-500" />}
        />
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        {/* PHẦN CHỌN XE TỪ KHO */}
        <div className="mb-6">
          <Text strong className="block mb-2">
            <CarOutlined /> Chọn xe từ kho hệ thống
          </Text>
          <Form.Item
            name="carId"
            rules={[
              { required: true, message: "Vui lòng chọn xe khách muốn mua" },
            ]}
          >
            <Select
              showSearch
              placeholder="Tìm theo tên xe, biển số hoặc mã VIN..."
              size="large"
              className="w-full shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              {inventory.map((car) => (
                <Option key={car.id} value={car.id} className="w-full!">
                  <div className="flex justify-between items-center py-1 w-full!">
                    <div>
                      <div className="font-bold">{car.modelName}</div>
                      <div className="text-[11px] text-gray-400">
                        BS:{" "}
                        <Tag color="default" className="m-0 py-0 leading-3">
                          {car.licensePlate || "N/A"}
                        </Tag>{" "}
                        | VIN: {car.vin?.slice(-6)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-600 font-bold">
                        {Number(car.sellingPrice).toLocaleString()} đ
                      </div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div className="flex items-start gap-2 text-gray-400 text-[12px] px-1">
            <InfoCircleOutlined className="mt-0.5" />
            <span>
              Chỉ những xe có trạng thái Sẵn sàng mới hiển thị trong danh sách
              này.
            </span>
          </div>
        </div>

        <Divider />

        {/* PHẦN THÔNG TIN HỢP ĐỒNG */}
        <Row gutter={20}>
          <Col span={12}>
            <Form.Item
              name="contractNo"
              label={<Text strong>Số hợp đồng / Mã phiếu</Text>}
              rules={[
                { required: true, message: "Nhập mã định danh hợp đồng" },
              ]}
            >
              <Input
                prefix={<BarcodeOutlined className="text-gray-400" />}
                placeholder="VD: HD-001/2024"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="actualPrice"
              label={<Text strong>Giá bán thực tế</Text>}
              rules={[{ required: true, message: "Vui lòng nhập giá chốt" }]}
            >
              <InputNumber
                className="w-full"
                size="large"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="contractNote"
          label={<Text strong>Ghi chú bán hàng</Text>}
        >
          <Input.TextArea
            rows={3}
            placeholder="Ví dụ: Tặng thảm lót sàn, bảo dưỡng miễn phí lần đầu, khách vay ngân hàng 70%..."
            className="rounded-lg"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
