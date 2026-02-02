/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Typography,
  Tag,
  message,
  Tooltip,
} from "antd";
import { AlertOutlined, MailOutlined, ManOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getOverdueCustomersAction,
  sendReminderEmailAction,
  freezeOverdueCustomersAction,
} from "@/actions/customer-actions";

const { Text } = Typography;

export default function LeadsOverdueModal({ isOpen, onClose }: any) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const loadData = async () => {
    setLoading(true);
    const data = await getOverdueCustomersAction();
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const handleSendMail = async (ids: string[]) => {
    setLoading(true);
    const res = await sendReminderEmailAction(ids);
    if (res.success) message.success("Đã gửi email nhắc nhở thành công");
    setLoading(false);
  };

  const handleFreeze = async (ids: string[]) => {
    Modal.confirm({
      title: "Xác nhận đóng băng?",
      content: `Hệ thống sẽ chuyển ${ids.length} khách hàng sang trạng thái ĐÓNG BĂNG và lưu lịch sử.`,
      onOk: async () => {
        setLoading(true);
        const res = await freezeOverdueCustomersAction(ids);
        if (res.success) {
          message.success("Đã đóng băng hồ sơ quá hạn");
          loadData();
          setSelectedRowKeys([]);
        }
        setLoading(false);
      },
    });
  };

  const columns = [
    {
      title: "KHÁCH HÀNG",
      render: (r: any) => (
        <div>
          <Text strong>{r.fullName}</Text>
          <br />
          <Text type="secondary" className="text-[11px]">
            {r.phone}
          </Text>
        </div>
      ),
    },
    {
      title: "NGÀY TẠO",
      render: (r: any) => (
        <Tag color="volcano">
          {dayjs().diff(dayjs(r.createdAt), "day")} ngày trước
        </Tag>
      ),
    },
    {
      title: "NHÂN VIÊN",
      render: (r: any) => r.assignedTo?.fullName || "Chưa giao",
    },
    {
      title: "HÀNH ĐỘNG",
      render: (r: any) => (
        <Space>
          <Tooltip title="Gửi mail cá nhân">
            <Button
              icon={<MailOutlined />}
              onClick={() => handleSendMail([r.id])}
            />
          </Tooltip>
          <Tooltip title="Đóng băng khách này">
            <Button
              danger
              icon={<ManOutlined />}
              onClick={() => handleFreeze([r.id])}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <AlertOutlined className="text-red-500" />{" "}
          <span className="uppercase">
            Khách hàng quá hạn ( `&gt;` 60 ngày)
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={null}
    >
      <div className="mb-4 flex justify-between items-center bg-red-50 p-4 rounded-2xl">
        <Text type="secondary">Chọn các hồ sơ để xử lý hàng loạt:</Text>
        <Space>
          <Button
            type="primary"
            icon={<MailOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => handleSendMail(selectedRowKeys as string[])}
          >
            Gửi Mail Tất Cả Đã Chọn
          </Button>
          <Button
            danger
            icon={<ManOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => handleFreeze(selectedRowKeys as string[])}
          >
            Đóng Băng Đã Chọn
          </Button>
        </Space>
      </div>

      <Table
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />
    </Modal>
  );
}
