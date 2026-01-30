/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Button,
  Avatar,
  Badge,
  App,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  PhoneOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { getMyReferralHistory } from "@/actions/referral-actions";
import { getLeadStatusHelper } from "@/lib/status-helper"; // Sử dụng helper đã viết ở các bước trước
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function MyReferralPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyReferralHistory();
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phone.includes(searchText),
  );

  // --- DESKTOP COLUMNS ---
  const columns = [
    {
      title: "KHÁCH HÀNG",
      key: "customer",
      render: (r: any) => (
        <Space size={12}>
          <Avatar size={40} className="bg-indigo-100 text-indigo-600 font-bold">
            {r.fullName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="flex flex-col">
            <Text strong className="text-slate-800 text-sm leading-tight">
              {r.fullName}
            </Text>
            <Text className="text-[11px] text-slate-400 font-mono tracking-tighter">
              <PhoneOutlined /> {r.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "XE & NHU CẦU",
      key: "car",
      render: (r: any) => {
        const isSell = r.type === "SELL" || r.type === "SELL_TRADE_NEW";
        return (
          <div className="flex flex-col gap-1">
            <Tag
              color={isSell ? "magenta" : "blue"}
              className="w-fit m-0 rounded-md text-[10px] font-bold border-none uppercase"
            >
              {isSell ? "Bán xe" : "Mua xe"}
            </Tag>
            <Text className="text-xs font-semibold text-slate-600 truncate max-w-[150px]">
              {r.carModel?.name || "Nhu cầu chung"}
            </Text>
          </div>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const { icon, color, label } = getLeadStatusHelper(status);
        return (
          <Tag
            icon={icon}
            color={color}
            className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px] border-none shadow-sm"
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: "NV HỖ TRỢ",
      dataIndex: "assignedTo",
      render: (staff: any) => (
        <div className="flex items-center gap-2">
          {staff ? (
            <Badge
              status="processing"
              color="green"
              text={
                <Text className="text-xs font-medium text-slate-600">
                  {staff.fullName}
                </Text>
              }
            />
          ) : (
            <Text italic className="text-[11px] text-slate-400">
              Đang chờ phân bổ
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "NGÀY GỬI",
      dataIndex: "createdAt",
      align: "right" as any,
      render: (date: any) => (
        <Text className="text-[11px] text-slate-400 font-medium">
          {dayjs(date).format("DD/MM/YYYY")}
        </Text>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-200 shadow-lg">
              <WalletOutlined className="text-white text-2xl" />
            </div>
            <div>
              <Title level={2} className="!m-0 text-slate-800 tracking-tighter">
                Lịch sử giới thiệu
              </Title>
              <Text className="text-slate-400 text-xs uppercase font-bold tracking-widest">
                Quản lý hiệu quả giới thiệu của bạn
              </Text>
            </div>
          </div>
          <Button
            type="primary"
            shape="round"
            size="large"
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
            className="bg-slate-800 hover:!bg-slate-700 h-12 px-8 font-bold border-none"
          >
            LÀM MỚI
          </Button>
        </div>

        {/* STATISTICS SECTION */}
        <Row gutter={[16, 16]} className="mb-8">
          {[
            {
              title: "Tổng số khách",
              value: data.length,
              color: "blue",
              icon: <UserOutlined />,
            },
            {
              title: "Đang chăm sóc",
              value: data.filter(
                (i) => !["DEAL_DONE", "LOSE", "CANCELLED"].includes(i.status),
              ).length,
              color: "orange",
              icon: <SyncOutlined />,
            },
            {
              title: "Thành công",
              value: data.filter((i) => i.status === "DEAL_DONE").length,
              color: "green",
              icon: <CheckCircleOutlined />,
            },
          ].map((stat, idx) => (
            <Col xs={24} sm={8} key={idx}>
              <Card className="rounded-[1.5rem] border-none shadow-sm transition-transform hover:scale-[1.02]">
                <Statistic
                  title={
                    <Text className="text-slate-400 text-xs font-black uppercase tracking-widest">
                      {stat.title}
                    </Text>
                  }
                  value={stat.value}
                  valueStyle={{
                    color: "#1e293b",
                    fontWeight: 900,
                    fontSize: "28px",
                  }}
                  prefix={
                    <div
                      className={`mr-2 p-2 rounded-lg bg-${stat.color}-50 text-${stat.color}-500 inline-flex`}
                    >
                      {stat.icon}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* SEARCH & FILTER SECTION */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <Input
            placeholder="Tìm kiếm khách hàng..."
            prefix={<SearchOutlined className="text-slate-300" />}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-12 rounded-2xl border-slate-100 shadow-sm md:max-w-md"
            allowClear
          />
          <div className="ml-auto text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            Hiển thị {filteredData.length} kết quả
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block">
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-md">
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              className="custom-referral-table"
            />
          </Card>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <Card loading className="rounded-2xl" />
          ) : filteredData.length > 0 ? (
            filteredData.map((r: any) => {
              const { icon, color, label } = getLeadStatusHelper(r.status);
              return (
                <Card
                  key={r.id}
                  className="rounded-2xl mb-3! border-none shadow-sm overflow-hidden active:scale-95 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <Space>
                      <Avatar className="bg-indigo-600">
                        {r.fullName.charAt(0)}
                      </Avatar>
                      <div className="flex flex-col">
                        <Text strong className="text-sm">
                          {r.fullName}
                        </Text>
                        <Text className="text-[10px] text-slate-400 font-mono italic">
                          {dayjs(r.createdAt).format("DD/MM/YYYY")}
                        </Text>
                      </div>
                    </Space>
                    <Tag
                      icon={icon}
                      color={color}
                      className="m-0 rounded-md text-[9px] font-bold uppercase border-none"
                    >
                      {label}
                    </Tag>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center mb-3">
                    <div className="flex flex-col">
                      <Text className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        Dòng xe quan tâm
                      </Text>
                      <Text className="text-xs font-bold text-slate-600">
                        {r.carModel?.name || "Chưa xác định"}
                      </Text>
                    </div>
                    <Tag
                      color={r.type === "SELL" ? "magenta" : "blue"}
                      className="rounded-md border-none font-bold uppercase text-[9px]"
                    >
                      {r.type === "SELL" ? "Bán" : "Mua"}
                    </Tag>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <Text className="text-slate-400">
                      <PhoneOutlined className="mr-1" /> {r.phone}
                    </Text>
                    <Text className="text-indigo-600 font-bold">
                      {r.assignedTo?.fullName || "Đợi xử lý"}
                    </Text>
                  </div>
                </Card>
              );
            })
          ) : (
            <Empty description="Không có dữ liệu giới thiệu" />
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-referral-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          font-weight: 800 !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .custom-referral-table .ant-table-row {
          transition: all 0.2s;
        }
        .custom-referral-table .ant-table-row:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}
