/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Card,
  message,
  Typography,
  Space,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  EyeOutlined,
  UserOutlined,
  FileSearchOutlined,
  StopOutlined,
  CarOutlined,
} from "@ant-design/icons";
import {
  getPendingApprovalsAction,
  approveCarPurchase,
  approveLoseRequestAction,
  approveDealAction, // Bạn cần import hàm này cho luồng Bán xe
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import ModalApprovalDetail from "@/components/approval-customer/ApprovalDetailModal";
import ModalApproveLose from "@/components/assigned-tasks/ModalApproveLose";
import ModalApprovalSalesDetail from "@/components/approval-customer/ModalApprovalSalesDetail";
import dayjs from "@/lib/dayjs";
import { getCustomerHistoryAction } from "@/actions/lead-actions";

const { Text, Title } = Typography;

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [carModels, setCarModels] = useState<any[]>([]);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isLoseModalOpen, setIsLoseModalOpen] = useState(false);
  const [isSalesDealModalOpen, setIsSalesDealModalOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- LOGIC MỞ MODAL (Đã sửa lỗi trùng lặp) ---
  const openApprovalModal = (record: any) => {
    setSelectedActivity(record);
    loadCustomerHistory(record.customerId);

    if (record.status === "PENDING_DEAL_APPROVAL") {
      // Nếu khách có type là BUY hoặc hồ sơ có liên quan đến việc bán xe trong kho
      if (record.customer?.type === "BUY") {
        setIsSalesDealModalOpen(true);
      } else {
        setIsPurchaseModalOpen(true);
      }
    } else {
      setIsLoseModalOpen(true);
    }
  };

  const handleAdminDecisionLose = async (
    activityId: string,
    decision: "APPROVE" | "REJECT",
    targetStatus?: string,
  ) => {
    setLoading(true);
    try {
      // Gọi API Server Action (Hàm này chúng ta đã viết ở bước trước)
      const res = await approveLoseRequestAction(
        activityId,
        decision,
        targetStatus,
      );

      if (res.success) {
        message.success(
          decision === "APPROVE"
            ? `Đã phê duyệt dừng hồ sơ (Trạng thái: ${targetStatus})`
            : "Đã từ chối yêu cầu dừng chăm sóc.",
        );
        handleCloseModals(); // Đóng Modal và xóa dữ liệu tạm
        loadData(); // Tải lại danh sách phê duyệt để cập nhật UI
      } else {
        message.error(res.error || "Có lỗi xảy ra khi phê duyệt");
      }
    } catch (error: any) {
      console.error("Lỗi handleAdminDecisionLose:", error);
      message.error("Lỗi hệ thống: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerHistory = async (customerId: string) => {
    setHistoryLoading(true);
    const res = await getCustomerHistoryAction(customerId);
    if (res.success) setCustomerHistory(res.data || []);
    setHistoryLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resApprovals, resModels] = await Promise.all([
        getPendingApprovalsAction(),
        getCarModelsAction(),
      ]);
      setData(resApprovals as any);
      setCarModels(resModels);
    } catch (error) {
      message.error("Lỗi tải dữ liệu phê duyệt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCloseModals = () => {
    setIsPurchaseModalOpen(false);
    setIsLoseModalOpen(false);
    setIsSalesDealModalOpen(false);
    setSelectedActivity(null);
  };

  // --- LUỒNG PHÊ DUYỆT BÁN XE ---
  const handleApproveSales = async (updatedData: any) => {
    setLoading(true);
    try {
      // Gọi action chuyên dụng để chốt Deal bán hàng
      const res = await approveDealAction(
        selectedActivity.id,
        updatedData.isReject ? "REJECT" : "APPROVE",
        updatedData.adminNote,
      );

      if (res.success) {
        message.success(
          updatedData.isReject
            ? "Đã từ chối chốt đơn."
            : "Đã phê duyệt chốt đơn thành công!",
        );
        handleCloseModals();
        loadData();
      } else {
        message.error((res as any).error);
      }
    } catch (e: any) {
      message.error("Lỗi hệ thống: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LUỒNG THU MUA ---
  const handleApprovePurchase = async (updatedData: any) => {
    setLoading(true);
    try {
      const res = await approveCarPurchase(
        selectedActivity.id,
        updatedData.isReject ? "REJECT" : "APPROVE",
        updatedData.adminNote,
        updatedData,
      );
      if (res.success) {
        message.success(
          updatedData.isReject
            ? "Đã từ chối nhập kho."
            : "Đã phê duyệt nhập kho xe!",
        );
        handleCloseModals();
        loadData();
      } else message.error(res.error);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#f0f2f5] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <Title
            level={3}
            className="m-0! flex items-center gap-3 text-slate-700"
          >
            <FileSearchOutlined className="text-blue-600" /> TRUNG TÂM PHÊ DUYỆT
          </Title>
        </header>

        <Card className="shadow-md rounded-2xl border-none">
          <Table
            dataSource={data}
            rowKey="id"
            loading={loading}
            columns={[
              {
                title: "KHÁCH HÀNG",
                render: (r) => (
                  <div className="flex flex-col">
                    <Text strong>{r.customer?.fullName}</Text>
                    <Text className="text-[11px] text-slate-400">
                      {r.customer?.phone}
                    </Text>
                  </div>
                ),
              },
              {
                title: "LOẠI YÊU CẦU",
                dataIndex: "status",
                render: (s, record) => {
                  if (s === "PENDING_DEAL_APPROVAL") {
                    const isSales = record.customer?.type === "BUY";
                    return (
                      <Tag
                        icon={<CarOutlined />}
                        color={isSales ? "cyan" : "green"}
                        className="rounded-full px-3"
                      >
                        {isSales ? "CHỐT BÁN" : "CHỐT THU"}
                      </Tag>
                    );
                  }
                  return (
                    <Tag
                      icon={<StopOutlined />}
                      color="volcano"
                      className="rounded-full px-3"
                    >
                      DỪNG CHĂM SÓC
                    </Tag>
                  );
                },
              },
              {
                title: "NHÂN VIÊN",
                render: (r) => (
                  <Text className="text-slate-600 font-medium">
                    {r.user?.fullName}
                  </Text>
                ),
              },
              {
                title: "THAO TÁC",
                align: "right",
                render: (r) => (
                  <Button
                    type="primary"
                    shape="round"
                    icon={<EyeOutlined />}
                    onClick={() => openApprovalModal(r)}
                  >
                    Xem & Xử lý
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* MODAL DUYỆT THU MUA */}
      {isPurchaseModalOpen && (
        <ModalApprovalDetail
          isOpen={isPurchaseModalOpen}
          onClose={handleCloseModals}
          selectedActivity={selectedActivity}
          carModels={carModels}
          loading={loading}
          onApprove={handleApprovePurchase}
          onReject={(reason) =>
            handleApprovePurchase({ adminNote: reason, isReject: true })
          }
        />
      )}

      {/* MODAL DUYỆT BÁN XE */}
      {isSalesDealModalOpen && (
        <ModalApprovalSalesDetail
          isOpen={isSalesDealModalOpen}
          onClose={handleCloseModals}
          selectedActivity={selectedActivity}
          loading={loading}
          onApprove={handleApproveSales}
          onReject={(reason) =>
            handleApproveSales({ adminNote: reason, isReject: true })
          }
        />
      )}

      {/* MODAL DUYỆT DỪNG CHĂM SÓC */}
      {isLoseModalOpen && (
        <ModalApproveLose
          isOpen={isLoseModalOpen}
          onClose={handleCloseModals}
          selectedActivity={selectedActivity}
          loading={loading}
          onConfirm={handleAdminDecisionLose}
        />
      )}
    </div>
  );
}
