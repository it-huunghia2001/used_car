/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Card,
  Typography,
  message,
  Row,
  Col,
  Select,
  InputNumber,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  getMyAssignedLeads,
  getAvailableCars,
  processCarPurchase,
  processCarSale,
  processLeadFailed, // Đảm bảo hàm này đã được export từ file actions
} from "@/actions/task-actions";

const { Title, Text } = Typography;

export default function AssignedTasksPage() {
  const [form] = Form.useForm();
  const [failForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // 1. Tải dữ liệu từ Server
  const loadData = async () => {
    setLoading(true);
    try {
      const [leads, cars]: any = await Promise.all([
        getMyAssignedLeads(),
        getAvailableCars(),
      ]);
      setData(leads);
      setInventory(cars);
    } catch (err) {
      message.error("Lỗi tải dữ liệu hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Mở Modal xử lý Thành công
  const handleAction = (record: any) => {
    setSelectedLead(record);
    setIsModalOpen(true);
    form.resetFields();
    if (record.type !== "BUY") {
      form.setFieldsValue({ modelName: record.carType });
    }
  };

  // 3. Mở Modal xử lý Thất bại
  const handleOpenFailModal = (record: any) => {
    setSelectedLead(record);
    setIsFailModalOpen(true);
    failForm.resetFields();
  };

  // 4. Submit Thành công (Thu mua hoặc Bán xe)
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      if (selectedLead.type === "BUY") {
        await processCarSale(selectedLead.id, values.carId);
        message.success("Đã chốt bán xe và bàn giao thành công!");
      } else {
        await processCarPurchase(selectedLead.id, values);
        message.success("Đã hoàn tất thu mua và nhập kho!");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Thất bại (Hủy Lead)
  const onFailFinish = async (values: any) => {
    try {
      setLoading(true);
      await processLeadFailed(selectedLead.id, values.reason);
      message.warning("Đã cập nhật trạng thái thất bại");
      setIsFailModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || "Không thể cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "KHÁCH HÀNG",
      key: "customer",
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            <UserOutlined /> {record.fullName}
          </Text>
          <Text type="secondary" className="text-[12px]">
            <PhoneOutlined /> {record.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "NHU CẦU",
      dataIndex: "type",
      width: 150,
      render: (type: string) => {
        const config: any = {
          SELL: { color: "orange", text: "BÁN XE" },
          BUY: { color: "green", text: "MUA XE" },
          VALUATION: { color: "blue", text: "ĐỊNH GIÁ" },
        };
        return <Tag color={config[type]?.color}>{config[type]?.text}</Tag>;
      },
    },
    {
      title: "GHI CHÚ BAN ĐẦU",
      key: "note",
      render: (record: any) => (
        <div className="max-w-[200px] text-[12px] italic text-gray-500">
          {record.carType || "N/A"} - {record.note || "Không có ghi chú"}
        </div>
      ),
    },
    {
      title: "THAO TÁC",
      align: "right" as const,
      render: (record: any) => (
        <Space>
          <Button
            type="primary"
            icon={
              record.type === "BUY" ? (
                <ShoppingCartOutlined />
              ) : (
                <CheckCircleOutlined />
              )
            }
            danger={record.type !== "BUY"}
            onClick={() => handleAction(record)}
          >
            Thành công
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            onClick={() => handleOpenFailModal(record)}
          >
            Thất bại
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card
        title={
          <Space>
            <ExclamationCircleOutlined className="text-blue-500" />
            <Title level={4} style={{ margin: 0 }}>
              Công việc được phân bổ
            </Title>
          </Space>
        }
        className="shadow-sm border-none"
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* MODAL XỬ LÝ THÀNH CÔNG */}
      <Modal
        title={
          selectedLead?.type === "BUY"
            ? "CHỐT ĐƠN BÁN XE"
            : "NHẬP XE THU MUA VÀO KHO"
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        confirmLoading={loading}
        okText="Xác nhận hoàn tất"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-4"
        >
          <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
            <Row gutter={16}>
              <Col span={12}>
                <Text>Khách hàng: </Text>
                <strong>{selectedLead?.fullName}</strong>
              </Col>
              <Col span={12}>
                <Text>Số điện thoại: </Text>
                <strong>{selectedLead?.phone}</strong>
              </Col>
            </Row>
          </div>

          {selectedLead?.type === "BUY" ? (
            <Form.Item
              name="carId"
              label="Chọn xe từ kho để bàn giao"
              rules={[{ required: true, message: "Vui lòng chọn xe" }]}
            >
              <Select
                placeholder="Tìm kiếm xe theo tên hoặc số khung..."
                showSearch
                optionFilterProp="label"
                size="large"
              >
                {inventory.map((car: any) => (
                  <Select.Option
                    key={car.id}
                    value={car.id}
                    label={`${car.modelName} ${car.vin}`}
                  >
                    <div className="flex justify-between py-1">
                      <Space direction="vertical" size={0}>
                        <span className="font-medium text-blue-600">
                          {car.modelName}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Màu: {car.color}
                        </span>
                      </Space>
                      <span className="text-gray-400 font-mono text-[12px]">
                        {car.vin}
                      </span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="modelName"
                    label="Tên dòng xe chính xác"
                    rules={[{ required: true }]}
                  >
                    <Input
                      placeholder="Vd: Toyota Vios 1.5G 2023"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="vin"
                    label="Số khung (VIN)"
                    rules={[
                      {
                        required: true,
                        len: 17,
                        message: "VIN phải đúng 17 ký tự",
                      },
                    ]}
                  >
                    <Input
                      className="uppercase font-mono"
                      maxLength={17}
                      placeholder="17 ký tự"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="licensePlate" label="Biển số xe">
                    <Input className="uppercase" placeholder="Vd: 30A-12345" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="color"
                    label="Màu sắc"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Vd: Trắng" />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    name="price"
                    label="Giá chốt giao dịch"
                    rules={[{ required: true, message: "Cần nhập giá" }]}
                  >
                    <InputNumber
                      className="w-full"
                      size="large"
                      formatter={(v) =>
                        `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      suffix="VNĐ"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="location"
                label="Vị trí đỗ bãi (Lưu kho)"
                rules={[{ required: true }]}
              >
                <Input placeholder="Vd: Khu B - Tầng 2" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* MODAL XỬ LÝ THẤT BẠI */}
      <Modal
        title={
          <Space className="text-red-500">
            <CloseCircleOutlined />
            <span>XÁC NHẬN GIAO DỊCH THẤT BẠI</span>
          </Space>
        }
        open={isFailModalOpen}
        onOk={() => failForm.submit()}
        onCancel={() => setIsFailModalOpen(false)}
        okText="Xác nhận hủy Lead"
        okButtonProps={{ danger: true }}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form
          form={failForm}
          layout="vertical"
          onFinish={onFailFinish}
          className="mt-4"
        >
          <Text type="secondary">
            Vui lòng nhập lý do cụ thể khiến khách hàng không thực hiện giao
            dịch này.
          </Text>
          <Form.Item
            name="reason"
            label="Lý do thất bại"
            className="mt-4"
            rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Vd: Khách đổi ý không bán nữa, giá chào mua quá thấp, xe bị lỗi nặng khi kiểm tra..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
