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
  Avatar,
  Badge,
  Tooltip,
  Statistic,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  GlobalOutlined,
  HomeOutlined,
  PhoneOutlined,
  SearchOutlined,
  ReloadOutlined,
  MailOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import {
  getUsersAction,
  upsertUserAction,
  deleteUserAction,
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
  });

  const debouncedSearch = useDebounce(searchText, 500);
  const roleValue = Form.useWatch("role", form);

  // --- Thống kê nhanh ---
  const stats = useMemo(
    () => ({
      active: users.filter((u) => u.active).length,
      global: users.filter((u) => u.isGlobalManager).length,
      total: total,
    }),
    [users, total],
  );

  // --- XỬ LÝ SUBMIT FORM (LƯU HOẶC CẬP NHẬT) ---
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // Gọi action để lưu data
      await upsertUserAction({ ...values, id: editingUser?.id });

      message.success(
        editingUser
          ? "Cập nhật nhân sự thành công"
          : "Khởi tạo nhân sự thành công",
      );

      setIsModalOpen(false);
      form.resetFields();
      loadData(); // Tải lại danh sách
    } catch (err: any) {
      message.error(err.message || "Có lỗi xảy ra khi lưu dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersAction({ ...filters, search: debouncedSearch });
      setUsers(res.data);
      setTotal(res.total);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    const loadCategories = async () => {
      const [d, b] = await Promise.all([
        getDepartmentsAction(),
        getBranchesAction(),
      ]);
      setDepartments(d);
      setBranches(b);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeptChange = (deptId: string) => {
    const selected = departments.find((d) => d.id === deptId);
    setPositions(selected?.positions || []);
    form.setFieldValue("positionId", null);
  };

  const columns = [
    {
      title: "THÔNG TIN NHÂN VIÊN",
      key: "user",
      fixed: "left" as const,
      width: 230,
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <Text strong className="text-[15px] leading-tight text-slate-800">
              {record.fullName}
            </Text>
            <Space className="text-[12px] mt-1" size={4}>
              <Tag color="blue" bordered={false} className="m-0 px-1 py-0">
                {record.username}
              </Tag>
              {record.isGlobalManager && (
                <Tooltip title="Quản trị toàn cầu">
                  <SafetyCertificateOutlined className="text-amber-500!" />
                </Tooltip>
              )}
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: "ĐỊA CHỈ LIÊN LẠC",
      key: "contact",
      width: 280,
      render: (record: any) => (
        <div className="flex flex-col gap-1">
          <Text className="flex items-center gap-2 text-slate-500">
            <MailOutlined className="text-[10px]" /> {record.email}
          </Text>
          <Text className="flex items-center gap-2 text-slate-500">
            <PhoneOutlined className="text-[10px]" /> {record.phone || "---"}
          </Text>
        </div>
      ),
    },
    {
      title: "PHÒNG BAN / CHI NHÁNH",
      key: "unit",
      render: (record: any) => (
        <div className="flex flex-col">
          <Text strong className="text-slate-700">
            {record.department?.name}
          </Text>
          <Space
            split={<Divider type="vertical" />}
            className="text-[12px] text-slate-400"
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
      title: "PHÂN QUYỀN",
      dataIndex: "role",
      width: 150,
      render: (role: string) => {
        const config: any = {
          ADMIN: { color: "magenta", label: "Quản trị" },
          MANAGER: { color: "geekblue", label: "Quản lý" },
          PURCHASE_STAFF: { color: "cyan", label: "Thu mua" },
          SALES_STAFF: { color: "green", label: "Kinh doanh" },
          REFERRER: { color: "purple", label: "Giới thiệu" },
        };
        const item = config[role] || { color: "default", label: role };
        return (
          <Tag
            color={item.color}
            variant="filled"
            className="font-medium uppercase rounded-full px-3"
          >
            {item.label}
          </Tag>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "active",
      align: "center" as const,
      width: 100,
      render: (active: boolean, record: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<StopOutlined />}
            checked={active}
            className={active ? "bg-green-500" : "bg-gray-300"}
            onChange={() =>
              toggleUserStatusAction(record.id, active).then(loadData)
            }
          />
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "right" as const,
      width: 80,
      render: (record: any) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              shape="circle"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => {
                setEditingUser(record);
                const dept = departments.find(
                  (d) => d.id === record.departmentId,
                );
                setPositions(dept?.positions || []);
                form.setFieldsValue({
                  ...record,
                  active: record.active ?? true, // Fallback về true nếu null
                });
                setIsModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa tài khoản?"
            onConfirm={() => deleteUserAction(record.id).then(loadData)}
          >
            <Button
              type="text"
              shape="circle"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-[1500px] mx-auto">
        {/* --- TOP HEADER & STATS --- */}
        <Row gutter={[24, 24]} className="mb-8 items-center">
          <Col xs={24} md={12}>
            <Space direction="vertical" size={0}>
              <Title level={2} className="m-0 tracking-tight text-slate-900">
                Quản trị Nhân sự
              </Title>
              <Paragraph className="text-slate-500 m-0">
                Hệ thống quản lý định danh và phân quyền nội bộ Toyota
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} md={12} className="text-right">
            <Space size="middle">
              <Button
                icon={<ReloadOutlined />}
                className="rounded-lg h-10 px-5 border-slate-200 hover:text-blue-600"
                onClick={loadData}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                size="large"
                danger
                icon={<UserAddOutlined />}
                onClick={() => {
                  setEditingUser(null);
                  form.resetFields();
                  setIsModalOpen(true);
                }}
                className="h-10 px-6 rounded-lg shadow-lg shadow-red-200"
              >
                Thêm Nhân sự mới
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={24} className="mb-8">
          <Col xs={24} sm={8}>
            <Card bordered={false} className="rounded-2xl shadow-sm">
              <Statistic
                title="Tổng nhân viên"
                value={total}
                prefix={<TeamOutlined className="text-blue-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="rounded-2xl shadow-sm">
              <Statistic
                title="Đang hoạt động"
                value={stats.active}
                valueStyle={{ color: "#10b981" }}
                prefix={<CheckCircleOutlined className="mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="rounded-2xl shadow-sm">
              <Statistic
                title="Quản trị viên"
                value={stats.global}
                valueStyle={{ color: "#f59e0b" }}
                prefix={<SafetyCertificateOutlined className="mr-2" />}
              />
            </Card>
          </Col>
        </Row>

        {/* --- DATA TABLE CARD --- */}
        <Card
          bordered={false}
          className="shadow-sm rounded-3xl overflow-hidden border border-slate-100"
        >
          <div className="p-6 bg-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-50">
            <div className="grid md:grid-cols-3 gap-3">
              <Input
                placeholder="Tìm nhân viên..."
                prefix={<SearchOutlined className="text-slate-400" />}
                className=" h-10 rounded-xl bg-slate-50 border-none focus:bg-white transition-all"
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                placeholder="Chi nhánh"
                className="w-[200px]! h-10"
                allowClear
                onChange={(val) =>
                  setFilters((f) => ({ ...f, branchId: val, page: 1 }))
                }
                options={branches.map((b) => ({ label: b.name, value: b.id }))}
              />
              <Select
                placeholder="Phòng ban"
                className=" h-10"
                allowClear
                onChange={(val) =>
                  setFilters((f) => ({ ...f, departmentId: val, page: 1 }))
                }
                options={departments.map((d) => ({
                  label: d.name,
                  value: d.id,
                }))}
              />
            </div>
            <Text className="text-slate-400 text-[13px]">
              Hiển thị{" "}
              <span className="text-slate-900 font-bold">{users.length}</span> /{" "}
              {total} kết quả
            </Text>
          </div>

          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            className="user-table"
            scroll={{ x: 1200 }}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: total,
              showSizeChanger: true,
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

        {/* --- STYLED MODAL --- */}
        <Modal
          title={
            <div className="flex items-center gap-3 p-4 border-b border-slate-50">
              <div
                className={`p-2 rounded-xl ${
                  editingUser
                    ? "bg-blue-50 text-blue-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {editingUser ? <SettingOutlined /> : <UserAddOutlined />}
              </div>
              <div>
                <Title level={4} className="m-0">
                  {editingUser ? "Cập nhật tài khoản" : "Khởi tạo nhân sự"}
                </Title>
                <Text type="secondary" className="text-[12px]">
                  Điền đầy đủ thông tin định danh hệ thống
                </Text>
              </div>
            </div>
          }
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
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="p-6"
          >
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
                  <Input
                    placeholder="Nguyễn Văn A"
                    className="h-10 rounded-lg"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email công ty"
                  // rules={[{ required: true, type: "email" }]}
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
                <Form.Item
                  name="departmentId"
                  label="Phòng ban"
                  // rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Chọn đơn vị"
                    className="h-10"
                    onChange={handleDeptChange}
                  >
                    {departments.map((d) => (
                      <Select.Option key={d.id} value={d.id}>
                        {d.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="positionId"
                  label="Chức vụ"
                  // rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn chức danh" className="h-10">
                    {positions.map((p) => (
                      <Select.Option key={p.id} value={p.id}>
                        {p.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="branchId" label="Chi nhánh làm việc">
                  <Select
                    allowClear
                    placeholder="Trụ sở chính"
                    className="h-10"
                  >
                    {branches.map((b) => (
                      <Select.Option key={b.id} value={b.id}>
                        {b.name}
                      </Select.Option>
                    ))}
                  </Select>
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
                          <Select.Option value="ADMIN">
                            Quản trị hệ thống
                          </Select.Option>
                          <Select.Option value="MANAGER">Quản lý</Select.Option>
                          <Select.Option value="PURCHASE_STAFF">
                            Nhân viên thu mua
                          </Select.Option>
                          <Select.Option value="SALES_STAFF">
                            Nhân viên bán hàng
                          </Select.Option>
                          <Select.Option value="REFERRER">
                            Người giới thiệu
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="isGlobalManager"
                        label="Quản trị toàn cầu"
                        valuePropName="checked"
                      >
                        <Switch className="mt-2" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="active"
                        label="Trạng thái hoạt động"
                        valuePropName="checked"
                        initialValue={true} // Mặc định là bật khi tạo mới
                      >
                        <Switch
                          checkedChildren="Đang hoạt động"
                          unCheckedChildren="Khóa"
                          className="mt-2"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="password" label="Mật khẩu truy cập">
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
                    <div className="bg-blue-600 p-3 rounded-xl text-white shadow-md shadow-blue-200">
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

        {/* --- CSS CUSTOM --- */}
        <style jsx global>{`
          .user-table .ant-table-thead > tr > th {
            background: #fafafa;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #f1f5f9;
          }
          .user-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid #f8fafc;
            padding: 16px 16px !important;
          }
          .user-table .ant-table-row:hover > td {
            background-color: #f1f5f9 !important;
          }
          .ant-card {
            transition: transform 0.2s ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
}
