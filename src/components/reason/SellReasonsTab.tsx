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
  getSellReasons,
  upsertSellReason,
  deleteSellReason,
} from "@/actions/sell-reason-actions";

export default function SellReasonsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const res = await getSellReasons();
    setData(res as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    const res = await upsertSellReason({ ...values, id: editingItem?.id });
    if (res.success) {
      message.success("Đã cập nhật danh mục bán");
      setIsModalOpen(false);
      loadData();
    }
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
          className="bg-orange-500 border-none"
        >
          Thêm lý do bán xe
        </Button>
      </div>
      <Table
        columns={[
          {
            title: "Lý do bán",
            dataIndex: "name",
            render: (t) => (
              <Tag color="orange" className="font-bold">
                {t}
              </Tag>
            ),
          },
          { title: "Mô tả", dataIndex: "content" },
          {
            title: "Thao tác",
            align: "right" as const,
            render: (r) => (
              <Space>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingItem(r);
                    form.setFieldsValue(r);
                    setIsModalOpen(true);
                  }}
                />
                <Popconfirm
                  title="Xóa?"
                  onConfirm={() => deleteSellReason(r.id).then(loadData)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title="Lý do bán xe"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Tên lý do" rules={[{ required: true }]}>
            <Input placeholder="VD: Cần tiền kinh doanh" />
          </Form.Item>
          <Form.Item name="content" label="Ghi chú">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
