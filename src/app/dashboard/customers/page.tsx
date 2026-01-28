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
  Typography,
  Modal,
  Descriptions,
  Divider,
} from "antd";
import { useEffect, useState } from "react";
import {
  UserOutlined,
  CarOutlined,
  PhoneOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  getCustomersAction,
  assignCustomerAction,
} from "@/actions/customer-actions";
import { getEligibleStaffAction } from "@/actions/user-actions";
import dayjs from "dayjs";

const { Search } = Input;
const { Text, Title } = Typography;

// Interfaces
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
  carModel?: { name: string };
  carYear?: number;
  note?: string;
  budget?: string;
  expectedPrice?: string;
  assignedToId: string | null;
  referrer: {
    fullName: string | null;
    username: string;
    branch?: { name: string };
  };
  assignedTo: { fullName: string | null; phone?: string } | null;
}

export default function CustomerManagementPage() {
  const [data, setData] = useState<CustomerData[]>([]);
  const [filteredData, setFilteredData] = useState<CustomerData[]>([]);
  const [staffs, setStaffs] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal chi tiết
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null,
  );

  const typeConfigs: any = {
    SELL: { label: "BÁN XE", color: "orange" },
    SELL_TRADE_NEW: { label: "BÁN CŨ ĐỔI MỚI", color: "red" },
    SELL_TRADE_USED: { label: "BÁN CŨ ĐỔI CŨ", color: "volcano" },
    BUY: { label: "MUA XE", color: "green" },
    VALUATION: { label: "ĐỊNH GIÁ", color: "blue" },
  };

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

  const onSearch = (value: string) => {
    const filtered = data.filter(
      (item) =>
        item.fullName.toLowerCase().includes(value.toLowerCase()) ||
        item.phone.includes(value) ||
        item.licensePlate?.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredData(filtered);
  };

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 120,
      render: (date: any) => (
        <div className="text-gray-500 text-xs">
          {dayjs(date).format("DD/MM/YYYY")}
          <br />
          {dayjs(date).format("HH:mm")}
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "customerInfo",
      render: (record: CustomerData) => (
        <Space orientation="vertical" size={0}>
          <Text strong className="text-blue-700 uppercase">
            {record.fullName}
          </Text>
          <Text type="secondary" className="text-xs">
            <PhoneOutlined /> {record.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nhu cầu & Xe",
      key: "demand",
      render: (record: CustomerData) => {
        const typeColors: any = {
          SELL: "orange",
          SELL_TRADE_NEW: "red", // Màu đỏ để nhấn mạnh đổi xe mới
          SELL_TRADE_USED: "volcano", // Màu cam đậm/đỏ gạch cho đổi xe cũ
          BUY: "green",
          VALUATION: "blue",
        };

        const typeLabels: any = {
          SELL: "BÁN XE",
          SELL_TRADE_NEW: "BÁN CŨ ĐỔI MỚI",
          SELL_TRADE_USED: "BÁN CŨ ĐỔI CŨ",
          BUY: "MUA XE",
          VALUATION: "ĐỊNH GIÁ",
        };
        return (
          <Space orientation="vertical" size={4}>
            <Tag
              color={typeColors[record.type]}
              className="font-bold border-none m-0"
            >
              {typeLabels[record.type]}
            </Tag>
            <div className="text-xs font-medium text-gray-600 italic">
              {record.carModel?.name || "Chưa chọn mẫu"} -{" "}
              {record.licensePlate || "N/A"}
            </div>
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => {
        const statusMap: any = {
          NEW: { color: "magenta", text: "MỚI" },
          ASSIGNED: { color: "blue", text: "ĐÃ GIAO" },
          PENDING_DEAL_APPROVAL: { color: "orange", text: "CHỜ DUYỆT" },
          CONTACTED: { color: "warning", text: "ĐANG XỬ LÝ" },
          DEAL_DONE: { color: "success", text: "THÀNH CÔNG" },
          CANCELLED: { color: "error", text: "HỦY" },
        };
        return (
          <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
        );
      },
    },
    {
      title: "Nhân viên phụ trách",
      width: 200,
      render: (record: CustomerData) => (
        <div onClick={(e) => e.stopPropagation()}>
          {" "}
          {/* Chặn sự kiện click row khi chọn Select */}
          <Select
            placeholder="Giao việc..."
            className="w-full"
            defaultValue={record.assignedToId}
            onChange={async (val) => {
              try {
                await assignCustomerAction(record.id, val);
                message.success(`Đã giao khách thành công`);
                loadAllData();
              } catch (err) {
                message.error("Lỗi phân bổ");
              }
            }}
          >
            {staffs.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.fullName}
              </Select.Option>
            ))}
          </Select>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Dashboard Thống kê */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-l-4 border-red-500">
            <Statistic
              title="Mới"
              value={data.filter((i) => i.status === "NEW").length}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-l-4 border-blue-500">
            <Statistic
              title="Đang xử lý"
              value={
                data.filter((i) => ["ASSIGNED", "CONTACTED"].includes(i.status))
                  .length
              }
              prefix={<ReloadOutlined spin={loading} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-l-4 border-green-500">
            <Statistic
              title="Thành công"
              value={data.filter((i) => i.status === "DEAL_DONE").length}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-l-4 border-gray-500">
            <Statistic
              title="Tổng"
              value={data.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span className="font-bold">QUẢN LÝ TIẾP NHẬN</span>}
        extra={
          <Space>
            <Search
              placeholder="Tìm nhanh..."
              onSearch={onSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={loadAllData} />
          </Space>
        }
        className="shadow-md rounded-xl"
      >
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedCustomer(record);
              setDetailVisible(true);
            },
            className: "cursor-pointer hover:bg-blue-50 transition-colors",
          })}
        />
      </Card>

      {/* MODAL CHI TIẾT KHÁCH HÀNG */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-blue-600">
            <EyeOutlined /> <span>CHI TIẾT GIỚI THIỆU</span>
          </div>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
        centered
      >
        {selectedCustomer && (
          <div className="py-2">
            <Descriptions
              title="Thông tin khách hàng"
              bordered
              column={{ xs: 1, sm: 2 }}
            >
              <Descriptions.Item label="Họ tên" span={2}>
                <Text strong className="text-lg">
                  {selectedCustomer.fullName}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                <Text copyable>{selectedCustomer.phone}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian gửi">
                {dayjs(selectedCustomer.createdAt).format("HH:mm - DD/MM/YYYY")}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="horizontal" className="my-4! text-gray-400">
              Chi tiết nhu cầu
            </Divider>

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Loại yêu cầu">
                {(() => {
                  const config = typeConfigs[selectedCustomer.type] || {
                    label: "KHÔNG XÁC ĐỊNH",
                    color: "default",
                  };
                  return (
                    <Tag color={config.color} className="font-bold">
                      {config.label}
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Xe yêu cầu">
                {selectedCustomer.carModel?.name}{" "}
                {selectedCustomer.carYear
                  ? `(Đời ${selectedCustomer.carYear})`
                  : ""}
              </Descriptions.Item>
              <Descriptions.Item label="Biển số">
                {selectedCustomer.licensePlate || "N/A"}
              </Descriptions.Item>
              {selectedCustomer.budget && (
                <Descriptions.Item label="Ngân sách">
                  {selectedCustomer.budget}
                </Descriptions.Item>
              )}
              {selectedCustomer.expectedPrice && (
                <Descriptions.Item label="Giá kỳ vọng">
                  {selectedCustomer.expectedPrice}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Ghi chú từ CTV">
                {selectedCustomer.note || "Không có ghi chú"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="horizontal" className="my-4! text-gray-400">
              Phụ trách & Nguồn
            </Divider>

            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Người giới thiệu">
                {selectedCustomer.referrer?.fullName} (
                {selectedCustomer.referrer?.username})
              </Descriptions.Item>
              <Descriptions.Item label="Chi nhánh">
                {selectedCustomer.referrer?.branch?.name || "Hệ thống"}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên xử lý" span={2}>
                {selectedCustomer.assignedTo ? (
                  <Space>
                    <UserOutlined className="text-blue-500" />{" "}
                    <Text strong>{selectedCustomer.assignedTo.fullName}</Text>
                  </Space>
                ) : (
                  <Text className="danger italic">Chưa giao nhân viên</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
