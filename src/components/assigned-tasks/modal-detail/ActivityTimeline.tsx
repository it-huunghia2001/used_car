/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Timeline, Tag, Empty, Card, Space } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export const ActivityTimeline = ({ activities }: any) => {
  return (
    <Card
      className="rounded-2xl border-slate-200 shadow-sm h-full"
      title={
        <Space>
          <HistoryOutlined />
          <span className="text-[15px] font-bold uppercase">
            Nhật ký hoạt động
          </span>
        </Space>
      }
    >
      <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
        {activities?.length > 0 ? (
          <Timeline
            mode="left"
            items={activities.map((act: any) => ({
              content: (
                <div className="mb-6 bg-slate-300 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      {dayjs(act.createdAt).format("DD/MM - HH:mm")}
                    </span>
                    <Tag className="m-0 border-none bg-white text-indigo-600 text-[10px] font-bold shadow-sm">
                      {act.user?.fullName?.split(" ").pop()}
                    </Tag>
                  </div>
                  <div className="text-[13px] text-slate-700 font-medium">
                    {act.note}
                  </div>
                </div>
              ),
            }))}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có lịch sử"
          />
        )}
      </div>
    </Card>
  );
};
