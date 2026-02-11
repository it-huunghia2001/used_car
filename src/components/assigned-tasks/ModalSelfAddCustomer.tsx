/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  InputNumber,
  Divider,
  Space,
  Typography,
  ConfigProvider,
  Button,
} from "antd";
import {
  UserAddOutlined,
  CarOutlined,
  InfoCircleOutlined,
  TagOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  WarningFilled,
  PhoneOutlined,
  FontSizeOutlined,
} from "@ant-design/icons";
import { selfCreateCustomerAction } from "@/actions/task-actions";

const { Title, Text } = Typography;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  carModels: any[];
  onSuccess: () => void;
}

export default function ModalSelfAddCustomer({
  isOpen,
  onClose,
  carModels,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // --- HÀM HIỂN THỊ THÔNG BÁO CHUYÊN NGHIỆP ---
  const showNotification = (
    type: "success" | "error" | "warning",
    msg: string,
  ) => {
    const isSuccess = type === "success";
    const isWarning = type === "warning";

    // Không gán biến 'modal' để tránh lỗi unused variable
    Modal[type]({
      icon: null,
      width: 480,
      centered: true,
      okText: "Đã hiểu",
      okButtonProps: {
        size: "large",
        type: "primary",
        className: isSuccess
          ? "bg-emerald-600"
          : isWarning
            ? "bg-amber-500"
            : "bg-red-600",
      },
      content: (
        <div className="text-center py-6">
          <div className="mb-6">
            {isSuccess && (
              <CheckCircleFilled style={{ fontSize: 72, color: "#10b981" }} />
            )}
            {isWarning && (
              <WarningFilled style={{ fontSize: 72, color: "#f59e0b" }} />
            )}
            {type === "error" && (
              <CloseCircleFilled style={{ fontSize: 72, color: "#ef4444" }} />
            )}
          </div>
          <Title level={3} className="mb-3 tracking-tight">
            {isSuccess
              ? "THÀNH CÔNG"
              : isWarning
                ? "DỮ LIỆU TRÙNG LẶP"
                : "CÓ LỖI XẢY RA"}
          </Title>
          <div className="px-4">
            <Text className="text-gray-500 text-lg leading-relaxed">
              {isSuccess
                ? "Hồ sơ khách hàng tự khai thác đã được khởi tạo. Bạn có thể bắt đầu chăm sóc ngay mà không bị áp KPI thời hạn."
                : msg}
            </Text>
          </div>
        </div>
      ),
    });
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await selfCreateCustomerAction(values);

      if (res.success) {
        onClose();
        showNotification("success", "");
        form.resetFields();
        onSuccess();
      } else {
        const errorMsg =
          (res as any).error || "Dữ liệu này đã tồn tại trong hệ thống.";
        showNotification("warning", errorMsg);
      }
    } catch (error: any) {
      showNotification("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space size={12} className="py-2">
          <div className="bg-blue-600 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <UserAddOutlined className="text-white text-xl" />
          </div>
          <div className="flex flex-col">
            <Text className="uppercase font-black text-slate-800 tracking-wider">
              Tạo Hồ Sơ Khách Hàng
            </Text>
            <Text className="text-[10px] text-blue-500 font-bold uppercase italic">
              Chế độ: Tự khai thác (Không KPI)
            </Text>
          </div>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={780}
      centered
      okText="Xác nhận & Lưu hồ sơ"
      cancelText="Hủy bỏ"
      maskClosable={false}
      className="modal-custom-border"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ type: "SELL" }}
        autoComplete="off"
        className="mt-6"
      >
        {/* KHỐI 1: ĐỊNH DANH */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 mb-6">
          <Divider titlePlacement="left" plain className="m-0! mb-5!">
            <Space className="text-slate-400 uppercase text-[11px] font-bold tracking-widest">
              <InfoCircleOutlined /> Thông tin khách hàng
            </Space>
          </Divider>
          <Row gutter={20}>
            <Col xs={24} md={12}>
              <Form.Item
                name="fullName"
                label={
                  <span className="font-semibold text-slate-600">
                    Họ và tên khách
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: "Vui lòng không bỏ trống tên khách",
                  },
                ]}
              >
                <Input
                  prefix={<FontSizeOutlined className="text-slate-300" />}
                  placeholder="VD: Nguyễn Văn A"
                  size="large"
                  className="rounded-xl border-slate-200"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label={
                  <span className="font-semibold text-slate-600">
                    Số điện thoại liên hệ
                  </span>
                }
                rules={[
                  { required: true, message: "Vui lòng nhập SĐT" },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "SĐT phải từ 10-11 chữ số",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined className="text-slate-300" />}
                  placeholder="09xx xxx xxx"
                  size="large"
                  className="rounded-xl border-slate-200"
                  onChange={(e) => {
                    // Chỉ giữ lại các ký tự là số, loại bỏ chữ và ký tự đặc biệt ngay lập tức
                    const value = e.target.value.replace(/\D/g, "");
                    // Cập nhật lại giá trị sạch vào form
                    form.setFieldsValue({ phone: value });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* KHỐI 2: NGHIỆP VỤ */}
        <Row gutter={20}>
          <Col xs={24} md={12}>
            <Form.Item
              name="type"
              label={
                <span className="font-semibold text-slate-600">
                  Loại hình giao dịch
                </span>
              }
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                className="w-full rounded-xl"
                options={[
                  { value: "SELL", label: "🤝 Thu mua xe (Khách bán)" },
                  { value: "SELL_TRADE_NEW", label: "♻️ Thu cũ - Đổi xe mới" },
                  { value: "SELL_TRADE_USED", label: "🔄 Thu cũ - Đổi xe cũ" },
                  { value: "VALUATION", label: "⚖️ Định giá xe" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="licensePlate"
              label={
                <span className="font-semibold text-slate-600">
                  Biển số phương tiện
                </span>
              }
              getValueFromEvent={(e) =>
                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
              }
            >
              <Input
                size="large"
                placeholder="VD: 51H12345"
                className="uppercase font-bold text-blue-600 rounded-xl border-slate-200 placeholder:font-normal placeholder:text-slate-300"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* KHỐI 3: XE */}
        <Divider titlePlacement="left" plain className="my-6!">
          <Space className="text-slate-400 uppercase text-[11px] font-bold tracking-widest">
            <CarOutlined /> Thông tin dòng xe
          </Space>
        </Divider>

        <Row gutter={20}>
          <Col xs={24} md={16}>
            <Form.Item
              name="carModelId"
              label={
                <span className="font-semibold text-slate-600">
                  Model xe khách hàng
                </span>
              }
            >
              <Select
                size="large"
                showSearch
                allowClear
                placeholder="Tìm kiếm model xe (Innova, Camry...)"
                optionFilterProp="label"
                options={carModels.map((m) => ({ label: m.name, value: m.id }))}
                className="rounded-xl"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="year"
              label={
                <span className="font-semibold text-slate-600">
                  Năm sản xuất
                </span>
              }
            >
              <InputNumber
                className="w-full! rounded-xl border-slate-200"
                size="large"
                placeholder="2024"
                min={1990}
                max={2026}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item
              name="tradeInModelId"
              label={
                <span className="font-semibold text-slate-600">
                  Model khách hàng quan tâm
                </span>
              }
            >
              <Select
                size="large"
                showSearch
                allowClear
                placeholder="Tìm kiếm model xe (Innova, Camry...)"
                optionFilterProp="label"
                options={carModels.map((m) => ({ label: m.name, value: m.id }))}
                className="rounded-xl"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="note"
              label={
                <span className="font-semibold text-slate-600">
                  Ghi chú & Nguồn khách
                </span>
              }
            >
              <Input.TextArea
                rows={3}
                placeholder="Mô tả ngắn gọn về tình trạng xe hoặc nguồn khách (Bạn bè, Facebook, khách vãng lai...)"
                className="rounded-xl border-slate-200"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
