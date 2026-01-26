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
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import ModalApprovalDetail from "@/components/approval-customer/ApprovalDetailModal";
import ModalApproveLose from "@/components/assigned-tasks/ModalApproveLose";
import dayjs from "@/lib/dayjs";
import { getCustomerHistoryAction } from "@/actions/lead-actions";

const { Text, Title } = Typography;

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [carModels, setCarModels] = useState<any[]>([]);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isLoseModalOpen, setIsLoseModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Hàm load lịch sử
  const loadCustomerHistory = async (customerId: string) => {
    setHistoryLoading(true);
    const res = await getCustomerHistoryAction(customerId);
    if (res.success) setCustomerHistory(res.data || []);
    setHistoryLoading(false);
  };

  const openApprovalModal = (record: any) => {
    setSelectedActivity(record);
    loadCustomerHistory(record.customerId); // Gọi load lịch sử ngay khi mở modal

    if (record.status === "PENDING_DEAL_APPROVAL") {
      setIsPurchaseModalOpen(true);
    } else {
      setIsLoseModalOpen(true);
    }
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

  // Đóng modal và dọn dẹp dữ liệu để tránh lỗi Parse JSON ở lần mở sau
  const handleCloseModals = () => {
    setIsPurchaseModalOpen(false);
    setIsLoseModalOpen(false);
    setSelectedActivity(null);
  };

  const handleApprovePurchase = async (updatedData: any) => {
    setLoading(true);
    try {
      const res = await approveCarPurchase(
        selectedActivity.id,
        "APPROVE",
        updatedData.adminNote,
        updatedData,
      );
      if (res.success) {
        message.success("Đã phê duyệt nhập kho xe!");
        handleCloseModals();
        loadData();
      } else message.error(res.error);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDecisionLose = async (
    id: string,
    decision: "APPROVE" | "REJECT",
    targetStatus?: string,
  ) => {
    setLoading(true);
    try {
      const res = await approveLoseRequestAction(id, decision, targetStatus);
      if (res.success) {
        message.success(
          decision === "APPROVE"
            ? "Đã đồng ý dừng hồ sơ!"
            : "Đã từ chối yêu cầu.",
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

  // const openApprovalModal = (record: any) => {
  //   setSelectedActivity(record);
  //   // Phân luồng dựa trên status
  //   if (record.status === "PENDING_DEAL_APPROVAL") {
  //     setIsPurchaseModalOpen(true);
  //   } else {
  //     setIsLoseModalOpen(true);
  //   }
  // };

  return (
    <div className="p-6 bg-[#f0f2f5] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <Title
            level={3}
            className="m-0! flex items-center gap-3 text-slate-700"
          >
            <FileSearchOutlined className="text-blue-600" />
            TRUNG TÂM PHÊ DUYỆT HỆ THỐNG
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
                key: "customer",
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
                render: (s) => {
                  const isDeal = s === "PENDING_DEAL_APPROVAL";
                  return (
                    <Tag
                      icon={isDeal ? <CarOutlined /> : <StopOutlined />}
                      color={isDeal ? "green" : "volcano"}
                      className="rounded-full px-3"
                    >
                      {isDeal ? "THU MUA" : "DỪNG CHĂM SÓC"}
                    </Tag>
                  );
                },
              },
              {
                title: "NHÂN VIÊN",
                key: "user",
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

      {/* --- PHÂN LUỒNG MODAL TRIỆT ĐỂ --- */}

      {/* Chỉ render Modal Duyệt Xe nếu đúng là yêu cầu DEAL */}
      {isPurchaseModalOpen &&
        selectedActivity?.status === "PENDING_DEAL_APPROVAL" && (
          <ModalApprovalDetail
            isOpen={isPurchaseModalOpen}
            onClose={handleCloseModals}
            selectedActivity={selectedActivity}
            carModels={carModels}
            loading={loading}
            onApprove={handleApprovePurchase}
            onReject={(reason: string) =>
              handleApprovePurchase({ adminNote: reason, isReject: true })
            }
          />
        )}

      {/* Chỉ render Modal Duyệt Lose nếu đúng là yêu cầu LOSE */}
      {isLoseModalOpen &&
        selectedActivity?.status !== "PENDING_DEAL_APPROVAL" && (
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
