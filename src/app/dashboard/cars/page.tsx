/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Typography,
  Space,
  Modal,
  Descriptions,
  Divider,
  Empty,
  Badge,
} from "antd";
import {
  CarOutlined,
  ShopOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { getInventory } from "@/actions/car-actions";

const { Title, Text } = Typography;

export default function InventoryPage() {
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<any[]>([]);

  // State quản lý Modal chi tiết
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);

  const loadCars = async () => {
    setLoading(true);
    const res = await getInventory();
    setCars(res);
    setLoading(false);
  };

  useEffect(() => {
    loadCars();
  }, []);

  // Hàm mở xem chi tiết
  const showDetail = (record: any) => {
    setSelectedCar(record);
    setIsDetailOpen(true);
  };

  const columns = [
    {
      title: "THÔNG TIN XE",
      key: "carInfo",
      render: (record: any) => (
        <div
          className="cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => showDetail(record)}
        >
          <Space direction="vertical" size={0}>
            <Text strong>
              <CarOutlined /> {record.modelName}
            </Text>
            <Text type="secondary" className="text-[12px]">
              VIN: {record.vin}
            </Text>
          </Space>
        </div>
      ),
    },
    {
      title: "CHI NHÁNH",
      dataIndex: ["branch", "name"],
      key: "branch",
      render: (text: string) => (
        <Tag icon={<ShopOutlined />} color="blue">
          {text}
        </Tag>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      render: (status: string) => {
        const statusMap: any = {
          READY_FOR_SALE: { color: "green", text: "Sẵn sàng bán" },
          PENDING: { color: "orange", text: "Chờ kiểm định" },
          REFURBISHING: { color: "cyan", text: "Đang làm đẹp" },
          SOLD: { color: "red", text: "Đã bán" },
          BOOKED: { color: "purple", text: "Đã đặt cọc" },
        };
        const config = statusMap[status] || { color: "default", text: status };
        return <Badge status={config.color} text={config.text} />;
      },
    },
    {
      title: "GIÁ BÁN",
      dataIndex: "sellingPrice",
      align: "right" as const,
      render: (price: any) => (
        <Text strong className="text-red-600">
          {price ? `${Number(price).toLocaleString()} VNĐ` : "Chưa định giá"}
        </Text>
      ),
    },
    {
      title: "NĂM SX",
      dataIndex: "year",
      align: "center" as const,
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right" as const,
      render: (record: any) => (
        <Button type="link" onClick={() => showDetail(record)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card
        title={
          <Space>
            <CarOutlined className="text-blue-500" />
            <Title level={4} style={{ margin: 0 }}>
              Quản lý kho xe hệ thống
            </Title>
          </Space>
        }
        extra={<Text type="secondary">Tổng số: {cars.length} xe</Text>}
        className="shadow-sm"
      >
        <Table
          dataSource={cars}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* MODAL CHI TIẾT XE */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined className="text-blue-500" />
            <span>CHI TIẾT XE: {selectedCar?.modelName}</span>
          </Space>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={null}
        width={900}
        centered
      >
        {selectedCar ? (
          <div className="py-2">
            <Descriptions
              bordered
              size="small"
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="Tên Model" span={2}>
                <Text strong className="text-blue-600">
                  {selectedCar.modelName}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Số khung (VIN)">
                <Text className="font-mono uppercase">{selectedCar.vin}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số máy">
                {selectedCar.engineNumber || "N/A"}
              </Descriptions.Item>

              <Descriptions.Item label="Biển số">
                <Tag color="default">
                  {selectedCar.licensePlate || "Chưa có"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Năm sản xuất">
                <CalendarOutlined /> {selectedCar.year}
              </Descriptions.Item>

              <Descriptions.Item label="Số ODO (Km)">
                <DashboardOutlined /> {selectedCar.odo?.toLocaleString()} km
              </Descriptions.Item>
              <Descriptions.Item label="Nguồn gốc">
                {selectedCar.origin || "Trong nước"}
              </Descriptions.Item>

              <Descriptions.Item label="Hộp số">
                <Tag color="geekblue">{selectedCar.transmission}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nhiên liệu">
                <Tag color="volcano">{selectedCar.fuelType}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Kiểu dáng">
                {selectedCar.carType}
              </Descriptions.Item>
              <Descriptions.Item label="Màu sắc (Ngoại/Nội)">
                {selectedCar.color} / {selectedCar.interiorColor || "N/A"}
              </Descriptions.Item>

              <Descriptions.Item label="Giá niêm yết (Web)" span={2}>
                <Title level={4} style={{ color: "#cf1322", margin: 0 }}>
                  {selectedCar.sellingPrice
                    ? `${Number(selectedCar.sellingPrice).toLocaleString()} VNĐ`
                    : "Chưa cập nhật"}
                </Title>
              </Descriptions.Item>

              <Descriptions.Item label="Vị trí bãi xe">
                <Text strong>
                  <ShopOutlined /> {selectedCar.branch?.name}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                <Text type="secondary" className="text-[12px]">
                  {selectedCar.branch?.address}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Ghi chú khuyến mãi" span={2}>
                {selectedCar.promotionNote ||
                  "Không có chương trình khuyến mãi"}
              </Descriptions.Item>

              <Descriptions.Item label="Đặc điểm nổi bật" span={2}>
                <div className="whitespace-pre-wrap">
                  {selectedCar.features || "Chưa cập nhật tính năng"}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Mô tả tình trạng" span={2}>
                <div className="bg-gray-50 p-2 rounded italic text-gray-600">
                  {selectedCar.description ||
                    "Chưa có mô tả chi tiết từ nhân viên thu mua."}
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="horizontal">Thông tin thời gian</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Ngày nhập kho</Text>
                  <Text>
                    {selectedCar.createdAt
                      ? new Date(selectedCar.createdAt).toLocaleDateString(
                          "vi-VN"
                        )
                      : "N/A"}
                  </Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Cập nhật cuối</Text>
                  <Text>
                    {new Date(selectedCar.updatedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Ngày bán xe</Text>
                  <Text>
                    {selectedCar.soldAt
                      ? new Date(selectedCar.soldAt).toLocaleDateString("vi-VN")
                      : "Chưa bán"}
                  </Text>
                </Space>
              </Col>
            </Row>
          </div>
        ) : (
          <Empty description="Không tìm thấy thông tin xe" />
        )}
      </Modal>
    </div>
  );
}

// Thêm Button để import nếu chưa có
import { Button, Row, Col } from "antd";
