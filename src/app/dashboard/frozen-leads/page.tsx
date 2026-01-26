/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/frozen-leads/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Typography,
  Space,
  message,
  Tooltip,
} from "antd";
import {
  CloudSyncOutlined,
  UserOutlined,
  ClockCircleOutlined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getFrozenLeadsAction } from "@/actions/customer-actions";
import { unfreezeCustomerAction } from "@/actions/task-actions";
import { getStaffByBranchAction, getUsersAction } from "@/actions/user-actions"; // Giả sử bạn có hàm lấy danh sách NV
import dayjs from "@/lib/dayjs";
import ModalUnfreeze from "@/components/frozen-leads/ModalUnfreeze";
import { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

export default function FrozenLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [salesStaff, setSalesStaff] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Gọi song song: Danh sách khách đóng băng và Danh sách nhân viên cùng chi nhánh
      const [leads, staffRes] = await Promise.all([
        getFrozenLeadsAction(),
        getStaffByBranchAction(), // API mới tạo ở trên
      ]);

      setData(leads);

      // Xử lý dữ liệu nhân viên an toàn
      if (staffRes.success) {
        setSalesStaff(staffRes.data); // staffRes.data lúc này chắc chắn là mảng any[]
      } else {
        message.error(staffRes.error);
      }
    } catch (error: any) {
      message.error("Lỗi hệ thống: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);

  const handleUnfreeze = async (
    customerId: string,
    assigneeId: string,
    note: string,
  ) => {
    try {
      const res = await unfreezeCustomerAction(customerId, assigneeId, note);
      if (res.success) {
        message.success("Đã rã băng và giao việc thành công!");
        setIsModalOpen(false);
        loadData();
      } else {
        const error = (res as any).error || "lỗi hệ thống";
        message.error(error);
      }
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "KHÁCH HÀNG",
      render: (r: any) => (
        <div>
          <Text strong className="block">
            {r.fullName}
          </Text>
          <Text type="secondary" className="text-xs">
            {r.phone}
          </Text>
          {r.licensePlate && <Tag className="mt-1">{r.licensePlate}</Tag>}
        </div>
      ),
    },
    {
      title: "LÝ DO HỆ THỐNG",
      render: (r: any) => {
        const lastAct = r.activities?.[0];
        return (
          <Space direction="vertical" size={0}>
            {/* Ưu tiên hiển thị content từ bảng LeadReason */}
            <Text strong className="text-red-500">
              {lastAct?.reason?.content || "Chưa xác định"}
            </Text>
            <Text type="secondary" className="text-[10px]">
              ID: {lastAct?.reasonId || "N/A"}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "GIẢI TRÌNH CỦA SALES",
      width: 300,
      render: (r: any) => {
        // Bóc tách chuỗi note: "...[YÊU CẦU DUYỆT ĐÓNG - MỤC TIÊU: {NỘI DUNG}]: FROZEN"
        const rawNote = r.note || "";
        const match = rawNote.match(/MỤC TIÊU: ([\s\S]*?)\]:/);
        const salesContent = match ? match[1].trim() : "Không có giải trình";

        return (
          <Tooltip title={rawNote}>
            <div className="text-xs italic bg-gray-50 p-2 rounded border border-dashed">
              {salesContent}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "NHÂN VIÊN CŨ",
      render: (r: any) => (
        <Tag icon={<UserOutlined />} color="blue">
          {r.assignedTo?.fullName || "N/A"}
        </Tag>
      ),
    },
    {
      title: "THAO TÁC",
      align: "right",
      render: (r: any) => (
        <Button
          type="primary"
          icon={<CloudSyncOutlined />}
          onClick={() => {
            setSelectedLead(r);
            setIsModalOpen(true);
          }}
        >
          Rã băng
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f0f2f5] min-h-screen">
      <Card
        className="rounded-xl shadow-sm"
        title={
          <Title level={4} className="m-0!">
            <ClockCircleOutlined className="text-blue-500" /> DANH SÁCH KHÁCH
            HÀNG ĐANG ĐÓNG BĂNG
          </Title>
        }
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <ModalUnfreeze
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCustomer={selectedLead}
        salesStaff={salesStaff}
        loading={loading}
        onFinish={handleUnfreeze}
      />
    </div>
  );
}
