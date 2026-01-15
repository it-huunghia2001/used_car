/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Radio,
  Typography,
  Divider,
  Row,
  Col,
  Space,
  ConfigProvider,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  PhoneOutlined,
  CarOutlined,
  AuditOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { createCustomerAction } from "@/actions/customer-actions";

const { Title, Text, Paragraph } = Typography;

export default function NewReferralPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentType, setCurrentType] = useState("SELL");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((session) => {
        if (session?.id) setUserId(session.id);
      });
  }, []);

  const onFinish = async (values: any) => {
    if (!userId) return message.error("Phiên đăng nhập hết hạn.");
    setLoading(true);
    try {
      await createCustomerAction({ ...values, referrerId: userId });
      message.success({
        content: "Gửi thông tin thành công! Quản lý sẽ sớm phản hồi.",
        icon: <CheckCircleFilled style={{ color: "#52c41a" }} />,
      });
      form.resetFields();
      setCurrentType("SELL");
    } catch (err: any) {
      message.error(err.message || "Lỗi hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d32f2f", // Màu đỏ đặc trưng Toyota
          borderRadius: 8,
        },
      }}
    >
      <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <Title
              level={2}
              className="!mb-1 !font-bold tracking-tight text-gray-800"
            >
              GỬI GIỚI THIỆU MỚI
            </Title>
            <Paragraph className="text-gray-500 !mb-0">
              Điền thông tin khách hàng để hệ thống bắt đầu xử lý nhu cầu.
            </Paragraph>
          </div>
          <Tag color="blue" icon={<InfoCircleOutlined />}>
            Phòng kinh doanh
          </Tag>
        </div>

        <Card className="shadow-sm border-gray-100 rounded-2xl overflow-hidden">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            size="large"
            initialValues={{ type: "SELL" }}
            className="p-2"
          >
            {/* 1. KHỐI NHU CẦU */}
            <section className="mb-10">
              <Text
                strong
                className="block mb-4 text-sm text-gray-400 uppercase tracking-widest"
              >
                Bước 1: Chọn nhu cầu khách hàng
              </Text>
              <Form.Item name="type" className="mb-0">
                <Radio.Group
                  block
                  optionType="button"
                  buttonStyle="solid"
                  onChange={(e) => setCurrentType(e.target.value)}
                  className="h-14 flex gap-2 p-1 bg-gray-50 rounded-xl"
                >
                  <Radio.Button
                    value="SELL"
                    className="flex-1 !rounded-lg border-none text-center leading-[52px] font-semibold transition-all"
                  >
                    BÁN XE / ĐỔI XE
                  </Radio.Button>
                  <Radio.Button
                    value="BUY"
                    className="flex-1 !rounded-lg border-none text-center leading-[52px] font-semibold transition-all"
                  >
                    MUA XE CŨ
                  </Radio.Button>
                  <Radio.Button
                    value="VALUATION"
                    className="flex-1 !rounded-lg border-none text-center leading-[52px] font-semibold transition-all"
                  >
                    ĐỊNH GIÁ XE
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </section>

            {/* 2. THÔNG TIN KHÁCH HÀNG */}
            <section className="mb-10">
              <Text
                strong
                className="block mb-6 text-sm text-gray-400 uppercase tracking-widest"
              >
                Bước 2: Thông tin liên hệ
              </Text>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="fullName"
                    label={
                      <span className="font-medium text-gray-700">
                        Tên khách hàng
                      </span>
                    }
                    rules={[{ required: true, message: "Bắt buộc nhập" }]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-300" />}
                      placeholder="Nhập họ tên"
                      className="rounded-lg border-gray-200"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label={
                      <span className="font-medium text-gray-700">
                        Số điện thoại
                      </span>
                    }
                    rules={[
                      { required: true, message: "Bắt buộc nhập" },
                      { pattern: /^[0-9]+$/, message: "SĐT không hợp lệ" },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined className="text-gray-300" />}
                      placeholder="Nhập số điện thoại"
                      className="rounded-lg border-gray-200"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            {/* 3. CHI TIẾT XE */}
            <section className="mb-6 bg-gray-50/50 p-6 rounded-2xl border border-dashed border-gray-200">
              <Text
                strong
                className="block mb-6 text-sm text-gray-400 uppercase tracking-widest"
              >
                Bước 3: Chi tiết yêu cầu
              </Text>
              <Row gutter={24}>
                {(currentType === "SELL" || currentType === "VALUATION") && (
                  <Col span={12}>
                    <Form.Item
                      name="licensePlate"
                      label={
                        <span className="font-medium text-gray-700">
                          Biển số xe
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Input
                        prefix={<AuditOutlined className="text-gray-300" />}
                        placeholder="Vd: 61A-12345"
                      />
                    </Form.Item>
                  </Col>
                )}

                <Col
                  span={
                    currentType === "SELL" || currentType === "VALUATION"
                      ? 12
                      : 24
                  }
                >
                  <Form.Item
                    name="carType"
                    label={
                      <span className="font-medium text-gray-700">
                        Mẫu xe & Đời xe
                      </span>
                    }
                  >
                    <Input
                      prefix={<CarOutlined className="text-gray-300" />}
                      placeholder="Vd: Toyota Vios 2021"
                    />
                  </Form.Item>
                </Col>

                {currentType === "BUY" && (
                  <Col span={24}>
                    <Form.Item
                      name="budget"
                      label={
                        <span className="font-medium text-gray-700">
                          Ngân sách dự kiến
                        </span>
                      }
                    >
                      <Input
                        prefix={<DollarOutlined className="text-gray-300" />}
                        placeholder="Vd: Tầm 500 triệu"
                      />
                    </Form.Item>
                  </Col>
                )}

                {currentType === "VALUATION" && (
                  <Col span={24}>
                    <Form.Item
                      name="expectedPrice"
                      label={
                        <span className="font-medium text-gray-700">
                          Giá mong muốn
                        </span>
                      }
                    >
                      <Input
                        prefix={<DollarOutlined className="text-gray-300" />}
                        placeholder="Mức giá khách kỳ vọng"
                      />
                    </Form.Item>
                  </Col>
                )}

                <Col span={24}>
                  <Form.Item
                    name="note"
                    label={
                      <span className="font-medium text-gray-700">
                        Ghi chú chi tiết
                      </span>
                    }
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="Mô tả thêm về tình trạng xe, màu sắc, địa điểm xem xe..."
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button
                size="large"
                className="rounded-lg px-8 h-12"
                onClick={() => form.resetFields()}
              >
                Làm lại
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                icon={<SendOutlined />}
                className="rounded-lg px-10 h-12 font-bold shadow-lg"
              >
                GỬI GIỚI THIỆU
              </Button>
            </div>
          </Form>
        </Card>

        <div className="mt-8 text-center">
          <Space className="text-gray-400 text-xs">
            <span>Chính sách bảo mật thông tin</span>
            <Divider type="vertical" />
            <span>Hotline hỗ trợ: 090x xxx xxx</span>
          </Space>
        </div>
      </div>
    </ConfigProvider>
  );
}

// Helper components bổ sung
import { Tag } from "antd";
