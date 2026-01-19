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
  Divider,
  Tooltip,
  Empty,
  Alert,
  DatePicker,
  Descriptions,
} from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  DollarOutlined,
  NumberOutlined,
  CarOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  BgColorsOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import {
  getMyAssignedLeads,
  getAvailableCars,
  getActiveReasonsAction,
  requestPurchaseApproval,
  requestSaleApproval,
  requestLoseApproval,
  updateCustomerStatusAction,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import dayjs from "dayjs";
import { LeadStatus, UrgencyType } from "@prisma/client";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Nếu bạn muốn hiển thị tiếng Việt (ví dụ: "2 giờ trước")

dayjs.extend(relativeTime);
dayjs.locale("vi"); // Kích hoạt tiếng Việt

const { Title, Text } = Typography;

export default function AssignedTasksPage() {
  const [form] = Form.useForm();
  const [failForm] = Form.useForm();
  const [contactForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // State mới cho Modal chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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

  const onContactFinish = async (values: any) => {
    try {
      setLoading(true);
      await updateCustomerStatusAction(
        selectedLead.id,
        "CONTACTED" as LeadStatus,
        values.note,
        values.nextContactAt?.toDate(),
      );
      messageApi.success("Đã ghi nhận tương tác!");
      setIsContactModalOpen(false);
      contactForm.resetFields();
      loadData();
    } catch (err: any) {
      messageApi.error(err.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const contractData = {
        contractNo: values.contractNo,
        price: values.actualPrice,
        note: values.contractNote,
      };

      if (selectedLead.type === "BUY") {
        await requestSaleApproval(selectedLead.id, values.carId, contractData);
        messageApi.success("Đã gửi yêu cầu duyệt bán xe và hợp đồng!");
      } else {
        const selectedModel = carModels.find((m) => m.id === values.carModelId);
        const carPayload = {
          ...values,
          modelName: selectedModel?.name || "Xe không định danh",
        };

        const purchasePayload = {
          carData: carPayload,
          contractData: contractData,
        };

        await requestPurchaseApproval(selectedLead.id, purchasePayload);
        messageApi.success("Đã gửi hồ sơ thu mua chờ duyệt!");
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
      const { reasonId, note } = values;
      await requestLoseApproval(selectedLead.id, reasonId, note || "");
      messageApi.success("Đã cập nhật trạng thái dừng chăm sóc");
      setIsFailModalOpen(false);
      loadData();
    } catch (err: any) {
      messageApi.error("Thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const UrgencyBadge = ({ type }: { type: UrgencyType | null }) => {
    switch (type) {
      case "HOT":
        return (
          <Tag color="error" className="animate-pulse font-bold">
            🔥 HOT
          </Tag>
        );
      case "WARM":
        return (
          <Tag color="warning" className="font-bold">
            ☀️ WARM
          </Tag>
        );
      case "COOL":
        return (
          <Tag color="processing" className="font-bold">
            ❄️ COOL
          </Tag>
        );
      default:
        return null;
    }
  };

  const ContractSection = () => (
    <Card size="small" className="bg-blue-50 border-blue-200 mt-4">
      <Title level={5} className="text-blue-700 !mt-0 !mb-4">
        <FileDoneOutlined className="mr-2" /> THÔNG TIN HỢP ĐỒNG KÝ KẾT
      </Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="contractNo"
            label="Số hợp đồng"
            rules={[{ required: true }]}
          >
            <Input prefix={<NumberOutlined />} placeholder="HĐ-2024-..." />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="actualPrice"
            label="Giá trị giao dịch"
            rules={[{ required: true }]}
          >
            <InputNumber
              className="w-full!"
              prefix={<DollarOutlined />}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              addonAfter="VND"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="contractNote" label="Ghi chú hợp đồng">
            <Input placeholder="Phụ lục, đặt cọc..." />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const columns = [
    {
      title: "Khách hàng",
      key: "customer",
      render: (record: any) => (
        <Space size="middle">
          <div>
            <div className="flex items-center gap-2">
              <Text strong className="text-indigo-700">
                {record.fullName}
              </Text>
              <UrgencyBadge type={record.urgencyLevel} />
            </div>
            <p className="text-sm text-gray-500">{record.phone}</p>
          </div>
        </Space>
      ),
    },
    {
      title: "Tương tác",
      key: "interaction",
      render: (record: any) => (
        <div className="text-[12px]">
          <div className="text-slate-400 italic">
            Gọi:{" "}
            {record.lastContactAt
              ? dayjs(record.lastContactAt).format("DD/MM HH:mm")
              : "---"}
          </div>
          <div className="text-rose-500 font-medium">
            Hẹn:{" "}
            {record.nextContactAt
              ? dayjs(record.nextContactAt).format("DD/MM HH:mm")
              : "---"}
          </div>
        </div>
      ),
    },
    {
      title: "Yêu cầu",
      dataIndex: "type",
      render: (type: string) => (
        <Tag
          color={type === "SELL" ? "volcano" : "green"}
          className="rounded-full"
        >
          {type === "SELL" ? "THU MUA" : "BÁN XE"}
        </Tag>
      ),
    },
    {
      title: "Quan tâm",
      render: (record: any) => (
        <div className="max-w-[150px] truncate font-medium text-slate-600">
          {record.carModel?.name || "Chưa chọn dòng"}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => (
        <Badge
          status={status.startsWith("PENDING") ? "warning" : "processing"}
          text={status}
        />
      ),
    },
    {
      title: "Thao tác",
      align: "right" as const,
      render: (record: any) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button
            icon={<SyncOutlined />}
            size="small"
            className="text-emerald-600 border-emerald-500"
            onClick={() => {
              setSelectedLead(record);
              setIsContactModalOpen(true);
            }}
          >
            Liên hệ
          </Button>
          <Button
            type="primary"
            size="small"
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
            type="text"
            icon={<CloseCircleOutlined />}
            onClick={() => {
              setSelectedLead(record);
              setIsFailModalOpen(true);
              getActiveReasonsAction("LOSE").then(setReasons);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f0f2f5] min-h-screen">
      {contextHolder}
      <div className="max-w-[1400px] mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <Title level={3} className="!mb-1">
              📋 Nhiệm vụ được giao
            </Title>
            <Text type="secondary">Quản lý và ưu tiên chăm sóc khách hàng</Text>
          </div>
          <Segmented
            size="large"
            options={[
              { label: "Tất cả", value: "ALL" },
              { label: "Tìm mua", value: "BUY" },
              { label: "Cần bán", value: "SELL" },
            ]}
            value={filterType}
            onChange={setFilterType}
          />
        </header>

        <Card bordered={false} className="shadow-sm rounded-xl">
          <Table
            dataSource={data.filter(
              (i: any) => filterType === "ALL" || i.type === filterType,
            )}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedLead(record);
                setIsDetailModalOpen(true);
              },
              className: "cursor-pointer hover:bg-slate-50 transition-colors",
            })}
          />
        </Card>
      </div>
      {/* --- MODAL 1: CHI TIẾT KHÁCH HÀNG --- */}

      <Modal
        title={
          <Space>
            <IdcardOutlined className="text-indigo-600" />
            <span className="font-bold">HỒ SƠ KHÁCH HÀNG CHI TIẾT</span>
          </Space>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={900} // Tăng độ rộng để hiển thị được nhiều cột thông tin
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="call"
            type="primary"
            icon={<PhoneOutlined />}
            onClick={() => {
              setIsDetailModalOpen(false);
              setIsContactModalOpen(true);
            }}
          >
            Ghi nhận tương tác
          </Button>,
        ]}
      >
        {selectedLead && (
          <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* 1. Header: Thông tin định danh nhanh */}
            <div className="flex justify-between items-start mb-6 p-4 bg-slate-50 border-l-4 border-indigo-500 rounded-r-lg">
              <Space size="large">
                <Avatar
                  size={70}
                  icon={<UserOutlined />}
                  className="bg-indigo-600 shadow-md"
                />
                <div>
                  <Title level={3} className="!mb-0 uppercase">
                    {selectedLead.fullName}
                  </Title>
                  <Space split={<Divider type="vertical" />}>
                    <Text strong className="text-lg text-indigo-700">
                      {selectedLead.phone}
                    </Text>
                    <Tag color="cyan" className="m-0">
                      {selectedLead.type}
                    </Tag>
                    <UrgencyBadge type={selectedLead.urgencyLevel} />
                  </Space>
                </div>
              </Space>
              <div className="text-right">
                <Text type="secondary">Trạng thái hiện tại</Text>
                <div className="mt-1">
                  <Tag color="blue" className="text-base px-3">
                    {selectedLead.status}
                  </Tag>
                </div>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              {/* 2. Nhóm: Thông tin Phụ trách & Nguồn */}
              <Col span={24}>
                <Descriptions
                  title="💼 Quản lý & Phụ trách"
                  bordered
                  size="small"
                  column={2}
                >
                  <Descriptions.Item label="Người giới thiệu">
                    {selectedLead.referrer?.fullName || "Hệ thống"} (
                    {selectedLead.referrer?.phone || "N/A"})
                  </Descriptions.Item>
                  <Descriptions.Item label="Nhân viên phụ trách">
                    {selectedLead.assignedTo?.fullName || (
                      <Text type="danger">Chưa bàn giao</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời điểm bàn giao">
                    {selectedLead.assignedAt
                      ? dayjs(selectedLead.assignedAt).format(
                          "DD/MM/YYYY HH:mm",
                        )
                      : "---"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo hồ sơ">
                    {dayjs(selectedLead.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              {/* 3. Nhóm: Nhu cầu xe chi tiết */}
              <Col span={24}>
                <Descriptions
                  title="🚗 Thông tin nhu cầu & Xe"
                  bordered
                  size="small"
                  column={2}
                >
                  <Descriptions.Item
                    label="Dòng xe quan tâm"
                    span={selectedLead.type === "BUY" ? 1 : 2}
                  >
                    <Text strong className="text-blue-600">
                      {selectedLead.carModel?.name ||
                        selectedLead.carYear ||
                        "Không xác định"}
                    </Text>
                  </Descriptions.Item>
                  {selectedLead.type === "BUY" && (
                    <Descriptions.Item label="Ngân sách dự kiến">
                      <Text strong className="text-emerald-600">
                        {selectedLead.budget || "Chưa rõ"}
                      </Text>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Biển số xe (nếu có)">
                    <Tag color="default" className="font-mono text-base">
                      {selectedLead.licensePlate || "---"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Giá mong muốn (Định giá)">
                    <Text strong color="orange">
                      {selectedLead.expectedPrice || "---"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú chi tiết" span={2}>
                    <div className="italic text-gray-600 italic">
                      {selectedLead.note || "Không có ghi chú thêm"}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              {/* 4. Nhóm: Lịch tương tác & Hẹn gọi lại */}
              <Col span={24}>
                <Descriptions
                  title={
                    <span className="text-rose-600">
                      <CalendarOutlined /> Lịch trình tương tác
                    </span>
                  }
                  bordered
                  size="small"
                  column={2}
                  className="bg-rose-50/20"
                >
                  <Descriptions.Item label="Liên hệ đầu tiên">
                    {selectedLead.firstContactAt
                      ? dayjs(selectedLead.firstContactAt).format(
                          "DD/MM/YYYY HH:mm",
                        )
                      : "Chưa thực hiện"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lần cuối tương tác">
                    {selectedLead.lastContactAt
                      ? dayjs(selectedLead.lastContactAt).format(
                          "DD/MM/YYYY HH:mm",
                        )
                      : "---"}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <Text strong className="text-rose-600">
                        Ngày hẹn gọi lại
                      </Text>
                    }
                    span={2}
                  >
                    {selectedLead.nextContactAt ? (
                      <Space>
                        <Text strong className="text-rose-600 text-lg">
                          {dayjs(selectedLead.nextContactAt).format(
                            "DD/MM/YYYY HH:mm",
                          )}
                        </Text>
                        <Badge
                          status="processing"
                          text={`(${dayjs(selectedLead.nextContactAt).fromNow()})`}
                        />
                      </Space>
                    ) : (
                      "Chưa có lịch hẹn"
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              {/* 5. Nhóm: Hình ảnh & Giấy tờ (Render ảnh từ Link Cloudinary/S3) */}
              <Col span={24}>
                <div className="ant-descriptions-title mb-3 mt-2">
                  🖼️ Hình ảnh & Giấy tờ đính kèm
                </div>
                <Row gutter={[12, 12]}>
                  {[
                    { label: "Ảnh xe", path: selectedLead.carImages },
                    {
                      label: "Đăng kiểm",
                      path: selectedLead.registrationImage,
                    },
                    { label: "CCCD Mặt trước", path: selectedLead.idCardFront },
                    { label: "CCCD Mặt sau", path: selectedLead.idCardBack },
                  ].map((img, index) => (
                    <Col span={6} key={index}>
                      <div className="border rounded p-2 text-center bg-gray-50">
                        <Text type="secondary" className="block mb-2">
                          {img.label}
                        </Text>
                        {img.path ? (
                          <img
                            src={img.path}
                            alt={img.label}
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            onClick={() => window.open(img.path, "_blank")}
                          />
                        ) : (
                          <div className="h-32 flex items-center justify-center bg-gray-200 rounded italic text-gray-400">
                            Trống
                          </div>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
      {/* --- MODAL 2: GHI NHẬN LIÊN HỆ --- */}
      <Modal
        title={
          <Space>
            <PhoneOutlined className="text-emerald-500" /> GHI NHẬN TƯƠNG TÁC
          </Space>
        }
        open={isContactModalOpen}
        onOk={() => contactForm.submit()}
        onCancel={() => setIsContactModalOpen(false)}
        okText="Lưu nhật ký"
        confirmLoading={loading}
        centered
      >
        <Form
          form={contactForm}
          layout="vertical"
          onFinish={onContactFinish}
          className="mt-4"
        >
          <Alert
            message={`Đang chăm sóc: ${selectedLead?.fullName}`}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="nextContactAt"
            label={
              <Text strong className="text-rose-600">
                <CalendarOutlined /> Hẹn lịch gọi lại (Nếu có)
              </Text>
            }
          >
            <DatePicker
              showTime
              className="w-full"
              placeholder="Chọn ngày và giờ khách hẹn"
              format="YYYY-MM-DD HH:mm"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>
          <Form.Item
            name="note"
            label="Nội dung trao đổi"
            rules={[
              { required: true, message: "Vui lòng nhập ghi chú cuộc gọi" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Khách hẹn cuối tuần qua xem xe..."
            />
          </Form.Item>
        </Form>
      </Modal>
      {/* --- MODAL 3: CHỐT DEAL --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-3 border-b">
            <SafetyCertificateOutlined className="text-indigo-600 text-2xl" />
            <span className="text-lg uppercase font-bold">
              {selectedLead?.type === "BUY"
                ? "PHÊ DUYỆT BÁN XE"
                : "HỒ SƠ THU MUA MỚI"}
            </span>
          </div>
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
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
          }}
          className="mt-4"
        >
          {selectedLead?.type === "BUY" ? (
            <div className="py-2">
              <Form.Item
                name="carId"
                label={<span className="font-bold">Chọn xe từ kho sẵn có</span>}
                rules={[{ required: true, message: "Vui lòng chọn xe" }]}
              >
                <Select
                  size="large"
                  showSearch
                  placeholder="Tìm theo tên xe hoặc biển số..."
                  options={inventory.map((c: any) => ({
                    label: `🚗 ${c.modelName} [${c.licensePlate || "Chưa biển"}]`,
                    value: c.id,
                  }))}
                />
              </Form.Item>
              <ContractSection />
            </div>
          ) : (
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <CarOutlined /> Thông tin cơ bản
                    </>
                  ),
                  children: (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="carModelId"
                            label="Dòng xe"
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
                        <Col span={6}>
                          <Form.Item
                            name="licensePlate"
                            label="Biển số"
                            rules={[{ required: true }]}
                          >
                            <Input
                              placeholder="VD: 51H12345"
                              className="uppercase"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="year"
                            label="Năm SX"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              className="w-full"
                              min={1990}
                              max={2026}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="vin" label="Số khung (VIN)">
                            <Input className="uppercase" maxLength={17} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="odo"
                            label="ODO (Km)"
                            rules={[{ required: true }]}
                          >
                            <InputNumber className="w-full" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <>
                      <SettingOutlined /> Thông số kỹ thuật
                    </>
                  ),
                  children: (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item name="transmission" label="Hộp số">
                            <Select
                              options={[
                                { label: "Tự động", value: "AUTOMATIC" },
                                { label: "Số sàn", value: "MANUAL" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="fuelType" label="Nhiên liệu">
                            <Select
                              options={[
                                { label: "Xăng", value: "GASOLINE" },
                                { label: "Dầu", value: "DIESEL" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="color" label="Màu sắc">
                            <Input />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
              ]}
            />
          )}
          {selectedLead?.type === "SELL" && <ContractSection />}
        </Form>
      </Modal>
      {/* --- MODAL 4: DỪNG CHĂM SÓC --- */}
      <Modal
        open={isFailModalOpen}
        onOk={() => failForm.submit()}
        onCancel={() => setIsFailModalOpen(false)}
        okButtonProps={{ danger: true }}
        okText="Xác nhận dừng"
        title="Dừng xử lý khách hàng"
      >
        <div className="text-center mb-6 pt-4">
          <ExclamationCircleOutlined className="text-red-500 text-5xl mb-3" />
          <p className="text-slate-500">
            Hành động này sẽ gửi yêu cầu lưu trữ hồ sơ và dừng chăm sóc khách
            hàng.
          </p>
        </div>
        <Form
          form={failForm}
          layout="vertical"
          onFinish={onFailFinish}
          initialValues={{ status: "LOSE" }}
        >
          <Form.Item name="status" label="Phân loại">
            <Select
              onChange={(val) => getActiveReasonsAction(val).then(setReasons)}
              options={[
                { label: "Thất bại (Cần phê duyệt)", value: "LOSE" },
                { label: "Tạm dừng (Đóng băng)", value: "FROZEN" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="reasonId"
            label="Lý do chi tiết"
            rules={[{ required: true }]}
          >
            <Select
              options={reasons.map((r) => ({ label: r.content, value: r.id }))}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú thêm">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
