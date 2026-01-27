/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Row, Col, Space, Badge, Avatar, Tag, Divider } from "antd";
import { UserOutlined, PhoneOutlined } from "@ant-design/icons";

export const CustomerBanner = ({
  customerData,
  renderTime,
  UrgencyBadge,
}: any) => {
  return (
    <div className="mb-6 p-8 bg-slate-900 rounded-2xl shadow-2xl text-white relative overflow-hidden border border-slate-800">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      <Row justify="space-between" align="middle" className="relative z-10">
        <Col>
          <Space size={24}>
            <Badge
              count={
                <div className="bg-emerald-500 w-4 h-4 rounded-full border-2 border-slate-900" />
              }
              offset={[-10, 60]}
            >
              <Avatar
                size={84}
                icon={<UserOutlined />}
                className="bg-indigo-500 border-4 border-slate-800 shadow-xl"
              />
            </Badge>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold tracking-tight">
                  {customerData.fullName}
                </span>
                <UrgencyBadge type={customerData?.urgencyLevel} />
              </div>
              <Space
                separator={<Divider className="bg-slate-700" />}
                className="text-slate-400"
              >
                <span className="flex items-center gap-2 text-indigo-300 font-medium">
                  <PhoneOutlined /> {customerData.phone}
                </span>
                <Tag
                  color="blue"
                  className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300 px-3 uppercase text-[10px] font-bold leading-5 m-0"
                >
                  {customerData.type === "SELL" ? "THU MUA" : "BÁN"}
                </Tag>
              </Space>
            </div>
          </Space>
        </Col>
        <Col className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
            Liên hệ gần nhất
          </div>
          <div className="text-lg font-mono text-indigo-400">
            {renderTime(customerData.lastContactAt)}
          </div>
        </Col>
      </Row>
    </div>
  );
};
