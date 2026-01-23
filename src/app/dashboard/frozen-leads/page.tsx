/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Table,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  message,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  UnlockOutlined,
  HistoryOutlined,
  ShakeOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import {
  getFrozenLeadsAction,
  unfreezeLeadAction,
  getCustomerHistoryAction,
} from "@/actions/lead-actions";
import CustomerTimeline from "@/components/CustomerHistoryTimeline";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const { Title, Text } = Typography;

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---
interface FrozenLead {
  id: string;
  fullName: string;
  phone: string;
  updatedAt: Date;
  referrer: {
    fullName: string | null;
    branch: { name: string } | null;
  };
  assignedTo: {
    fullName: string | null;
  } | null;
}

interface ModalState {
  open: boolean;
  data: any[]; // Bạn có thể định nghĩa chi tiết hơn dựa trên LeadActivity
  customerName: string;
}

export default function FrozenLeadsPage() {
  // Sử dụng Interface thay vì any[] để tránh lỗi never[]
  const [data, setData] = useState<FrozenLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyModal, setHistoryModal] = useState<ModalState>({
    open: false,
    data: [],
    customerName: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getFrozenLeadsAction();
      if (res.success && res.data) {
        // Ép kiểu về FrozenLead[] để khớp với Prisma include
        setData(res.data as unknown as FrozenLead[]);
      } else {
        message.error(res.error || "Không thể tải dữ liệu");
        setData([]);
      }
    } catch (error) {
      message.error("Đã có lỗi xảy ra khi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openHistory = async (id: string, name: string) => {
    const res = await getCustomerHistoryAction(id);
    if (res.success && res.data) {
      setHistoryModal({
        open: true,
        data: res.data,
        customerName: name,
      });
    } else {
      message.error("Không thể tải lịch sử hoạt động");
    }
  };

  const columns = [
    {
      title: "Thông tin khách hàng",
      key: "customer",
      render: (v: FrozenLead) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-blue-700">
            {v.fullName}
          </Text>
          <Text type="secondary" className="text-xs">
            {v.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "Đơn vị & Phụ trách",
      key: "staff",
      render: (v: FrozenLead) => (
        <Space direction="vertical" size={0}>
          <Tag color="purple" className="font-medium">
            {v.referrer.branch?.name || "Hệ thống"}
          </Tag>
          <Text className="text-[11px] text-gray-500">
            NV: {v.assignedTo?.fullName || "Chưa bàn giao"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Ngày đóng băng",
      dataIndex: "updatedAt",
      render: (date: Date) => (
        <Text type="secondary" className="text-sm">
          {dayjs(date).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right" as const,
      render: (v: FrozenLead) => (
        <Space>
          <Tooltip title="Xem lịch sử tương tác">
            <Button
              icon={<HistoryOutlined />}
              onClick={() => openHistory(v.id, v.fullName)}
              className="hover:text-blue-600"
            />
          </Tooltip>
          <Button
            type="primary"
            danger
            ghost
            icon={<UnlockOutlined />}
            className="rounded-lg font-medium"
            onClick={() => {
              Modal.confirm({
                title: "Xác nhận rã băng khách hàng",
                icon: <UnlockOutlined className="text-blue-600" />,
                content: `Hệ thống sẽ chuyển khách hàng ${v.fullName} về trạng thái 'Đã liên hệ'. Bạn có chắc chắn?`,
                okText: "Xác nhận rã băng",
                cancelText: "Hủy",
                okButtonProps: { type: "primary" },
                onOk: async () => {
                  const res = await unfreezeLeadAction(v.id);
                  if (res.success) {
                    message.success(`Đã rã băng khách hàng ${v.fullName}`);
                    fetchData();
                  } else {
                    message.error("lỗi rồi");
                  }
                },
              });
            }}
          >
            Rã băng
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Kho lưu trữ Đóng băng
          </Title>
          <Text type="secondary">
            Danh sách khách hàng tạm dừng chăm sóc. Quản lý có quyền phê duyệt
            rã băng để tái khai thác.
          </Text>
        </div>
      </div>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} md={8}>
          <Card className="shadow-sm rounded-2xl border-l-4 border-purple-500">
            <Statistic
              title={
                <span className="text-gray-500 font-medium text-sm">
                  TỔNG KHÁCH ĐÓNG BĂNG
                </span>
              }
              value={data.length}
              style={{ fontWeight: 800, color: "#6366f1" }}
              prefix={<ShakeOutlined className="mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="shadow-sm rounded-2xl border-l-4 border-green-500">
            <Statistic
              title={
                <span className="text-gray-500 font-medium text-sm">
                  TỶ LỆ KHAI THÁC LẠI
                </span>
              }
              value={15.4}
              precision={1}
              style={{ fontWeight: 800, color: "#10b981" }}
              prefix={<RiseOutlined className="mr-2" />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-md rounded-2xl overflow-hidden">
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng số ${total} khách hàng`,
            className: "pr-4",
          }}
          className="custom-table"
        />
      </Card>

      <Modal
        title={
          <Space className="py-2 border-b w-full">
            <HistoryOutlined className="text-blue-600 text-lg" />
            <span className="text-lg font-bold">
              Lịch sử: {historyModal.customerName}
            </span>
          </Space>
        }
        open={historyModal.open}
        onCancel={() => setHistoryModal({ ...historyModal, open: false })}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setHistoryModal({ ...historyModal, open: false })}
          >
            Đóng
          </Button>,
        ]}
        width={700}
        centered
        styles={{
          body: { padding: "24px", maxHeight: "70vh", overflowY: "auto" },
        }}
      >
        <CustomerTimeline history={historyModal.data} />
      </Modal>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: #f1f5f9 !important;
          font-weight: 600 !important;
          color: #475569 !important;
        }
        .rounded-2xl {
          border-radius: 1rem;
        }
      `}</style>
    </div>
  );
}
