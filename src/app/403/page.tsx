"use client";

import React from "react";
import { Result, Button, Typography, Space } from "antd";
import {
  HomeOutlined,
  LeftOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";

const { Title, Text } = Typography;

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 md:p-12 text-center border border-slate-100">
        <Result
          status="403"
          icon={
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <LockOutlined className="text-red-500 text-5xl" />
              </div>
              <SafetyCertificateOutlined className="absolute -bottom-2 -right-2 text-red-600 text-3xl bg-white rounded-full p-1 shadow-sm" />
            </div>
          }
          title={
            <Title
              level={2}
              className="!font-black !m-0 !text-slate-800 uppercase tracking-tight"
            >
              Khu vực hạn chế
            </Title>
          }
          subTitle={
            <div className="mt-4">
              <Text className="text-slate-500 text-base block">
                Tài khoản của bạn không có đủ quyền hạn để truy cập vào trang
                này.
              </Text>
              <Text className="text-slate-400 text-sm italic">
                (Vui lòng liên hệ Quản trị viên nếu bạn tin rằng đây là một lỗi
                hệ thống)
              </Text>
            </div>
          }
          extra={
            <Space size="middle" className="mt-8">
              <Button
                icon={<LeftOutlined />}
                size="large"
                className="rounded-xl border-slate-200 text-slate-600 font-bold hover:!border-red-500 hover:!text-red-500"
                onClick={() => router.back()}
              >
                QUAY LẠI
              </Button>
              <Button
                type="primary"
                danger
                size="large"
                icon={<HomeOutlined />}
                className="rounded-xl font-bold shadow-lg shadow-red-100 h-12 px-8"
              >
                <Link href="/dashboard/referrals/new">TRANG CHỦ</Link>
              </Button>
            </Space>
          }
        />

        <div className="mt-12 pt-8 border-t border-slate-100">
          <Text
            type="secondary"
            className="text-[10px] uppercase tracking-[2px] font-bold text-slate-300"
          >
            Hệ thống quản trị nội bộ Toyota Bình Dương
          </Text>
        </div>
      </div>
    </div>
  );
}
