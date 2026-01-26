/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
  Tag,
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  CarOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface ModalApproveSalesProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: any;
  inventory: any[];
  onFinish: (values: any) => Promise<void>;
  loading: boolean;
}

export default function ModalApproveSales({
  isOpen,
  onClose,
  selectedLead,
  inventory,
  onFinish,
  loading,
}: ModalApproveSalesProps) {
  const [form] = Form.useForm();
  const [selectedCar, setSelectedCar] = useState<any>(null);

  // Cập nhật giá niêm yết khi chọn xe
  const handleCarChange = (carId: string) => {
    const car = inventory.find((c) => c.id === carId);
    setSelectedCar(car);
    if (car) {
      form.setFieldsValue({
        finalPrice: car.sellingPrice, // Mặc định để giá bán thỏa thuận bằng giá niêm yết
      });
    }
  };

  useEffect(() => {
    if (isOpen && selectedLead) {
      console.log(selectedLead);
      console.log(inventory);

      // 1. Reset form về trạng thái sạch trước
      form.resetFields();
      setSelectedCar(null);

      // 2. Lấy dữ liệu leadCar từ object API
      const leadCar = selectedLead.customer?.leadCar;

      if (leadCar) {
        let carFound = null;

        // Cách A: Tìm theo carId trực tiếp (nếu schema có)
        if (leadCar.carId) {
          carFound = inventory.find((c) => c.id === leadCar.carId);
        }

        // Cách B: Nếu carId null, bóc tách StockCode từ description
        // (Dành cho trường hợp description là: "Mã kho liên kết: CK-26-001")
        if (!carFound && leadCar.description) {
          const match = leadCar.description.match(/([A-Z0-9-]{5,})/); // Tìm chuỗi mã kho
          if (match) {
            const stockCode = match[0];
            carFound = inventory.find((c) => c.stockCode === stockCode);
          }
        }

        // 3. Nếu tìm thấy xe trong kho (inventory), tự động điền Form
        if (carFound) {
          setSelectedCar(carFound);
          form.setFieldsValue({
            carId: carFound.id,
            finalPrice: carFound.sellingPrice,
          });
        }
      }
    }
  }, [isOpen, selectedLead, inventory, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onFinish(values);
    } catch (error) {
      console.error("Validate failed:", error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined className="text-emerald-600" />
          <span className="uppercase font-black text-slate-700">
            Yêu cầu phê duyệt bán xe
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Gửi yêu cầu duyệt"
      cancelText="Đóng"
      width={700}
      centered
      okButtonProps={{
        className: "bg-emerald-600 border-emerald-600 h-10 px-8",
      }}
    >
      {selectedLead?.customer?.leadCar?.id && (
        <Alert
          message="Khách hàng đã chọn sẵn xe này từ lúc đăng ký"
          type="info"
          showIcon
          className="mb-4!"
        />
      )}
      <Alert
        message={
          <Text strong>Khách hàng: {selectedLead?.customer?.fullName}</Text>
        }
        description={
          <div className="text-xs">
            Nhu cầu:{" "}
            <Tag color="blue">{selectedLead?.customer?.carModel?.name}</Tag>|
            Ngân sách:{" "}
            <Text type="danger">
              {Number(selectedLead?.customer?.budget || 0).toLocaleString()}đ
            </Text>
          </div>
        }
        type="success"
        showIcon
        className="mb-6! rounded-xl"
      />

      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={20}>
          {/* PHẦN CHỌN XE TRONG KHO */}
          <Col span={24}>
            <Form.Item
              name="carId"
              label={
                <Text strong>
                  <CarOutlined /> Chọn xe trong kho để chốt
                </Text>
              }
              rules={[{ required: true, message: "Vui lòng chọn xe từ kho" }]}
              extra="Chỉ hiển thị xe có trạng thái Sẵn sàng bán (Ready for Sale)"
            >
              <Select
                showSearch
                placeholder="Tìm theo mã kho hoặc mẫu xe..."
                optionFilterProp="label"
                onChange={handleCarChange}
                options={inventory.map((car) => ({
                  label: `[${car.stockCode}] ${car.modelName} - ${car.year} (${car.licensePlate})`,
                  value: car.id,
                }))}
                className="w-full"
              />
            </Form.Item>
          </Col>

          {/* HIỂN THỊ THÔNG TIN XE ĐÃ CHỌN */}
          {selectedCar && (
            <Col span={24}>
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 mb-6 animate-in zoom-in-95 duration-300">
                <Row gutter={16}>
                  <Col span={12}>
                    <Text
                      type="secondary"
                      className="text-[11px] uppercase block"
                    >
                      Giá niêm yết
                    </Text>
                    <Title level={4} className="!m-0 !text-blue-600">
                      {Number(selectedCar.sellingPrice).toLocaleString()}đ
                    </Title>
                  </Col>
                  <Col span={12}>
                    <Text
                      type="secondary"
                      className="text-[11px] uppercase block"
                    >
                      Mã kho / VIN
                    </Text>
                    <Text strong className="text-slate-700">
                      {selectedCar.stockCode} / {selectedCar.vin?.slice(-6)}
                    </Text>
                  </Col>
                </Row>
              </div>
            </Col>
          )}

          <Divider className="my-2" />

          {/* PHẦN NHẬP GIÁ CHỐT */}
          <Col xs={24} md={12}>
            <Form.Item
              name="finalPrice"
              label={
                <Text strong>
                  <DollarOutlined /> Giá bán thỏa thuận
                </Text>
              }
              rules={[{ required: true, message: "Nhập giá bán thực tế" }]}
            >
              <InputNumber
                className="w-full!"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                addonAfter="VNĐ"
                placeholder="Ví dụ: 500,000,000"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="paymentMethod"
              label={
                <Text strong>
                  <SolutionOutlined /> Hình thức thanh toán
                </Text>
              }
              initialValue="TIỀN MẶT"
            >
              <Select
                options={[
                  { label: "Tiền mặt / Chuyển khoản", value: "CASH" },
                  { label: "Trả góp qua Ngân hàng", value: "BANK_LOAN" },
                  { label: "Thu cũ đổi mới", value: "TRADE_IN" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="note"
              label={
                <Text strong>
                  <InfoCircleOutlined /> Ghi chú phê duyệt & Khuyến mãi
                </Text>
              }
              rules={[
                {
                  required: true,
                  message: "Nhập lý do chốt hoặc quà tặng kèm",
                },
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Ví dụ: Tặng gói bảo hiểm thân vỏ, miễn phí đăng ký biển số, khách thanh toán 100%..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
