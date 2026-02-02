/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Typography,
  message,
  Badge,
  Tooltip,
  Segmented,
  Divider,
  Avatar,
  Input,
  Row,
  Col,
  Form,
} from "antd";
import {
  SyncOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  UserAddOutlined,
  CarOutlined,
  SearchOutlined,
  TeamOutlined,
  PhoneOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

// Actions
import {
  getMyTasksAction,
  getAvailableCars,
  requestSaleApproval,
  getActiveReasonsAction,
  updateCustomerStatusAction,
  requestLoseApproval,
  completeMaintenanceTaskAction,
  getMaintenanceTasksAction,
  getMyCustomersAction,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import dayjs from "@/lib/dayjs";

// Components
import ModalLoseLead from "@/components/assigned-tasks/ModalLoseLead";
import ModalContactAndLeadCar from "@/components/assigned-tasks/ModalContactAndLeadCar";
import ModalDetailCustomer from "@/components/assigned-tasks/modal-detail/ModalDetailCustomer";
import ModalSelfAddCustomer from "@/components/assigned-tasks/ModalSelfAddCustomer";
import ModalApproveSales from "@/components/assigned-tasks/ModalApproveSales";
import { UrgencyBadge } from "@/lib/urgencyBadge";
import { log } from "console";
import { getMeAction } from "@/actions/user-actions";
import { getLeadStatusHelper } from "@/lib/status-helper";

const { Title, Text } = Typography;

export default function SalesTasksPage() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState([]);
  const [carModels, setCarModels] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("Tất cả");
  const [searchText, setSearchText] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Modal States
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    const timer = setInterval(() => setNow(dayjs()), 30000);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(timer);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leads, cars, models, maintenance, myCustomers, userData]: any =
        await Promise.all([
          getMyTasksAction(),
          getAvailableCars(),
          getCarModelsAction(),
          getMaintenanceTasksAction(),
          getMyCustomersAction(),
          getMeAction(),
        ]);
      setTasks(leads);

      setInventory(cars);
      setCarModels(models);
      setMaintenanceTasks(maintenance);
      setCustomers(myCustomers);
      setCurrentUser(userData);
    } catch (err) {
      messageApi.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMakeCall = (customerPhone: string) => {
    if (!customerPhone) return;

    // Lấy extension từ thông tin user đã load (hoặc từ props/session)
    const extension = currentUser?.extension || "";

    // Nối chuỗi: [Mã extension][Số điện thoại]
    const finalPhoneNumber = `${extension}${customerPhone}`;

    window.location.href = `tel:${finalPhoneNumber}`;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((i) => {
      const matchSearch =
        i.customer?.fullName
          ?.toLowerCase()
          .includes(searchText.toLowerCase()) ||
        i.customer?.phone?.includes(searchText);
      if (filterType === "Quá hạn") return matchSearch && i.isOverdue;
      return matchSearch;
    });
  }, [tasks, searchText, filterType]);

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
        selectedLead?.customerId ||
          selectedLead?.id ||
          selectedLead?.customer?.customerId ||
          selectedLead?.customer?.id,
        "CONTACTED",
        values.note,
        selectedLead?.id || selectedLead?.customer?.id,
        values.nextContactAt ? dayjs(values.nextContactAt).toISOString() : null,
        { nextNote: values.nextContactNote },
      );
      if (result.success) {
        messageApi.success("Đã cập nhật");
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
        selectedLead.id || selectedLead.customer.id, // customerId
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

  const handleCompleteMaintenance = async (taskId: string) => {
    const hide = messageApi.loading("Đang xử lý...", 0);
    try {
      const res = await completeMaintenanceTaskAction(taskId);
      if (res.success) {
        messageApi.success("Đã xong!");
        loadData();
      }
    } finally {
      hide();
    }
  };

  // --- MOBILE CARD RENDERER ---
  const renderMobileFeed = (items: any[], type: "TASK" | "CUSTOMER") => {
    if (items.length === 0)
      return (
        <Card className="rounded-2xl border-none text-center p-8">
          <Text type="secondary">Không có dữ liệu</Text>
        </Card>
      );
    return items.map((item) => {
      const isTask = type === "TASK";
      const record = isTask ? item : { customer: item, isOverdue: false };
      return (
        <Card
          key={item.id}
          className={`mb-4! rounded-3xl shadow-sm border-none overflow-hidden ${record.isOverdue ? "bg-red-50/50" : "bg-white"}`}
          onClick={() => {
            setSelectedLead(item);
            setIsDetailModalOpen(true);
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <Space>
              <Avatar
                size={45}
                className={`${isTask ? "bg-emerald-500" : "bg-slate-800"}`}
              >
                {record.customer.fullName?.[0]}
              </Avatar>
              <div className="flex flex-col">
                <Text strong className="text-base">
                  {record.customer.fullName}
                </Text>
                <Text type="secondary" className="text-xs font-mono">
                  {record.customer.phone}
                </Text>
              </div>
            </Space>
            <UrgencyBadge type={record.customer.urgencyLevel} />
          </div>
          <div className="bg-white/60 p-3 rounded-2xl border border-slate-100 mb-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CarOutlined />{" "}
              {record.customer.carModel?.name || "Nhu cầu chung"}
            </div>
          </div>
          <div className="flex justify-between items-center">
            {isTask ? (
              <Text
                strong
                className={record.isOverdue ? "text-red-500" : "text-blue-600"}
              >
                <ClockCircleOutlined />{" "}
                {dayjs(item.scheduledAt).format("HH:mm - DD/MM")}
              </Text>
            ) : (
              <Tag
                color="blue"
                className="rounded-full border-none px-3 font-black text-[10px] uppercase"
              >
                {record.customer.status}
              </Tag>
            )}
            <Space onClick={(e) => e.stopPropagation()}>
              <Button
                shape="circle"
                icon={<HistoryOutlined />}
                onClick={(e) => {
                  e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài Card/Row

                  // 1. Kích hoạt cuộc gọi hệ thống ngay lập tức
                  const phoneNumber = record.customer?.phone;
                  handleMakeCall(phoneNumber);

                  // 2. Mở Modal ghi chú tương tác
                  setSelectedLead(item);
                  setIsContactModalOpen(true);
                }}
              />
              <Button
                type="primary"
                className="bg-emerald-600 border-none font-bold rounded-xl"
                onClick={() => {
                  setSelectedLead(item);
                  setIsSalesModalOpen(true);
                }}
              >
                CHỐT BÁN
              </Button>
              <Button
                danger
                shape="circle"
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setSelectedLead(item);
                  setIsFailModalOpen(true);
                  getActiveReasonsAction("LOSE").then(setReasons);
                }}
              />
            </Space>
          </div>
        </Card>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8">
      {contextHolder}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm gap-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg">
              <DollarOutlined className="text-xl" />
            </div>
            <Title
              level={4}
              className="!m-0 font-black uppercase tracking-tighter"
            >
              Bán hàng
            </Title>
          </div>
          <Button
            type="primary"
            size="large"
            className="bg-emerald-600 font-bold rounded-2xl h-12 px-6 w-full sm:w-auto shadow-lg shadow-emerald-100"
            icon={<UserAddOutlined />}
            onClick={() => setIsAddModalOpen(true)}
          >
            THÊM KHÁCH
          </Button>
        </div>

        {/* SECTION 1: NHIỆM VỤ */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <Title
              level={5}
              className="m-0! text-slate-500 uppercase tracking-widest text-[12px]"
            >
              <ThunderboltOutlined className="text-orange-400" /> Nhiệm vụ
            </Title>
            <Segmented
              options={["Tất cả", "Quá hạn"]}
              value={filterType}
              onChange={(v: any) => setFilterType(v)}
              className="bg-slate-200/50 p-1 rounded-xl"
            />
          </div>
          {isMobile ? (
            renderMobileFeed(filteredTasks, "TASK")
          ) : (
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
              <Table
                dataSource={filteredTasks}
                columns={[
                  {
                    title: "KHÁCH HÀNG",
                    render: (t) => (
                      <Space>
                        <div>
                          <Text strong className="block">
                            {t.customer.fullName}
                          </Text>
                          <Text type="secondary" className="text-[11px]">
                            {t.customer.phone}
                          </Text>
                        </div>
                        <UrgencyBadge type={t.customer.urgencyLevel} />
                      </Space>
                    ),
                  },
                  {
                    title: "XE / NHU CẦU",
                    render: (t) => (
                      <div>
                        <Text strong className="text-emerald-700 text-[13px]">
                          <CarOutlined /> {t.customer.carModel?.name}
                        </Text>
                        <div className="text-[11px] text-slate-400">
                          {t.customer.leadCar?.description || "Nhu cầu chung"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "KPI HẠN",
                    render: (t) => (
                      <div className="flex flex-col">
                        <Text className="text-[12px] font-bold text-slate-500">
                          {dayjs(t.scheduledAt).format("HH:mm DD/MM")}
                        </Text>
                        {t.isOverdue ? (
                          <Tag
                            color="error"
                            className="w-fit m-0 text-[10px] font-bold"
                          >
                            TRỄ {t.minutesOverdue}m
                          </Tag>
                        ) : (
                          <Tag
                            color="success"
                            className="w-fit m-0 text-[10px]"
                          >
                            {dayjs(t.deadlineAt).fromNow()}
                          </Tag>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: "XỬ LÝ",
                    align: "right",
                    render: (record) => (
                      <Space onClick={(e) => e.stopPropagation()}>
                        <Button
                          icon={<HistoryOutlined />}
                          type="primary"
                          ghost
                          size="small"
                          shape="circle"
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài Card/Row

                            // 1. Kích hoạt cuộc gọi hệ thống ngay lập tức
                            const phoneNumber = record.customer?.phone;
                            handleMakeCall(phoneNumber);
                            // 2. Mở Modal ghi chú tương tác
                            setSelectedLead(record);
                            setIsContactModalOpen(true);
                          }}
                        />

                        <Button
                          type="primary"
                          size="small"
                          className="bg-emerald-600 border-none font-bold"
                          onClick={() => {
                            setSelectedLead(record);
                            setIsSalesModalOpen(true);
                          }}
                        >
                          CHỐT BÁN
                        </Button>
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          type="text"
                          onClick={() => {
                            setSelectedLead(record);
                            setIsFailModalOpen(true);
                            getActiveReasonsAction("LOSE").then(setReasons);
                          }}
                        />
                      </Space>
                    ),
                  },
                ]}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                onRow={(r) => ({
                  onClick: () => {
                    setSelectedLead(r);
                    setIsDetailModalOpen(true);
                  },
                })}
              />
            </Card>
          )}
        </div>

        {/* SECTION 2: KHO KHÁCH */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 px-2">
            <Space direction="vertical" size={0}>
              <Title
                level={5}
                className="!m-0 text-slate-500 uppercase tracking-widest text-[12px]"
              >
                <TeamOutlined /> Kho khách hàng quản lý
              </Title>
              <Text type="secondary" className="text-[11px]">
                Chăm sóc khách hàng chủ động
              </Text>
            </Space>
            <Input
              placeholder="Tìm tên, SĐT..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="rounded-2xl border-none shadow-sm h-11 w-full sm:w-64"
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>
          {isMobile ? (
            renderMobileFeed(filteredCustomers, "CUSTOMER")
          ) : (
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white/70 backdrop-blur-sm">
              <Table
                dataSource={filteredCustomers}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 8 }}
                onRow={(r) => ({
                  onClick: () => {
                    setSelectedLead({ customer: r });
                    setIsDetailModalOpen(true);
                  },
                })}
                columns={[
                  {
                    title: "KHÁCH HÀNG",
                    render: (r) => (
                      <Space>
                        <Avatar className="bg-slate-800">
                          {r.fullName?.[0]}
                        </Avatar>
                        <div>
                          <Text strong>{r.fullName}</Text>
                          <div className="text-[11px] font-mono">{r.phone}</div>
                        </div>
                      </Space>
                    ),
                  },
                  {
                    title: "MÔ HÌNH XE",
                    render: (r) => (
                      <Text strong>
                        <CarOutlined /> {r.carModel?.name || "N/A"}
                      </Text>
                    ),
                  },
                  {
                    title: "TRẠNG THÁI",
                    dataIndex: "status",
                    render: (s) => {
                      const { label, color, icon } = getLeadStatusHelper(s);
                      return (
                        <Tag
                          icon={icon}
                          color={color}
                          className="rounded-full border-none font-black text-[10px] px-3"
                        >
                          {label}
                        </Tag>
                      );
                    },
                  },
                  {
                    title: "THAO TÁC",
                    align: "right",
                    render: (record) => (
                      <Space onClick={(e) => e.stopPropagation()}>
                        <Button
                          icon={<PhoneOutlined />}
                          shape="circle"
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài Card/Row

                            // 1. Kích hoạt cuộc gọi hệ thống ngay lập tức
                            const phoneNumber = record?.phone;
                            handleMakeCall(phoneNumber);

                            // 2. Mở Modal ghi chú tương tác
                            setSelectedLead(record);
                            setIsContactModalOpen(true);
                          }}
                        />
                        <Button
                          type="primary"
                          className="bg-emerald-600 border-none font-bold rounded-xl"
                          onClick={() => {
                            setSelectedLead({
                              customerId: record.id,
                              customer: record,
                            });
                            setIsSalesModalOpen(true);
                          }}
                        >
                          CHỐT NGAY
                        </Button>
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          type="text"
                          onClick={() => {
                            setSelectedLead({
                              customer: record,
                              id: record.id,
                            });
                            setIsFailModalOpen(true);
                            getActiveReasonsAction("LOSE").then(setReasons);
                          }}
                        />
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </div>

        {/* SECTION 3: BẢO DƯỠNG */}
        <Divider plain>
          <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            Lịch nhắc bảo dưỡng
          </Text>
        </Divider>
        <Card className="rounded-3xl border-none shadow-lg bg-white/40 overflow-hidden">
          <Table
            dataSource={maintenanceTasks}
            columns={[
              {
                title: "KHÁCH HÀNG",
                render: (t) => (
                  <Text strong className="text-[12px]">
                    {t.customer?.fullName}
                  </Text>
                ),
              },
              {
                title: "HẠN KPI",
                render: (t) => (
                  <Text
                    className={`text-[11px] ${dayjs().isAfter(dayjs(t.deadlineAt)) ? "text-red-500 font-bold" : ""}`}
                  >
                    {dayjs(t.deadlineAt).format("DD/MM HH:mm")}
                  </Text>
                ),
              },
              {
                title: "",
                align: "right",
                render: (t) => (
                  <Button
                    type="primary"
                    size="small"
                    className="bg-blue-600 rounded-lg text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteMaintenance(t.id);
                    }}
                  >
                    GỌI XONG
                  </Button>
                ),
              },
            ]}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </div>

      {/* --- MODALS --- */}
      <ModalApproveSales
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        selectedLead={selectedLead}
        inventory={inventory}
        loading={loading}
        onFinish={async (v: any) => {
          setLoading(true);
          try {
            const res = await requestSaleApproval(
              selectedLead.customer?.id || selectedLead.id,
              v,
              selectedLead.id || selectedLead.customer?.id,
            );
            if (res.success) {
              messageApi.success("Đã gửi phê duyệt!");
              setIsSalesModalOpen(false);
              loadData();
            }
          } finally {
            setLoading(false);
          }
        }}
      />
      <ModalContactAndLeadCar
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        selectedLead={selectedLead}
        onFinish={onContactFinish}
        loading={loading}
      />
      <ModalDetailCustomer
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedLead={selectedLead}
        onContactClick={() => {
          setIsDetailModalOpen(false);
          setIsContactModalOpen(true);
        }}
        UrgencyBadge={UrgencyBadge}
        carModels={carModels}
        onUpdateSuccess={loadData}
      />
      <ModalLoseLead
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        selectedLead={selectedLead}
        loading={loading}
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

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          color: #94a3b8 !important;
          letter-spacing: 1px;
          font-weight: 800 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 16px !important;
        }
        .ant-table-row {
          cursor: pointer;
          transition: all 0.2s;
        }
        .ant-table-row:hover {
          background-color: #f1f7ff !important;
        }
      `}</style>
    </div>
  );
}
