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
  Row,
  Col,
  ConfigProvider,
  Select,
  InputNumber,
  Tag,
  Modal,
  notification,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  PhoneOutlined,
  AuditOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { createCustomerAction } from "@/actions/customer-actions";
import { getCarModelsAction } from "@/actions/car-actions";

const { Title, Text, Paragraph } = Typography;

export default function NewReferralPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentType, setCurrentType] = useState("SELL");
  const [userId, setUserId] = useState<string | null>(null);
  const [carModels, setCarModels] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((session) => {
        if (session?.id) setUserId(session.id);
      });

    const fetchModels = async () => {
      const models = await getCarModelsAction();
      setCarModels(models);
    };
    fetchModels();
  }, []);

  // Cập nhật hàm onFinish bên trong NewReferralPage
  const onFinish = async (values: any) => {
    if (!userId) return message.error("Phiên đăng nhập hết hạn.");
    setLoading(true);
    try {
      await createCustomerAction({ ...values, referrerId: userId });

      // Thông báo thành công
      notification.success({
        message: "Gửi thành công!",
        description: "Thông tin đã được chuyển đến bộ phận thu mua.",
        placement: "topRight",
      });

      form.resetFields();
      setCurrentType("SELL");
    } catch (err: any) {
      // XỬ LÝ THÔNG BÁO NẾU TRÙNG (Catch lỗi từ Server Action)
      Modal.error({
        title: "Không thể gửi giới thiệu",
        content: err.message, // Hiển thị nội dung: "Thông tin đã được giới thiệu bởi [Nguyễn Văn A]..."
        okText: "Đã hiểu",
        centered: true,
        okButtonProps: { danger: true },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d32f2f",
          borderRadius: 8,
        },
      }}
    >
      <div className="max-w-4xl mx-auto py-4 md:py-8 px-3 md:px-4 animate-fadeIn">
        {/* Header Section - Responsive Flex */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <Title
              level={2}
              className="!mb-1 !text-xl md:!text-2xl !font-bold tracking-tight text-gray-800 uppercase"
            >
              Gửi giới thiệu mới
            </Title>
            <Paragraph className="text-gray-500 !mb-0 text-sm md:text-base">
              Hệ thống tiếp nhận thông tin khách hàng 24/7.
            </Paragraph>
          </div>
          <Tag
            color="blue"
            icon={<InfoCircleOutlined />}
            className="py-1 px-3 m-0"
          >
            Phòng kinh doanh
          </Tag>
        </div>

        <Card className="shadow-md border-none rounded-xl md:rounded-2xl overflow-hidden">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            size="large"
            initialValues={{ type: "SELL" }}
            className="p-0 md:p-2"
          >
            {/* 1. KHỐI NHU CẦU - Cuộn ngang trên mobile nếu cần */}
            <section className="mb-8">
              <Text
                strong
                className="block mb-4 text-[11px] md:text-sm text-gray-400 uppercase tracking-widest"
              >
                Bước 1: Chọn nhu cầu khách hàng
              </Text>
              <Form.Item name="type" className="mb-0">
                <Radio.Group
                  block
                  optionType="button"
                  buttonStyle="solid"
                  onChange={(e) => setCurrentType(e.target.value)}
                  className="flex flex-col sm:flex-row gap-2 bg-transparent md:bg-gray-50 p-0 md:p-1 md:rounded-xl"
                >
                  <Radio.Button
                    value="SELL"
                    className="flex-1 !rounded-lg border-gray-200 text-center font-semibold h-12 md:h-14 leading-[46px] md:leading-[52px]"
                  >
                    BÁN / ĐỔI XE
                  </Radio.Button>
                  <Radio.Button
                    value="BUY"
                    className="flex-1 !rounded-lg border-gray-200 text-center font-semibold h-12 md:h-14 leading-[46px] md:leading-[52px]"
                  >
                    MUA XE CŨ
                  </Radio.Button>
                  <Radio.Button
                    value="VALUATION"
                    className="flex-1 !rounded-lg border-gray-200 text-center font-semibold h-12 md:h-14 leading-[46px] md:leading-[52px]"
                  >
                    ĐỊNH GIÁ
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </section>

            {/* 2. THÔNG TIN KHÁCH HÀNG - 1 cột mobile, 2 cột desktop */}
            <section className="mb-8">
              <Text
                strong
                className="block mb-6 text-[11px] md:text-sm text-gray-400 uppercase tracking-widest"
              >
                Bước 2: Thông tin liên hệ
              </Text>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="fullName"
                    label={<span className="font-medium">Tên khách hàng</span>}
                    rules={[{ required: true, message: "Bắt buộc nhập" }]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-300" />}
                      placeholder="Họ và tên"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label={<span className="font-medium">Số điện thoại</span>}
                    rules={[
                      { required: true, message: "Bắt buộc nhập" },
                      { pattern: /^[0-9]+$/, message: "SĐT không hợp lệ" },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined className="text-gray-300" />}
                      placeholder="Nhập số điện thoại"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            {/* 3. CHI TIẾT XE */}
            <section className="mb-6 bg-gray-50/50 p-4 md:p-6 rounded-xl border border-dashed border-gray-200">
              <Text
                strong
                className="block mb-6 text-[11px] md:text-sm text-gray-400 uppercase tracking-widest"
              >
                Bước 3: Chi tiết yêu cầu
              </Text>
              <Row gutter={[16, 0]}>
                {(currentType === "SELL" || currentType === "VALUATION") && (
                  <Col span={24} className="mb-4">
                    <Form.Item
                      name="licensePlate"
                      label={<span className="font-medium">Biển số xe</span>}
                      extra={
                        <span className="text-[10px] text-gray-400">
                          Hệ thống sẽ kiểm tra trùng lặp dựa trên biển số này
                        </span>
                      }
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
                          message: "Vui lòng nhập biển số xe!",
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
                      <Input
                        prefix={<AuditOutlined className="text-gray-300" />}
                        placeholder="Vd: 61A12345"
                        className="uppercase font-bold text-blue-600"
                        maxLength={9} // ✅ CHẶN NGAY TỪ INPUT
                        showCount // (tuỳ chọn) hiển thị số ký tự
                      />
                    </Form.Item>
                  </Col>
                )}

                <Col xs={24} md={16}>
                  <Form.Item
                    name="carModelId"
                    label={<span className="font-medium">Mẫu xe</span>}
                    rules={[{ required: true, message: "Chọn mẫu xe" }]}
                  >
                    <Select
                      showSearch
                      placeholder="Chọn dòng xe"
                      optionFilterProp="label"
                      options={carModels.map((m) => ({
                        label: m.name,
                        value: m.id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="carYear"
                    label={<span className="font-medium">Đời xe (Năm)</span>}
                  >
                    <InputNumber
                      placeholder="Vd: 2022"
                      className="w-full! rounded-lg"
                      prefix={<CalendarOutlined className="text-gray-300" />}
                    />
                  </Form.Item>
                </Col>

                {currentType === "BUY" && (
                  <Col span={24}>
                    <Form.Item
                      name="budget"
                      label={
                        <span className="font-medium">Ngân sách dự kiến</span>
                      }
                    >
                      <InputNumber
                        className="w-full!"
                        placeholder="Vd: 500.000.000"
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                        addonAfter="VNĐ"
                      />
                    </Form.Item>
                  </Col>
                )}

                {currentType === "VALUATION" && (
                  <Col span={24}>
                    <Form.Item
                      name="expectedPrice"
                      label={<span className="font-medium">Giá mong muốn</span>}
                    >
                      <Input
                        prefix={<DollarOutlined className="text-gray-300" />}
                        placeholder="Mức giá kỳ vọng"
                      />
                    </Form.Item>
                  </Col>
                )}

                <Col span={24}>
                  <Form.Item
                    name="note"
                    label={<span className="font-medium">Ghi chú</span>}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Mô tả thêm tình trạng xe..."
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            {/* Nút hành động - Full width trên mobile */}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
              <Button
                size="large"
                icon={<UndoOutlined />}
                className="w-full md:w-auto rounded-lg px-8 h-12 text-gray-500"
                onClick={() => {
                  form.resetFields();
                  setCurrentType("SELL");
                }}
              >
                Làm lại
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                icon={<SendOutlined />}
                className="w-full md:w-auto rounded-lg px-10 h-12 font-bold shadow-lg"
              >
                GỬI GIỚI THIỆU
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
