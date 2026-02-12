/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Typography,
  Space,
  message,
  Tooltip,
  Input,
  Select,
  Modal,
  Descriptions,
  Divider,
  Empty,
} from "antd";
import {
  CloudSyncOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  PhoneOutlined,
  EyeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { getFrozenLeadsAction } from "@/actions/customer-actions";
import { unfreezeCustomerAction } from "@/actions/task-actions";
import { getStaffByBranchAction } from "@/actions/user-actions";
import dayjs from "@/lib/dayjs";
import ModalUnfreeze from "@/components/frozen-leads/ModalUnfreeze";
import { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

export default function FrozenLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [salesStaff, setSalesStaff] = useState<any[]>([]);

  // States cho lọc (Server-side)
  const [searchText, setSearchText] = useState("");
  const [filterStaff, setFilterStaff] = useState<string | undefined>(undefined);

  // States cho Modal
  const [isUnfreezeOpen, setIsUnfreezeOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Hàm load dữ liệu từ API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leads, staffRes] = await Promise.all([
        getFrozenLeadsAction({
          search: searchText,
          staffId: filterStaff,
        }),
        getStaffByBranchAction(),
      ]);
      setData(leads);
      if (staffRes.success) setSalesStaff(staffRes.data);
    } catch (error: any) {
      message.error("Lỗi tải dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [searchText, filterStaff]);

  // Debounce tìm kiếm để tránh spam API
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, filterStaff, loadData]);

  const handleUnfreeze = async (
    customerId: string,
    assigneeId: string,
    note: string,
  ) => {
    try {
      const res = await unfreezeCustomerAction(customerId, assigneeId, note);
      if (res.success) {
        message.success("Đã rã băng và bàn giao thành công!");
        setIsUnfreezeOpen(false);
        loadData();
      } else {
        message.error((res as any).error || "Lỗi thực hiện rã băng");
      }
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "KHÁCH HÀNG / XE",
      key: "customer",
      width: 250,
      render: (r: any) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-indigo-700">
            {r.fullName}
          </Text>
          <Text type="secondary" className="text-xs">
            <PhoneOutlined /> {r.phone}
          </Text>
          {/* Ưu tiên lấy biển số từ leadCar, nếu ko có thì lấy từ customer */}
          {(r.leadCar?.licensePlate || r.licensePlate) && (
            <Tag color="blue" className="mt-1 font-mono">
              {r.leadCar?.licensePlate || r.licensePlate}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "NGUỒN GỐC",
      key: "referrer",
      render: (r: any) => (
        <Space direction="vertical" size={0}>
          <Text className="text-xs">
            <TeamOutlined /> {r.referrer?.fullName || "Hệ thống"}
          </Text>
          <Tag color="cyan" className="text-[10px] m-0 mt-1 uppercase">
            {r.typeVietnamese}
          </Tag>
        </Space>
      ),
    },
    {
      title: "LÝ DO ĐÓNG BĂNG",
      key: "reason",
      render: (r: any) => {
        const lastAct = r.activities?.[0];
        return (
          <Tooltip title={r.note || "Xem chi tiết lý do"}>
            <div className="max-w-[200px]">
              <Text strong className="text-red-500 block">
                {lastAct?.reason?.content || "Quá hạn xử lý"}
              </Text>
              <Text type="secondary" className="text-[10px] italic">
                {dayjs(r.lastFrozenAt).format("DD/MM/YYYY HH:mm")}
              </Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "NHÂN VIÊN CŨ",
      key: "assignedTo",
      render: (r: any) => (
        <div className="flex flex-col">
          <Text className="text-xs font-medium">
            {r.assignedTo?.fullName || "Chưa giao"}
          </Text>
          <Text type="secondary" className="text-[10px]">
            {r.branch?.name}
          </Text>
        </div>
      ),
    },
    {
      title: "THAO TÁC",
      align: "right",
      render: (r: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLead(r);
              setIsPreviewOpen(true);
            }}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CloudSyncOutlined />}
            onClick={() => {
              setSelectedLead(r);
              setIsUnfreezeOpen(true);
            }}
          >
            Rã băng
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f0f2f5] min-h-screen">
      <Card className="rounded-xl shadow-sm border-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <Title level={4} className="m-0!">
              <ClockCircleOutlined className="text-red-500 mr-2" />
              DANH SÁCH HỒ SƠ ĐANG ĐÓNG BĂNG
            </Title>
            <Text type="secondary">
              Tìm thấy {data.length} khách hàng cần xử lý rã băng
            </Text>
          </div>

          <Space wrap>
            <Input
              placeholder="Tên, SĐT, Biển số..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
            />
            <Select
              placeholder="Nhân viên tiếp nhận"
              allowClear
              style={{ width: 200 }}
              suffixIcon={<FilterOutlined />}
              onChange={(val) => setFilterStaff(val)}
              options={salesStaff.map((s) => ({
                label: `${s.fullName} (${s.branch?.name || "VP"})`,
                value: s.id,
              }))}
            />
            <Button
              icon={<CloudSyncOutlined />}
              onClick={loadData}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{
            emptyText: (
              <Empty description="Không có khách hàng nào đang đóng băng" />
            ),
          }}
          className="custom-table"
        />
      </Card>

      {/* MODAL CHI TIẾT HỒ SƠ */}
      <Modal
        title={
          <Space>
            <UserOutlined className="text-indigo-600" />
            <span className="uppercase">Chi tiết khách hàng đóng băng</span>
          </Space>
        }
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsPreviewOpen(false)}
          >
            Đóng lại
          </Button>,
        ]}
        width={800}
        centered
      >
        {selectedLead && (
          <div className="py-2">
            <Descriptions
              title="Thông tin cá nhân & Giới thiệu"
              bordered
              column={2}
              size="small"
            >
              <Descriptions.Item label="Họ và tên" span={1}>
                <Text strong>{selectedLead.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedLead.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày giới thiệu">
                {dayjs(selectedLead.referralDate).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Người giới thiệu">
                <Tag color="orange">
                  {selectedLead.referrer?.fullName || "Hệ thống"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nhu cầu khách">
                <Tag color="green">{selectedLead.typeVietnamese}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tỉnh thành">
                {selectedLead.province || "Chưa cập nhật"}
              </Descriptions.Item>
            </Descriptions>

            <Divider className="!text-xs text-gray-400 uppercase">
              Thông tin xe
            </Divider>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Dòng xe">
                {selectedLead.carModel?.name ||
                  selectedLead.leadCar?.modelName ||
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Biển số">
                {selectedLead.licensePlate ||
                  selectedLead.leadCar?.licensePlate ||
                  "N/A"}
              </Descriptions.Item>
            </Descriptions>

            <Divider className="!text-xs text-red-400 uppercase">
              Lý do đóng băng & Giải trình
            </Divider>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <Space direction="vertical" className="w-full">
                <div className="flex justify-between">
                  <Text strong type="danger">
                    Lý do hệ thống:
                  </Text>
                  <Text type="secondary">
                    {dayjs(selectedLead.lastFrozenAt).format(
                      "DD/MM/YYYY HH:mm",
                    )}
                  </Text>
                </div>
                <Text className="block mb-2">
                  {selectedLead.activities?.[0]?.reason?.content ||
                    "Hệ thống tự động đóng băng do quá hạn xử lý tasks."}
                </Text>
                <Text strong>Nội dung ghi chú/giải trình:</Text>
                <div className="bg-white p-2 rounded border italic text-gray-600">
                  {selectedLead.note || "Không có nội dung ghi chú."}
                </div>
              </Space>
            </div>

            <Descriptions bordered column={1} size="small" className="mt-4">
              <Descriptions.Item label="Chi nhánh quản lý">
                {selectedLead.branch?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên xử lý cũ">
                {selectedLead.assignedTo?.fullName} -{" "}
                {selectedLead.assignedTo?.phone}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* MODAL RÃ BĂNG (COMPONENTS CŨ CỦA BẠN) */}
      <ModalUnfreeze
        isOpen={isUnfreezeOpen}
        onClose={() => setIsUnfreezeOpen(false)}
        selectedCustomer={selectedLead}
        salesStaff={salesStaff}
        loading={loading}
        onFinish={handleUnfreeze}
      />

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f8fafc;
          font-size: 12px;
          text-transform: uppercase;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
