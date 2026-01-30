/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
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
  Empty,
  Skeleton,
} from "antd";
import {
  CloseCircleOutlined,
  CarOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined,
  SearchOutlined,
  UserAddOutlined,
  UserOutlined,
  FilterOutlined,
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
import { getMeAction } from "@/actions/user-actions";
import dayjs from "@/lib/dayjs";
import { UrgencyBadge } from "@/lib/urgencyBadge";
import { getLeadStatusHelper } from "@/lib/status-helper";

// Sub-components
import ModalApproveTransaction from "@/components/assigned-tasks/ModalApproveTransaction";
import ModalLoseLead from "@/components/assigned-tasks/ModalLoseLead";
import ModalContactAndLeadCar from "@/components/assigned-tasks/ModalContactAndLeadCar";
import ModalDetailCustomer from "@/components/assigned-tasks/modal-detail/ModalDetailCustomer";
import ModalSelfAddCustomer from "@/components/assigned-tasks/ModalSelfAddCustomer";

const { Title, Text } = Typography;

export default function AssignedTasksPage() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // --- DATA STATES ---
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [carModels, setCarModels] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- UI STATES ---
  const [activeView, setActiveView] = useState("TASKS");
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<any>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // --- LOAD DATA ---
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
      setCurrentUser(userData.data);
    } catch (err) {
      messageApi.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- LOGIC LỌC & TÍNH TOÁN ---
  const calculateDelay = (task: any) => {
    if (!task.scheduledAt) return { isLate: false, lateMinutes: 0 };
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

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.phone?.includes(searchText),
    );
  }, [customers, searchText]);

  const handleMakeCall = (customerPhone: string) => {
    if (!customerPhone) return;

    // Nếu có extension thì nối, không thì gọi trực tiếp số khách
    const extension = currentUser?.extension ? currentUser.extension : "";
    window.location.href = `tel:${extension}${customerPhone}`;
  };

  // --- ACTIONS FINISH ---
  const onContactFinish = async (values: any) => {
    setLoading(true);
    try {
      const result = await updateCustomerStatusAction(
        selectedLead?.customerId ||
          selectedLead?.id ||
          selectedLead?.customer.id,
        "CONTACTED",
        values.note,
        selectedLead?.id || selectedLead?.customer.id,
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
      const res = await requestLoseApproval(
        selectedLead.customer.id,
        values.reasonId,
        values.note,
        values.status,
      );
      if (res.success) {
        messageApi.success("Đã gửi yêu cầu phê duyệt thành công");
        setIsFailModalOpen(false);
        form.resetFields();
        loadData();
      } else {
        messageApi.error(res.error || "Không thể gửi yêu cầu phê duyệt");
      }
    } catch (error: any) {
      messageApi.error("Lỗi hệ thống: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- TASK CARD COMPONENT ---
  const TaskCard = ({
    item,
    isTask = true,
  }: {
    item: any;
    isTask?: boolean;
  }) => {
    // Nếu là Task thì lấy data từ task.customer, nếu là Customer thì lấy trực tiếp item
    const customer = isTask ? item.customer : item;
    const { isLate, lateMinutes } = isTask
      ? calculateDelay(item)
      : { isLate: false, lateMinutes: 0 };
    const scheduledTime = isTask ? dayjs(item.scheduledAt) : null;

    return (
      <Card
        hoverable
        className={`task-card mb-4 border-l-4 transition-all ${isLate ? "border-l-red-500 shadow-red-50" : "border-l-blue-500 shadow-blue-50"}`}
        onClick={() => {
          setSelectedLead(isTask ? item : { customer: item });
          setIsDetailModalOpen(true);
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          {/* CỘT 1: KHÁCH HÀNG */}
          <Col xs={24} sm={10} md={8}>
            <Space align="start">
              <Avatar
                size={48}
                icon={<UserOutlined />}
                className="bg-slate-100 text-blue-600"
              />
              <div>
                <Space size={4}>
                  <Text strong className="text-base text-slate-800">
                    {customer?.fullName}
                  </Text>
                  {isLate && (
                    <Badge
                      count={`-${lateMinutes}m`}
                      style={{ backgroundColor: "#ff4d4f" }}
                    />
                  )}
                </Space>
                <div className="text-slate-500 text-sm">
                  <PhoneOutlined className="mr-1" /> {customer?.phone}
                </div>
                <UrgencyBadge type={customer?.urgencyLevel} />
              </div>
            </Space>
          </Col>

          {/* CỘT 2: XE & TRẠNG THÁI */}
          <Col xs={24} sm={7} md={8}>
            <div className="flex flex-col gap-1">
              <Text strong className="text-slate-700">
                <CarOutlined className="mr-2 text-slate-400" />{" "}
                {customer?.carModel?.name || "Chưa xác định"}
              </Text>
              {!isTask && (
                <div>
                  {(() => {
                    const { label, color, icon } = getLeadStatusHelper(
                      customer.status,
                    );
                    return (
                      <Tag
                        icon={icon}
                        color={color}
                        className="rounded-full px-3"
                      >
                        {label}
                      </Tag>
                    );
                  })()}
                </div>
              )}
              <Space wrap size={4}>
                <Tag
                  color="orange"
                  className="border-none rounded-md text-[11px]"
                >
                  Kỳ vọng: {customer?.expectedPrice || "---"}
                </Tag>
                <Text type="secondary" className="text-xs font-mono">
                  BS: {customer?.licensePlate || "---"}
                </Text>
              </Space>
            </div>
          </Col>

          {/* CỘT 3: HÀNH ĐỘNG */}
          <Col
            xs={24}
            sm={7}
            md={8}
            className="flex flex-col sm:items-end gap-3"
          >
            {isTask && (
              <div className="sm:text-right">
                <div
                  className={`text-[11px] font-bold uppercase tracking-widest ${isLate ? "text-red-500" : "text-emerald-500"}`}
                >
                  {isLate ? "Quá hạn" : scheduledTime?.fromNow().toUpperCase()}
                </div>
                <Text strong className="text-slate-600">
                  <CalendarOutlined className="mr-1" />{" "}
                  {scheduledTime?.format("HH:mm - DD/MM")}
                </Text>
              </div>
            )}

            <Space wrap onClick={(e) => e.stopPropagation()}>
              <Tooltip title="Gọi & Ghi chú">
                <Button
                  icon={<PhoneOutlined />}
                  className="bg-blue-50 text-blue-600 border-none rounded-xl h-10 w-10 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMakeCall(customer?.phone);
                    setSelectedLead(isTask ? item : { customer: item });
                    setIsContactModalOpen(true);
                  }}
                />
              </Tooltip>
              <Button
                type="primary"
                className="bg-blue-600 rounded-xl px-6 h-10 font-bold shadow-md shadow-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLead(isTask ? item : { customer: item });
                  setIsModalOpen(true);
                }}
              >
                CHỐT
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                className="rounded-xl h-10 w-10 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLead(isTask ? item : { customer: item });
                  setIsFailModalOpen(true);
                  getActiveReasonsAction("LOSE").then(setReasons);
                }}
              />
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8">
      {contextHolder}
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3.5 rounded-2xl text-white shadow-lg shadow-blue-200">
              <TeamOutlined className="text-2xl" />
            </div>
            <Title
              level={3}
              className="m-0! font-black uppercase tracking-tight text-slate-800 leading-none"
            >
              Quản lý Nhiệm vụ
            </Title>
          </div>

          <Space wrap className="w-full lg:w-auto">
            <Input
              placeholder="Tìm khách hàng..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="rounded-xl h-12 w-full lg:w-72 border-none bg-slate-100 focus:bg-white transition-all shadow-inner"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              danger
              icon={<UserAddOutlined />}
              className="rounded-xl h-12 font-bold px-8 shadow-lg shadow-red-200"
              onClick={() => setIsAddModalOpen(true)}
            >
              THÊM KHÁCH
            </Button>
          </Space>
        </div>

        {/* TABS CONTENT */}
        <Card className="shadow-xl rounded-[2.5rem] border-none overflow-hidden bg-white/80 backdrop-blur-md min-h-[600px]">
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
                  <div className="py-6 px-2">
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <Text className="text-slate-400 italic text-xs">
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
                        className="rounded-2xl p-1 bg-slate-100 font-bold text-[11px]"
                      />
                    </div>

                    {loading ? (
                      [1, 2, 3].map((i) => (
                        <Skeleton
                          key={i}
                          active
                          avatar
                          className="bg-white p-6 rounded-3xl mb-4"
                        />
                      ))
                    ) : filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <TaskCard key={task.id} item={task} isTask={true} />
                      ))
                    ) : (
                      <Empty
                        description="Không có nhiệm vụ nào"
                        className="py-20"
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "CUSTOMERS",
                label: (
                  <span className="font-bold px-2 py-3 inline-block uppercase tracking-wider text-[12px]">
                    Khách hàng của tôi
                  </span>
                ),
                children: (
                  <div className="py-6 px-2">
                    {loading ? (
                      <Skeleton active />
                    ) : filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => (
                        <TaskCard key={cust.id} item={cust} isTask={false} />
                      ))
                    ) : (
                      <Empty description="Không tìm thấy khách hàng" />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* --- MODALS (Logic nghiệp vụ đầy đủ) --- */}

      {/* 1. Modal Ghi chú / Tương tác */}
      <ModalContactAndLeadCar
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        selectedLead={selectedLead}
        onFinish={onContactFinish}
        loading={loading}
      />

      {/* 2. Modal Chi tiết khách hàng */}
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

      {/* 3. Modal Phê duyệt (Chốt mua/bán) */}
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
            // Logic quan trọng: Kiểm tra ID dựa trên nguồn mở modal

            const targetId = selectedLead.customer.id || selectedLead.id;

            if (!targetId) {
              messageApi.error(
                "Không xác định được ID khách hàng. Vui lòng thử lại!",
              );
              return;
            }

            const res = await requestPurchaseApproval(targetId, values);
            if (res.success) {
              messageApi.success("Đã gửi yêu cầu phê duyệt thành công!");
              setIsModalOpen(false);
              loadData();
            }
          } finally {
            setLoading(false);
          }
        }}
      />

      {/* 4. Modal Thất bại / Đóng băng */}
      <ModalLoseLead
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        loading={loading}
        selectedLead={selectedLead}
        reasons={reasons}
        onFinish={onFailFinish}
        onStatusChange={(val) => getActiveReasonsAction(val).then(setReasons)}
      />

      {/* 5. Modal Tự thêm khách hàng */}
      <ModalSelfAddCustomer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        carModels={carModels}
        onSuccess={loadData}
      />

      <style jsx global>{`
        .custom-modern-tabs .ant-tabs-nav::before {
          border-bottom: none !important;
        }
        .ant-tabs-ink-bar {
          background: #2563eb !important;
          height: 4px !important;
          border-radius: 4px;
        }
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #2563eb !important;
        }
        .task-card {
          border-radius: 1.5rem !important;
          border: 1px solid #f1f5f9 !important;
        }
        .task-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1) !important;
        }
        @media (max-width: 640px) {
          .p-8 {
            padding: 1rem !important;
          }
          .task-card .ant-card-body {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
