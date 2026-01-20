/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  Divider,
  Card,
  Checkbox,
  Space,
} from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";

interface ModalApproveTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  selectedLead: any;
  inventory: any[]; // Xe có sẵn trong kho (cho trường hợp BÁN)
  carModels: any[]; // Danh sách dòng xe (cho trường hợp THU)
}

export default function ModalApproveTransaction({
  isOpen,
  onClose,
  onFinish,
  loading,
  selectedLead,
  inventory,
  carModels,
}: ModalApproveTransactionProps) {
  const [form] = Form.useForm();

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined className="text-indigo-600" />
          <span className="font-bold uppercase">
            {selectedLead?.type === "BUY"
              ? "PHÊ DUYỆT BÁN XE"
              : "HỒ SƠ THU MUA MỚI"}
          </span>
        </Space>
      }
      open={isOpen}
      onOk={() => form.submit()}
      onCancel={onClose}
      width={1000}
      okText="Gửi yêu cầu phê duyệt"
      confirmLoading={loading}
      centered
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          transmission: "AUTOMATIC",
          fuelType: "GASOLINE",
          carType: "SUV",
          seats: 5,
          driveTrain: "FWD",
          origin: "Trong nước",
        }}
        className="mt-4"
      >
        {selectedLead?.type === "BUY" ? (
          <Form.Item
            name="carId"
            label={
              <span className="font-bold text-indigo-700">
                Chọn xe từ kho để bán
              </span>
            }
            rules={[{ required: true }]}
          >
            <Select
              size="large"
              showSearch
              placeholder="Tìm xe theo tên hoặc biển số..."
              options={inventory.map((c: any) => ({
                label: `🚗 ${c.modelName} [${
                  c.licensePlate || "Chưa biển"
                }] - ${Number(c.sellingPrice).toLocaleString()}đ`,
                value: c.id,
              }))}
            />
          </Form.Item>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
            {/* THÔNG TIN XE (DÀNH CHO THU MUA) */}
            <Card
              size="small"
              title="1. Thông tin định danh & Kỹ thuật"
              className="mb-4 bg-slate-50"
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="carModelId"
                    label="Dòng xe (Model)"
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      options={carModels.map((m) => ({
                        label: m.name,
                        value: m.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="licensePlate"
                    label="Biển số"
                    getValueFromEvent={
                      (e) =>
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 9) // ✅ CHẶN TỐI ĐA 9 KÝ TỰ
                    }
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập biển số",
                      },
                      {
                        min: 5,
                        message: "Biển số không hợp lệ",
                      },
                      {
                        max: 9,
                        message: "Biển số tối đa 9 ký tự",
                      },
                    ]}
                  >
                    <Input className="uppercase" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="year"
                    label="Năm SX"
                    rules={[{ required: true }]}
                  >
                    <InputNumber className="w-full!" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="vin" label="Số khung (VIN)">
                    <Input className="uppercase" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="engineNumber" label="Số máy">
                    <Input className="uppercase" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="odo"
                    label="Số Km (ODO)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber className="w-full!" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="transmission" label="Hộp số">
                    <Select
                      options={[
                        { label: "Tự động", value: "AUTOMATIC" },
                        { label: "Số sàn", value: "MANUAL" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Form.Item name="fuelType" label="Nhiên liệu">
                    <Select
                      options={[
                        { label: "Xăng", value: "GASOLINE" },
                        { label: "Dầu", value: "DIESEL" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="origin" label="Xuất xứ">
                    <Input placeholder="VD: Thái Lan" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="color" label="Màu ngoại thất">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="interiorColor" label="Màu nội thất">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title="2. Nội dung hiển thị (CMS)"
              className="mb-4"
            >
              <Form.Item
                name="description"
                label="Mô tả chi tiết tình trạng xe"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Cam kết 5 tiêu chuẩn vàng..."
                />
              </Form.Item>
              <Form.Item name="features" label="Tiện nghi nổi bật">
                <Input placeholder="VD: Cửa sổ trời, Ghế điện..." />
              </Form.Item>
            </Card>
          </div>
        )}

        <Divider orientation="horizontal">
          3. Thông tin giao dịch & Pháp lý
        </Divider>
        <Row gutter={16}>
          <Col xs={12} md={8}>
            <Form.Item
              name="contractNo"
              label="Số hợp đồng"
              rules={[{ required: true }]}
            >
              <Input placeholder="HĐ-2024/..." />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="actualPrice"
              label="Giá trị giao dịch"
              rules={[{ required: true }]}
            >
              <InputNumber
                className="w-full!"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="ownerType" label="Hình thức sở hữu">
              <Select
                options={[
                  { label: "Cá nhân", value: "PERSONAL" },
                  { label: "Công ty", value: "COMPANY" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
