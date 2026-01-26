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
  Input,
  Tag,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Select,
  InputNumber,
  Segmented,
  message,
  Badge,
  Divider,
  Tooltip,
  Alert,
  DatePicker,
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
} from "@ant-design/icons";
import {
  getMyTasksAction,
  getAvailableCars,
  getActiveReasonsAction,
  requestPurchaseApproval,
  requestSaleApproval,
  requestLoseApproval,
  updateCustomerStatusAction,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import { LeadStatus, UrgencyType } from "@prisma/client";

import ModalApproveTransaction from "@/components/assigned-tasks/ModalApproveTransaction";
import ModalLoseLead from "@/components/assigned-tasks/ModalLoseLead";
import ModalContactAndLeadCar from "@/components/assigned-tasks/ModalContactAndLeadCar";
import ModalDetailCustomer from "@/components/assigned-tasks/modal-detail/ModalDetailCustomer";
import dayjs from "@/lib/dayjs";
import ModalSelfAddCustomer from "@/components/assigned-tasks/ModalSelfAddCustomer";
import { UrgencyBadge } from "@/lib/urgencyBadge";

const { Title, Text } = Typography;

export default function AssignedTasksPage() {
  const [contactForm] = Form.useForm();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [inventory, setInventory] = useState([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [carModels, setCarModels] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterType, setFilterType] = useState<any>("ALL");
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  // Trong AssignedTasksPage.tsx
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- MAPPING ---
  const REFERRAL_TYPE_MAP: any = {
    SELL: { label: "THU MUA XE", color: "orange", icon: <CarOutlined /> },
    SELL_TRADE_NEW: {
      label: "THU CŨ ĐỔI MỚI",
      color: "red",
      icon: <SyncOutlined />,
    },
    SELL_TRADE_USED: {
      label: "THU CŨ ĐỔI CŨ",
      color: "volcano",
      icon: <SyncOutlined />,
    },
    BUY: { label: "BÁN XE", color: "green", icon: <DollarOutlined /> },
    VALUATION: {
      label: "ĐỊNH GIÁ XE",
      color: "blue",
      icon: <SafetyCertificateOutlined />,
    },
  };

  // --- LOGIC TÍNH TOÁN ĐỘ TRỄ ---
  const calculateDelay = (task: any) => {
    // Đối với Task, mốc thời gian là scheduledAt
    const scheduledTime = dayjs(task.scheduledAt).tz("Asia/Ho_Chi_Minh");
    const now = dayjs().tz("Asia/Ho_Chi_Minh");

    // Giả định Admin set maxLateMinutes là 30 (nên lấy từ config trả về từ server)
    const RESPONSE_LIMIT = 30;
    const deadline = scheduledTime.add(RESPONSE_LIMIT, "minute");

    const isOverdue = now.isAfter(deadline);
    const diffMinutes = now.diff(scheduledTime, "minute"); // Tính từ lúc bắt đầu hẹn

    return {
      isLate: isOverdue,
      minutes: diffMinutes > 0 ? diffMinutes : 0,
      lateMinutes: isOverdue ? now.diff(deadline, "minute") : 0,
    };
  };

  // --- LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      const [leads, cars, models]: any = await Promise.all([
        getMyTasksAction(),
        getAvailableCars(),
        getCarModelsAction(),
      ]);
      setData(leads);
      console.log(leads);

      setInventory(cars);
      setCarModels(models);
    } catch (err) {
      messageApi.error("Không thể tải danh sách dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Trong AssignedTasksPage.tsx

  const onContactFinish = async (values: any) => {
    try {
      setLoading(true);
      const taskId = selectedLead.id;
      const customerId = selectedLead.customerId;

      // XỬ LÝ AN TOÀN: Bọc bằng dayjs để đảm bảo có hàm toISOString
      let nextContactAtISO = null;
      if (values.nextContactAt) {
        const dateObj = dayjs(values.nextContactAt);
        if (dateObj.isValid()) {
          nextContactAtISO = dateObj.toISOString();
        }
      }

      const result = await updateCustomerStatusAction(
        customerId,
        "CONTACTED",
        values.note,
        taskId,
        nextContactAtISO, // Truyền chuỗi ISO sạch vào đây
        {
          nextNote: values.nextContactNote,
        },
      );

      // 3. Xử lý kết quả trả về
      if (result.success) {
        // Ép kiểu để lấy thông tin KPI
        const { isLate, lateMinutes } = result as {
          isLate: boolean;
          lateMinutes: number;
        };

        if (isLate) {
          messageApi.warning(`Đã lưu! Ghi nhận trễ ${lateMinutes} phút.`);
        } else {
          messageApi.success("Tuyệt vời! Bạn đã hoàn thành nhiệm vụ đúng hạn.");
        }

        setIsContactModalOpen(false);
        loadData(); // Reload lại danh sách Task
      } else {
        messageApi.error("Lỗi cập nhật trạng thái");
      }
    } catch (err: any) {
      console.error("Contact Finish Error:", err);
      messageApi.error("Có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  const onFailFinish = async (values: any) => {
    setLoading(true);

    try {
      const res = await requestLoseApproval(
        selectedLead.id, // ID của Task hiện tại
        selectedLead.customerId, // ID khách hàng
        values.reasonId, // ID lý do hệ thống
        values.status, // Trạng thái mục tiêu: LOSE/FROZEN/PENDING_VIEW
        values.note, // Nội dung giải trình của sales
      );

      if (res.success) {
        messageApi.success("Yêu cầu đã được gửi. Đang chờ Quản lý phê duyệt.");
        setIsFailModalOpen(false);
        loadData(); // Load lại để Task biến mất khỏi danh sách làm việc
      } else {
        const errorMsg = (res as any).error || "Gửi yêu cầu thất bại";

        messageApi.error(errorMsg || "Gửi yêu cầu thất bại");
      }
    } catch (error) {
      messageApi.error("Lỗi kết nối Server");
    } finally {
      setLoading(false);
    }
  };
  // --- COLUMNS ---
  const columns = [
    {
      title: "Khách hàng",
      key: "customer",
      render: (record: any) => {
        const { isLate, lateMinutes } = calculateDelay(record);
        return (
          <div className="max-w-45">
            <Space size={4} align="start">
              <Text strong>{record.customer.fullName}</Text>
              {isLate && (
                <Tooltip title={`Trễ KPI: ${lateMinutes} phút`}>
                  <Badge
                    count={`-${lateMinutes}m`}
                    style={{ backgroundColor: "#f5222d", fontSize: "10px" }}
                  />
                </Tooltip>
              )}
            </Space>
            <div className="text-[11px] text-gray-500">
              {record.customer.phone}
            </div>
            <div className="flex gap-1 mt-1">
              <UrgencyBadge type={record.customer.urgencyLevel} />
              {record.customer.status === "CONTACTED" && (
                <Tag color="blue" className="text-[10px] m-0">
                  Đã chăm sóc
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Thông tin xe thu mua",
      key: "leadCar",
      responsive: ["md"] as any,
      render: (record: any) => (
        <div className="text-[12px]">
          <div className="font-medium text-slate-700">
            <CarOutlined />{" "}
            {record.customer.carModel?.name || "Chưa cập nhật model"}
          </div>
          <div className="text-gray-500">
            Năm: {record.customer.leadCar.year || "---"} | Giá mong muốn:{" "}
            {record.customer.leadCar.expectedPrice
              ? `${record.customer.leadCar.expectedPrice}`
              : "---"}
          </div>
        </div>
      ),
    },
    {
      title: "Lịch hẹn / KPI",
      key: "kpi",
      render: (task: any) => {
        const { isLate, lateMinutes } = calculateDelay(task);
        const scheduledTime = dayjs(task.scheduledAt).tz("Asia/Ho_Chi_Minh");

        return (
          <div className="text-[11px]">
            <div className="text-gray-400">
              Hẹn: {scheduledTime.format("HH:mm DD/MM")}
            </div>
            {isLate ? (
              <div className="text-red-500 font-bold animate-pulse">
                <ClockCircleOutlined /> QUÁ HẠN {lateMinutes} PHÚT
              </div>
            ) : dayjs().tz().isAfter(scheduledTime) ? (
              <div className="text-orange-500 font-medium">
                <SyncOutlined spin /> Sắp đến hẹn
              </div>
            ) : (
              <div className="text-emerald-600">
                <CalendarOutlined /> {scheduledTime.fromNow()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      align: "right" as const,
      render: (record: any) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Ghi chú & Cập nhật xe">
            <Button
              icon={<HistoryOutlined />}
              size="small"
              type="primary"
              ghost
              onClick={() => {
                setSelectedLead(record);
                // Set initial values cho form từ data cũ
                contactForm.setFieldsValue({
                  carModelId: record.carModelId,
                  manufactureYear: record.manufactureYear,
                  expectedPrice: record.expectedPrice,
                  urgencyLevel: record.urgencyLevel,
                });
                setIsContactModalOpen(true);
              }}
            />
          </Tooltip>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedLead(record);
              setIsModalOpen(true);
            }}
          >
            Chốt
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            size="small"
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
    <div className="p-4 bg-[#f0f2f5] min-h-screen">
      {contextHolder}
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <Title level={4} className="m-0! text-slate-800">
            <CarOutlined className="mr-2" /> TRẠM THU MUA: NHIỆM VỤ CỦA TÔI
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Tự thêm khách
            </Button>
            <Segmented
              options={[
                { label: "Tất cả", value: "ALL" },
                { label: "Hot Lead", value: "HOT" },
                { label: "Đã trễ", value: "LATE" },
              ]}
              value={filterType}
              onChange={setFilterType}
            />
          </Space>
        </header>

        <Card className="shadow-sm rounded-xl">
          <Table
            dataSource={data.filter((i) => {
              if (filterType === "HOT") return i.urgencyLevel === "HOT";
              if (filterType === "LATE") return calculateDelay(i).isLate;
              return true;
            })}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedLead(record);
                setIsDetailModalOpen(true);
              },
              className: "cursor-pointer",
            })}
          />
        </Card>
      </div>
      {/* --- MODAL GHI NHẬN TƯƠNG TÁC & CẬP NHẬT XE --- */}
      <ModalContactAndLeadCar
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        selectedLead={selectedLead}
        onFinish={onContactFinish}
        loading={loading}
      />
      {/* --- CÁC MODAL CHI TIẾT & PHÊ DUYỆT --- */}
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
          console.log(values);

          setLoading(true);
          try {
            const res = await requestPurchaseApproval(
              selectedLead.customerId,
              values,
            );

            if (res.success) {
              messageApi.success(
                "Đã gửi yêu cầu phê duyệt thu mua cho Quản lý!",
              );
              setIsModalOpen(false);
              loadData(); // Tải lại danh sách để Lead này biến mất (vì trạng thái đã đổi)
            }
          } catch (error: any) {
            messageApi.error(error.message);
          } finally {
            setLoading(false);
          }
        }}
      />
      <ModalLoseLead
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        onFinish={async (v) => {
          onFailFinish(v);
        }}
        loading={loading}
        selectedLead={selectedLead}
        reasons={reasons}
        onStatusChange={(val) => {
          console.log("Đang đổi sang trạng thái:", val);
          // Gọi API lấy lý do tương ứng với trạng thái mới (LOSE/FROZEN...)
          getActiveReasonsAction(val).then((res) => {
            setReasons(res);
          });
        }}
      />
      <ModalSelfAddCustomer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        carModels={carModels}
        onSuccess={loadData}
      />
    </div>
  );
}
