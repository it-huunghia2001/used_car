/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Timeline, Tag, Typography, Card, Empty } from "antd";
import { ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "@/lib/dayjs";

const { Text } = Typography;

export default function CustomerHistoryTimeline({ activities, loading }: any) {
  if (!loading && (!activities || activities.length === 0)) {
    return <Empty description="Chưa có lịch sử chăm sóc" />;
  }

  return (
    <Timeline
      pending={loading ? "Đang tải lịch sử..." : false}
      className="mt-4"
      items={activities?.map((act: any) => ({
        color: act.status.includes("DONE") ? "green" : "blue",
        children: (
          <Card size="small" className="mb-2 shadow-sm border-slate-100">
            <div className="flex justify-between items-start">
              <Tag color="blue" className="text-[10px] m-0">
                {act.status}
              </Tag>
              <Text type="secondary" className="text-[11px]">
                {dayjs(act.createdAt).format("HH:mm DD/MM")}
              </Text>
            </div>
            <div className="py-2 text-slate-700 text-sm whitespace-pre-wrap">
              {act.note || "Không có ghi chú"}
            </div>
            {act.reason && (
              <Tag color="red" className="text-[10px]">
                Lý do: {act.reason.content}
              </Tag>
            )}
            <div className="mt-1 pt-1 border-t flex items-center gap-1 text-[10px] text-slate-400">
              <UserOutlined /> {act.user?.fullName}
            </div>
          </Card>
        ),
      }))}
    />
  );
}
