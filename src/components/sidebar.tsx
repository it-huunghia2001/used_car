/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  CarOutlined,
  TeamOutlined,
  SolutionOutlined,
  SettingOutlined,
  LogoutOutlined,
  LineChartOutlined,
  AppstoreAddOutlined,
  UserAddOutlined, // Icon mới cho giới thiệu
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

const { Sider } = Layout;

type Role = "ADMIN" | "MANAGER" | "PURCHASE_STAFF" | "SALES_STAFF" | "REFERRER";

interface SidebarProps {
  role: Role;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const menuItems: any[] = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Tổng quan</Link>,
    },

    // --- MỤC MỚI: GIỚI THIỆU KHÁCH HÀNG (Dành cho tất cả mọi người) ---
    {
      key: "referral-menu",
      icon: <UserAddOutlined />,
      label: "Giới thiệu khách",
      children: [
        {
          key: "/dashboard/referrals/new",
          label: (
            <Link href="/dashboard/referrals/new">Gửi giới thiệu mới</Link>
          ),
        },
        // Chỉ Manager/Admin mới thấy mục quản lý phân bổ
        role === "ADMIN" || role === "MANAGER"
          ? {
              key: "/dashboard/customers",
              label: <Link href="/dashboard/customers">Quản lý & Phân bổ</Link>,
            }
          : null,
        {
          key: "/dashboard/referrals/history",
          label: (
            <Link href="/dashboard/referrals/history">Lịch sử của tôi</Link>
          ),
        },
      ].filter(Boolean),
    },
    // --- PHẦN NGHIỆP VỤ THU MUA ---
    role === "ADMIN" || role === "PURCHASE_STAFF" || role === "SALES_STAFF"
      ? {
          key: "purchase-menu",
          icon: <SolutionOutlined />,
          label: "Nghiệp vụ thu mua",
          children: [
            {
              key: "/dashboard/assigned-tasks", // Đường dẫn trang bạn vừa tạo
              label: (
                <Link href="/dashboard/assigned-tasks">Xử lý giới thiệu</Link>
              ),
            },
            {
              key: "/dashboard/purchase/new",
              label: (
                <Link href="/dashboard/purchase/new">Tạo hồ sơ xe mới</Link>
              ),
            },
            {
              key: "/dashboard/purchase/history",
              label: (
                <Link href="/dashboard/purchase/history">Lịch sử thu mua</Link>
              ),
            },
          ],
        }
      : null,

    // --- PHẦN QUẢN LÝ XE ---
    {
      key: "cars-management",
      icon: <CarOutlined />,
      label: "Quản lý kho xe",
      children: [
        role === "ADMIN" || role === "MANAGER"
          ? {
              key: "/dashboard/admin/approval-customer",
              label: (
                <Link href="/dashboard/admin/approval-customer">
                  Duyệt yêu cầu nv
                </Link>
              ),
            }
          : null,
        {
          key: "/dashboard/cars",
          label: <Link href="/dashboard/cars">Danh sách xe</Link>,
        },
        {
          key: "/dashboard/cars/pending",
          label: <Link href="/dashboard/cars/pending">Xe chờ định giá</Link>,
        },
        {
          key: "/dashboard/cars/refurbishing",
          label: (
            <Link href="/dashboard/cars/refurbishing">Xe đang tân trang</Link>
          ),
        },
      ],
    },

    // --- QUẢN LÝ DANH MỤC ---
    role === "ADMIN"
      ? {
          key: "admin-settings",
          icon: <AppstoreAddOutlined />,
          label: "Danh mục hệ thống",
          children: [
            {
              key: "/dashboard/settings/car-setup",
              label: (
                <Link href="/dashboard/settings/car-setup">Setup mẫu xe</Link>
              ),
            },
            {
              key: "/dashboard/settings/reasons",
              label: (
                <Link href="/dashboard/settings/reasons">Setup Lý do</Link>
              ),
            },
            {
              key: "/dashboard/settings/departments",
              label: (
                <Link href="/dashboard/settings/departments">
                  Phòng ban & Chức vụ
                </Link>
              ),
            },
            {
              key: "/dashboard/settings/branches",
              label: (
                <Link href="/dashboard/settings/branches">
                  Chi nhánh Toyota
                </Link>
              ),
            },
          ],
        }
      : null,

    // --- QUẢN LÝ NHÂN SỰ ---
    role === "ADMIN" || role === "MANAGER"
      ? {
          key: "/dashboard/users",
          icon: <TeamOutlined />,
          label: <Link href="/dashboard/users">Quản lý nhân viên</Link>,
        }
      : null,

    // --- BÁO CÁO ---
    {
      key: "reports",
      icon: <LineChartOutlined />,
      label: "Báo cáo thống kê",
      children: [
        {
          key: "/dashboard/reports/kpis",
          label: <Link href="/dashboard/reports/kpis">KPIs Cá nhân</Link>,
        },
      ],
    },

    // --- TÀI KHOẢN ---
    {
      key: "account",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      children: [
        {
          key: "/dashboard/profile",
          label: <Link href="/dashboard/profile">Thông tin cá nhân</Link>,
        },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          danger: true,
          label: <span onClick={handleLogout}>Đăng xuất</span>,
        },
      ],
    },
  ].filter(Boolean);

  return (
    <Sider
      width={260}
      collapsible
      breakpoint="lg"
      theme="dark"
      className="h-screen sticky top-0 left-0 shadow-2xl"
      style={{ background: "#001529" }}
    >
      <div className="flex flex-col items-center py-6 border-b border-gray-700 mb-4">
        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-2">
          T
        </div>
        <div className="text-white font-bold text-sm tracking-widest text-center px-2">
          TOYOTA BÌNH DƯƠNG
          <div className="text-[10px] text-red-400 font-normal mt-1">
            {role}
          </div>
        </div>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        // Thêm "referral-menu" vào danh sách tự động mở
        defaultOpenKeys={[
          "referral-menu",
          "cars-management",
          "purchase-menu",
          "admin-settings",
        ]}
        items={menuItems}
        className="font-medium"
      />
    </Sider>
  );
}
