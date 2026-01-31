/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Row, Col, Badge, Avatar, Tag, Divider, Typography } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  MessageOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

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
        <Col xs={24} md={16} lg={16}>
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

        <Col xs={24} md={8} lg={8}>
          <div className="space-y-4">
            {/* Liên hệ gần nhất */}
            <div className="flex items-center justify-center md:justify-end gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                  Liên hệ gần nhất
                </div>
                <div className="text-base font-mono text-indigo-400 font-bold">
                  {renderTime(customerData.lastContactAt)}
                </div>
              </div>
              <ClockCircleOutlined className="text-slate-600 text-lg hidden md:block" />
            </div>

            {/* Hẹn tiếp theo */}
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-[0.1em] text-indigo-400 font-bold">
                  <CalendarOutlined className="mr-1" /> Hẹn tiếp theo
                </span>
              </div>
              <div className="text-sm font-mono text-emerald-400 font-bold mb-2">
                {customerData.nextContactAt
                  ? renderTime(customerData.nextContactAt)
                  : "Chưa có hẹn"}
              </div>

              {customerData.nextContactNote && (
                <div className="pt-2 border-t border-indigo-500/20 flex items-start gap-2">
                  <MessageOutlined className="text-indigo-400 text-xs mt-1" />
                  <Text className="text-slate-300! italic text-[12px] leading-relaxed">
                    {customerData.nextContactNote}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};
