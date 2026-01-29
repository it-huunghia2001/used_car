/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Row, Col, Badge, Avatar, Tag, Divider } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

export const CustomerBanner = ({
  customerData,
  renderTime,
  UrgencyBadge,
}: any) => {
  return (
    <div className="mb-6 p-6 md:p-8 bg-slate-900 rounded-3xl shadow-2xl text-white relative overflow-hidden border border-slate-800 transition-all">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 md:opacity-100"></div>

      <Row gutter={[24, 24]} align="middle" className="relative z-10">
        {/* Phần thông tin chính */}
        <Col xs={24} md={16} lg={18}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <Badge
              count={
                <div className="bg-emerald-500 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-slate-900" />
              }
              offset={[-8, 65]}
            >
              <Avatar
                size={{ xs: 80, sm: 84, md: 90, lg: 100 }}
                icon={<UserOutlined />}
                className="bg-indigo-500 border-4 border-slate-800 shadow-2xl"
              />
            </Badge>

            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                <span className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                  {customerData.fullName}
                </span>
                <UrgencyBadge type={customerData?.urgencyLevel} />
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2">
                <a
                  href={`tel:${customerData.phone}`}
                  className="flex items-center gap-2 text-indigo-300 font-semibold hover:text-indigo-200 transition-colors"
                >
                  <PhoneOutlined className="text-sm" />
                  <span className="text-sm md:text-base">
                    {customerData.phone}
                  </span>
                </a>

                <Divider
                  type="vertical"
                  className="hidden sm:block bg-slate-700 h-4"
                />

                <Tag
                  color="blue"
                  className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300 px-3 uppercase text-[10px] font-bold leading-5 m-0 rounded-lg"
                >
                  {customerData.type === "SELL" ? "THU MUA" : "BÁN"}
                </Tag>
              </div>
            </div>
          </div>
        </Col>

        {/* Phần thống kê bên phải/dưới */}
        <Col xs={24} md={8} lg={6}>
          <div className="h-full flex flex-col justify-center items-center md:items-end p-4 md:p-0 bg-slate-800/40 md:bg-transparent rounded-2xl border border-slate-700/50 md:border-none">
            <div className="flex items-center gap-2 md:block">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1 text-center md:text-right font-bold">
                <ClockCircleOutlined className="mr-1 md:hidden" />
                Liên hệ gần nhất
              </div>
              <div className="text-lg md:text-xl font-mono text-indigo-400 font-bold">
                {renderTime(customerData.lastContactAt)}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};
