/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Card, Typography, Empty, Space, message } from "antd";
import { getMyReferralsAction } from "@/actions/customer-actions";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function MyReferralHistoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Lấy session từ API cầu nối
        const res = await fetch("/api/auth/me");
        const session = await res.json();

        // 2. Kiểm tra id (Dựa trên schema của bạn là session.id)
        if (session && session.id) {
          const referrals = await getMyReferralsAction(session.id);
          setData(referrals);
        } else {
          message.error("Không tìm thấy thông tin đăng nhập");
        }
      } catch (error) {
        console.error("Lỗi load lịch sử:", error);
        message.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const columns = [
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: any) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.fullName}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nhu cầu",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const config: any = {
          SELL: { color: "orange", text: "Bán xe" },
          BUY: { color: "green", text: "Mua xe" },
          VALUATION: { color: "blue", text: "Định giá" },
        };
        return (
          <Tag color={config[type]?.color}>{config[type]?.text || type}</Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig: any = {
          NEW: { color: "default", text: "Mới tiếp nhận" },
          ASSIGNED: { color: "processing", text: "Đã phân bổ" },
          CONTACTED: { color: "warning", text: "Đang liên hệ" },
          DEAL_DONE: { color: "success", text: "Thành công" },
          CANCELLED: { color: "error", text: "Đã hủy" },
        };
        return (
          <Tag color={statusConfig[status]?.color}>
            {statusConfig[status]?.text.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Nhân viên xử lý",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo: any) =>
        assignedTo ? (
          <Text italic style={{ color: "#52c41a" }}>
            {assignedTo.fullName}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Chờ phân bổ...
          </Text>
        ),
    },
  ];

  return (
    <div className="p-4">
      <Card className="shadow-sm border-t-4 border-red-600">
        <Title level={4} className="mb-6 uppercase text-center">
          Lịch sử giới thiệu của tôi
        </Title>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: <Empty description="Bạn chưa có dữ liệu giới thiệu" />,
          }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
