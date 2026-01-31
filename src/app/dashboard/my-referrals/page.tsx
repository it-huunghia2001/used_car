/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  ReloadOutlined,
  PhoneOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { getMyReferralHistory } from "@/actions/referral-actions";
import { getLeadStatusHelper } from "@/lib/status-helper";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/use-debounce";

const { Title, Text } = Typography;

export default function MyReferralPage() {
  const { message } = App.useApp();

  // --- STATES ---
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchText, setSearchText] = useState("");

  // Debounce search text để tránh gọi API quá nhiều khi đang gõ
  const debouncedSearch = useDebounce(searchText, 500);

  // --- FETCH DATA FROM SERVER ---
  const fetchData = useCallback(
    async (page: number, search: string) => {
      setLoading(true);
      try {
        const res = await getMyReferralHistory({
          page,
          pageSize,
          search,
        });
        if (res.success) {
          setData(res.data);
          setTotal(res.total || 0);
        }
      } catch (error) {
        message.error("Không thể tải dữ liệu từ máy chủ");
      } finally {
        setLoading(false);
      }
    },
    [pageSize, message],
  );

  // Khởi chạy khi Page, PageSize hoặc Search thay đổi
  useEffect(() => {
    fetchData(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchData]);

  // Reset về trang 1 khi search
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // --- COLUMNS ---
  const columns = [
    {
      title: "KHÁCH HÀNG",
      key: "customer",
      render: (r: any) => (
        <Space size={12}>
          <Avatar
            size={40}
            className="bg-indigo-100 text-indigo-600 font-bold shadow-sm"
          >
            {r.fullName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="flex flex-col">
            <Text strong className="text-slate-800 text-sm leading-tight">
              {r.fullName}
            </Text>
            <Text className="text-[11px] text-slate-400 font-mono tracking-tighter">
              <PhoneOutlined className="mr-1" /> {r.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "XE & BIỂN SỐ",
      key: "car",
      render: (r: any) => {
        const isSell = ["SELL", "SELL_TRADE_NEW", "SELL_TRADE_USED"].includes(
          r.type,
        );
        const licensePlate = r.leadCar?.licensePlate || r.licensePlate;
        return (
          <div className="flex flex-col gap-1">
            <Space size={4}>
              <Tag
                color={isSell ? "magenta" : "blue"}
                className="m-0 rounded-md text-[9px] font-extrabold border-none uppercase"
              >
                {isSell ? "Bán xe" : "Mua xe"}
              </Tag>
              {licensePlate && (
                <Tag className="bg-slate-100 text-slate-500 border-none font-mono text-[10px] m-0">
                  {licensePlate}
                </Tag>
              )}
            </Space>
            <Text className="text-xs font-semibold text-slate-600 truncate max-w-[150px]">
              {r.carModel?.name || r.leadCar?.modelName || "Nhu cầu chung"}
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
      render: (staff: any) =>
        staff ? (
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
          <Text italic className="text-[11px] text-slate-300">
            Đang chờ phân bổ
          </Text>
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
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-indigo-200 shadow-lg">
              <WalletOutlined className="text-white text-2xl" />
            </div>
            <div>
              <Title level={2} className="!m-0 text-slate-800 tracking-tighter">
                Lịch sử giới thiệu
              </Title>
              <Text className="text-slate-400 text-xs uppercase font-bold tracking-widest">
                Theo dõi và quản lý các hồ sơ bạn đã gửi
              </Text>
            </div>
          </div>
          <Button
            type="primary"
            shape="round"
            size="large"
            icon={<ReloadOutlined />}
            onClick={() => fetchData(currentPage, debouncedSearch)}
            loading={loading}
            className="bg-slate-800 hover:!bg-slate-700 h-12 px-8 font-bold border-none"
          >
            LÀM MỚI
          </Button>
        </div>

        {/* STATISTICS (Sử dụng dữ liệu total từ server nếu cần, ở đây dùng data.length tạm thời cho mẫu stat) */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={8}>
            <Card className="rounded-3xl border-none shadow-sm">
              <Statistic
                title={
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    Tổng hồ sơ tìm thấy
                  </Text>
                }
                value={total}
                valueStyle={{ fontWeight: 900 }}
                prefix={<UserOutlined className="text-blue-500 mr-2" />}
              />
            </Card>
          </Col>
          {/* Các Stat khác có thể bổ sung API count riêng */}
        </Row>

        {/* SEARCH BAR */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <Input
            placeholder="Tìm theo tên, SĐT hoặc biển số xe..."
            prefix={<SearchOutlined className="text-slate-300" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-14 rounded-2xl border-none shadow-sm md:max-w-lg bg-white"
            allowClear
          />
          <div className="ml-auto text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-200/50 px-4 py-2 rounded-full">
            Trang {currentPage} / {Math.ceil(total / pageSize) || 1} • {total}{" "}
            kết quả
          </div>
        </div>

        {/* TABLE VIEW (Desktop) */}
        <div className="hidden md:block">
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white/70 backdrop-blur-md">
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: false,
                position: ["bottomCenter"],
                className: "custom-pagination",
              }}
              className="custom-referral-table"
            />
          </Card>
        </div>

        {/* CARDS VIEW (Mobile) */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <Card loading className="rounded-3xl" />
          ) : data.length > 0 ? (
            <>
              {data.map((r: any) => {
                const { icon, color, label } = getLeadStatusHelper(r.status);
                return (
                  <Card
                    key={r.id}
                    className="rounded-3xl border-none shadow-sm mb-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Space>
                        <Avatar className="bg-indigo-600 shadow-sm">
                          {r.fullName.charAt(0)}
                        </Avatar>
                        <div className="flex flex-col">
                          <Text strong className="text-sm">
                            {r.fullName}
                          </Text>
                          <Text className="text-[10px] text-slate-400 font-mono">
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
                    <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
                      <div className="flex flex-col">
                        <Text className="text-[9px] text-slate-400 uppercase font-black">
                          Dòng xe
                        </Text>
                        <Text className="text-xs font-bold text-slate-600">
                          {r.carModel?.name || r.leadCar?.modelName || "---"}
                        </Text>
                      </div>
                      <Text className="text-indigo-600 font-bold text-xs">
                        {r.assignedTo?.fullName || "Đợi xử lý"}
                      </Text>
                    </div>
                  </Card>
                );
              })}
              {/* Phân trang mobile đơn giản */}
              <div className="flex justify-center py-4">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <span className="px-4 flex items-center font-bold">
                  {currentPage}
                </span>
                <Button
                  disabled={currentPage * pageSize >= total}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </>
          ) : (
            <Empty
              description="Không tìm thấy dữ liệu"
              className="bg-white p-10 rounded-3xl"
            />
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-referral-table .ant-table {
          background: transparent !important;
        }
        .custom-referral-table .ant-table-thead > tr > th {
          background: rgba(248, 250, 252, 0.5) !important;
          color: #64748b !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          font-weight: 800 !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .custom-referral-table .ant-table-row:hover > td {
          background: rgba(241, 245, 249, 0.5) !important;
        }
        .custom-pagination .ant-pagination-item-active {
          border-radius: 12px;
          background: #4f46e5;
          border-color: #4f46e5;
        }
        .custom-pagination .ant-pagination-item-active a {
          color: white !important;
        }
      `}</style>
    </div>
  );
}
