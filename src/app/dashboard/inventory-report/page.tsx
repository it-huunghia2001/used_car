/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Tag,
  Typography,
  Space,
  Tabs,
  Statistic,
  Row,
  Col,
  Button,
  Modal,
  Descriptions,
  Divider,
} from "antd";
import {
  CarOutlined,
  ShopOutlined,
  FileProtectOutlined,
  DollarCircleOutlined,
  PrinterOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  getInventoryReportAction,
  getContractHistoryAction,
} from "@/actions/inventory-report-actions";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ContractDocument } from "@/components/ContractTemplate";

const { Title, Text } = Typography;

export default function InventoryReportPage() {
  const [loading, setLoading] = useState(true);
  const [soldCars, setSoldCars] = useState<any[]>([]);
  const [purchasedCars, setPurchasedCars] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const loadAllData = async () => {
    setLoading(true);
    const [resSold, resPurchased, resContracts] = await Promise.all([
      getInventoryReportAction("SOLD"),
      getInventoryReportAction("PURCHASED"),
      getContractHistoryAction(),
    ]);
    if (resSold.success) setSoldCars(resSold.data);
    if (resPurchased.success) setPurchasedCars(resPurchased.data);
    if (resContracts.success) setContracts(resContracts.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const commonColumns = [
    {
      title: "THÔNG TIN XE",
      render: (r: any) => (
        <Space orientation="vertical" size={0}>
          <Text strong className="text-blue-700">
            {r.modelName}
          </Text>
          <Tag color="black" className="m-0 font-mono text-[10px]">
            {r.stockCode}
          </Tag>
        </Space>
      ),
    },
    {
      title: "KHÁCH HÀNG",
      render: (r: any) => <Text strong>{r.customer?.fullName || "N/A"}</Text>,
    },
    {
      title: "NGƯỜI THỰC HIỆN",
      render: (r: any) => (
        <Text className="text-slate-500">
          {r.purchaser?.fullName || "Hệ thống"}
        </Text>
      ),
    },
    {
      title: "GIÁ TRỊ",
      render: (r: any) => (
        <Text strong className="text-red-600">
          {Number(r.price || 0).toLocaleString()}đ
        </Text>
      ),
    },
    {
      title: "THAO TÁC",
      align: "right" as const,
      render: (r: any) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedItem(r);
            setIsDetailOpen(true);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <Title level={2} className="!m-0 font-black text-slate-800">
            BÁO CÁO GIAO DỊCH
          </Title>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            className="bg-blue-600 h-10 shadow-lg"
          >
            Xuất Excel
          </Button>
        </header>

        {/* Thống kê nhanh */}
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} md={8}>
            <Card className="rounded-2xl border-none shadow-md bg-blue-600 !text-blue-500">
              <Statistic
                title={<span className="text-blue-500">Doanh thu xe bán</span>}
                value={soldCars.reduce((s, c) => s + Number(c.price || 0), 0)}
                valueStyle={{ color: "blue", fontWeight: 900 }}
                prefix={<DollarCircleOutlined className="text-blue-500!" />}
                suffix={<span className="text-xs text-blue-500">VND</span>}
              />
            </Card>
          </Col>
          <Col xs={12} md={8}>
            <Card className="rounded-2xl border-none shadow-md">
              <Statistic
                title="Xe đã bán"
                value={soldCars.length}
                prefix={<CarOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} md={8}>
            <Card className="rounded-2xl border-none shadow-md">
              <Statistic
                title="Hợp đồng mới"
                value={contracts.length}
                prefix={<FileProtectOutlined className="text-orange-500" />}
              />
            </Card>
          </Col>
        </Row>

        <Card className="rounded-2xl shadow-xl border-none p-2">
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: (
                  <span className="font-bold px-4">
                    <CarOutlined /> XE ĐÃ BÁN
                  </span>
                ),
                children: (
                  <Table
                    dataSource={soldCars}
                    columns={commonColumns}
                    rowKey="id"
                    loading={loading}
                  />
                ),
              },
              {
                key: "2",
                label: (
                  <span className="font-bold px-4">
                    <ShopOutlined /> XE ĐÃ THU MUA
                  </span>
                ),
                children: (
                  <Table
                    dataSource={purchasedCars}
                    columns={commonColumns}
                    rowKey="id"
                    loading={loading}
                  />
                ),
              },
              {
                key: "3",
                label: (
                  <span className="font-bold px-4">
                    <FileProtectOutlined /> NHẬT KÝ HỢP ĐỒNG
                  </span>
                ),
                children: (
                  <Table
                    dataSource={contracts}
                    columns={commonColumns}
                    rowKey="id"
                    loading={loading}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>

      <Modal
        title={
          <Title level={4} className="m-0!">
            <EyeOutlined /> CHI TIẾT GIAO DỊCH
          </Title>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)}>
            Đóng
          </Button>,
          <PDFDownloadLink
            key="pdf"
            document={<ContractDocument record={selectedItem} />}
            fileName={`HD_${selectedItem?.customer?.fullName || "Khach"}.pdf`}
          >
            {({ loading }) => (
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                loading={loading}
                className="bg-emerald-600 border-none shadow-md"
              >
                {loading ? "Đang tạo..." : "In Hợp đồng PDF"}
              </Button>
            )}
          </PDFDownloadLink>,
        ]}
      >
        {selectedItem && (
          <div className="py-4">
            <Descriptions
              title="Thông tin khách hàng"
              bordered
              column={2}
              size="small"
            >
              <Descriptions.Item label="Họ tên">
                {selectedItem.customer?.fullName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Điện thoại">
                {selectedItem.customer?.phone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedItem.customer?.address || "N/A"}
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Descriptions
              title="Thông tin phương tiện"
              bordered
              column={2}
              size="small"
            >
              <Descriptions.Item label="Mẫu xe">
                {selectedItem.modelName || selectedItem.car?.modelName}
              </Descriptions.Item>
              <Descriptions.Item label="Mã kho">
                {selectedItem.stockCode || selectedItem.car?.stockCode}
              </Descriptions.Item>
              <Descriptions.Item label="Số khung (VIN)" span={2}>
                {selectedItem.vin || selectedItem.car?.vin}
              </Descriptions.Item>
              <Descriptions.Item label="Giá trị giao dịch" span={2}>
                <Text type="danger" strong className="text-xl">
                  {Number(selectedItem.price || 0).toLocaleString()} VNĐ
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
