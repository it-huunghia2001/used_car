// components/AppLayout.tsx
"use client";

import Sidebar from "@/components/sidebar";
import { Layout } from "antd";
import { usePathname } from "next/navigation";

const { Content } = Layout;
type Role =
  | "ADMIN"
  | "MANAGER"
  | "PURCHASE_STAFF"
  | "SALES_STAFF"
  | "REFERRER"
  | "APPRAISER";
interface AppLayoutProps {
  children: React.ReactNode;
  role: Role;
  isGobal: boolean;
}

export default function AppLayout({ children, role, isGobal }: AppLayoutProps) {
  const publicRoutes = ["/login", "/register", "/forgot-password"]; // mở rộng nếu cần
  const pathname = usePathname();

  const isPublic = publicRoutes.includes(pathname || "/");
  return (
    <Layout className="min-h-screen">
      {!isPublic && <Sidebar role={role} isGobal={isGobal} />}
      <Layout className="h-screen overflow-auto ">
        <Content className="bg-gray-50">{children}</Content>
      </Layout>
    </Layout>
  );
}
