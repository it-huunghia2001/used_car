/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Tag,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Segmented,
  message,
  Badge,
  Tooltip,
  Tabs,
  Input,
  Divider,
  Avatar,
  ConfigProvider,
} from "antd";
import {
  SyncOutlined,
  CloseCircleOutlined,
  CarOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  CalendarOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  TeamOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  FilterOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

// Actions & Libs
import {
  getMyTasksAction,
  getAvailableCars,
  getActiveReasonsAction,
  requestPurchaseApproval,
  requestLoseApproval,
  updateCustomerStatusAction,
  getMyCustomersAction,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import dayjs from "@/lib/dayjs";
import { UrgencyBadge } from "@/lib/urgencyBadge";

// Sub-components
import ModalApproveTransaction from "@/components/assigned-tasks/ModalApproveTransaction";
import ModalLoseLead from "@/components/assigned-tasks/ModalLoseLead";
import ModalContactAndLeadCar from "@/components/assigned-tasks/ModalContactAndLeadCar";
import ModalDetailCustomer from "@/components/assigned-tasks/modal-detail/ModalDetailCustomer";
import ModalSelfAddCustomer from "@/components/assigned-tasks/ModalSelfAddCustomer";
import { getLeadStatusHelper } from "@/lib/status-helper";
import { getMeAction } from "@/actions/user-actions";

const { Title, Text, Paragraph } = Typography;

export default function AssignedTasksPage() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Data States
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [carModels, setCarModels] = useState<any[]>([]);

  // UI States
  const [activeView, setActiveView] = useState("TASKS");
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<any>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [leads, cars, models, myCustomers, userData]: any =
        await Promise.all([
          getMyTasksAction(),
          getAvailableCars(),
          getCarModelsAction(),
          getMyCustomersAction(),
          getMeAction(),
        ]);
      setTasks(leads);

      setCustomers(myCustomers);
      setInventory(cars);
      setCarModels(models);
      setCurrentUser(userData);
    } catch (err) {
      messageApi.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- LOGIC LỌC DỮ LIỆU ---
  const calculateDelay = (task: any) => {
    if (!task.scheduledAt) return { isLate: false, minutes: 0, lateMinutes: 0 };
    const scheduledTime = dayjs(task.scheduledAt);
    const now = dayjs();
    const deadline = scheduledTime.add(30, "minute");
    const isOverdue = now.isAfter(deadline);
    return {
      isLate: isOverdue,
      lateMinutes: isOverdue ? now.diff(deadline, "minute") : 0,
    };
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((i) => {
      const matchSearch =
        i.customer?.fullName
          ?.toLowerCase()
          .includes(searchText.toLowerCase()) ||
        i.customer?.phone?.includes(searchText);
      let matchType = true;
      if (filterType === "HOT") matchType = i.customer?.urgencyLevel === "HOT";
      if (filterType === "LATE") matchType = calculateDelay(i).isLate;
      return matchSearch && matchType;
    });
  }, [tasks, searchText, filterType]);

  const handleMakeCall = (customerPhone: string) => {
    if (!customerPhone) return;

    // Lấy extension từ thông tin user đã load (hoặc từ props/session)
    const extension = currentUser?.extension || "";

    // Nối chuỗi: [Mã extension][Số điện thoại]
    const finalPhoneNumber = `${extension}${customerPhone}`;

    window.location.href = `tel:${finalPhoneNumber}`;
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.phone?.includes(searchText),
    );
  }, [customers, searchText]);

  // --- ACTIONS ---
  const onContactFinish = async (values: any) => {
    setLoading(true);
    try {
      const result = await updateCustomerStatusAction(
        selectedLead?.customerId || selectedLead?.id,
        "CONTACTED",
        values.note,
        selectedLead?.id,
        values.nextContactAt ? dayjs(values.nextContactAt).toISOString() : null,
        { nextNote: values.nextContactNote },
      );
      if (result.success) {
        messageApi.success("Đã cập nhật tương tác");
        setIsContactModalOpen(false);
        loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  const onFailFinish = async (values: any) => {
    setLoading(true);
    try {
      // Lưu ý: Đảm bảo thứ tự tham số truyền vào đúng với hàm requestLoseApproval ở Server
      const res = await requestLoseApproval(
        selectedLead.id, // customerId
        values.reasonId, // reasonId
        values.note, // note
        values.status, // targetStatus (LOSE, FROZEN...)
      );

      if (res.success) {
        // ✅ TRƯỜNG HỢP THÀNH CÔNG
        messageApi.success("Đã gửi yêu cầu phê duyệt thành công");
        setIsFailModalOpen(false); // Chỉ đóng modal khi thành công
        form.resetFields(); // Reset form để lần sau mở lại không bị dính dữ liệu cũ
        loadData();
      } else {
        // ❌ TRƯỜNG HỢP THẤT BẠI (Lỗi chặn trùng, lỗi logic...)
        // messageApi.error sẽ hiển thị thông báo: "Hồ sơ này đang có một yêu cầu phê duyệt khác..."
        messageApi.error(res.error || "Không thể gửi yêu cầu phê duyệt");
      }
    } catch (error: any) {
      // Lỗi kết nối hoặc lỗi server crash
      messageApi.error("Lỗi hệ thống: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- COLUMNS (DESKTOP) ---
  const taskColumns = [
    {
      title: "Khách hàng",
      key: "customer",
      render: (record: any) => {
        const { isLate, lateMinutes } = calculateDelay(record);
        return (
          <Space align="start">
            <Avatar
              size={40}
              icon={<UserOutlined />}
              className="bg-blue-50 text-blue-500"
            />
            <div className="flex flex-col">
              <Space size={4}>
                <Text strong className="text-slate-700">
                  {record.customer?.fullName}
                </Text>
                {isLate && (
                  <Badge
                    count={`-${lateMinutes}m`}
                    style={{ backgroundColor: "#ff4d4f" }}
                  />
                )}
              </Space>
              <Text type="secondary" className="text-[12px]">
                <PhoneOutlined /> {record.customer?.phone}
              </Text>
              <UrgencyBadge type={record.customer?.urgencyLevel} />
            </div>
          </Space>
        );
      },
    },
    {
      title: "Xe & Nhu cầu",
      render: (record: any) => (
        <div className="text-[13px]">
          <Text strong>
            <CarOutlined /> {record.customer?.carModel?.name || "Chưa xác định"}
          </Text>
          <div className="text-slate-400 text-[12px] mt-1">
            Biển số: {record.customer?.licensePlate || "---"}
          </div>
          <Tag color="orange" className="mt-1 border-none text-[10px]">
            Kỳ vọng: {record.customer?.expectedPrice || "---"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Lịch hẹn / KPI",
      width: 300,
      render: (task: any) => {
        const { isLate } = calculateDelay(task);
        const scheduledTime = dayjs(task.scheduledAt);
        return (
          <div className="flex flex-col">
            <Text type="secondary" className="text-[11px] uppercase font-bold">
              <CalendarOutlined /> {scheduledTime.format("HH:mm - DD/MM")}
            </Text>
            <Text
              className={
                isLate
                  ? "text-red-500! font-bold"
                  : "text-emerald-500! font-medium"
              }
            >
              {isLate ? "ĐÃ QUÁ HẠN" : scheduledTime.fromNow()}
            </Text>
            {task?.content ? (
              <div className="text-slate-400 text-[12px] mt-1">
                Nội dung: {task?.content}
              </div>
            ) : (
              ""
            )}
          </div>
        );
      },
    },
    {
      title: "Hành động",
      align: "right" as const,
      render: (record: any) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Ghi chú">
            <Button
              icon={<PhoneOutlined />}
              shape="circle"
              type="primary"
              ghost
              onClick={(e) => {
                e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài Card/Row

                // 1. Kích hoạt cuộc gọi hệ thống ngay lập tức
                const phoneNumber = record?.customer?.phone;

                handleMakeCall(phoneNumber);
                setSelectedLead(record);
                setIsContactModalOpen(true);
              }}
            />
          </Tooltip>
          <Button
            type="primary"
            className="rounded-lg font-bold bg-blue-600"
            onClick={() => {
              setSelectedLead(record);
              setIsModalOpen(true);
            }}
          >
            CHỐT
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            shape="circle"
            onClick={() => {
              setSelectedLead(record);
              setIsFailModalOpen(true);
              getActiveReasonsAction("LOSE").then(setReasons);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8">
      {contextHolder}
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
              <TeamOutlined className="text-2xl" />
            </div>
            <div>
              <Title
                level={3}
                className="m-0! font-black uppercase tracking-tight text-slate-800"
              >
                Quản lý Nhiệm vụ
              </Title>
            </div>
          </div>

          <Space wrap className="w-full lg:w-auto">
            <Input
              placeholder="Tìm tên, SĐT khách hàng..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="rounded-xl h-11 w-full lg:w-72 border-none bg-slate-100 hover:bg-slate-200 focus:bg-white transition-all"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              danger
              icon={<UserAddOutlined />}
              className="rounded-xl h-12 font-bold px-6 shadow-lg shadow-red-200 w-full lg:w-auto"
              onClick={() => setIsAddModalOpen(true)}
            >
              <p className="hidden md:block">THÊM KHÁCH</p>
            </Button>
          </Space>
        </div>

        {/* MAIN CONTENT SECTION */}
        <Card className="shadow-xl rounded-[2.5rem] border-none overflow-hidden bg-white/80 backdrop-blur-md">
          <Tabs
            activeKey={activeView}
            onChange={setActiveView}
            className="px-6 pt-2 custom-modern-tabs"
            items={[
              {
                key: "TASKS",
                label: (
                  <Badge
                    count={filteredTasks.length}
                    offset={[10, 0]}
                    size="small"
                    showZero={false}
                  >
                    <span className="font-bold px-2 py-3 inline-block uppercase tracking-wider text-[12px]">
                      Lịch hẹn
                    </span>
                  </Badge>
                ),
                children: (
                  <div className="py-4">
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <Text className="text-slate-400 italic text-[13px]">
                        <FilterOutlined /> Đang lọc theo trạng thái nhiệm vụ
                      </Text>
                      <Segmented
                        options={[
                          { label: "TẤT CẢ", value: "ALL" },
                          { label: "🔥 HOT LEAD", value: "HOT" },
                          { label: "⏰ QUÁ HẠN", value: "LATE" },
                        ]}
                        value={filterType}
                        onChange={setFilterType}
                        className="rounded-xl p-1 bg-slate-100 font-bold text-[11px] w-full sm:w-auto"
                        block={false}
                      />
                    </div>

                    <Table
                      dataSource={filteredTasks}
                      columns={taskColumns}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        className: "p-4",
                        showSizeChanger: false,
                      }}
                      onRow={(record) => ({
                        onClick: () => {
                          setSelectedLead(record);
                          setIsDetailModalOpen(true);
                        },
                        className:
                          "hover:bg-blue-50/30 transition-all cursor-pointer",
                      })}
                      scroll={{ x: 900 }}
                    />
                  </div>
                ),
              },
              {
                key: "CUSTOMERS",
                label: (
                  <span className="font-bold px-2 py-3 inline-block uppercase tracking-wider text-[12px]">
                    KHTN
                  </span>
                ),
                children: (
                  <div className="py-4">
                    <Table
                      dataSource={filteredCustomers}
                      rowKey="id"
                      loading={loading}
                      pagination={{ pageSize: 10, className: "p-4" }}
                      onRow={(record) => ({
                        onClick: () => {
                          setSelectedLead({ customer: record });
                          setIsDetailModalOpen(true);
                        },
                        className:
                          "hover:bg-blue-50/30 transition-all cursor-pointer",
                      })}
                      scroll={{ x: 900 }}
                      columns={[
                        {
                          title: "KHÁCH HÀNG",
                          render: (r: any) => (
                            <Space>
                              <Avatar
                                size={40}
                                className="bg-slate-200 text-slate-600 font-bold"
                              >
                                {r.fullName?.[0].toUpperCase()}
                              </Avatar>
                              <div className="flex flex-col">
                                <Text strong className="text-slate-700">
                                  {r.fullName}
                                </Text>
                                <Text
                                  type="secondary"
                                  className="text-[11px] font-mono"
                                >
                                  {r.phone}
                                </Text>
                              </div>
                            </Space>
                          ),
                        },
                        {
                          title: "TRẠNG THÁI",
                          dataIndex: "status",
                          render: (status) => {
                            const { label, color, icon } =
                              getLeadStatusHelper(status);
                            return (
                              <Tag
                                icon={icon}
                                color={color}
                                className="rounded-full border-none font-black text-[10px] uppercase px-3 py-0.5"
                              >
                                {label}
                              </Tag>
                            );
                          },
                        },
                        {
                          title: "DÒNG XE",
                          render: (r) => (
                            <div>
                              <div className="font-bold text-[13px] text-slate-600">
                                {r.carModel?.name || "N/A"}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Năm SX: {r.carYear || "---"}
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "THAO TÁC",
                          align: "right",
                          render: (record: any) => (
                            <Space onClick={(e) => e.stopPropagation()}>
                              <Tooltip title="Ghi chú">
                                <Button
                                  icon={<PhoneOutlined />}
                                  shape="circle"
                                  type="primary"
                                  ghost
                                  onClick={(e) => {
                                    e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài Card/Row

                                    // 1. Kích hoạt cuộc gọi hệ thống ngay lập tức
                                    const phoneNumber = record?.phone;
                                    handleMakeCall(phoneNumber);
                                    setSelectedLead(record);
                                    setIsContactModalOpen(true);
                                  }}
                                />
                              </Tooltip>
                              <Button
                                type="primary"
                                className="rounded-lg font-bold bg-blue-600"
                                onClick={() => {
                                  setSelectedLead(record);
                                  setIsModalOpen(true);
                                }}
                              >
                                CHỐT
                              </Button>
                              <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                shape="circle"
                                onClick={() => {
                                  setSelectedLead(record);
                                  setIsFailModalOpen(true);
                                  getActiveReasonsAction("LOSE").then(
                                    setReasons,
                                  );
                                }}
                              />
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* --- MODALS (Giữ nguyên logic cũ của bạn) --- */}
      <ModalContactAndLeadCar
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        selectedLead={selectedLead}
        onFinish={onContactFinish}
        loading={loading}
      />
      <ModalDetailCustomer
        carModels={carModels}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedLead={selectedLead}
        onContactClick={() => {
          setIsDetailModalOpen(false);
          setIsContactModalOpen(true);
        }}
        UrgencyBadge={UrgencyBadge}
        onUpdateSuccess={loadData}
      />
      <ModalApproveTransaction
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loading={loading}
        selectedLead={selectedLead}
        inventory={inventory}
        carModels={carModels}
        onFinish={async (values) => {
          setLoading(true);
          try {
            const res = await requestPurchaseApproval(
              selectedLead.customerId || selectedLead.id,
              values,
            );
            if (res.success) {
              messageApi.success("Đã gửi phê duyệt!");
              setIsModalOpen(false);
              loadData();
            }
          } finally {
            setLoading(false);
          }
        }}
      />
      <ModalLoseLead
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        loading={loading}
        selectedLead={selectedLead}
        reasons={reasons}
        onFinish={onFailFinish}
        onStatusChange={(val) => getActiveReasonsAction(val).then(setReasons)}
      />
      <ModalSelfAddCustomer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        carModels={carModels}
        onSuccess={loadData}
      />

      {/* CSS CUSTOM MODER UI */}
      <style jsx global>{`
        .custom-modern-tabs .ant-tabs-nav::before {
          border-bottom: 2px solid #f8fafc !important;
        }
        .ant-tabs-tab {
          padding: 12px 0 !important;
          margin: 0 16px !important;
        }
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #2563eb !important;
        }
        .ant-tabs-ink-bar {
          background: #2563eb !important;
          height: 3px !important;
          border-radius: 3px 3px 0 0;
        }

        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          color: #94a3b8 !important;
          letter-spacing: 0.8px;
          border-bottom: 1px solid #f1f5f9 !important;
        }

        .ant-table-row:hover .ant-btn-ghost {
          background: white !important;
        }

        @media (max-width: 640px) {
          .ant-tabs-tab {
            margin: 0 8px !important;
          }
          .ant-card {
            border-radius: 1.5rem !important;
          }
          .p-8 {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
