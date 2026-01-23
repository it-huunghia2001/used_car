/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { Timeline, Card, Tag, Typography, Empty, Spin, Badge } from "antd";
import { getStaffHistoryAction } from "@/actions/history-actions"; // Đường dẫn file action của bạn
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  CheckCircleOutlined,
  PhoneOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function StaffHistoryTimeline() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const res = await getStaffHistoryAction();
      if (res?.success) {
        setActivities(res.data || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "DEAL_DONE":
        return {
          color: "green",
          icon: <CheckCircleOutlined />,
          label: "Thành công",
        };
      case "CONTACTED":
        return { color: "blue", icon: <PhoneOutlined />, label: "Đã liên hệ" };
      case "CANCELLED":
      case "LOSE":
        return {
          color: "red",
          icon: <CloseCircleOutlined />,
          label: "Thất bại/Hủy",
        };
      case "PENDING_VIEW":
        return {
          color: "orange",
          icon: <SearchOutlined />,
          label: "Chờ xem xe",
        };
      default:
        return { color: "gray", icon: <ClockCircleOutlined />, label: status };
    }
  };

  if (loading)
    return (
      <Card className="m-4">
        <Spin tip="Đang tải lịch sử..." />
      </Card>
    );

  return (
    <Card
      title={
        <span className="font-bold text-lg">Nhật Ký Hoạt Động Của Tôi</span>
      }
      className="shadow-md m-4"
    >
      {activities.length === 0 ? (
        <Empty description="Bạn chưa có hoạt động nào được ghi lại." />
      ) : (
        <Timeline mode="left" className="mt-6">
          {activities.map((item) => {
            const config = getStatusConfig(item.status);
            return (
              <Timeline.Item
                key={item.id}
                dot={config.icon}
                color={config.color}
                label={
                  <Text type="secondary">
                    {dayjs(item.createdAt).format("DD/MM HH:mm")}
                  </Text>
                }
              >
                <div className="flex flex-col bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <Text strong className="text-blue-600 mr-2">
                        {item.customer.fullName}
                      </Text>
                      <Tag color={config.color}>{config.label}</Tag>
                    </div>
                    <Badge
                      count={item.customer.type}
                      style={{ backgroundColor: "#52c41a" }}
                    />
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    {item.customer.licensePlate && (
                      <span className="mr-3">
                        🚗 Biển số: <b>{item.customer.licensePlate}</b>
                      </span>
                    )}
                    <span>📞 {item.customer.phone}</span>
                  </div>

                  {item.reason && (
                    <div className="mt-2 text-xs bg-orange-50 text-orange-700 p-2 rounded">
                      <b>Lý do:</b> {item.reason.content}
                    </div>
                  )}

                  {item.note && (
                    <div className="mt-2 p-2 bg-gray-50 rounded italic text-gray-600 border-l-2 border-gray-300">
                      {item.note}
                    </div>
                  )}
                </div>
              </Timeline.Item>
            );
          })}
        </Timeline>
      )}
    </Card>
  );
}
