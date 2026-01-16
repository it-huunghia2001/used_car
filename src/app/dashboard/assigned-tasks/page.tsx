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
  Row,
  Col,
  Select,
  InputNumber,
  Segmented,
  Avatar,
  message,
  Badge,
  Tabs,
  Alert,
} from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  getMyAssignedLeads,
  getAvailableCars,
  getActiveReasonsAction,
  requestPurchaseApproval,
  requestSaleApproval,
  requestLoseApproval,
  processLeadStatusUpdate,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";

const { Title, Text } = Typography;

export default function AssignedTasksPage() {
  const [form] = Form.useForm();
  const [failForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterType, setFilterType] = useState<any>("ALL");
  const [carModels, setCarModels] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leads, cars, models]: any = await Promise.all([
        getMyAssignedLeads(),
        getAvailableCars(),
        getCarModelsAction(),
      ]);
      setData(leads);
      setInventory(cars);
      setCarModels(models);
    } catch (err) {
      messageApi.error("Không thể tải danh sách dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      if (selectedLead.type === "BUY") {
        await requestSaleApproval(selectedLead.id, values.carId);
        messageApi.success("Đã gửi yêu cầu duyệt bán xe!");
      } else {
        // Lấy tên Model từ ID để lưu vào bản ghi Car sau này
        const selectedModel = carModels.find((m) => m.id === values.carModelId);
        const payload = {
          ...values,
          modelName: selectedModel?.name || "Xe không định danh",
        };
        await requestPurchaseApproval(selectedLead.id, payload);
        messageApi.success("Đã gửi yêu cầu duyệt thu mua xe!");
      }
      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      messageApi.error(err.message || "Gửi yêu cầu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onFailFinish = async (values: any) => {
    try {
      setLoading(true);
      if (values.status === "LOSE") {
        await requestLoseApproval(
          selectedLead.id,
          values.reasonId,
          values.note || ""
        );
        messageApi.info("Yêu cầu đóng hồ sơ Thất bại đã gửi tới quản lý.");
      } else {
        await processLeadStatusUpdate(
          selectedLead.id,
          values.status,
          values.reasonId,
          values.note || ""
        );
        messageApi.success(`Đã cập nhật trạng thái: ${values.status}`);
      }
      setIsFailModalOpen(false);
      failForm.resetFields();
      loadData();
    } catch (err: any) {
      messageApi.error(err.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Khách hàng",
      key: "customer",
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} className="bg-slate-400" />
          <div>
            <div className="font-bold text-slate-800">{record.fullName}</div>
            <div className="text-slate-500 text-xs">{record.phone}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => {
        if (status.startsWith("PENDING_")) {
          return (
            <Tag icon={<SyncOutlined spin />} color="warning">
              Chờ duyệt
            </Tag>
          );
        }
        return <Badge status="processing" text={status} />;
      },
    },
    {
      title: "Nhu cầu",
      render: (record: any) => (
        <div>
          <Tag color={record.type === "SELL" ? "orange" : "green"}>
            {record.type === "SELL" ? "Thu mua" : "Bán xe"}
          </Tag>
          <span className="text-sm font-medium">{record.carModel?.name}</span>
        </div>
      ),
    },
    {
      title: "Thao tác",
      align: "right" as const,
      render: (record: any) => (
        <Space>
          <Button
            type="primary"
            disabled={record.status.startsWith("PENDING_")}
            onClick={() => {
              setSelectedLead(record);
              setIsModalOpen(true);
              form.resetFields();
            }}
          >
            Chốt Deal
          </Button>
          <Button
            danger
            disabled={record.status.startsWith("PENDING_")}
            icon={<CloseCircleOutlined />}
            onClick={() => {
              setSelectedLead(record);
              setIsFailModalOpen(true);
              getActiveReasonsAction("LOSE").then(setReasons);
            }}
          >
            Dừng
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      {contextHolder}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <Title level={2}>📋 Nhiệm vụ của tôi</Title>
            <Text type="secondary">
              Quản lý và xử lý tiến độ khách hàng được giao
            </Text>
          </div>
          <Segmented
            size="large"
            options={[
              { label: "Tất cả", value: "ALL" },
              { label: "Mua xe", value: "BUY" },
              { label: "Bán xe", value: "SELL" },
            ]}
            value={filterType}
            onChange={setFilterType}
          />
        </div>

        <Card bordered={false} className="shadow-md rounded-2xl">
          <Table
            dataSource={data.filter(
              (i: any) => filterType === "ALL" || i.type === filterType
            )}
            columns={columns}
            rowKey="id"
            loading={loading}
          />
        </Card>
      </div>

      {/* MODAL THU MUA/BÁN */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b">
            <ShoppingCartOutlined className="text-blue-600 text-xl" />
            <span className="uppercase font-bold text-slate-700">
              {selectedLead?.type === "BUY"
                ? "Đề xuất bán xe cho khách"
                : "Lập hồ sơ thu mua xe"}
            </span>
          </div>
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
        okText="Gửi yêu cầu phê duyệt"
        centered
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="pt-4"
          initialValues={{
            transmission: "AUTOMATIC",
            fuelType: "GASOLINE",
            carType: "SUV",
            seats: 5,
          }}
        >
          {selectedLead?.type === "BUY" ? (
            /* GIAO DIỆN KHI NHÂN VIÊN BÁN XE TỪ KHO CHO KHÁCH */
            <div className="py-10">
              <Form.Item
                name="carId"
                label={
                  <span className="font-semibold">Chọn xe đang có tại kho</span>
                }
                rules={[{ required: true, message: "Vui lòng chọn xe để bán" }]}
              >
                <Select
                  size="large"
                  placeholder="Tìm theo tên xe hoặc biển số..."
                  showSearch
                  optionFilterProp="label"
                  options={inventory.map((c: any) => ({
                    label: `${c.modelName} - Biển: ${
                      c.licensePlate || "Chưa có"
                    } - Giá gốc: ${Number(c.costPrice).toLocaleString()}đ`,
                    value: c.id,
                  }))}
                />
              </Form.Item>
              <Alert
                message="Lưu ý: Chỉ những xe có trạng thái 'Sẵn sàng bán' mới hiển thị ở đây."
                type="info"
                showIcon
              />
            </div>
          ) : (
            /* GIAO DIỆN KHI NHÂN VIÊN THU MUA XE CỦA KHÁCH VÀO KHO */
            <Tabs
              type="card"
              items={[
                {
                  key: "1",
                  label: <span className="px-4">📋 Thông tin định danh</span>,
                  children: (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <Row gutter={[16, 0]}>
                        <Col span={12}>
                          <Form.Item
                            name="carModelId"
                            label="Dòng xe hệ thống"
                            rules={[{ required: true }]}
                          >
                            <Select
                              showSearch
                              options={carModels.map((m) => ({
                                label: m.name,
                                value: m.id,
                              }))}
                              placeholder="Chọn model xe"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="price"
                            label="Giá đề xuất thu mua (VNĐ)"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              className="w-full!"
                              size="large"
                              formatter={(v) =>
                                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                              }
                              addonAfter="VND"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="vin" label="Số khung (VIN)">
                            <Input
                              className="uppercase font-mono"
                              placeholder="17 ký tự"
                              maxLength={17}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="engineNumber" label="Số máy">
                            <Input
                              className="uppercase font-mono"
                              placeholder="Nhập số máy"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="licensePlate"
                            label="Biển kiểm soát"
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng nhập biển số",
                              },
                              {
                                pattern: /^[A-Z0-9]{1,9}$/,
                                message:
                                  "Biển số chỉ gồm chữ, số, không khoảng trắng/ký tự đặc biệt",
                              },
                            ]}
                          >
                            <Input
                              className="uppercase font-mono"
                              placeholder="VD: 51H12345"
                              maxLength={9} // Giới hạn tối đa 9 ký tự
                              onChange={(e) => {
                                // Tự động xóa khoảng trắng và ký tự đặc biệt khi người dùng gõ
                                const value = e.target.value
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9]/g, "");
                                form.setFieldsValue({ licensePlate: value });
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="year"
                            label="Năm sản xuất"
                            rules={[{ required: true }]}
                          >
                            <InputNumber className="w-full!" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="origin" label="Xuất xứ">
                            <Select
                              options={[
                                { label: "Nhập khẩu", value: "Nhập khẩu" },
                                {
                                  label: "Lắp ráp trong nước",
                                  value: "Lắp ráp",
                                },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="odo"
                            label="Số Km đã đi (ODO)"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              className="w-full!"
                              addonAfter="Km"
                              formatter={(v) =>
                                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                              }
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: <span className="px-4">⚙️ Thông số kỹ thuật</span>,
                  children: (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <Row gutter={[16, 0]}>
                        <Col span={8}>
                          <Form.Item name="transmission" label="Hộp số">
                            <Select
                              options={[
                                { label: "Số tự động", value: "AUTOMATIC" },
                                { label: "Số sàn", value: "MANUAL" },
                                { label: "Vô cấp (CVT)", value: "CVT" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="fuelType" label="Nhiên liệu">
                            <Select
                              options={[
                                { label: "Xăng", value: "GASOLINE" },
                                { label: "Dầu (Diesel)", value: "DIESEL" },
                                { label: "Hybrid", value: "HYBRID" },
                                { label: "Điện", value: "ELECTRIC" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="carType" label="Kiểu dáng">
                            <Select
                              options={[
                                { label: "SUV", value: "SUV" },
                                { label: "Sedan", value: "SEDAN" },
                                { label: "Hatchback", value: "HATCHBACK" },
                                { label: "Pickup", value: "PICKUP" },
                                { label: "MPV", value: "MPV" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="engineSize"
                            label="Dung tích động cơ"
                          >
                            <Input placeholder="VD: 2.5L, 1.5 Turbo" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="driveTrain" label="Hệ dẫn động">
                            <Input placeholder="VD: 4WD, FWD, RWD" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="seats" label="Số chỗ ngồi">
                            <InputNumber className="w-full" min={2} max={50} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="color" label="Màu ngoại thất">
                            <Input placeholder="Trắng, Đen, Đỏ..." />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="interiorColor" label="Màu nội thất">
                            <Input placeholder="Kem, Nâu, Đen..." />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: "3",
                  label: <span className="px-4">📝 Mô tả & Cam kết</span>,
                  children: (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <Form.Item
                        name="features"
                        label="Trang bị nổi bật (Options)"
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Cửa sổ trời, Phanh tay điện tử, Ghế điện, Loa JBL..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="description"
                        label="Tình trạng thực tế & Cam kết chất lượng"
                      >
                        <Input.TextArea
                          rows={5}
                          placeholder="Xe không đâm đụng, không ngập nước, máy móc nguyên bản, bảo dưỡng định kỳ tại hãng..."
                        />
                      </Form.Item>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Form>
      </Modal>

      {/* MODAL DỪNG LEAD */}
      <Modal
        open={isFailModalOpen}
        onOk={() => failForm.submit()}
        onCancel={() => setIsFailModalOpen(false)}
        okButtonProps={{ danger: true }}
      >
        <div className="text-center py-4">
          <ExclamationCircleOutlined className="text-amber-500 text-4xl mb-2" />
          <Title level={4}>Dừng chăm sóc khách hàng</Title>
        </div>
        <Form
          form={failForm}
          layout="vertical"
          onFinish={onFailFinish}
          initialValues={{ status: "LOSE" }}
        >
          <Form.Item name="status" label="Loại trạng thái">
            <Select
              onChange={(val) => getActiveReasonsAction(val).then(setReasons)}
              options={[
                { label: "Thất bại (Cần duyệt)", value: "LOSE" },
                { label: "Tạm dừng (Frozen)", value: "FROZEN" },
                { label: "Chờ xem xe (Pending)", value: "PENDING_VIEW" },
              ]}
            />
          </Form.Item>
          <Form.Item name="reasonId" label="Lý do" rules={[{ required: true }]}>
            <Select
              options={reasons.map((r) => ({ label: r.content, value: r.id }))}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
