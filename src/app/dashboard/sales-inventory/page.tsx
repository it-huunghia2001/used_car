/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  SyncOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  UserAddOutlined,
  CarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  getMyTasksAction,
  getAvailableCars,
  requestSaleApproval,
  getActiveReasonsAction,
  updateCustomerStatusAction,
  requestLoseApproval,
  completeMaintenanceTaskAction,
  getMaintenanceTasksAction,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import dayjs from "@/lib/dayjs";

import ModalLoseLead from "@/components/assigned-tasks/ModalLoseLead";
import ModalContactAndLeadCar from "@/components/assigned-tasks/ModalContactAndLeadCar";
import ModalDetailCustomer from "@/components/assigned-tasks/modal-detail/ModalDetailCustomer";
import ModalSelfAddCustomer from "@/components/assigned-tasks/ModalSelfAddCustomer";
import ModalApproveSales from "@/components/assigned-tasks/ModalApproveSales";
import { UrgencyType } from "@prisma/client";
import { UrgencyBadge } from "@/lib/urgencyBadge";

const { Title, Text } = Typography;

export default function SalesTasksPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [inventory, setInventory] = useState([]);
  const [carModels, setCarModels] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("Tất cả");

  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [now, setNow] = useState(dayjs());
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);

  // 2. Thiết lập interval cập nhật mỗi phút để tiết kiệm hiệu năng (hoặc 1s nếu muốn mượt hơn)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
    }, 10000); // Cập nhật mỗi 10 giây là đủ để Sales theo dõi
    return () => clearInterval(timer);
  }, []);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [leads, cars, models]: any = await Promise.all([
        getMyTasksAction(),
        getAvailableCars(),
        getCarModelsAction(),
        getMaintenanceTasksAction(), // Bạn cần viết thêm Action này
      ]);
      setData(leads);
      console.log(leads);

      setInventory(cars);
      setCarModels(models);
    } catch (err) {
      message.error("Không thể tải danh sách nhiệm vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMaintenance = async (taskId: string) => {
    const hide = message.loading("Đang xử lý...", 0);
    try {
      const res = await completeMaintenanceTaskAction(taskId);
      if (res.success) {
        message.success("Đã xác nhận hoàn thành nhiệm vụ chăm sóc!");
        loadData(); // Tải lại dữ liệu để cập nhật danh sách
      } else {
        message.error("Lỗi: Không thể cập nhật trạng thái");
      }
    } catch (error) {
      message.error("Lỗi kết nối hệ thống");
    } finally {
      hide();
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  const maintenanceColumns = [
    {
      title: "KHÁCH HÀNG",
      key: "customer",
      render: (task: any) => (
        <Space orientation="vertical" size={0}>
          <Text strong className="text-slate-800">
            {task.customer?.fullName}
          </Text>
          <Text type="secondary" className="text-[11px]">
            {task.customer?.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "NỘI DUNG",
      dataIndex: "title",
      key: "title",
      render: (text: string) => (
        <Tag
          color="cyan"
          className="font-medium border-cyan-100 uppercase text-[10px]"
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "HẠN KPI",
      key: "deadline",
      render: (task: any) => {
        const deadline = dayjs(task.deadlineAt);
        const isLate = dayjs().isAfter(deadline);
        return (
          <div className="flex flex-col">
            <Text className="text-[12px]">
              {deadline.format("DD/MM/YYYY HH:mm")}
            </Text>
            {isLate && (
              <Tag
                color="error"
                className="m-0 text-[10px] w-fit font-bold border-none animate-pulse"
              >
                QUÁ HẠN
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "THAO TÁC",
      align: "right" as const, // CHÌA KHÓA FIX LỖI: Thêm "as const" ở đây
      render: (task: any) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          className="bg-blue-600 hover:!bg-blue-500 rounded-lg shadow-sm font-medium"
          onClick={(e) => {
            e.stopPropagation(); // Ngăn sự kiện click row
            handleCompleteMaintenance(task.id);
          }}
        >
          Xác nhận đã gọi
        </Button>
      ),
    },
  ];
  const columns = [
    {
      title: "Khách hàng",
      key: "customer",
      render: (task: any) => (
        <div className="max-w-[180px]">
          <Space size={4} align="start">
            <Text strong className="text-slate-800">
              {task.customer.fullName}
            </Text>
            {task.isOverdue && (
              <Badge
                count={`-${task.minutesOverdue}m`}
                style={{ backgroundColor: "#ff4d4f", fontSize: "10px" }}
              />
            )}
          </Space>
          <div className="text-[11px] text-gray-500 font-medium">
            {task.customer.phone}
          </div>
          <div className="mt-1">
            <UrgencyBadge type={task.customer.urgencyLevel} />
          </div>
        </div>
      ),
    },
    {
      title: "Xe quan tâm / Trong kho",
      key: "car_info",
      render: (task: any) => {
        const leadCar = task.customer.leadCar;
        return (
          <div className="text-[12px]">
            <div className="font-bold text-emerald-700">
              <CarOutlined className="mr-1" /> {task.customer.carModel?.name}
            </div>
            {leadCar ? (
              <div className="mt-1 bg-emerald-50 p-1 rounded border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-bold uppercase">
                  Khớp mã kho:
                </div>
                <div className="text-emerald-800 font-medium">
                  {leadCar.description}
                </div>
                <div className="text-[10px] text-slate-500">
                  Màu: {leadCar.color} | Năm: {leadCar.year}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 italic mt-1">
                Tìm theo nhu cầu chung
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Ngân sách & KPI",
      key: "kpi",
      render: (task: any) => {
        const deadline = dayjs(task.deadlineAt);
        const scheduled = dayjs(task.scheduledAt);

        // Tính số phút chênh lệch giữa bây giờ và deadline
        const diffMinutes = deadline.diff(now, "minute");
        const isOverdue = now.isAfter(deadline);

        return (
          <div className="text-[11px]">
            {/* Hiển thị mốc giờ hẹn cố định */}
            <div className="mb-1 text-gray-400 font-medium">
              Hẹn: {scheduled.format("HH:mm DD/MM")}
            </div>

            {isOverdue ? (
              <div className="flex flex-col gap-1 w-fit">
                <Tag
                  color="error"
                  className="animate-pulse m-0 font-bold border-none shadow-sm"
                >
                  <ClockCircleOutlined /> QUÁ HẠN {now.diff(deadline, "minute")}{" "}
                  PHÚT
                </Tag>
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-fit">
                {/* Nếu còn dưới 60 phút thì hiện đếm ngược chi tiết */}
                {diffMinutes <= 60 ? (
                  <Tag
                    color="warning"
                    className="m-0 font-bold border-none shadow-sm w-fit"
                  >
                    <SyncOutlined spin className="mr-1" />
                    CÒN {diffMinutes} PHÚT
                  </Tag>
                ) : (
                  <Tag color="success" className="m-0 border-none font-medium">
                    Sắp đến: {deadline.from(now)}
                    {deadline.format("HH:MM")}
                  </Tag>
                )}
                <Text type="secondary" className="text-[10px]">
                  Nội dung: {task.content}
                </Text>
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
          <Tooltip title="Chăm sóc">
            <Button
              icon={<HistoryOutlined />}
              size="small"
              type="primary"
              ghost
              onClick={() => {
                setSelectedLead(record);
                setIsContactModalOpen(true);
              }}
            />
          </Tooltip>
          <Button
            type="primary"
            size="small"
            className="bg-emerald-600 border-emerald-600 hover:!bg-emerald-500"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setSelectedLead(record);
              setIsSalesModalOpen(true);
            }}
          >
            Chốt bán
          </Button>
          <Button
            danger
            icon={<ClockCircleOutlined />}
            size="small"
            onClick={() => {
              setSelectedLead(record);
              setIsFailModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      {contextHolder}
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-100">
              <DollarOutlined className="text-white text-2xl" />
            </div>
            <div>
              <Title
                level={3}
                className="!m-0 text-slate-800 uppercase font-black tracking-tight"
              >
                Nhiệm vụ bán hàng
              </Title>
              <Text type="secondary" className="text-sm font-medium">
                Theo dõi và chốt đơn khách hàng mua xe
              </Text>
            </div>
          </div>
          <Space>
            <Button
              type="primary"
              size="large"
              className="rounded-xl font-bold shadow-md shadow-emerald-100"
              icon={<UserAddOutlined />}
              onClick={() => setIsAddModalOpen(true)}
            >
              THÊM KHÁCH MỚI
            </Button>
            <Segmented
              options={["Tất cả", "Sắp đến hạn", "Quá hạn"]}
              value={filterType}
              onChange={(v: any) => setFilterType(v)}
              className="bg-white p-1 rounded-xl shadow-sm"
            />
          </Space>
        </header>

        <Card className="shadow-xl rounded-3xl border-none overflow-hidden">
          <Table
            dataSource={data.filter((i) =>
              filterType === "Quá hạn" ? i.isOverdue : true,
            )}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedLead(record);
                setIsDetailModalOpen(true);
              },
            })}
          />
        </Card>

        <Divider titlePlacement="left" className="mt-12">
          <Space>
            <HistoryOutlined />{" "}
            <Title level={4} className="m-0!">
              CHĂM SÓC KHÁCH HÀNG & BẢO DƯỠNG
            </Title>
          </Space>
        </Divider>

        <Card className="shadow-lg rounded-2xl border-none overflow-hidden mt-4 bg-white/60">
          <Table
            dataSource={maintenanceTasks}
            columns={maintenanceColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </div>

      <ModalApproveSales
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        selectedLead={selectedLead}
        inventory={inventory}
        loading={loading}
        onFinish={async (values: any) => {
          setLoading(true);
          try {
            const res = await requestSaleApproval(
              selectedLead.customer.id,
              selectedLead.id,
              values,
            );
            if (res.success) {
              message.success("Đã gửi yêu cầu phê duyệt chốt đơn!");
              setIsSalesModalOpen(false);
              loadData();
            }
          } catch (e: any) {
            message.error(e.message);
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
      />

      <ModalLoseLead
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        selectedLead={selectedLead}
        // onFinish={loadData}
        onFinish={async (v) => {
          onFailFinish(v);
        }}
        loading={loading}
        reasons={reasons}
        onStatusChange={(val) => getActiveReasonsAction(val).then(setReasons)}
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
