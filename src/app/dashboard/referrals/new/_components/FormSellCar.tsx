/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Form,
  Card,
  Input,
  Select,
  Button,
  Row,
  Col,
  message,
  Typography,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  SendOutlined,
  AuditOutlined,
  CalendarOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { createCustomerAction } from "@/actions/customer-actions";
import { useState } from "react";

const { Title, Text } = Typography;

export default function FormSellCar({
  type,
  carModels,
  userId,
  onSuccess,
}: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const SELL_SUB_TYPES = [
    { value: "SELL", label: "Chỉ bán xe cũ" },
    { value: "SELL_TRADE_NEW", label: "Bán cũ - Đổi xe mới" },
    { value: "SELL_TRADE_USED", label: "Bán cũ - Đổi xe cũ" },
  ];

  const onFinish = async (values: any) => {
    if (!userId) return message.error("Lỗi phiên đăng nhập");
    setLoading(true);
    // Nếu là VALUATION thì giữ nguyên type, nếu SELL thì lấy giá trị từ Select SubType
    const finalType = type === "VALUATION" ? "VALUATION" : values.type;

    const res = await createCustomerAction({
      ...values,
      type: finalType,
      referrerId: userId,
    });
    if (res?.success) {
      message.success("Gửi thông tin thành công!");
      onSuccess();
    } else {
      message.error(res?.error || "Gửi thất bại");
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-xl rounded-2xl border-none overflow-hidden ">
      <div
        className={`p-4 -mx-6 -mt-6 mb-6 ${type === "SELL" ? "bg-red-600" : "bg-orange-500"}`}
      >
        <Title level={4} className="!text-white !m-0 uppercase text-center">
          {type === "SELL"
            ? "Thông tin ký gửi / Đổi xe"
            : "Yêu cầu định giá xe"}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
        initialValues={{ type: "SELL" }}
      >
        <section className="mb-4">
          <Text
            strong
            className="text-gray-400 text-[11px] uppercase tracking-widest mb-4 block"
          >
            Thông tin khách hàng
          </Text>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="fullName"
                label="Tên khách hàng"
                rules={[{ required: true }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
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
          </Row>
        </section>

        <section className="mb-4">
          <Text
            strong
            className="text-gray-400 text-[11px] uppercase tracking-widest mb-4 block"
          >
            Chi tiết xe giới thiệu
          </Text>
          <Row gutter={16}>
            {type === "SELL" && (
              <Col span={24}>
                <Form.Item
                  name="type"
                  label="Hình thức giao dịch"
                  rules={[{ required: true }]}
                >
                  <Select options={SELL_SUB_TYPES} className="w-full" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Form.Item
                name="licensePlate"
                label="Biển số xe"
                rules={[{ required: true, message: "Bắt buộc để check trùng" }]}
                getValueFromEvent={(e) =>
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                }
              >
                <Input
                  prefix={<AuditOutlined />}
                  placeholder="61A12345"
                  className="font-bold text-blue-600"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="carModelId"
                label="Dòng xe khách tìm"
                rules={[{ required: true, message: "Vui lòng chọn dòng xe!" }]}
              >
                <Select
                  showSearch
                  placeholder="Gõ để tìm dòng xe (VD: Vios, Accent...)"
                  optionFilterProp="label" // QUAN TRỌNG: Cho phép search theo label (m.name)
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  } // Thêm hàm này để search tiếng Việt không phân biệt hoa thường
                  options={carModels.map((m: any) => ({
                    label: m.name,
                    value: m.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="carYear" label="Năm sản xuất">
                <Input prefix={<CalendarOutlined />} placeholder="Vd: 2019" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="expectedPrice"
                label={type === "SELL" ? "Giá muốn bán" : "Giá kỳ vọng"}
              >
                <Input prefix={<CarOutlined />} placeholder="Vd: 450 triệu" />
              </Form.Item>
            </Col>
          </Row>
        </section>

        <Form.Item name="note" label="Ghi chú thêm">
          <Input.TextArea
            rows={3}
            placeholder="Tình trạng xe, pháp lý, thời gian xem xe tốt nhất..."
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          icon={<SendOutlined />}
          className={`h-14 font-bold text-lg rounded-xl border-none ${type === "SELL" ? "bg-red-600" : "bg-orange-500"}`}
        >
          XÁC NHẬN GỬI THÔNG TIN
        </Button>
      </Form>
    </Card>
  );
}
