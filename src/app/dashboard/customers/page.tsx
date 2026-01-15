/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Table,
  Tag,
  Select,
  Card,
  message,
  Row,
  Col,
  Statistic,
  Input,
  Space,
  Button,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import {
  UserOutlined,
  CarOutlined,
  PhoneOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  getCustomersAction,
  assignCustomerAction,
} from "@/actions/customer-actions";
import { getEligibleStaffAction, getUsersAction } from "@/actions/user-actions";
import dayjs from "dayjs";

const { Search } = Input;

// Interface giữ nguyên như cũ
interface UserData {
  id: string;
  fullName: string | null;
  username: string;
  role: any;
}

interface CustomerData {
  id: string;
  fullName: string;
  phone: string;
  type: string;
  status: string;
  createdAt: any;
  licensePlate?: string;
  carType?: string;
  referrerId: string; // Thêm nếu cần
  assignedToId: string | null; // <--- THÊM DÒNG NÀY ĐỂ HẾT LỖI
  referrer: { fullName: string | null; username: string };
  assignedTo: { fullName: string | null } | null;
}

export default function CustomerManagementPage() {
  const [data, setData] = useState<CustomerData[]>([]);
  const [filteredData, setFilteredData] = useState<CustomerData[]>([]);
  const [staffs, setStaffs] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [customers, users] = await Promise.all([
        getCustomersAction(),
        getEligibleStaffAction(),
      ]);
      setData(customers as any);
      setFilteredData(customers as any);
      setStaffs(users as any);
    } catch (error) {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Xử lý tìm kiếm nhanh
  const onSearch = (value: string) => {
    const filtered = data.filter(
      (item) =>
        item.fullName.toLowerCase().includes(value.toLowerCase()) ||
        item.phone.includes(value) ||
        item.licensePlate?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 150,
      render: (date: any) => (
        <div className="text-gray-500 text-xs">
          {dayjs(date).format("DD/MM/YYYY")}
          <br />
          {dayjs(date).format("HH:mm")}
        </div>
      ),
    },
    {
      title: "Thông tin Khách hàng",
      key: "customerInfo",
      render: (record: CustomerData) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-blue-700 uppercase">
            {record.fullName}
          </Text>
          <Space className="text-xs text-gray-500">
            <PhoneOutlined /> {record.phone}
          </Space>
        </Space>
      ),
    },
    {
      title: "Nhu cầu & Xe",
      key: "demand",
      render: (record: CustomerData) => {
        const typeColors: any = {
          SELL: "orange",
          BUY: "green",
          VALUATION: "blue",
        };
        const typeLabels: any = {
          SELL: "BÁN XE",
          BUY: "MUA XE",
          VALUATION: "ĐỊNH GIÁ",
        };
        return (
          <Space direction="vertical" size={4}>
            <Tag
              color={typeColors[record.type]}
              className="font-bold border-none m-0"
            >
              {typeLabels[record.type]}
            </Tag>
            {record.carType && (
              <div className="text-xs font-medium text-gray-600 italic">
                🚙 {record.carType} - {record.licensePlate || "Chưa có biển"}
              </div>
            )}
          </Space>
        );
      },
    },
    {
      title: "Người giới thiệu",
      render: (record: CustomerData) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <div>
            <div className="text-sm">{record.referrer?.fullName}</div>
            <div className="text-[10px] bg-gray-100 px-1 rounded text-gray-400">
              ID: {record.referrer?.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => {
        const statusMap: any = {
          NEW: { color: "magenta", text: "MỚI" },
          ASSIGNED: { color: "blue", text: "ĐÃ GIAO" },
          CONTACTED: { color: "warning", text: "ĐANG XỬ LÝ" },
          DEAL_DONE: { color: "success", text: "THÀNH CÔNG" },
          CANCELLED: { color: "error", text: "HỦY" },
        };
        return (
          <Tag color={statusMap[status]?.color} style={{ borderRadius: 10 }}>
            {statusMap[status]?.text}
          </Tag>
        );
      },
    },
    {
      title: "Phân bổ nhân viên phụ trách",
      width: 220,
      render: (record: CustomerData) => (
        <Select
          placeholder="Chọn nhân viên..."
          style={{ width: "100%" }}
          defaultValue={record.assignedToId}
          status={!record.assignedToId ? "error" : ""}
          onChange={async (val) => {
            try {
              await assignCustomerAction(record.id, val);
              message.success(`Đã giao khách ${record.fullName} thành công`);
              loadAllData(); // Refresh để cập nhật trạng thái
            } catch (err) {
              message.error("Không thể phân bổ");
            }
          }}
        >
          {staffs.map((s: UserData) => (
            <Select.Option key={s.id} value={s.id}>
              <span className="font-medium">{s.fullName}</span>{" "}
              <small className="text-gray-400">({s.role})</small>
            </Select.Option>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 1. Dashboard Thống kê nhanh */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-magenta-500"
          >
            <Statistic
              title="Khách mới chưa giao"
              value={data.filter((i) => i.status === "NEW").length}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-blue-500"
          >
            <Statistic
              title="Đang xử lý"
              value={
                data.filter(
                  (i) => i.status === "CONTACTED" || i.status === "ASSIGNED"
                ).length
              }
              prefix={<ReloadOutlined spin />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-green-500"
          >
            <Statistic
              title="Chốt thành công"
              value={data.filter((i) => i.status === "DEAL_DONE").length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-gray-500"
          >
            <Statistic
              title="Tổng giới thiệu"
              value={data.length}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Bảng dữ liệu chính */}
      <Card
        title={
          <span className="text-lg font-bold">DANH SÁCH TIẾP NHẬN NHU CẦU</span>
        }
        extra={
          <Space>
            <Search
              placeholder="Tìm tên, SĐT, biển số..."
              onSearch={onSearch}
              style={{ width: 250 }}
              allowClear
            />
            <Tooltip title="Tải lại dữ liệu">
              <Button icon={<ReloadOutlined />} onClick={loadAllData} />
            </Tooltip>
          </Space>
        }
        className="shadow-md rounded-lg"
      >
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}

const { Text } = Typography;
import { Typography } from "antd";
