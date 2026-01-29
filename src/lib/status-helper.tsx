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
