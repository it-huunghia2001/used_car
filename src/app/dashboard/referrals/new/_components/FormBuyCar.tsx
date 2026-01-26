/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  Card,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  message,
  Typography,
  Divider,
  Tag,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  SendOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { createCustomerAction } from "@/actions/customer-actions";
import { getAvailableCarsAction } from "@/actions/car-actions";

const { Title, Text } = Typography;

export default function FormBuyCar({ carModels, userId, onSuccess }: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableCars, setAvailableCars] = useState<any[]>([]);

  useEffect(() => {
    // Load danh sách xe thực tế trong kho
    getAvailableCarsAction().then(setAvailableCars);
  }, []);

  const onFinish = async (values: any) => {
    if (!userId) return message.error("Lỗi phiên đăng nhập");
    setLoading(true);
    const res = await createCustomerAction({
      ...values,
      type: "BUY",
      referrerId: userId,
    });
    if (res?.success) {
      message.success("Đã gửi yêu cầu giới thiệu thành công!");
      onSuccess();
    } else {
      message.error(res?.error || "Gửi thất bại");
    }
    setLoading(false);
  };

  // Khi chọn 1 xe cụ thể từ kho
  const handleSelectStockCar = (carId: string) => {
    // Nếu xóa trắng Select (clear) thì reset form về trống
    if (!carId) {
      form.setFieldsValue({
        carModelId: undefined,
        carYear: undefined,
        budget: undefined,
        note: undefined,
      });
      return;
    }

    const car = availableCars.find((c) => c.id === carId);

    if (car) {
      console.log("Selected Car Data:", car); // Để debug kiểm tra carModelId có tồn tại không

      form.setFieldsValue({
        // Tự động chọn dòng xe tương ứng
        carModelId: car.carModelId,

        // Tự động điền đời xe
        carYear: car.year,

        // Tự động điền ngân sách dựa trên giá bán
        budget: car.sellingPrice ? Number(car.sellingPrice) : undefined,

        // Ghi chú chi tiết mã xe để Admin dễ nhận biết
        note: `Khách quan tâm xe có sẵn - Mã kho: ${car.stockCode} (${car.modelName})`,
      });

      message.success(`Đã áp dụng thông tin xe ${car.stockCode}`);
    }
  };
  return (
    <Card className="shadow-xl rounded-2xl border-none overflow-hidden animate-in fade-in duration-500">
      <div className="bg-blue-600 p-4 -mx-6 -mt-6 mb-6 text-center">
        <Title level={4} className="!text-white !m-0 uppercase">
          Giới thiệu khách mua xe
        </Title>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
        <Row gutter={20}>
          <Col xs={24} md={12}>
            <Form.Item
              name="fullName"
              label="Họ tên khách mua"
              rules={[{ required: true }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="090..." />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Divider titlePlacement="left" plain>
              <Text
                type="secondary"
                className="text-[11px] uppercase font-bold"
              >
                Tùy chọn: Chọn xe có sẵn trong kho
              </Text>
            </Divider>
            <Form.Item
              name="selectedCarId"
              extra="Nếu khách đã ưng một chiếc cụ thể trên web, hãy chọn ở đây"
            >
              <Select
                showSearch
                placeholder="Tìm theo mã kho hoặc tên xe (Vd: TOY001...)"
                optionFilterProp="label"
                onChange={handleSelectStockCar}
                allowClear
                options={availableCars.map((c) => ({
                  label: `[${c.stockCode}] ${c.modelName} - ${c.year} (${new Intl.NumberFormat("vi-VN").format(c.sellingPrice)}đ)`,
                  value: c.id,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item
              name="carModelId"
              label="Dòng xe khách tìm"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                placeholder="Chọn dòng xe"
                options={carModels.map((m: any) => ({
                  label: m.name,
                  value: m.id,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="carYear" label="Đời xe từ">
              <InputNumber className="w-full" placeholder="2022" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="budget" label="Ngân sách (VNĐ)">
              <InputNumber
                className="w-full"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="note" label="Ghi chú nhu cầu chi tiết">
              <Input.TextArea
                rows={3}
                placeholder="Màu sắc, trả góp, phụ kiện..."
              />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          icon={<SendOutlined />}
          className="h-14 bg-blue-600 font-bold text-lg rounded-xl shadow-lg shadow-blue-100"
        >
          GỬI THÔNG TIN GIỚI THIỆU
        </Button>
      </Form>
    </Card>
  );
}
