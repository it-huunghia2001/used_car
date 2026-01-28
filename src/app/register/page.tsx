/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Form, Input, Button, Card, Select, message, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Image from "next/image";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<
    { address: string; name: string; id: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Hiệu ứng Spotlight giống trang Login
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Load chi nhánh
    const fetchBranches = async () => {
      const { getBranchesAction } = await import("@/actions/branch-actions");
      const res = await getBranchesAction();
      setBranches(res);
    };
    fetchBranches();

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const { registerAction } = await import("@/actions/auth-actions");
      const res = await registerAction(values);
      if (res.success) {
        message.success(res.message);
        router.push("/login");
      } else {
        message.error(res.error);
      }
    } catch (error) {
      message.error("Lỗi hệ thống, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 px-4 relative overflow-hidden py-10">
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-all duration-200 h-full w-full"
        style={{
          background: `radial-gradient(600px at ${pos.x}px ${pos.y}px, rgba(163,198,243,0.5), transparent 80%)`,
        }}
      />

      <Card
        className="w-full max-w-lg shadow-2xl rounded-3xl border-0 z-20 bg-[rgba(255,255,255,0.7)] backdrop-blur-md"
        styles={{ body: { padding: "2rem" } }}
      >
        <div className="relative z-10 space-y-6">
          <div className="text-center">
            <Image
              src="/storage/images/logo-toyota.webp"
              alt="Logo"
              width={50}
              height={50}
              className="mx-auto mb-2 h-12 w-auto"
              priority
            />
            <Title level={3} className="!m-0 !font-bold dark:text-white">
              Đăng ký tài khoản
            </Title>
            <Text className="text-gray-400 text-xs">
              Hệ thống quản lý nội bộ TOYOTA BÌNH DƯƠNG
            </Text>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            size="middle"
            requiredMark={false}
            className="space-y-0"
          >
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item
                label={
                  <span className="text-xs font-semibold text-gray-500">
                    MSNV
                  </span>
                }
                name="username"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Mã NV"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                label={
                  <span className="text-xs font-semibold text-gray-500">
                    Họ và tên
                  </span>
                }
                name="fullName"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <Input placeholder="Họ tên" className="rounded-lg" />
              </Form.Item>
            </div>

            <Form.Item
              label={
                <span className="text-xs font-semibold text-gray-500">
                  Email công ty
                </span>
              }
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Email không hợp lệ",
                },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="email@toyotabinhduong.com.vn"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-xs font-semibold text-gray-500">
                  Chi nhánh công tác
                </span>
              }
              name="branchId"
              rules={[{ required: true, message: "Vui lòng chọn" }]}
            >
              <Select
                placeholder="Chọn chi nhánh"
                className="w-full"
                suffixIcon={<BankOutlined />}
                options={branches.map((b: any) => ({
                  label: b.name,
                  value: b.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-xs font-semibold text-gray-500">
                  Số điện thoại
                </span>
              }
              name="phone"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="090x xxx xxx"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-xs font-semibold text-gray-500">
                  Mật khẩu
                </span>
              }
              name="password"
              rules={[{ required: true, min: 6, message: "Tối thiểu 6 ký tự" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="******"
                className="rounded-lg"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="w-full h-11 mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold border-none shadow-lg shadow-blue-100"
            >
              ĐĂNG KÝ NGAY
            </Button>
          </Form>

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500">
              Đã có tài khoản?{" "}
              <a
                href="/login"
                className="text-blue-600 font-bold hover:underline"
              >
                Đăng nhập
              </a>
            </p>
            <p className="text-[10px] text-gray-400 italic">
              © {new Date().getFullYear()} Công Ty TOYOTA BÌNH DƯƠNG.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
