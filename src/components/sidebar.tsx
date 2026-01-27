/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Layout, Menu, Drawer, Button } from "antd";
import {
  DashboardOutlined,
  CarOutlined,
  TeamOutlined,
  SolutionOutlined,
  SettingOutlined,
  LogoutOutlined,
  AppstoreAddOutlined,
  UserAddOutlined,
  HomeOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useState, useEffect } from "react";

const { Sider } = Layout;

type Role = "ADMIN" | "MANAGER" | "PURCHASE_STAFF" | "SALES_STAFF" | "REFERRER";

interface SidebarProps {
  role: Role;
  isGobal: boolean;
}

export default function Sidebar({ role, isGobal }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false); // Trạng thái đóng mở Drawer trên Mobile
  const [collapsed, setCollapsed] = useState(false); // Trạng thái thu gọn trên Desktop

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
    {
      key: "/dashboard/showroom",
      icon: <HomeOutlined />,
      label: <Link href="/dashboard/showroom">Showroom</Link>,
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
          key: "/dashboard/my-referrals",
          label: <Link href="/dashboard/my-referrals">Lịch sử của tôi</Link>,
        },
      ].filter(Boolean),
    },
    role === "ADMIN" || role === "SALES_STAFF"
      ? {
          key: "purchase-menu-sales",
          icon: <SolutionOutlined />,
          label: "Nghiệp vụ sale",
          children: [
            {
              key: "/dashboard/sales-inventory", // Đường dẫn trang bạn vừa tạo
              label: (
                <Link href="/dashboard/sales-inventory">Xử lý giới thiệu</Link>
              ),
            },

            {
              key: "/dashboard/purchase/sales-history",
              label: <Link href="/dashboard/history">Lịch sử thu mua</Link>,
            },
          ],
        }
      : null,

    // --- PHẦN NGHIỆP VỤ THU MUA ---
    role === "ADMIN" || role === "PURCHASE_STAFF"
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
              key: "/dashboard/purchase/history",
              label: <Link href="/dashboard/history">Lịch sử thu mua</Link>,
            },
          ],
        }
      : null,

    // --- PHẦN NGHIỆP VỤ THU MUA ---
    role === "ADMIN" || role === "MANAGER"
      ? {
          key: "manager-customer-menu",
          icon: <SolutionOutlined />,
          label: "Quản lý KHTN",
          children: [
            {
              key: "/dashboard/frozen-leads-1", // Đường dẫn trang bạn vừa tạo
              label: <Link href="/dashboard/frozen-leads-1">Danh sách KH</Link>,
            },
            {
              key: "/dashboard/frozen-leads",
              label: <Link href="/dashboard/frozen-leads">Rã băng KH</Link>,
            },
          ],
        }
      : null,

    {
      key: "/dashboard/inventory-report",
      icon: <CarOutlined />,
      label: <Link href="/dashboard/inventory-report">Xe đã bán</Link>,
    },

    // --- PHẦN QUẢN LÝ XE ---
    role === "ADMIN" || role === "MANAGER"
      ? {
          key: "cars-management",
          icon: <CarOutlined />,
          label: "Quản lý kho xe",
          children: [
            {
              key: "/dashboard/admin/approval-customer",
              label: (
                <Link href="/dashboard/admin/approval-customer">
                  Duyệt yêu cầu nv
                </Link>
              ),
            },
            {
              key: "/dashboard/cars",
              label: <Link href="/dashboard/cars">Danh sách xe</Link>,
            },
            {
              key: "/dashboard/cars/pending",
              label: (
                <Link href="/dashboard/cars/pending">Xe chờ định giá</Link>
              ),
            },
            {
              key: "/dashboard/cars/refurbishing",
              label: (
                <Link href="/dashboard/cars/refurbishing">
                  Xe đang tân trang
                </Link>
              ),
            },
          ],
        }
      : null,

    // --- QUẢN LÝ DANH MỤC ---
    role === "ADMIN" || (role === "MANAGER" && isGobal)
      ? {
          key: "admin-settings",
          icon: <AppstoreAddOutlined />,
          label: "Danh mục hệ thống",
          children: [
            {
              key: "/dashboard/schedules",
              label: <Link href="/dashboard/schedules">Lịch Trực</Link>,
            },
            {
              key: "/dashboard/settings/car-setup",
              label: (
                <Link href="/dashboard/settings/car-setup">Setup mẫu xe</Link>
              ),
            },
            {
              key: "/dashboard/settings/reasons",
              label: (
                <Link href="/dashboard/settings/reasons">Setup lý do</Link>
              ),
            },
            {
              key: "/dashboard/settings/lead",
              label: (
                <Link href="/dashboard/settings/lead">
                  Trạng thái khách hàng
                </Link>
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

  // Nội dung Menu dùng chung cho cả Sider và Drawer
  const SidebarContent = (
    <>
      <div className="flex flex-col items-center py-6 border-b border-gray-700 mb-4 overflow-hidden">
        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-2 shrink-0">
          T
        </div>
        {!collapsed && (
          <div className="text-white font-bold text-sm tracking-widest text-center px-2 animate-in fade-in duration-500">
            TOYOTA BÌNH DƯƠNG
            <div className="text-[10px] text-red-400 font-normal mt-1 lowercase">
              {role.replace("_", " ")}
            </div>
          </div>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={() => setVisible(false)} // Đóng drawer khi click menu trên mobile
        className="font-medium border-none h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar"
      />
    </>
  );

  return (
    <>
      {/* Nút Hamburger cho Mobile - Chỉ hiện ở màn hình < 992px */}
      <Button
        className="lg:hidden! fixed top-4 left-4 z-50 bg-[#001529] border-gray-600 text-white"
        icon={<MenuOutlined />}
        onClick={() => setVisible(true)}
      />

      {/* Drawer cho Mobile */}
      <Drawer
        title={null}
        placement="left"
        onClose={() => setVisible(false)}
        open={visible}
        style={{ padding: 0, width: "100wv", background: "#001529" }}
        closable={true}
      >
        <div className="h-full bg-[#001529]">{SidebarContent}</div>
      </Drawer>

      {/* Sider cho Desktop - Ẩn khi ở màn hình nhỏ */}
      <Sider
        width={260}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
        collapsedWidth={80}
        theme="dark"
        className="hidden lg:block  h-screen sticky top-0 left-0 shadow-2xl z-40"
        style={{ background: "#001529" }}
      >
        {SidebarContent}
      </Sider>
    </>
  );
}
