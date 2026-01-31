/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Row,
  Col,
  Badge,
  Avatar,
  Tag,
  Divider,
  Typography,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export const CustomerBanner = ({
  customerData,
  renderTime,
  UrgencyBadge,
}: any) => {
  console.log(customerData);

  // Logic hiển thị label cho tình trạng giám định
  const getInspectStatusTag = (status: string) => {
    switch (status) {
      case "INSPECTED":
        return (
          <Tag color="green" className="m-0 font-bold">
            ĐÃ XEM XE
          </Tag>
        );
      case "APPOINTED":
        return (
          <Tag color="orange" className="m-0 font-bold">
            HẸN XEM XE
          </Tag>
        );
      case "NOT_INSPECTED":
        return (
          <Tag color="error" className="m-0 font-bold">
            CHƯA XEM XE
          </Tag>
        );
      default:
        return (
          <Tag color="default" className="m-0 font-bold">
            KĐ ĐỊNH
          </Tag>
        );
    }
  };

  return (
    <div className="mb-6 p-6 md:p-8 bg-slate-900 rounded-3xl shadow-2xl text-white relative overflow-hidden border border-slate-800 transition-all">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 md:opacity-100"></div>

      <Row gutter={[24, 24]} align="top" className="relative z-10">
        {/* CỘT 1: THÔNG TIN CƠ BẢN */}
        <Col xs={24} md={10} lg={10}>
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

              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <a
                    href={`tel:${customerData.phone}`}
                    className="flex items-center gap-2 text-indigo-300 font-semibold hover:text-indigo-200"
                  >
                    <PhoneOutlined className="text-sm" />
                    <span>{customerData.phone}</span>
                  </a>
                  <Divider type="vertical" className="bg-slate-700 h-4" />
                  <Tag
                    color="blue"
                    className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300 uppercase font-bold m-0"
                  >
                    {customerData.type === "SELL" ? "THU MUA" : "BÁN"}
                  </Tag>
                </div>

                {/* Lý do bán xe / Nhu cầu mua */}
                {(customerData.buyReasonRef?.name ||
                  customerData.buyReasonId) && (
                  <div className="text-[12px] text-slate-400 flex items-center gap-2">
                    <Tooltip title="Lý do/Nhu cầu">
                      <MessageOutlined />
                      <span>
                        {customerData.buyReasonRef?.name || "Nhu cầu mua xe"}
                      </span>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>

        {/* CỘT 2: THÔNG TIN GIÁM ĐỊNH (Dành cho KH muốn bán) */}
        <Col
          xs={24}
          md={7}
          lg={7}
          className="border-l border-slate-800/50 px-4"
        >
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Tình trạng giám định
              </div>
              <div className="flex items-center gap-2">
                {getInspectStatusTag(customerData.inspectStatus)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-slate-300">
                <UserOutlined className="text-indigo-400" />
                <div className="text-[13px]">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Giám định viên
                  </span>
                  <span className="font-semibold">
                    {customerData.inspectorRef?.fullName ||
                      customerData.inspector ||
                      "---"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <EnvironmentOutlined className="text-indigo-400" />
                <div className="text-[13px]">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Nơi giám định
                  </span>
                  <span className="font-semibold">
                    {customerData.inspectLocation || "---"}
                  </span>
                </div>
              </div>
            </div>

            {/* Hiển thị nguyên nhân nếu chưa xem được xe */}
            {customerData.inspectStatus === "NOT_INSPECTED" && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span className="text-red-400 block text-[10px] uppercase font-bold mb-1">
                  Nguyên nhân chưa xem
                </span>
                <span className="text-[12px] text-red-200 italic">
                  {customerData.notSeenReasonRef?.name ||
                    customerData.notSeenReason ||
                    "Chưa cập nhật lý do"}
                </span>
              </div>
            )}
          </div>
        </Col>

        {/* CỘT 3: LỊCH HẸN & TIMES */}
        <Col xs={24} md={7} lg={7}>
          <div className="space-y-4">
            {/* Ngày hoàn tất giám định */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Ngày hoàn tất GĐ
                </div>
                <div className="text-sm font-mono text-indigo-400 font-bold">
                  {customerData.inspectDoneDate
                    ? renderTime(customerData.inspectDoneDate)
                    : "---"}
                </div>
              </div>
              <SafetyOutlined className="text-indigo-400 text-lg hidden md:block" />
            </div>

            {/* Hẹn tiếp theo */}
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
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
