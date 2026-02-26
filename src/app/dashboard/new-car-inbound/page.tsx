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
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "@/lib/dayjs";
import {
  deleteDailyInbound,
  getDailyInboundDetail,
  getDailyInbounds,
  upsertDailyInbound,
} from "@/actions/daily-carInbound-actions";

const { RangePicker } = DatePicker;
const { Text } = Typography;

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
          <div className="space-y-2 pt-4">
            <p>
              <strong>Số lượng:</strong>{" "}
              <Tag color="blue">{res.data.totalCars} xe</Tag>
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
              <Text type="secondary" className="text-xs">
                Cập nhật: {dayjs(res.data.updatedAt).format("DD/MM/YYYY HH:mm")}
              </Text>
            </p>
          </div>
        ),
        okText: "Đóng",
        maskClosable: true,
      });
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
      render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: "Số lượng",
      dataIndex: "totalCars",
      render: (val: number) => (
        <Tag color="blue" className="font-bold">
          {val} xe
        </Tag>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      ellipsis: true,
    },
    {
      title: "Hành động",
      key: "action",
      align: "right" as any,
      render: (_: any, record: any) => (
        <Space>
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
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-3 md:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 m-0">
            EM XE MỚI
          </h1>

          <div className="flex flex-col sm:flex-row gap-2">
            <RangePicker
              className="w-full sm:w-[250px]"
              placeholder={["Từ ngày", "Đến"]}
              onChange={(dates) => setDateRange(dates as any)}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="h-10 font-bold rounded-lg shadow-md"
              block
            >
              NHẬP HÔM NAY
            </Button>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Card className="shadow-sm rounded-xl overflow-hidden border-none">
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 15 }}
            />
          </Card>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <Card loading className="rounded-xl" />
          ) : data.length > 0 ? (
            data.map((record) => (
              <Card
                key={record.id}
                className="rounded-xl shadow-sm border-none"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <Text className="text-[10px] uppercase font-bold text-slate-400">
                      Ngày nhập
                    </Text>
                    <Text strong className="text-lg">
                      <CalendarOutlined className="mr-2 text-indigo-500" />
                      {dayjs(record.date).format("DD/MM/YYYY")}
                    </Text>
                  </div>
                  <Tag
                    color="blue"
                    className="m-0 px-3 py-1 rounded-lg font-black text-sm"
                  >
                    {record.totalCars} XE
                  </Tag>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg mb-4">
                  <Text type="secondary" className="text-xs block mb-1">
                    Ghi chú:
                  </Text>
                  <Text className="italic">
                    {record.note || "Không có ghi chú"}
                  </Text>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <Space>
                    <UserOutlined className="text-slate-300" />
                    <Text className="text-xs text-slate-500">
                      {record.createdBy?.fullName}
                    </Text>
                  </Space>
                  <Space>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleView(record)}
                      className="rounded-md"
                    />
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                      className="rounded-md"
                    />
                    <Popconfirm
                      title="Xóa bản ghi này?"
                      onConfirm={() => handleDelete(record.id)}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        className="rounded-md"
                      />
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            ))
          ) : (
            <Card className="text-center p-10 rounded-xl">
              <Text type="secondary">Không có dữ liệu</Text>
            </Card>
          )}
        </div>
      </div>

      {/* Modal - Tối ưu Responsive Form */}
      <Modal
        title={
          <span className="font-bold">
            {isEdit ? "CHỈNH SỬA" : "NHẬP DỮ LIỆU MỚI"}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        width={400}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="pt-4"
        >
          <Form.Item
            name="date"
            label="Ngày"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              className="h-10"
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
              className="h-10 flex items-center"
              placeholder="Nhập số lượng (Ví dụ: 10)"
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea
              rows={3}
              placeholder="Nhập thông tin bổ sung nếu có..."
              className="rounded-lg"
            />
          </Form.Item>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={() => setModalVisible(false)}
              className="flex-1 h-10 rounded-lg"
            >
              HỦY
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="flex-1 h-10 rounded-lg font-bold"
            >
              {isEdit ? "CẬP NHẬT" : "LƯU DỮ LIỆU"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
