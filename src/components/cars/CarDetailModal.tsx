/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Modal,
  Descriptions,
  Tabs,
  Tag,
  Table,
  Typography,
  Space,
  Divider,
  Row,
  Col,
  Card,
  Avatar,
  Statistic,
  Empty,
} from "antd";
import {
  CarOutlined,
  HistoryOutlined,
  UserOutlined,
  DollarCircleOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface CarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
}

export default function CarDetailModal({
  isOpen,
  onClose,
  car,
}: CarDetailModalProps) {
  if (!car) return null;

  const items = [
    {
      key: "1",
      label: (
        <Space className="px-4 font-bold uppercase text-[11px]">
          <CarOutlined /> Thông số & Pháp lý
        </Space>
      ),
      children: (
        <div className="space-y-6 pt-4 animate-fadeIn">
          {/* Section: Thông tin chung */}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Mã kho (Stock)">
              <Text strong className="text-blue-600">
                {car.stockCode}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Biển số">
              <Tag
                color="default"
                className="font-mono font-bold border-slate-300"
              >
                {car.licensePlate || "Chưa có"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Dòng xe" span={2}>
              <Text strong className="text-indigo-600 uppercase">
                {car.carModel?.name} {car.modelName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số khung (VIN)">
              <Text className="font-mono">{car.vin || "---"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số máy">
              <Text className="font-mono">{car.engineNumber || "---"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Năm SX">{car.year}</Descriptions.Item>
            <Descriptions.Item label="Số Km (ODO)">
              <Text strong>{car.odo?.toLocaleString()} km</Text>
            </Descriptions.Item>
          </Descriptions>

          {/* Section: Kỹ thuật chi tiết */}
          <Divider className="m-0!">
            <Text type="secondary" className="text-[10px] uppercase font-black">
              Chi tiết kỹ thuật
            </Text>
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Hộp số">
                  {car.transmission}
                </Descriptions.Item>
                <Descriptions.Item label="Nhiên liệu">
                  {car.fuelType}
                </Descriptions.Item>
                <Descriptions.Item label="Kiểu dáng">
                  {car.carType}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Màu ngoại thất">
                  {car.color}
                </Descriptions.Item>
                <Descriptions.Item label="Màu nội thất">
                  {car.interiorColor || "---"}
                </Descriptions.Item>
                <Descriptions.Item label="Số chỗ ngồi">
                  {car.seats} chỗ
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

          {/* Section: Hạn định pháp lý */}
          <Card size="small" className="bg-slate-50 border-none rounded-2xl">
            <Row gutter={16}>
              <Col span={12}>
                <Space orientation="vertical" size={0}>
                  <Text
                    type="secondary"
                    className="text-[10px] uppercase font-bold"
                  >
                    Hạn đăng kiểm
                  </Text>
                  <Text className="font-medium">
                    <CalendarOutlined />{" "}
                    {car.registrationDeadline
                      ? dayjs(car.registrationDeadline).format("DD/MM/YYYY")
                      : "---"}
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space orientation="vertical" size={0}>
                  <Text
                    type="secondary"
                    className="text-[10px] uppercase font-bold"
                  >
                    Bảo hiểm vật chất
                  </Text>
                  <Text className="font-medium">
                    <SafetyCertificateOutlined />{" "}
                    {car.insuranceVCDeadline
                      ? dayjs(car.insuranceVCDeadline).format("DD/MM/YYYY")
                      : "---"}
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <Space className="px-4 font-bold uppercase text-[11px]">
          <HistoryOutlined /> Lịch sử & Chủ cũ
        </Space>
      ),
      children: (
        <div className="space-y-4 pt-4">
          <Table
            size="small"
            pagination={false}
            dataSource={car.ownerHistory}
            rowKey="id"
            className="custom-mini-table"
            columns={[
              {
                title: "GIAO DỊCH",
                key: "type",
                render: (r) => (
                  <Tag
                    color={r.type === "PURCHASE" ? "orange" : "green"}
                    className="rounded-md font-bold border-none"
                  >
                    {r.type === "PURCHASE" ? "NHẬP KHO" : "XUẤT BÁN"}
                  </Tag>
                ),
              },
              {
                title: "ĐỐI TÁC / KHÁCH HÀNG",
                key: "customer",
                render: (r) => (
                  <Space>
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      className="bg-slate-200"
                    />
                    <div className="flex flex-col">
                      <Text strong className="text-[12px]">
                        {r.customer?.fullName}
                      </Text>
                      <Text className="text-[10px] text-slate-400 font-mono">
                        {r.customer?.phone}
                      </Text>
                    </div>
                  </Space>
                ),
              },
              {
                title: "NGÀY",
                dataIndex: "date",
                render: (d) => (
                  <Text className="text-slate-500 text-[11px]">
                    {dayjs(d).format("DD/MM/YYYY")}
                  </Text>
                ),
              },
              {
                title: "HỢP ĐỒNG",
                dataIndex: "contractNo",
                render: (c) => (
                  <Tag className="font-mono text-[10px]">{c || "N/A"}</Tag>
                ),
              },
              {
                title: "GIÁ TRỊ",
                dataIndex: "price",
                align: "right",
                render: (p) => (
                  <Text strong className="text-slate-700">
                    {Number(p).toLocaleString()} đ
                  </Text>
                ),
              },
            ]}
          />
          {(!car.ownerHistory || car.ownerHistory.length === 0) && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có dữ liệu lịch sử"
            />
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <Space className="px-4 font-bold uppercase text-[11px]">
          <DollarCircleOutlined /> Tài chính nội bộ
        </Space>
      ),
      children: (
        <div className="pt-4 space-y-6">
          <Row gutter={16}>
            <Col span={12}>
              <Card
                size="small"
                className="bg-rose-50 border-rose-100 rounded-2xl"
              >
                <Statistic
                  title={
                    <Text className="text-rose-400 text-[10px] uppercase font-black tracking-widest">
                      Giá vốn (Cost)
                    </Text>
                  }
                  value={car.costPrice}
                  suffix="đ"
                  valueStyle={{
                    color: "#e11d48",
                    fontWeight: 900,
                    fontSize: "24px",
                  }}
                />
                <Text type="secondary" className="text-[11px]">
                  Bao gồm phí thu mua và vận chuyển
                </Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                size="small"
                className="bg-emerald-50 border-emerald-100 rounded-2xl"
              >
                <Statistic
                  title={
                    <Text className="text-emerald-400 text-[10px] uppercase font-black tracking-widest">
                      Giá bán (Selling)
                    </Text>
                  }
                  value={car.sellingPrice}
                  suffix="đ"
                  valueStyle={{
                    color: "#10b981",
                    fontWeight: 900,
                    fontSize: "24px",
                  }}
                />
                <Text type="secondary" className="text-[11px]">
                  Giá niêm yết tại Showroom
                </Text>
              </Card>
            </Col>
          </Row>

          <Descriptions bordered size="small" column={1} className="mt-4">
            <Descriptions.Item
              label={
                <Space>
                  <ShopOutlined /> Chi nhánh quản lý
                </Space>
              }
            >
              <Text strong>{car.branch?.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <UserOutlined /> Nhân viên thu mua
                </Space>
              }
            >
              {car.purchaser?.fullName || "Hệ thống"}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <ArrowRightOutlined /> Nhân viên bán (nếu có)
                </Space>
              }
            >
              {car.soldBy?.fullName || "---"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <CarOutlined className="text-xl" />
          </div>
          <div>
            <Title
              level={4}
              className="m-0! font-black uppercase tracking-tight text-slate-800"
            >
              Hồ sơ phương tiện
            </Title>
            <Space className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <span>ID: {car.id.slice(-6)}</span>
              <Divider type="vertical" />
              <span className="text-indigo-500 font-mono italic">
                {car.stockCode}
              </span>
            </Space>
          </div>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      className="custom-car-modal"
    >
      <Tabs defaultActiveKey="1" items={items} className="modern-tabs" />
    </Modal>
  );
}
