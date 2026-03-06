/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Space, Tag, Avatar, Button, Typography } from "antd";
import {
  CarOutlined,
  HistoryOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "@/lib/dayjs";
import { UrgencyBadge } from "@/lib/urgencyBadge";
import { getLeadStatusHelper } from "@/lib/status-helper";

const { Text } = Typography;

export const getTaskColumns = (
  handleMakeCall: (phone: string) => void,
  setSelectedLead: (lead: any) => void,
  setIsContactModalOpen: (open: boolean) => void,
  setIsFailModalOpen: (open: boolean) => void,
  getActiveReasonsAction: (type: string) => Promise<any>,
  setReasons: (reasons: any[]) => void,
) => [
  {
    title: "KHÁCH HÀNG",
    key: "customer",
    render: (t: any) => (
      <Space>
        <div>
          <Text strong className="block">
            {t.customer?.fullName}
          </Text>
          <Text type="secondary" className="text-[11px] font-mono">
            {t.customer?.phone}
          </Text>
        </div>
        <UrgencyBadge type={t.customer?.urgencyLevel} />
      </Space>
    ),
  },
  {
    title: "XE / NHU CẦU",
    key: "car",
    render: (t: any) => (
      <div>
        <Text strong className="text-emerald-700 text-[13px]">
          <CarOutlined /> {t.customer?.carModel?.name || "Chưa chọn xe"}
        </Text>
        <div className="text-[11px] text-slate-400 line-clamp-1">
          {t.customer?.leadCar?.description || "Nhu cầu chung"}
        </div>
      </div>
    ),
  },
  {
    title: "KPI HẠN",
    key: "deadline",
    render: (t: any) => (
      <div className="flex flex-col">
        <Text
          className={`text-[12px] font-bold ${t.isOverdue ? "text-red-500" : "text-slate-500"}`}
        >
          {dayjs(t.scheduledAt).format("HH:mm DD/MM")}
        </Text>
        {t.isOverdue && (
          <Tag color="error" className="w-fit m-0 text-[10px] font-bold">
            TRỄ {t.minutesOverdue}m
          </Tag>
        )}
      </div>
    ),
  },
  {
    title: "XỬ LÝ",
    align: "right" as const,
    key: "actions",
    render: (record: any) => (
      <Space onClick={(e) => e.stopPropagation()}>
        <Button
          icon={<HistoryOutlined />}
          type="primary"
          ghost
          size="small"
          shape="circle"
          onClick={(e) => {
            e.stopPropagation();
            handleMakeCall(record.customer?.phone);
            setSelectedLead(record);
            setIsContactModalOpen(true);
          }}
        />
        <Button
          danger
          icon={<CloseCircleOutlined />}
          type="text"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLead(record.customer);
            setIsFailModalOpen(true);
            getActiveReasonsAction("LOSE").then(setReasons);
          }}
        />
      </Space>
    ),
  },
];

export const getCustomerColumns = (
  handleMakeCall: (phone: string) => void,
  setSelectedLead: (lead: any) => void,
  setIsContactModalOpen: (open: boolean) => void,
  setIsSalesModalOpen: (open: boolean) => void,
  setIsFailModalOpen: (open: boolean) => void,
  getActiveReasonsAction: (type: string) => Promise<any>,
  setReasons: (reasons: any[]) => void,
) => [
  {
    title: "KHÁCH HÀNG",
    key: "customer_info",
    render: (r: any) => (
      <Space>
        <Avatar className="bg-slate-800">{r.fullName?.[0]}</Avatar>
        <div>
          <div className="flex gap-2 items-center">
            <Text strong>{r.fullName}</Text>
            <UrgencyBadge type={r.urgencyLevel} />
          </div>
          <div className="text-[11px] font-mono">{r.phone}</div>
        </div>
      </Space>
    ),
  },
  {
    title: "TRẠNG THÁI",
    key: "status",
    render: (r: any) => {
      const { label, color, icon } = getLeadStatusHelper(r.status);
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
    align: "right" as const,
    key: "actions",
    render: (record: any) => (
      <Space onClick={(e) => e.stopPropagation()}>
        <Button
          icon={<PhoneOutlined />}
          shape="circle"
          onClick={(e) => {
            e.stopPropagation();
            handleMakeCall(record.phone);
            setSelectedLead({ customer: record });
            setIsContactModalOpen(true);
          }}
        />
        <Button
          type="primary"
          className="bg-emerald-600 border-none font-bold rounded-xl"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLead({ customerId: record.id, customer: record });
            setIsSalesModalOpen(true);
          }}
        >
          CHỐT
        </Button>
      </Space>
    ),
  },
];
