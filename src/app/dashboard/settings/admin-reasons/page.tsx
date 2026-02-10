/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Tabs, Card, Typography, Space } from "antd";
import {
  SettingOutlined,
  EyeInvisibleOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import LeadStatusReasonsTab from "@/components/reason/LeadStatusReasonsTab";
import NotSeenReasonsTab from "@/components/reason/NotSeenReasonsTab";
import SellReasonsTab from "@/components/reason/SellReasonsTab";
import BuyReasonsTab from "@/components/reason/BuyReasonsTab";

// Import các sub-component

const { Title, Text, Paragraph } = Typography;

export default function AdminReasonsPage() {
  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Space align="center" className="mb-1">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <SettingOutlined className="text-white text-2xl" />
              </div>
              <Title level={2} className="!m-0 text-slate-800 tracking-tight">
                Cấu hình hệ thống lý do
              </Title>
            </Space>
            <Paragraph className="text-slate-500 m-0 ml-14">
              Quản lý tập trung các danh mục phản hồi mẫu nhằm chuẩn hóa dữ liệu
              báo cáo.
            </Paragraph>
          </div>
          <Card
            size="small"
            className="bg-amber-50 border-amber-100 hidden lg:block"
          >
            <Space>
              <BulbOutlined className="text-amber-500" />
              <Text italic className="text-amber-700 text-xs">
                Các thay đổi sẽ áp dụng ngay lập tức cho Modal xử lý của nhân
                viên.
              </Text>
            </Space>
          </Card>
        </div>

        <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
          <Tabs
            defaultActiveKey="1"
            type="line"
            size="large"
            animated={{ inkBar: true, tabPane: true }}
            className="custom-admin-tabs"
            items={[
              {
                key: "1",
                label: (
                  <Space>
                    <AppstoreOutlined />
                    Lý do xử lý Lead
                  </Space>
                ),
                children: <LeadStatusReasonsTab />,
              },
              {
                key: "2",
                label: (
                  <Space>
                    <EyeInvisibleOutlined />
                    Lý do chưa xem xe
                  </Space>
                ),
                children: <NotSeenReasonsTab />,
              },
              {
                key: "3",
                label: (
                  <Space>
                    <ShoppingOutlined />
                    Lý do bán xe
                  </Space>
                ),
                children: <SellReasonsTab />,
              },
              {
                key: "4",
                label: (
                  <Space>
                    <ShoppingCartOutlined />
                    Lý do mua xe
                  </Space>
                ),
                children: <BuyReasonsTab />,
              },
            ]}
          />
        </Card>
      </div>

      <style jsx global>{`
        .custom-admin-tabs .ant-tabs-nav {
          padding: 8px 32px 0;
          background: #fff;
          margin-bottom: 0 !important;
          border-bottom: 1px solid #f1f5f9;
        }
        .custom-admin-tabs .ant-tabs-tab-active {
          font-weight: 800 !important;
        }
        .custom-admin-tabs .ant-tabs-content-holder {
          padding: 32px;
          background: #fff;
        }
        .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
      `}</style>
    </div>
  );
}
