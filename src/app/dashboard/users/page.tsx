/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Button,
  Input,
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

// Actions & Libs
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

// Sub-components
import UserTable from "./_component/UserTable";
import ApprovalModal from "./_component/ApprovalModal";
import UserFormModal from "./_component/UserFormModal";

const { Title, Text } = Typography;

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
        getUsersAction({ status: "REJECTED" }),
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
        loadData();
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
    <div className="p-3 sm:p-6 md:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-[1500px] mx-auto">
        {/* HEADER SECTION - RESPONSIVE STACK */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4">
          <div>
            <Title
              level={2}
              className="!m-0 !font-black uppercase tracking-tight text-xl md:text-2xl"
            >
              Quản trị nhân sự
            </Title>
            <Text type="secondary" className="text-xs md:text-sm">
              Quản lý tài khoản, phân quyền và phê duyệt hệ thống
            </Text>
          </div>

          <div className="flex flex-row gap-2 w-full lg:w-auto">
            <Badge
              count={pendingUsers.length}
              offset={[-2, 2]}
              showZero={false}
              className="flex-1 lg:flex-none"
            >
              <Button
                icon={<BellOutlined />}
                className="rounded-xl h-10 md:h-11 font-bold bg-white shadow-sm border-slate-200 w-full"
                onClick={() => setIsApproveOpen(true)}
              >
                <span className="inline-block sm:hidden xl:inline-block ml-1">
                  PHÊ DUYỆT
                </span>
              </Button>
            </Badge>
            <Button
              type="primary"
              danger
              icon={<UserAddOutlined />}
              className="rounded-xl h-10 md:h-11 font-bold shadow-lg shadow-red-100 flex-1 lg:flex-none"
              onClick={() => {
                setEditingUser(null);
                form.resetFields();
                setIsEditOpen(true);
              }}
            >
              THÊM <span className="hidden sm:inline-block ml-1">NHÂN SỰ</span>
            </Button>
          </div>
        </div>

        {/* TAB & TABLE SECTION */}
        <Card className="rounded-2xl md:rounded-[2rem] shadow-sm border-none overflow-hidden bg-white">
          <div className="px-4 md:px-6 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-50 gap-4">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="w-full md:w-auto custom-manage-tabs"
              items={[
                {
                  key: "ACTIVE",
                  label: (
                    <span className="px-1 md:px-4 font-bold uppercase text-[10px] md:text-[12px]">
                      Đang hoạt động ({users.filter((u) => u.active).length})
                    </span>
                  ),
                },
                {
                  key: "INACTIVE",
                  label: (
                    <span className="px-1 md:px-4 font-bold uppercase text-red-500 text-[10px] md:text-[12px]">
                      Tạm ngưng ({users.filter((u) => !u.active).length})
                    </span>
                  ),
                },
              ]}
            />

            <div className="w-full md:max-w-xs pb-4 md:pb-0">
              <Input
                placeholder="Tìm kiếm nhân viên..."
                prefix={<SearchOutlined className="text-slate-400" />}
                className="rounded-xl h-10 bg-slate-50 border-none w-full"
                allowClear
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <UserTable
              users={users.filter((u) =>
                activeTab === "ACTIVE" ? u.active : !u.active,
              )}
              loading={loading}
              onEdit={handleEdit}
              onDelete={(id: string) =>
                deleteUserAction(id).then(() => {
                  message.success("Đã xóa người dùng");
                  loadData();
                })
              }
            />
          </div>
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

      {/* MOBILE CSS OVERRIDES */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .custom-manage-tabs .ant-tabs-nav-list {
            width: 100%;
            justify-content: space-between;
          }
          .custom-manage-tabs .ant-tabs-tab {
            margin: 0 !important;
            padding: 8px 4px !important;
          }
          .ant-card-body {
            padding: 0 !important;
          }
        }

        .ant-tabs-ink-bar {
          height: 3px !important;
          border-radius: 3px 3px 0 0;
        }
      `}</style>
    </div>
  );
}
