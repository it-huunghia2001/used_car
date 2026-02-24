/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ControlOutlined,
  CrownOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";

export const getRoleTag = (role: string) => {
  const roleConfig: any = {
    ADMIN: { label: "Quản trị viên", color: "red", icon: <KeyOutlined /> },
    MANAGER: {
      label: "Quản lý",
      color: "blue",
      icon: <SafetyCertificateOutlined />,
    },
    PURCHASE_STAFF: {
      label: "Nhân viên Thu mua",
      color: "purple",
      icon: <ShoppingCartOutlined />,
    },
    SALES_STAFF: {
      label: "Nhân viên bán",
      color: "green",
      icon: <TeamOutlined />,
    },
    REFERRER: {
      label: "Người giới thiệu",
      color: "orange",
      icon: <UsergroupAddOutlined />,
    },
    APPRAISER: {
      label: "Nhân viên giám định",
      color: "orange",
      icon: <UsergroupAddOutlined />,
    },
    // --- THÊM 2 ROLE MỚI ---
    SALE_MANAGER: {
      label: "Quản lý bán hàng",
      color: "geekblue",
      icon: <CrownOutlined />,
    },
    ADMIN_MANAGER: {
      label: "Quản lý Admin",
      color: "volcano",
      icon: <ControlOutlined />,
    },
  };

  const config = roleConfig[role] || {
    label: role,
    color: "default",
    icon: null,
  };

  return (
    <Tag
      color={config.color}
      icon={config.icon}
      className="rounded-lg border-none font-bold px-3 py-0.5 uppercase text-[10px]"
    >
      {config.label}
    </Tag>
  );
};
