/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Table,
  Button,
  Space,
  Divider,
  Typography,
  Avatar,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getRoleTag } from "@/components/role";

const { Text } = Typography;

// Hàm hỗ trợ dịch và hiển thị Tag vai trò

export default function UserTable({ users, loading, onEdit, onDelete }: any) {
  const columns = [
    {
      title: "NHÂN VIÊN",
      render: (record: any) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            className="bg-blue-100 text-blue-600"
          />
          <div className="flex flex-col">
            <Text strong>{record.fullName}</Text>
            <Text type="secondary" className="text-[11px] uppercase">
              {record.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "ĐƠN VỊ",
      render: (record: any) => (
        <div className="text-[13px]">
          <Text className="text-slate-600 block">
            {record.department?.name}
          </Text>
          <Space
            className="text-slate-400 text-[12px]"
            split={<Divider type="vertical" />}
          >
            <span>{record.position?.name}</span>
            <span>
              <HomeOutlined /> {record.branch?.name || "Global"}
            </span>
          </Space>
        </div>
      ),
    },
    {
      title: "VAI TRÒ",
      dataIndex: "role",
      key: "role",
      width: 180,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: "THAO TÁC",
      align: "right" as const,
      render: (record: any) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa vĩnh viễn nhân sự này?"
            onConfirm={() => onDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, className: "p-6" }}
      scroll={{ x: 800 }}
    />
  );
}
