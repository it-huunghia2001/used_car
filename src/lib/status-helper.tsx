import {
  InfoCircleOutlined,
  UserOutlined,
  SyncOutlined,
  PhoneOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import { SnowflakeIcon } from "lucide-react";
import React from "react";

export const getLeadStatusHelper = (status: string) => {
  switch (status) {
    case "NEW":
      return { label: "Mới tạo", color: "blue", icon: <InfoCircleOutlined /> };
    case "ASSIGNED":
      return { label: "Đã phân công", color: "cyan", icon: <UserOutlined /> };
    case "FOLLOW_UP":
      return {
        label: "Đang chăm sóc",
        color: "processing",
        icon: <SyncOutlined spin />,
      };
    case "CONTACTED":
      return {
        label: "Đã liên hệ",
        color: "geekblue",
        icon: <PhoneOutlined />,
      };
    case "INSPECTING":
      return {
        label: "Đang giám định",
        color: "orange",
        icon: <SearchOutlined />,
      };
    case "PENDING_DEAL_APPROVAL":
      return {
        label: "Chờ duyệt chốt",
        color: "warning",
        icon: <ClockCircleOutlined />,
      };
    case "DEAL_DONE":
      return {
        label: "Đã chốt đơn",
        color: "success",
        icon: <CheckCircleOutlined />,
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        color: "default",
        icon: <CloseCircleOutlined />,
      };
    case "LOSE":
      return {
        label: "Thất bại (Lose)",
        color: "error",
        icon: <StopOutlined />,
      };
    case "FROZEN":
      return {
        label: "đóng băng",
        color: "#67bed9",
        icon: <SnowflakeIcon />,
      };
    case "PENDING_LOSE_APPROVAL":
      return {
        label: "Chờ duyệt đóng",
        color: "volcano",
        icon: <ClockCircleOutlined />,
      };
    case "REJECTED_APPROVAL":
      return {
        label: "Bị từ chối duyệt",
        color: "magenta",
        icon: <CloseCircleOutlined />,
      };
    case "PENDING_VIEW":
      return { label: "Chờ xem xe", color: "purple", icon: <EyeOutlined /> };
    default:
      return {
        label: "Không xác định",
        color: "default",
        icon: <InfoCircleOutlined />,
      };
  }
};

export const getReferralTypeTag = (type: string) => {
  switch (type) {
    case "SELL":
      return (
        <Tag
          color="orange"
          className="bg-orange-500/20 border-orange-500/30 text-orange-300 px-3 uppercase text-[10px] font-bold m-0 rounded-lg"
        >
          THU MUA
        </Tag>
      );
    case "BUY":
      return (
        <Tag
          color="green"
          className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 px-3 uppercase text-[10px] font-bold m-0 rounded-lg"
        >
          BÁN XE
        </Tag>
      );
    case "VALUATION":
      return (
        <Tag
          color="purple"
          className="bg-purple-500/20 border-purple-500/30 text-purple-300 px-3 uppercase text-[10px] font-bold m-0 rounded-lg"
        >
          ĐỊNH GIÁ
        </Tag>
      );
    case "SELL_TRADE_NEW":
      return (
        <Tag
          color="blue"
          className="bg-blue-500/20 border-blue-500/30 text-blue-300 px-3 uppercase text-[10px] font-bold m-0 rounded-lg"
        >
          ĐỔI XE MỚI
        </Tag>
      );
    case "SELL_TRADE_USED":
      return (
        <Tag
          color="cyan"
          className="bg-cyan-500/20 border-cyan-500/30 text-cyan-300 px-3 uppercase text-[10px] font-bold m-0 rounded-lg"
        >
          ĐỔI XE LƯỚT
        </Tag>
      );
    default:
      return (
        <Tag
          color="default"
          className="px-3 uppercase text-[10px] font-bold m-0 rounded-lg"
        >
          KĐ
        </Tag>
      );
  }
};
