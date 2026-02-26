/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import {
  Timeline,
  Card,
  Tag,
  Typography,
  Empty,
  Spin,
  Badge,
  Flex,
} from "antd";
import { getStaffHistoryAction } from "@/actions/history-actions";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  CheckCircleOutlined,
  PhoneOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
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
          label: "LOST/Hủy",
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

  return (
    <Card
      title={
        <span className="font-bold text-lg">Nhật Ký Hoạt Động Của Tôi</span>
      }
      className="shadow-md m-4"
    >
      {/* Sửa lỗi Spin bằng cách bọc nội dung vào bên trong */}
      <Spin spinning={loading} tip="Đang tải lịch sử...">
        <div style={{ minHeight: activities.length === 0 ? 200 : "auto" }}>
          {!loading && activities.length === 0 ? (
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
                      <Text type="secondary" className="text-[12px]">
                        {dayjs(item.createdAt).format("DD/MM HH:mm")}
                      </Text>
                    }
                  >
                    <div className="flex flex-col bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <Flex align="center" gap={8}>
                          <Text strong className="text-slate-800 text-base">
                            {item.customer.fullName}
                          </Text>
                          <Tag
                            color={config.color}
                            bordered={false}
                            className="m-0 font-medium"
                          >
                            {config.label}
                          </Tag>
                        </Flex>
                        <Badge
                          count={item.customer.type}
                          style={{ backgroundColor: "#52c41a" }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                        {item.customer.licensePlate && (
                          <span className="flex items-center">
                            🚗{" "}
                            <b className="ml-1 text-slate-700">
                              {item.customer.licensePlate}
                            </b>
                          </span>
                        )}
                        <span className="flex items-center">
                          📞 <span className="ml-1">{item.customer.phone}</span>
                        </span>
                      </div>

                      {item.reason && (
                        <div className="text-xs bg-orange-50 text-orange-700 p-2 rounded-lg border border-orange-100 mb-2">
                          <b>Lý do:</b> {item.reason.content}
                        </div>
                      )}

                      {item.note && (
                        <div className="p-3 bg-slate-50 rounded-lg italic text-gray-600 border-l-4 border-blue-400 text-sm">
                          {item.note}
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          )}
        </div>
      </Spin>
    </Card>
  );
}
