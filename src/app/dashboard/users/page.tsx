/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Card,
  Switch,
  Divider,
  Row,
  Col,
  Typography,
  Badge,
  Tooltip,
  Statistic,
  Tabs,
  Avatar,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  MailOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  PhoneOutlined,
  HomeOutlined,
  UserOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  StopOutlined,
} from "@ant-design/icons";

import {
  getUsersAction,
  upsertUserAction,
  deleteUserAction,
  approveUserAction,
  toggleUserStatusAction,
} from "@/actions/user-actions";
import {
  getDepartmentsAction,
  getBranchesAction,
} from "@/actions/category-actions";

const { Title, Text, Paragraph } = Typography;

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function UserManagementPage() {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchText, setSearchText] = useState("");

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    branchId: undefined as string | undefined,
    departmentId: undefined as string | undefined,
    status: "ALL" as any,
  });

  const debouncedSearch = useDebounce(searchText, 500);
  const roleValue = Form.useWatch("role", form);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersAction({
        ...filters,
        search: debouncedSearch,
        status: filters.status === "ALL" ? undefined : filters.status,
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch (err: any) {
      message.error(err.message || "Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [d, b] = await Promise.all([
          getDepartmentsAction(),
          getBranchesAction(),
        ]);
        setDepartments(d);
        setBranches(b);
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Xử lý Duyệt nhanh ---
  const handleProcessUser = async (
    userId: string,
    targetStatus: "APPROVED" | "REJECTED",
  ) => {
    try {
      setLoading(true);
      const res = await approveUserAction(userId, targetStatus);
      if (res.success) {
        message.success(
          targetStatus === "APPROVED" ? "Đã phê duyệt" : "Đã từ chối",
        );
        loadData();
      }
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await upsertUserAction({ ...values, id: editingUser?.id });
      message.success("Lưu thành công");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (deptId: string) => {
    const selected = departments.find((d) => d.id === deptId);
    setPositions(selected?.positions || []);
    form.setFieldValue("positionId", null);
  };

  const columns = [
    {
      title: "NHÂN VIÊN",
      key: "user",
      fixed: "left" as const,
      width: 250,
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <Avatar
            icon={<UserOutlined />}
            className={
              record.status === "APPROVED"
                ? "bg-blue-100 text-blue-600"
                : "bg-orange-100 text-orange-600"
            }
          />
          <div className="flex flex-col">
            <Text strong className="text-slate-800">
              {record.fullName}
            </Text>
            <Text className="text-[11px] text-slate-400 uppercase tracking-wider">
              {record.username}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "ĐƠN VỊ",
      key: "unit",
      render: (record: any) => (
        <div className="flex flex-col text-[13px]">
          <Text className="text-slate-600">
            {record.department?.name || "---"}
          </Text>
          <Space
            className="text-[12px] text-slate-400"
            split={<Divider type="vertical" />}
          >
            <span>{record.position?.name}</span>
            <span className="flex items-center gap-1">
              <HomeOutlined /> {record.branch?.name || "Global"}
            </span>
          </Space>
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      width: 140,
      render: (status: string) => {
        const config: any = {
          PENDING: {
            color: "orange",
            label: "Chờ duyệt",
            icon: <ClockCircleOutlined />,
          },
          APPROVED: {
            color: "green",
            label: "Đã duyệt",
            icon: <CheckCircleOutlined />,
          },
          REJECTED: { color: "red", label: "Từ chối", icon: <CloseOutlined /> },
          BANNED: {
            color: "default",
            label: "Bị khóa",
            icon: <StopOutlined />,
          },
        };
        const s = config[status] || { color: "default", label: status };
        return (
          <Tag
            color={s.color}
            icon={s.icon}
            className="rounded-lg border-none px-3 py-0.5 font-bold uppercase text-[10px]"
          >
            {s.label}
          </Tag>
        );
      },
    },
    {
      title: "XỬ LÝ",
      key: "actions",
      fixed: "right" as const,
      width: 180,
      render: (record: any) => (
        <Space>
          {record.status === "PENDING" && (
            <>
              <Popconfirm
                title="Phê duyệt?"
                onConfirm={() => handleProcessUser(record.id, "APPROVED")}
              >
                <Button
                  type="primary"
                  size="small"
                  className="bg-green-600 border-none shadow-sm"
                  icon={<CheckOutlined />}
                />
              </Popconfirm>
              <Popconfirm
                title="Từ chối?"
                onConfirm={() => handleProcessUser(record.id, "REJECTED")}
              >
                <Button size="small" danger icon={<CloseOutlined />} />
              </Popconfirm>
            </>
          )}
          <Tooltip title="Chỉnh sửa chi tiết">
            <Button
              type="text"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => {
                setEditingUser(record);
                const dept = departments.find(
                  (d) => d.id === record.departmentId,
                );
                setPositions(dept?.positions || []);
                form.setFieldsValue({
                  ...record,
                  active: record.active ?? true,
                });
                setIsModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa vĩnh viễn?"
            onConfirm={() => deleteUserAction(record.id).then(loadData)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen text-slate-900">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Title level={2} className="!m-0 !font-black uppercase">
            Quản trị nhân sự
          </Title>
          <Button
            type="primary"
            danger
            icon={<UserAddOutlined />}
            size="large"
            className="rounded-xl h-12 font-bold"
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            THÊM NHÂN SỰ
          </Button>
        </div>

        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl border-none shadow-sm bg-orange-500 text-white">
              <Statistic
                title={
                  <span className="text-slate-400  uppercase text-xs font-bold">
                    Chờ duyệt
                  </span>
                }
                value={users.filter((u) => u.status === "PENDING").length}
                valueStyle={{ color: "#2563eb", fontWeight: 900 }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl shadow-sm border-l-4 border-blue-600">
              <Statistic
                title={
                  <span className="text-slate-400 uppercase text-xs font-bold">
                    Tổng nhân sự
                  </span>
                }
                value={total}
                valueStyle={{ color: "#2563eb", fontWeight: 900 }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl shadow-sm border-l-4 border-green-500">
              <Statistic
                title={
                  <span className="text-slate-400 uppercase text-xs font-bold">
                    Admin
                  </span>
                }
                value={users.filter((u) => u.role === "ADMIN").length}
                valueStyle={{ color: "#10b981", fontWeight: 900 }}
                prefix={<SafetyCertificateOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card
          bordered={false}
          className="shadow-xl rounded-3xl overflow-hidden border border-slate-100"
        >
          <Tabs
            activeKey={filters.status}
            onChange={(key) =>
              setFilters((f) => ({ ...f, status: key, page: 1 }))
            }
            className="px-6 pt-2"
            items={[
              {
                key: "ALL",
                label: (
                  <span className="px-4 font-bold uppercase text-[12px]">
                    Tất cả
                  </span>
                ),
              },
              {
                key: "PENDING",
                label: (
                  <Badge
                    count={users.filter((u) => u.status === "PENDING").length}
                    offset={[12, 0]}
                  >
                    <span className="px-4 font-bold uppercase text-[12px]">
                      Yêu cầu mới
                    </span>
                  </Badge>
                ),
              },
              {
                key: "APPROVED",
                label: (
                  <span className="px-4 font-bold uppercase text-[12px]">
                    Đã duyệt
                  </span>
                ),
              },
            ]}
          />
          <div className="p-6 bg-white flex gap-3 border-b border-slate-50">
            <Input
              placeholder="Tìm mã NV, tên..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="max-w-sm h-10 rounded-xl"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              placeholder="Chi nhánh"
              className="w-48 h-10"
              allowClear
              onChange={(v) =>
                setFilters((f) => ({ ...f, branchId: v, page: 1 }))
              }
              options={branches.map((b) => ({ label: b.name, value: b.id }))}
            />
          </div>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: total,
              className: "p-6",
            }}
            onChange={(p) =>
              setFilters((f) => ({
                ...f,
                page: p.current!,
                limit: p.pageSize!,
              }))
            }
          />
        </Card>
      </div>

      {/* --- MODAL CHỈNH SỬA CHI TIẾT (GIỮ NGUYÊN LOGIC CŨ CỦA BẠN) --- */}
      <Modal
        title={editingUser ? "CẬP NHẬT TÀI KHOẢN" : "KHỞI TẠO NHÂN SỰ"}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        width={900}
        centered
        closeIcon={null}
        footer={[
          <Button
            key="back"
            onClick={() => setIsModalOpen(false)}
            className="rounded-lg h-10 px-6"
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger={!editingUser}
            onClick={() => form.submit()}
            className="rounded-lg h-10 px-8 shadow-md"
          >
            {editingUser ? "Lưu thay đổi" : "Xác nhận tạo"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="p-6">
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="username"
                label="Mã định danh (Username)"
                rules={[{ required: true }]}
              >
                <Input
                  disabled={!!editingUser}
                  prefix={<IdcardOutlined />}
                  className="h-10 rounded-lg"
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="fullName"
                label="Họ và tên đầy đủ"
                rules={[{ required: true }]}
              >
                <Input placeholder="Nguyễn Văn A" className="h-10 rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email công ty"
                rules={[{ required: true, type: "email" }]}
              >
                <Input
                  placeholder="name@toyota.com.vn"
                  className="h-10 rounded-lg"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại cá nhân">
                <Input placeholder="09xx..." className="h-10 rounded-lg" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="departmentId" label="Phòng ban">
                <Select
                  placeholder="Chọn đơn vị"
                  className="h-10"
                  onChange={handleDeptChange}
                  options={departments.map((d) => ({
                    label: d.name,
                    value: d.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="positionId" label="Chức vụ">
                <Select
                  placeholder="Chọn chức danh"
                  className="h-10"
                  options={positions.map((p) => ({
                    label: p.name,
                    value: p.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="branchId" label="Chi nhánh làm việc">
                <Select
                  allowClear
                  placeholder="Trụ sở chính"
                  className="h-10"
                  options={branches.map((b) => ({
                    label: b.name,
                    value: b.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isGlobalManager"
                label="Quản trị tổng"
                valuePropName="checked"
              >
                <Switch className="mt-2" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="active"
                label="Hoạt động"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                  className="mt-2"
                />
              </Form.Item>
            </Col>
            <Col span={24} className="mt-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <Row gutter={24}>
                  <Col span={6}>
                    <Form.Item
                      name="role"
                      label="Phân quyền hệ thống"
                      rules={[{ required: true }]}
                    >
                      <Select className="h-10">
                        <Select.Option value="ADMIN">Admin</Select.Option>
                        <Select.Option value="MANAGER">Quản lý</Select.Option>
                        <Select.Option value="PURCHASE_STAFF">
                          Thu mua
                        </Select.Option>
                        <Select.Option value="SALES_STAFF">
                          Kinh doanh
                        </Select.Option>
                        <Select.Option value="REFERRER">
                          Giới thiệu
                        </Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="status" label="Quy trình Duyệt">
                      <Select
                        className="h-10"
                        options={[
                          { label: "Chờ duyệt", value: "PENDING" },
                          { label: "Đã duyệt", value: "APPROVED" },
                          { label: "Từ chối", value: "REJECTED" },
                          { label: "Khóa (Ban)", value: "BANNED" },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item name="password" label="Đổi mật khẩu">
                      <Input.Password
                        className="h-10 rounded-lg"
                        placeholder="••••••••"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Col>

            {["MANAGER", "PURCHASE_STAFF", "SALES_STAFF"].includes(
              roleValue,
            ) && (
              <Col span={24} className="mt-4">
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-6 items-center">
                  <div className="bg-blue-600 p-3 rounded-xl text-white shadow-md">
                    <PhoneOutlined className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <Text strong className="text-blue-800 block mb-3">
                      Cấu hình Tổng đài viên (VoIP)
                    </Text>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="extension"
                          label="Số nội bộ (Ext)"
                          className="m-0"
                        >
                          <Input
                            placeholder="101"
                            className="h-10 rounded-lg"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="extensionPassword"
                          label="Mật khẩu SIP"
                          className="m-0"
                        >
                          <Input.Password className="h-10 rounded-lg" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          color: #64748b !important;
        }
        .ant-card {
          border-radius: 20px !important;
        }
      `}</style>
    </div>
  );
}
