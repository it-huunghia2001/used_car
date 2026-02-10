/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Popconfirm,
  message,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  getAllReasons,
  createReason,
  updateReason,
  deleteReason,
} from "@/actions/reason-actions";

export default function LeadStatusReasonsTab() {
  const [form] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllReasons();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingId) await updateReason(editingId, values);
      else await createReason(values);
      message.success("Thao tác thành công");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Nội dung lý do",
      dataIndex: "content",
      key: "content",
      render: (text: string) => (
        <span className="font-semibold text-slate-700">{text}</span>
      ),
    },
    {
      title: "Loại trạng thái",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const configs: any = {
          LOSE: {
            color: "red",
            text: "Thất bại (Lose)",
            icon: <StopOutlined />,
          },
          FROZEN: {
            color: "orange",
            text: "Tạm dừng",
            icon: <ClockCircleOutlined />,
          },
          PENDING_VIEW: {
            color: "blue",
            text: "Chờ xử lý",
            icon: <InfoCircleOutlined />,
          },
        };
        const item = configs[type] || configs.LOSE;
        return (
          <Tag
            icon={item.icon}
            color={item.color}
            className="rounded-full px-3"
          >
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <Badge
          status={active ? "success" : "default"}
          text={active ? "Đang dùng" : "Đã ẩn"}
        />
      ),
    },
    {
      title: "Hành động",
      key: "action",
      align: "right" as const,
      render: (record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingId(record.id);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          />
          <Popconfirm
            title="Xóa lý do này?"
            onConfirm={() => deleteReason(record.id).then(loadData)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 rounded-lg"
        >
          Thêm lý do hệ thống
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 7 }}
      />
      <Modal
        title={editingId ? "Cập nhật lý do" : "Thêm lý do hệ thống"}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="type"
            label="Áp dụng cho trạng thái"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: "Lost", value: "LOSE" },
                { label: "Đóng băng", value: "FROZEN" },
                { label: "Đang theo dõi", value: "PENDING_VIEW" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung hiển thị"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
