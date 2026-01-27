/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Timeline, Typography, Tag, Card, Avatar, Space } from "antd";
import {
  UnlockOutlined,
  ShakeOutlined,
  UserOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export default function CustomerTimeline({ history }: { history: any[] }) {
  const getIcon = (status: string) => {
    switch (status) {
      case "FROZEN":
        return <ShakeOutlined style={{ color: "#722ed1" }} />;
      case "CONTACTED":
        return <UnlockOutlined style={{ color: "#1890ff" }} />;
      case "DEAL_DONE":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      default:
        return <UserOutlined />;
    }
  };

  return (
    <div className="max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
      <Timeline mode="left">
        {history.map((item) => (
          <Timeline.Item
            key={item.id}
            dot={getIcon(item.status)}
            label={
              <Text type="secondary" className="text-xs">
                {dayjs(item.createdAt).format("DD/MM HH:mm")}
              </Text>
            }
          >
            <Card className="shadow-none border-gray-100 bg-gray-50/50 hover:bg-white transition-all rounded-xl mb-2">
              <div className="flex justify-between items-start mb-2">
                <Space orientation="vertical" size={0}>
                  <Text strong className="text-sm uppercase">
                    {item.status}
                  </Text>
                  <Text type="secondary" className="text-[12px]">
                    Bởi:{" "}
                    <span className="text-blue-600 font-medium">
                      {item.user.fullName}
                    </span>
                  </Text>
                </Space>
                {item.reason && (
                  <Tag color="error" bordered={false}>
                    {item.reason.content}
                  </Tag>
                )}
              </div>
              <div className="text-gray-600 text-sm italic border-l-2 border-gray-200 pl-3 py-1">
                {item.note || "Không có ghi chú"}
              </div>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
}
