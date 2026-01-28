/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Button,
  Input,
  Space,
  Badge,
  Tabs,
  Typography,
  message,
  Form,
} from "antd";
import {
  UserAddOutlined,
  BellOutlined,
  SearchOutlined,
} from "@ant-design/icons";

// Import actions
import {
  getUsersAction,
  upsertUserAction,
  deleteUserAction,
  approveUserAction,
} from "@/actions/user-actions";
import {
  getDepartmentsAction,
  getBranchesAction,
} from "@/actions/category-actions";

// Import sub-components
import UserTable from "./_component/UserTable";
import ApprovalModal from "./_component/ApprovalModal";
import UserFormModal from "./_component/UserFormModal";

const { Title } = Typography;

export default function UserManagementPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // State quản lý danh sách
  const [users, setUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<any[]>([]);

  // State danh mục
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // State UI
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [searchText, setSearchText] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);

  // LOGIC LẤY DỮ LIỆU
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resAppr, resPend, resRej] = await Promise.all([
        getUsersAction({ status: "APPROVED", search: searchText }),
        getUsersAction({ status: "PENDING" }),
        getUsersAction({ status: "REJECTED" }), // Lấy danh sách từ chối
      ]);

      setUsers(resAppr.data || []);
      setPendingUsers(resPend.data || []);
      setRejectedUsers(resRej.data || []);
    } catch (err) {
      message.error("Lỗi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    const init = async () => {
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
    init();
    loadData();
  }, [loadData]);

  const handleDeptChange = (deptId: string) => {
    const selected = departments.find((d) => d.id === deptId);
    setPositions(selected?.positions || []);
    form.setFieldValue("positionId", null);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);
    const dept = departments.find((d) => d.id === record.departmentId);
    setPositions(dept?.positions || []);
    form.setFieldsValue({ ...record, active: record.active ?? true });
    setIsEditOpen(true);
  };

  const handleProcess = async (id: string, status: any) => {
    try {
      const res = await approveUserAction(id, status);
      if (res.success) {
        message.success("Thao tác thành công");
        loadData(); // Reload để cập nhật số lượng badge và danh sách
      }
    } catch (err) {
      message.error("Không thể xử lý yêu cầu");
    }
  };

  const onFinish = async (vals: any) => {
    setLoading(true);
    try {
      await upsertUserAction({ ...vals, id: editingUser?.id });
      message.success("Đã lưu thông tin nhân sự");
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-[1500px] mx-auto">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title
              level={2}
              className="!m-0 !font-black uppercase tracking-tight"
            >
              Quản trị nhân sự
            </Title>
            <Typography.Text type="secondary">
              Quản lý tài khoản, phân quyền và phê duyệt hệ thống
            </Typography.Text>
          </div>

          <Space size="middle">
            <Badge
              count={pendingUsers.length}
              offset={[-2, 2]}
              showZero={false}
            >
              <Button
                icon={<BellOutlined />}
                className="rounded-xl h-11 font-bold bg-white shadow-sm border-slate-200"
                onClick={() => setIsApproveOpen(true)}
              >
                YÊU CẦU PHÊ DUYỆT
              </Button>
            </Badge>
            <Button
              type="primary"
              danger
              icon={<UserAddOutlined />}
              className="rounded-xl h-11 font-bold shadow-lg shadow-red-100"
              onClick={() => {
                setEditingUser(null);
                form.resetFields();
                setIsEditOpen(true);
              }}
            >
              THÊM NHÂN SỰ
            </Button>
          </Space>
        </div>

        {/* TAB & TABLE SECTION */}
        <Card className="rounded-[2rem] shadow-sm border-none overflow-hidden bg-white">
          <div className="px-6 pt-4 flex justify-between items-center border-b border-slate-50">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "ACTIVE",
                  label: (
                    <span className="px-4 font-bold uppercase text-[12px]">
                      Đang hoạt động ({users.filter((u) => u.active).length})
                    </span>
                  ),
                },
                {
                  key: "INACTIVE",
                  label: (
                    <span className="px-4 font-bold uppercase text-red-500 text-[12px]">
                      Tạm ngưng ({users.filter((u) => !u.active).length})
                    </span>
                  ),
                },
              ]}
            />

            <Input
              placeholder="Tìm kiếm nhân viên..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="max-w-xs rounded-xl h-10 mb-3 bg-slate-50 border-none"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <UserTable
            users={users.filter((u) =>
              activeTab === "ACTIVE" ? u.active : !u.active,
            )}
            loading={loading}
            onEdit={handleEdit}
            onDelete={(id: string) => deleteUserAction(id).then(loadData)}
          />
        </Card>
      </div>

      {/* MODALS */}
      <ApprovalModal
        open={isApproveOpen}
        onCancel={() => setIsApproveOpen(false)}
        pendingData={pendingUsers}
        rejectedData={rejectedUsers}
        onProcess={handleProcess}
      />

      <UserFormModal
        open={isEditOpen}
        onCancel={() => setIsEditOpen(false)}
        editingUser={editingUser}
        form={form}
        departments={departments}
        branches={branches}
        positions={positions}
        onDeptChange={handleDeptChange}
        onFinish={onFinish}
        loading={loading}
      />
    </div>
  );
}
