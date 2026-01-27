/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  Alert,
  InputNumber,
} from "antd";
import {
  UserAddOutlined,
  PhoneOutlined,
  CarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { Role } from "@prisma/client";

const { Text } = Typography;
const { Option } = Select;

interface ModalAddSelfLeadProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  carModels: any[];
  currentUser: any; // Truyền user từ Page vào để check Role
}

export default function ModalAddSelfLead({
  isOpen,
  onClose,
  onFinish,
  loading,
  carModels,
  currentUser,
}: ModalAddSelfLeadProps) {
  const [form] = Form.useForm();
  const watchType = Form.useWatch("type", form);
  console.log(currentUser);

  // Tự động set giá trị mặc định dựa trên Role khi mở Modal
  useEffect(() => {
    if (isOpen && currentUser?.role) {
      if (currentUser.role === Role.SALES_STAFF) {
        form.setFieldValue("type", "BUY");
      } else if (currentUser.role === Role.PURCHASE_STAFF) {
        form.setFieldValue("type", "SELL");
      }
    }
  }, [isOpen, currentUser, form]);

  const isLocked =
    currentUser?.role === Role.SALES_STAFF ||
    currentUser?.role === Role.PURCHASE_STAFF;

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined className="text-green-600" />
          <span className="uppercase font-bold">
            Thêm khách hàng mới của tôi
          </span>
        </Space>
      }
      open={isOpen}
      onOk={() => form.submit()}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      confirmLoading={loading}
      width={600}
      okText="Tạo khách hàng & Nhận chăm sóc"
      centered
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fullName"
              label="Họ và tên khách hàng"
              rules={[{ required: true, message: "Nhập tên khách hàng" }]}
            >
              <Input
                placeholder="VD: Nguyễn Văn A"
                prefix={<UserAddOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Nhập số điện thoại" },
                { pattern: /^[0-9]{10}$/, message: "SĐT không hợp lệ (10 số)" },
              ]}
            >
              <Input
                placeholder="090..."
                prefix={<PhoneOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="type"
          label="Nhu cầu khách hàng"
          extra={
            isLocked ? (
              <Text type="secondary" className="text-[11px]">
                Nhu cầu được cố định theo chức vụ của bạn
              </Text>
            ) : null
          }
        >
          <Select className="w-full" disabled={isLocked}>
            <Option value="BUY">Mua xe (Lead Bán hàng)</Option>
            <Option value="SELL">Bán xe / Ký gửi (Lead Thu mua)</Option>
            <Option value="VALUATION">Chỉ định giá xe</Option>
          </Select>
        </Form.Item>

        <Divider plain>
          <CarOutlined /> Thông tin nhu cầu chi tiết
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="carModelId" label="Dòng xe quan tâm">
              <Select placeholder="Chọn dòng xe" showSearch>
                {carModels.map((m) => (
                  <Option key={m.id} value={m.id}>
                    {m.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="carYear" label="Đời xe / Năm SX">
              <Input placeholder="VD: 2022" />
            </Form.Item>
          </Col>
        </Row>

        {watchType === "BUY" ? (
          <Form.Item name="budget" label="Ngân sách dự kiến">
            <InputNumber
              className="w-full!"
              placeholder="VD: Khoảng 500 - 600 triệu"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              addonAfter="VNĐ"
            />
          </Form.Item>
        ) : (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="licensePlate"
                label="Biển số xe"
                getValueFromEvent={(e) =>
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 9)
                }
                rules={[
                  {
                    required: watchType !== "BUY",
                    message: "Vui lòng nhập biển số xe!",
                  },
                  { min: 5, message: "Biển số không hợp lệ" },
                ]}
              >
                <Input placeholder="VD: 51G12345" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedPrice" label="Giá khách muốn bán">
                <InputNumber
                  className="w-full!"
                  placeholder="Vd: 500,000,000"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.Item name="note" label="Ghi chú thêm">
          <Input.TextArea
            rows={3}
            placeholder="Ghi chú nhanh về tình trạng khách hàng..."
          />
        </Form.Item>

        <Alert
          type="success"
          showIcon
          title={
            <Text className="text-green-700 font-medium">
              Bạn đang tự gán khách hàng này cho chính mình.
            </Text>
          }
        />
      </Form>
    </Modal>
  );
}
