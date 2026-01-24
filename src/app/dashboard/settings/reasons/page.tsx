/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Card,
  Typography,
  Space,
  Popconfirm,
  message,
  Badge,
  Row,
  Col,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  HeatMapOutlined,
} from "@ant-design/icons";
import {
  getAllReasons,
  createReason,
  updateReason,
  deleteReason,
} from "@/actions/reason-actions";
import { LeadStatus } from "@prisma/client";

const { Title, Text } = Typography;

export default function AdminReasonsPage() {
  const [form] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");

  // Load dữ liệu
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllReasons();
      setData(res);
    } catch (err) {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý Lưu (Thêm/Sửa)
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingId) {
        await updateReason(editingId, values);
        message.success("Cập nhật lý do thành công");
      } else {
        await createReason(values);
        message.success("Thêm lý do mới thành công");
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      loadData();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mở modal sửa
  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  // Xóa
  const handleDelete = async (id: string) => {
    try {
      await deleteReason(id);
      message.success("Đã xóa lý do");
      loadData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const filteredData = data.filter((item) =>
    filterType === "ALL" ? true : item.type === filterType,
  );

  // Thống kê nhanh
  const stats = {
    total: data.length,
    lose: data.filter((i) => i.type === "LOSE").length,
    frozen: data.filter((i) => i.type === "FROZEN").length,
    pending: data.filter((i) => i.type === "PENDING_VIEW").length,
  };

  const columns = [
    {
      title: "NỘI DUNG LÝ DO",
      dataIndex: "content",
      key: "content",
      render: (text: string) => (
        <Text strong className="text-slate-700">
          {text}
        </Text>
      ),
    },
    {
      title: "LOẠI TRẠNG THÁI",
      dataIndex: "type",
      key: "type",
      width: 180,
      render: (type: LeadStatus) => {
        const config: Record<
          string,
          { color: string; text: string; icon: React.ReactNode }
        > = {
          LOSE: {
            color: "error",
            text: "Thất bại (Lose)",
            icon: <StopOutlined />,
          },
          FROZEN: {
            color: "warning",
            text: "Tạm dừng",
            icon: <ClockCircleOutlined />,
          },
          PENDING_VIEW: {
            color: "processing",
            text: "Đang chờ",
            icon: <InfoCircleOutlined />,
          },
          DEAL_DONE: {
            color: "success",
            text: "Thành công",
            icon: <CheckCircleOutlined />,
          },
          ASSIGNED: {
            color: "default",
            text: "Đã phân bổ",
            icon: <HeatMapOutlined />,
          },
          CONTACTED: {
            color: "cyan",
            text: "Đã liên hệ",
            icon: <HeatMapOutlined />,
          },
          NEW: { color: "purple", text: "Mới", icon: <HeatMapOutlined /> },
          CANCELLED: {
            color: "magenta",
            text: "Hủy bỏ",
            icon: <StopOutlined />,
          },
          PENDING_DEAL_APPROVAL: {
            color: "default",
            text: "Chờ phê duyệt",
            icon: <HeatMapOutlined />,
          },
        };
        const item = config[type] || config.LOSE;
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
      title: "TRẠNG THÁI",
      dataIndex: "active",
      key: "active",
      width: 120,
      render: (active: boolean) => (
        <Badge
          status={active ? "success" : "default"}
          text={active ? "Đang dùng" : "Đã ẩn"}
        />
      ),
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      width: 150,
      align: "right" as const,
      render: (record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa lý do này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={2} className="m-0 text-slate-800">
              Cấu hình Lý do Đóng Lead
            </Title>
            <Text type="secondary">
              Quản lý danh mục lý do xuất hiện trong các Modal xử lý của nhân
              viên
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 rounded-lg shadow-blue-200 shadow-lg"
          >
            Thêm lý do mới
          </Button>
        </div>

        {/* Stats Section */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card className="shadow-sm">
              <div className="text-slate-400 text-xs uppercase font-bold mb-1">
                Tổng số
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="shadow-sm border-l-4 border-red-500">
              <div className="text-slate-400 text-xs uppercase font-bold mb-1">
                Thất bại (Lose)
              </div>
              <div className="text-2xl font-bold text-red-600">
                {stats.lose}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              bordered={false}
              className="shadow-sm border-l-4 border-orange-500"
            >
              <div className="text-slate-400 text-xs uppercase font-bold mb-1">
                Tạm dừng
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.frozen}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              bordered={false}
              className="shadow-sm border-l-4 border-blue-500"
            >
              <div className="text-slate-400 text-xs uppercase font-bold mb-1">
                Chờ xử lý
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.pending}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Table Section */}
        <Card className="shadow-md border-none rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FilterOutlined className="text-slate-400" />
              <Select
                defaultValue="ALL"
                style={{ width: 200 }}
                onChange={setFilterType}
                options={[
                  { label: "Tất cả trạng thái", value: "ALL" },
                  { label: "Thất bại (Lose)", value: "LOSE" },
                  { label: "Tạm dừng (Frozen)", value: "FROZEN" },
                  { label: "Chờ xem xe (Pending)", value: "PENDING_VIEW" },
                ]}
              />
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
            locale={{
              emptyText: <Empty description="Chưa có dữ liệu lý do" />,
            }}
          />
        </Card>
      </div>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingId ? "Cập nhật lý do" : "Thêm lý do hệ thống mới"}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        okText="Lưu thông tin"
        cancelText="Hủy bỏ"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="type"
            label="Áp dụng cho trạng thái nào?"
            rules={[
              { required: true, message: "Vui lòng chọn trạng thái áp dụng" },
            ]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="LOSE">
                Thất bại (Khách không mua/bán nữa)
              </Select.Option>
              <Select.Option value="FROZEN">
                Tạm dừng (Sẽ quay lại sau)
              </Select.Option>
              <Select.Option value="PENDING_VIEW">
                Chờ xem xe (Đang sắp xếp lịch)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung lý do mẫu"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung lý do" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Khách chê giá mua quá thấp so với thị trường"
            />
          </Form.Item>

          {editingId && (
            <Form.Item
              name="active"
              label="Trạng thái hoạt động"
              valuePropName="checked"
            >
              <Select
                options={[
                  { label: "Đang hoạt động (Hiển thị cho NV)", value: true },
                  { label: "Ngưng sử dụng (Ẩn)", value: false },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 800 !important;
        }
        .ant-card {
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
