/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Card,
  Typography,
  Empty,
  Space,
  message,
  Badge,
} from "antd";
import { getMyReferralsAction } from "@/actions/customer-actions";
import dayjs from "dayjs";
import { CarOutlined, UserOutlined, HistoryOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function MyReferralHistoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // Gọi Server Action trực tiếp (không cần qua fetch api/auth/me nếu Action đã check auth)
      const referrals = await getMyReferralsAction();
      setData(referrals);
    } catch (error: any) {
      console.error("Lỗi load lịch sử:", error);
      message.error(error.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: any) => (
        <Space orientation="vertical" size={0}>
          <Text>{dayjs(date).format("DD/MM/YYYY")}</Text>
          <Text type="secondary" className="text-[11px]">
            {dayjs(date).format("HH:mm")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (record: any) => (
        <Space orientation="vertical" size={0}>
          <Text strong>
            <UserOutlined /> {record.fullName}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nhu cầu / Dòng xe",
      key: "demand",
      render: (record: any) => {
        const typeConfig: any = {
          SELL: { color: "volcano", text: "Bán xe" },
          BUY: { color: "green", text: "Mua xe" },
          VALUATION: { color: "blue", text: "Định giá" },
        };
        return (
          <Space orientation="vertical" size={4}>
            <Tag color={typeConfig[record.type]?.color} className="m-0">
              {typeConfig[record.type]?.text || record.type}
            </Tag>
            <Text italic className="text-[12px] text-gray-500">
              {record.carModel?.name || "Chưa chọn dòng xe"}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Xe liên quan (Stock)",
      key: "stock",
      render: (record: any) => {
        // Lấy lịch sử giao dịch gần nhất
        const deal = record.carOwnerHistories?.[0];
        if (!deal || !deal.car) return <Text type="secondary">--</Text>;
        return (
          <Space orientation="vertical" size={0}>
            <Tag color="magenta" className="font-mono font-bold">
              {deal.car.stockCode || "N/A"}
            </Tag>
            <Text className="text-[11px] truncate max-w-[120px]">
              {deal.car.modelName}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig: any = {
          NEW: { color: "cyan", text: "Mới tiếp nhận" },
          ASSIGNED: { color: "blue", text: "Đã phân bổ" },
          CONTACTED: { color: "orange", text: "Đang chăm sóc" },
          DEAL_DONE: { color: "green", text: "Thành công" },
          LOSE: { color: "red", text: "Thất bại" },
          CANCELLED: { color: "default", text: "Đã hủy" },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };
        return (
          <Badge
            color={config.color}
            text={
              <Text strong style={{ color: config.color }}>
                {config.text.toUpperCase()}
              </Text>
            }
          />
        );
      },
    },
    {
      title: "Người xử lý",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo: any) =>
        assignedTo ? (
          <Tag icon={<UserOutlined />} color="default">
            {assignedTo.fullName}
          </Tag>
        ) : (
          <Text type="secondary" className="text-[11px]">
            Chờ phân bổ...
          </Text>
        ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <Title level={3} className="!mb-0">
            <HistoryOutlined /> LỊCH SỬ GIỚI THIỆU
          </Title>
          <Text type="secondary">
            Theo dõi tiến độ xử lý khách hàng bạn đã gửi vào hệ thống
          </Text>
        </header>

        <Card className="shadow-sm border-none rounded-xl overflow-hidden">
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 800 }}
            locale={{
              emptyText: <Empty description="Bạn chưa có dữ liệu giới thiệu" />,
            }}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Tổng cộng ${total} khách hàng`,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
