/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Space,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "@/lib/dayjs";
import {
  deleteDailyInbound,
  getDailyInboundDetail,
  getDailyInbounds,
  upsertDailyInbound,
} from "@/actions/daily-carInbound-actions";

const { RangePicker } = DatePicker;

export default function NewCarInboundPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      const res = await getDailyInbounds(params);
      if (res.success) {
        setData(res.data || []);
      } else {
        message.error(res.message || "Không tải được dữ liệu");
      }
    } catch (err) {
      message.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs() });
    setModalVisible(true);
  };

  const handleEdit = async (record: any) => {
    setIsEdit(true);
    setCurrentRecord(record);
    form.setFieldsValue({
      date: dayjs(record.date),
      totalCars: record.totalCars,
      note: record.note,
    });
    setModalVisible(true);
  };

  const handleView = async (record: any) => {
    const res = await getDailyInboundDetail({ id: record.id });
    if (res.success && res.data) {
      Modal.info({
        title: `Chi tiết ngày ${dayjs(res.data.date).format("DD/MM/YYYY")}`,
        content: (
          <div>
            <p>
              <strong>Số lượng xe mới bán ra:</strong> {res.data.totalCars}
            </p>
            <p>
              <strong>Ghi chú:</strong> {res.data.note || "Không có"}
            </p>
            <p>
              <strong>Chi nhánh:</strong> {res.data.branch?.name}
            </p>
            <p>
              <strong>Người nhập:</strong> {res.data.createdBy?.fullName}
            </p>
            <p>
              <strong>Cập nhật lúc:</strong>{" "}
              {dayjs(res.data.updatedAt).format("DD/MM/YYYY HH:mm")}
            </p>
          </div>
        ),
        okText: "Đóng",
      });
    } else {
      message.error(res.message);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteDailyInbound(id);
    if (res.success) {
      message.success(res.message);
      fetchData();
    } else {
      message.error(res.message);
    }
  };

  const onFinish = async (values: any) => {
    const payload = {
      date: values.date.toISOString(),
      totalCars: values.totalCars,
      note: values.note || "",
    };

    const res = await upsertDailyInbound(payload);
    if (res.success) {
      message.success(res.message);
      setModalVisible(false);
      fetchData();
    } else {
      message.error(res.message);
    }
  };

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: "Số lượng xe mới bán ra",
      dataIndex: "totalCars",
      key: "totalCars",
      render: (val: number) => <Tag color="blue">{val} xe</Tag>,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
    },
    {
      title: "Người nhập",
      key: "createdBy",
      render: (_: any, record: any) => record.createdBy?.fullName || "N/A",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa?"
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
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Nhập số lượng xe mới bán ra hàng ngày
          </h1>
          <Space>
            <RangePicker
              placeholder={["Từ ngày", "Đến ngày"]}
              onChange={(dates) => setDateRange(dates as any)}
              allowClear
              style={{ width: 300 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Nhập hôm nay
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={isEdit ? "Sửa số lượng xe mới" : "Nhập số lượng xe mới bán ra"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="date"
            label="Ngày"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              disabledDate={(d) => d > dayjs().endOf("day")}
            />
          </Form.Item>

          <Form.Item
            name="totalCars"
            label="Số lượng xe mới bán ra"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng" },
              { type: "number", min: 0, message: "Số lượng không được âm" },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Ví dụ: 15"
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Xe từ đại lý A, chương trình khuyến mãi..."
            />
          </Form.Item>

          <Form.Item className="text-right">
            <Button onClick={() => setModalVisible(false)} className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {isEdit ? "Cập nhật" : "Lưu"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
