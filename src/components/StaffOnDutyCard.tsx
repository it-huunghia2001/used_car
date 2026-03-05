/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  List,
  Avatar,
  Badge,
  Tag,
  Typography,
  Spin,
  Empty,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getStaffOnDutyAction } from "@/actions/customer-actions";

dayjs.extend(relativeTime);
const { Text, Title } = Typography;

export default function StaffOnDutyCard() {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);

  const loadStaff = async () => {
    setLoading(true);
    const res = await getStaffOnDutyAction();
    console.log(res);

    if (
      typeof res === "object" &&
      res !== null &&
      "success" in res &&
      res.success
    ) {
      // Sắp xếp: Ai nhận khách lâu nhất trước đó (lastAssignedAt nhỏ nhất) sẽ đứng đầu hàng đợi
      const sorted = res.data.sort(
        (a: any, b: any) =>
          new Date(a.lastAssignedAt || 0).getTime() -
          new Date(b.lastAssignedAt || 0).getTime(),
      );
      setStaffList(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
    const interval = setInterval(loadStaff, 60000); // Tự động làm mới mỗi phút
    return () => clearInterval(interval);
  }, []);

  return (
    <Card
      className="rounded-3xl shadow-sm border-none bg-white/80 backdrop-blur-md"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockCircleOutlined className="text-indigo-600" />
            <span className="font-bold text-slate-700">
              Đội ngũ trực ca hôm nay
            </span>
          </div>
          <Badge count={staffList.length} showZero color="#4f46e5" />
        </div>
      }
    >
      <Spin spinning={loading}>
        {staffList.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={staffList}
            renderItem={(item, index) => (
              <List.Item
                className={`px-4 rounded-2xl mb-2 border-none transition-all ${
                  index === 0
                    ? "bg-indigo-50/50 border-l-4 border-l-indigo-500"
                    : ""
                }`}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={item.active} color="green" offset={[-2, 32]}>
                      <Avatar
                        size={48}
                        icon={<UserOutlined />}
                        className={
                          index === 0 ? "bg-indigo-600" : "bg-slate-300"
                        }
                      />
                    </Badge>
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong className="text-slate-700">
                        {item.fullName}
                      </Text>
                      {index === 0 && (
                        <Tooltip title="Người tiếp theo nhận khách">
                          <Tag
                            color="gold"
                            icon={<ThunderboltOutlined />}
                            className="m-0 border-none rounded-full px-2 text-[10px]"
                          >
                            NEXT UP
                          </Tag>
                        </Tooltip>
                      )}
                    </div>
                  }
                  description={
                    <div className="flex flex-col">
                      <Text type="secondary" className="text-xs">
                        {item.role}
                      </Text>
                      <Text type="secondary" className="text-[10px]">
                        Lần cuối nhận khách:{" "}
                        {item.lastAssignedAt
                          ? dayjs(item.lastAssignedAt).fromNow()
                          : "Chưa nhận khách"}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description="Không có nhân viên trực hôm nay"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Spin>
    </Card>
  );
}
