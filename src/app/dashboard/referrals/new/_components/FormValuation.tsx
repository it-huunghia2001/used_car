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
  DollarOutlined,
  UserOutlined,
  PhoneOutlined,
  SendOutlined,
  AuditOutlined,
  CalendarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { createCustomerAction } from "@/actions/customer-actions";
import { useState } from "react";

const { Title, Text } = Typography;

export default function FormValuation({ carModels, userId, onSuccess }: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    if (!userId) return message.error("Lỗi phiên đăng nhập");
    setLoading(true);

    // Ép kiểu về VALUATION trước khi gửi lên Server Action
    const res = await createCustomerAction({
      ...values,
      type: "VALUATION",
      referrerId: userId,
    });

    if (res?.success) {
      message.success("Yêu cầu định giá đã được gửi đi!");
      onSuccess();
    } else {
      message.error(res?.error || "Gửi thất bại");
    }
    setLoading(false);
  };

  return (
    <Card className=" shadow-xl rounded-2xl border-none overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-orange-500 p-5 -mx-6 -mt-6 mb-6">
        <Title
          level={4}
          className="!text-white !m-0 uppercase text-center tracking-tight"
        >
          <DollarOutlined /> Đăng ký định giá xe chuyên sâu
        </Title>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
        <section className="mb-6">
          <Divider titlePlacement="left" plain>
            <Text
              strong
              className="text-gray-400 text-[10px] uppercase tracking-widest"
            >
              Liên hệ chủ xe
            </Text>
          </Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="fullName"
                label="Tên khách hàng"
                rules={[{ required: true, message: "Nhập tên khách" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Ví dụ: Anh Nghĩa"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: "Nhập số điện thoại" }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="0367..." />
              </Form.Item>
            </Col>
          </Row>
        </section>

        <section className="mb-6 bg-orange-50/30 p-4 rounded-xl border border-orange-100">
          <Divider titlePlacement="left" plain>
            <Text
              strong
              className="text-orange-400 text-[10px] uppercase tracking-widest"
            >
              Thông tin xe cần định giá
            </Text>
          </Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="licensePlate"
                label="Biển số xe"
                extra={
                  <span className="text-[10px]">
                    Cần thiết để tra cứu lịch sử bảo dưỡng
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: "Cần biển số để định giá chính xác",
                  },
                ]}
                getValueFromEvent={(e) =>
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 9)
                }
              >
                <Input
                  prefix={<AuditOutlined />}
                  placeholder="Vd: 61A12345"
                  className="font-bold text-orange-600 uppercase"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="carModelId"
                label="Mẫu xe"
                rules={[{ required: true, message: "Chọn mẫu xe" }]}
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
            <Col xs={24} md={12}>
              <Form.Item name="carYear" label="Năm sản xuất">
                <Input
                  prefix={<CalendarOutlined />}
                  placeholder="Ví dụ: 2021"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="expectedPrice"
                label="Giá khách mong muốn (nếu có)"
              >
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Ví dụ: 600 triệu"
                />
              </Form.Item>
            </Col>
          </Row>
        </section>

        <Form.Item name="note" label="Mô tả sơ bộ tình trạng xe">
          <Input.TextArea
            rows={3}
            placeholder="Ví dụ: Xe một đời chủ, đi kỹ, đã thay lốp mới, không đâm đụng..."
          />
        </Form.Item>

        <div className="pt-4">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            icon={<SendOutlined />}
            className="h-14 font-bold text-lg rounded-xl border-none bg-orange-500 hover:bg-orange-600 shadow-orange-200 shadow-lg"
          >
            GỬI YÊU CẦU ĐỊNH GIÁ
          </Button>
          <Text type="secondary" className="block text-center mt-3 text-[11px]">
            * Chuyên viên định giá sẽ phản hồi trong vòng 60 phút làm việc.
          </Text>
        </div>
      </Form>
    </Card>
  );
}

import { Divider } from "antd"; // Nhớ import thêm Divider để giao diện phân đoạn rõ ràng
