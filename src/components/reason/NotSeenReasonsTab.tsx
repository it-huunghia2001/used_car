/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getNotSeenReasons,
  upsertNotSeenReason,
  deleteNotSeenReason,
} from "@/actions/not-seen-reason-actions";

export default function NotSeenReasonsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const res = await getNotSeenReasons();
    setData(res as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    const res = await upsertNotSeenReason({ ...values, id: editingItem?.id });
    if (res.success) {
      message.success("Lưu thành công");
      setIsModalOpen(false);
      loadData();
    }
  };

  const columns = [
    {
      title: "Tên lý do",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Tag color="default" className="font-bold text-slate-600">
          {text}
        </Tag>
      ),
    },
    { title: "Mô tả chi tiết", dataIndex: "content", key: "content" },
    {
      title: "Thao tác",
      key: "action",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingItem(record);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          />
          <Popconfirm
            title="Xác nhận xóa?"
            onConfirm={() => deleteNotSeenReason(record.id).then(loadData)}
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
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
        >
          Thêm nguyên nhân chưa xem
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title="Lý do chưa xem xe"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Tên lý do ngắn"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Ghi chú hệ thống">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
