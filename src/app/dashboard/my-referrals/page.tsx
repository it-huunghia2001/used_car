/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Card,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Input,
  Empty,
  Skeleton,
  Button,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { getMyReferralHistory } from "@/actions/referral-actions";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// Mapping trạng thái sang màu sắc và nhãn tiếng Việt
const statusConfig: any = {
  NEW: { color: "blue", label: "Mới tiếp nhận", icon: <ClockCircleOutlined /> },
  ASSIGNED: { color: "cyan", label: "Đã phân bổ", icon: <SyncOutlined spin /> },
  CONTACTED: { color: "orange", label: "Đang liên hệ", icon: <SyncOutlined /> },
  DEAL_DONE: {
    color: "green",
    label: "Thành công",
    icon: <CheckCircleOutlined />,
  },
  CANCELLED: { color: "red", label: "Đã hủy", icon: <InfoCircleOutlined /> },
  LOSE: { color: "volcano", label: "Thất bại", icon: <InfoCircleOutlined /> },
};

export default function MyReferralPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getMyReferralHistory();

    console.log(res);

    if (res.success) {
      setData(res.data);
    }
    setLoading(false);
  };

  // Logic lọc dữ liệu tại chỗ
  const filteredData = data.filter(
    (item) =>
      item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phone.includes(searchText),
  );

  const columns = [
    {
      title: "KHÁCH HÀNG",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-indigo-900">
            {text}
          </Text>
          <Text type="secondary" className="text-xs">
            {record.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "NHU CẦU",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const color =
          type === "SELL" ? "magenta" : type === "BUY" ? "blue" : "purple";
        const label =
          type === "SELL" ? "Bán xe" : type === "BUY" ? "Mua xe" : "Định giá";
        return (
          <Tag color={color} className="rounded-full px-3">
            {label}
          </Tag>
        );
      },
    },
    {
      title: "THÔNG TIN XE",
      key: "carInfo",
      render: (record: any) => (
        <div className="max-w-[200px]">
          <Text className="block truncate">
            {record.carModel?.name || record.carYear || "---"}
          </Text>
          {record.licensePlate && (
            <Tag className="mt-1 bg-gray-100 border-none text-[10px]">
              {record.licensePlate}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const config = statusConfig[status] || {
          color: "default",
          label: status,
        };
        return (
          <Tag
            icon={config.icon}
            color={config.color}
            className="flex items-center w-fit gap-1 rounded-md px-2 py-0.5"
          >
            {config.label.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "NHÂN VIÊN HỖ TRỢ",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (staff: any) =>
        staff ? (
          <Text className="text-slate-600">
            <UserOutlined className="mr-1" /> {staff.fullName}
          </Text>
        ) : (
          <Text italic type="secondary">
            Chưa bàn giao
          </Text>
        ),
    },
    {
      title: "NGÀY GỬI",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: any, b: any) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date: any) => (
        <Tooltip title={dayjs(date).format("HH:mm DD/MM/YYYY")}>
          {dayjs(date).format("DD/MM/YYYY")}
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Title level={2} className="!m-0 text-slate-800">
              Lịch sử giới thiệu
            </Title>
            <Text type="secondary">
              Theo dõi tiến độ xử lý khách hàng bạn đã giới thiệu
            </Text>
          </div>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={fetchData}
            className="bg-indigo-600 hover:!bg-indigo-700 rounded-lg h-10"
          >
            Làm mới dữ liệu
          </Button>
        </div>

        {/* STATS CARDS */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={8}>
            <Card className="shadow-sm rounded-2xl border-b-4 border-blue-500">
              <Statistic
                title={
                  <Text className="text-slate-500 font-medium">
                    Tổng số khách
                  </Text>
                }
                value={data.length}
                prefix={<UserOutlined className="text-blue-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="shadow-sm rounded-2xl border-b-4 border-orange-500">
              <Statistic
                title={
                  <Text className="text-slate-500 font-medium">Đang xử lý</Text>
                }
                value={
                  data.filter((i) =>
                    ["NEW", "ASSIGNED", "CONTACTED"].includes(i.status),
                  ).length
                }
                style={{ color: "#f59e0b" }}
                prefix={<SyncOutlined className="mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="shadow-sm rounded-2xl border-b-4 border-green-500">
              <Statistic
                title={
                  <Text className="text-slate-500 font-medium">
                    Thành công (Chốt deal)
                  </Text>
                }
                value={data.filter((i) => i.status === "DEAL_DONE").length}
                style={{ color: "#10b981" }}
                prefix={<CheckCircleOutlined className="mr-2" />}
              />
            </Card>
          </Col>
        </Row>

        {/* MAIN TABLE CARD */}
        <Card className="shadow-md rounded-2xl border-none overflow-hidden">
          <div className="mb-6 flex justify-between items-center">
            <Input
              placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="max-w-md h-10 rounded-lg"
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 8,
              showTotal: (total) => `Tổng cộng ${total} khách hàng`,
            }}
            className="custom-table"
            locale={{
              emptyText: (
                <Empty description="Bạn chưa giới thiệu khách hàng nào" />
              ),
            }}
          />
        </Card>
      </div>

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f1f5f9;
          color: #475569;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .custom-table .ant-table-row:hover {
          background-color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}
