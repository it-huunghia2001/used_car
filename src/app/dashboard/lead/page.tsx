/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Descriptions,
  Card,
  Typography,
  Space,
  Badge,
  Divider,
  Avatar,
  Tooltip,
  Row,
  Col,
  Input,
  Select,
  Button,
  Empty,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  DollarCircleOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getLeadsAction } from "@/actions/customer-actions";
import Paragraph from "antd/es/typography/Paragraph";

const { Text, Title } = Typography;
const { Option } = Select;

export default function LeadsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "ALL",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsAction(filters);
      setData(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu Leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  // Hàm hỗ trợ dịch loại nhu cầu (ReferralType)
  const getReferralTypeTag = (type: string) => {
    const config: any = {
      SELL: { color: "volcano", label: "Bán xe cho Showroom" },
      BUY: { color: "green", label: "Mua xe tại Showroom" },
      VALUATION: { color: "gold", label: "Định giá xe" },
      SELL_TRADE_NEW: { color: "blue", label: "Đổi xe mới" },
      SELL_TRADE_USED: { color: "cyan", label: "Đổi xe cũ" },
    };
    const item = config[type] || { color: "default", label: type };
    return (
      <Tag
        color={item.color}
        className="rounded-md font-bold uppercase text-[10px]"
      >
        {item.label}
      </Tag>
    );
  };

  // --- GIAO DIỆN CHI TIẾT KHI BẤM MỞ RỘNG DÒNG ---
  const expandedRowRender = (record: any) => (
    <Card
      bordered={false}
      className="bg-slate-50 rounded-2xl shadow-inner border border-slate-100"
    >
      <Row gutter={[24, 24]}>
        {/* Cột 1: Thông tin cá nhân & Nhu cầu */}
        <Col xs={24} md={12}>
          <Descriptions
            title={
              <Space>
                <UserOutlined className="text-blue-600" /> THÔNG TIN KHÁCH HÀNG
                & NHU CẦU
              </Space>
            }
            bordered
            column={1}
            size="small"
          >
            <Descriptions.Item label="Nhu cầu chính">
              {getReferralTypeTag(record.type)}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ cụ thể">
              {record.address || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Tỉnh/Thành">
              {record.province || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Người giới thiệu">
              <Space>
                <Text strong>{record.referrer?.fullName}</Text>
                <Tag className="text-[10px] uppercase">
                  {record.referrer?.role}
                </Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú nội bộ">
              {record.note || "Không có ghi chú"}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        {/* Cột 2: Thông tin Xe & Ngân sách */}
        <Col xs={24} md={12}>
          <Descriptions
            title={
              <Space>
                <DollarCircleOutlined className="text-emerald-600" /> THÔNG TIN
                XE & TÀI CHÍNH
              </Space>
            }
            bordered
            column={1}
            size="small"
          >
            <Descriptions.Item label="Model quan tâm">
              {record.carModel?.name || record.carYear || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Biển số xe (nếu có)">
              {record.licensePlate || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngân sách khách">
              {record.budget
                ? `${Number(record.budget).toLocaleString()} VNĐ`
                : "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá khách kỳ vọng">
              {record.expectedPrice
                ? `${Number(record.expectedPrice).toLocaleString()} VNĐ`
                : "---"}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        {/* Thông tin Xe Giám Định (Nếu có) */}
        {record.leadCar && (
          <Col span={24}>
            <Divider>
              <Text
                strong
                className="text-orange-600 uppercase tracking-widest"
              >
                Chi tiết xe giám định kỹ thuật
              </Text>
            </Divider>
            <Descriptions
              bordered
              size="small"
              column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="Số khung (VIN)">
                {record.leadCar.vin}
              </Descriptions.Item>
              <Descriptions.Item label="Số máy">
                {record.leadCar.engineNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Số Km (ODO)">
                {record.leadCar.odo?.toLocaleString()} km
              </Descriptions.Item>
              <Descriptions.Item label="Màu xe">
                {record.leadCar.color}
              </Descriptions.Item>
              <Descriptions.Item label="Nhiên liệu">
                {record.leadCar.fuelType}
              </Descriptions.Item>
              <Descriptions.Item
                label="Giá T-Sure định giá"
                labelStyle={{ color: "red" }}
              >
                <Text strong type="danger">
                  {Number(record.leadCar.tSurePrice).toLocaleString()} VNĐ
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        )}

        {/* Nhật ký hoạt động */}
        <Col span={24}>
          <Divider>
            <Space>
              <HistoryOutlined /> NHẬT KÝ CHĂM SÓC GẦN NHẤT
            </Space>
          </Divider>
          <div className="max-h-50 overflow-y-auto space-y-2 pr-2">
            {record.activities?.length > 0 ? (
              record.activities.map((act: any) => (
                <div
                  key={act.id}
                  className="text-[12px] bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all"
                >
                  <div className="flex justify-between mb-1">
                    <Space>
                      <Badge status="processing" />
                      <Text strong>
                        {dayjs(act.createdAt).format("DD/MM/YYYY HH:mm")}
                      </Text>
                    </Space>
                    <Tag color="default" className="m-0 text-[10px]">
                      {act.status}
                    </Tag>
                  </div>
                  <Paragraph className="mb-1! italic">{act.note}</Paragraph>
                  <Text type="secondary" className="text-[11px]">
                    Người thực hiện: {act.user?.fullName}
                  </Text>
                </div>
              ))
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có nhật ký hoạt động"
              />
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );

  const columns = [
    {
      title: "KHÁCH HÀNG",
      width: 250,
      render: (r: any) => (
        <Space>
          <Avatar className="bg-red-600 shadow-sm" icon={<UserOutlined />} />
          <div className="flex flex-col">
            <Text strong className="text-slate-700">
              {r.fullName}
            </Text>
            <Text type="secondary" className="text-[11px] font-mono">
              {r.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "NHU CẦU",
      width: 180,
      render: (r: any) => getReferralTypeTag(r.type),
    },
    {
      title: "MODEL",
      width: 150,
      render: (r: any) => (
        <Space size={4}>
          <CarOutlined className="text-slate-400" />
          <Text className="text-[13px]">{r.carModel?.name || "Chưa chọn"}</Text>
        </Space>
      ),
    },
    {
      title: "CHI NHÁNH",
      dataIndex: ["branch", "name"],
      render: (text: string) => (
        <Tag
          icon={<EnvironmentOutlined />}
          className="rounded-md border-slate-200 bg-slate-50"
        >
          {text || "Hệ thống"}
        </Tag>
      ),
    },
    {
      title: "XỬ LÝ BỞI",
      dataIndex: ["assignedTo", "fullName"],
      render: (text: string) =>
        text ? (
          <Tag color="geekblue" className="border-none font-medium">
            {text}
          </Tag>
        ) : (
          <Tag className="border-dashed">Đang chờ...</Tag>
        ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      width: 140,
      render: (status: string) => {
        const colors: any = {
          DEAL_DONE: "green",
          NEW: "blue",
          FOLLOW_UP: "orange",
          CANCELLED: "red",
        };
        return (
          <Tag
            color={colors[status] || "default"}
            className="font-black uppercase text-[10px]"
          >
            {status}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="p-8 bg-[#f4f7fe] min-h-screen">
      <div className="max-w-400 mx-auto space-y-6">
        {/* TIÊU ĐỀ & SEARCH BOX */}
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={8}>
              <Title
                level={3}
                className="m-0! uppercase font-black tracking-tight"
              >
                Hệ thống quản lý Leads
              </Title>
              <Text type="secondary" className="text-[12px]">
                <InfoCircleOutlined /> Hiển thị theo phân quyền quản trị
              </Text>
            </Col>
            <Col xs={24} lg={16}>
              <div className="flex flex-wrap gap-3 justify-end">
                <Input
                  placeholder="Tìm tên, số điện thoại, biển số..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="max-w-sm rounded-xl h-11 border-slate-200"
                  allowClear
                  onPressEnter={(e: any) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                  onChange={(e) =>
                    !e.target.value &&
                    setFilters({ ...filters, search: "", page: 1 })
                  }
                />
                <Select
                  defaultValue="ALL"
                  className="w-44 h-11"
                  onChange={(val) =>
                    setFilters({ ...filters, status: val, page: 1 })
                  }
                >
                  <Option value="ALL">Tất cả trạng thái</Option>
                  <Option value="NEW">Mới (NEW)</Option>
                  <Option value="FOLLOW_UP">Đang chăm sóc</Option>
                  <Option value="DEAL_DONE">Chốt đơn</Option>
                  <Option value="CANCELLED">Hủy bỏ</Option>
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  className="h-11 rounded-xl font-bold"
                  onClick={() => loadData()}
                >
                  LÀM MỚI
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* BẢNG DỮ LIỆU */}
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            expandable={{
              expandedRowRender,
              rowExpandable: () => true,
              expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                  <Button
                    size="small"
                    type="text"
                    icon={
                      <Tooltip title="Thu gọn">
                        <Badge status="error" />
                      </Tooltip>
                    }
                    onClick={(e) => onExpand(record, e)}
                  />
                ) : (
                  <Button
                    size="small"
                    type="text"
                    icon={
                      <Tooltip title="Xem chi tiết">
                        <Badge status="success" />
                      </Tooltip>
                    }
                    onClick={(e) => onExpand(record, e)}
                  />
                ),
            }}
            pagination={{
              total,
              current: filters.page,
              pageSize: filters.limit,
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} khách hàng`,
              onChange: (page, pageSize) =>
                setFilters({ ...filters, page, limit: pageSize }),
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>
      </div>

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-weight: 700 !important;
          color: #64748b !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #f1f5f9;
        }
        .ant-descriptions-title {
          font-size: 12px !important;
          font-weight: 800 !important;
          color: #1e293b !important;
        }
        .ant-table-row:hover {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
