/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Card,
  message,
  Popconfirm,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  getDepartmentsAction,
  createDepartmentAction,
  createPositionAction,
  deleteDepartmentAction,
  // Bổ sung các action mới dưới đây
  deletePositionAction,
  updateDepartmentAction,
  updatePositionAction,
} from "@/actions/category-actions";

export default function DepartmentPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Mở rộng modalType để hỗ trợ sửa (EDIT)
  const [modalType, setModalType] = useState<
    "ADD_DEPT" | "ADD_POS" | "EDIT_DEPT" | "EDIT_POS"
  >("ADD_DEPT");
  const [selectedItem, setSelectedItem] = useState<any>(null); // Lưu Dept hoặc Pos đang được sửa
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const res = await getDepartmentsAction();
    setData(res as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (values: { name: string }) => {
    try {
      let res: any;
      switch (modalType) {
        case "ADD_DEPT":
          await createDepartmentAction(values.name);
          message.success("Thêm phòng ban thành công");
          break;
        case "ADD_POS":
          await createPositionAction(values.name, selectedItem.id);
          message.success(`Thêm chức vụ cho ${selectedItem.name} thành công`);
          break;
        case "EDIT_DEPT":
          res = await updateDepartmentAction(selectedItem.id, values.name);
          if (res?.success === false) throw new Error(res.error);
          message.success("Cập nhật phòng ban thành công");
          break;
        case "EDIT_POS":
          res = await updatePositionAction(selectedItem.id, values.name);
          if (res?.success === false) throw new Error(res.error);
          message.success("Cập nhật chức vụ thành công");
          break;
      }
      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDeleteDept = async (id: string) => {
    const res: any = await deleteDepartmentAction(id);
    if (res?.success === false) {
      message.error(res.error);
    } else {
      message.success("Đã xóa phòng ban");
      loadData();
    }
  };

  const handleDeletePos = async (id: string) => {
    const res: any = await deletePositionAction(id);
    if (res?.success === false) {
      message.error(res.error);
    } else {
      message.success("Đã xóa chức vụ");
      loadData();
    }
  };

  const columns = [
    {
      title: "Tên Phòng Ban",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <b className="text-blue-600 flex items-center gap-2">
          <ApartmentOutlined /> {text}
        </b>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 300,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setModalType("ADD_POS");
              setSelectedItem(record);
              setIsModalOpen(true);
            }}
          >
            Chức vụ
          </Button>
          <Button
            type="text"
            icon={<EditOutlined className="text-orange-400" />}
            onClick={() => {
              setModalType("EDIT_DEPT");
              setSelectedItem(record);
              form.setFieldsValue({ name: record.name });
              setIsModalOpen(true);
            }}
          />
          <Popconfirm
            title="Xóa phòng ban này?"
            description="Lưu ý: Chỉ xóa được khi phòng ban không có nhân viên."
            onConfirm={() => handleDeleteDept(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <Card
        title={
          <span className="font-bold text-lg">Hệ Thống Cơ Cấu Tổ Chức</span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setModalType("ADD_DEPT");
              setSelectedItem(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Thêm Phòng Ban
          </Button>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-inner">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Danh sách chức vụ của {record.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {record.positions?.length || 0} chức vụ
                  </span>
                </div>

                <Table
                  columns={[
                    {
                      title: "Tên chức vụ",
                      dataIndex: "name",
                      key: "name",
                      render: (text) => (
                        <span className="font-medium text-gray-700">
                          <UserOutlined className="mr-2 text-blue-400" />
                          {text}
                        </span>
                      ),
                    },
                    {
                      title: "Thao tác",
                      key: "sub-action",
                      width: 120,
                      align: "right", // Căn phải cho gọn
                      render: (__: any, pos: any) => (
                        <Space>
                          <Tooltip title="Sửa">
                            <Button
                              type="text"
                              size="small"
                              className="flex items-center justify-center hover:bg-orange-50"
                              icon={
                                <EditOutlined className="text-orange-400" />
                              }
                              onClick={() => {
                                setModalType("EDIT_POS");
                                setSelectedItem(pos);
                                form.setFieldsValue({ name: pos.name });
                                setIsModalOpen(true);
                              }}
                            />
                          </Tooltip>
                          <Popconfirm
                            title="Xóa chức vụ?"
                            onConfirm={() => handleDeletePos(pos.id)}
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="text"
                              size="small"
                              className="flex items-center justify-center hover:bg-red-50"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={record.positions}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  // Thêm minHeight cho bảng con tại đây nếu vẫn thấy ngắn
                  locale={{ emptyText: "Chưa có chức vụ nào" }}
                  className="border border-gray-50 rounded"
                />
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title={
          <div className="border-b pb-2">
            {modalType === "ADD_DEPT" && "Tạo Mới Phòng Ban"}
            {modalType === "ADD_POS" &&
              `Thêm Chức Vụ Mới: ${selectedItem?.name}`}
            {modalType === "EDIT_DEPT" && "Chỉnh Sửa Phòng Ban"}
            {modalType === "EDIT_POS" && "Chỉnh Sửa Chức Vụ"}
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Lưu thông tin"
        cancelText="Hủy bỏ"
        destroyOnClose
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className="pt-4"
        >
          <Form.Item
            name="name"
            label="Tên gọi hiển thị"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input
              placeholder="Ví dụ: Phòng Kinh Doanh, Trưởng Phòng..."
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
