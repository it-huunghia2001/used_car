/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Card,
  Table,
  Typography,
  Segmented,
  Divider,
  Space,
  Button,
} from "antd";
import { ThunderboltOutlined, PhoneOutlined } from "@ant-design/icons";
import dayjs from "@/lib/dayjs";

const { Title, Text } = Typography;

interface TaskTabProps {
  loading: boolean;
  filteredTasks: any[];
  filterType: string;
  setFilterType: (val: string) => void;
  columnsTasks: any[];
  maintenanceTasks: any[];
  handleMakeCall: (phone: string) => void;
  handleCompleteMaintenance: (id: string) => void;
  isMobile: boolean;
  setSelectedLead: (lead: any) => void;
  setIsDetailModalOpen: (open: boolean) => void;
}

export default function TaskTab({
  loading,
  filteredTasks,
  filterType,
  setFilterType,
  columnsTasks,
  maintenanceTasks,
  handleMakeCall,
  handleCompleteMaintenance,
  isMobile,
  setSelectedLead,
  setIsDetailModalOpen,
}: TaskTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <Title
            level={5}
            className="!m-0 text-slate-400 uppercase text-[11px] tracking-widest"
          >
            <ThunderboltOutlined className="text-orange-400 mr-1" /> Nhiệm vụ
            thực thi
          </Title>
          <Segmented
            options={["Tất cả", "Quá hạn"]}
            value={filterType}
            onChange={(v: any) => setFilterType(v)}
            className="bg-slate-200/50 p-1 rounded-xl"
          />
        </div>

        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
          <Table
            dataSource={filteredTasks}
            columns={columnsTasks}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 5 }}
            scroll={isMobile ? { x: 600 } : undefined}
            onRow={(r) => ({
              onClick: () => {
                setSelectedLead(r);
                setIsDetailModalOpen(true);
              },
            })}
          />
        </Card>
      </div>

      <div className="space-y-4">
        <Divider plain>
          <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Lịch nhắc bảo dưỡng
          </Text>
        </Divider>
        <Card className="rounded-3xl border-none shadow-lg bg-white/40 overflow-hidden">
          <Table
            dataSource={maintenanceTasks}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5 }}
            columns={[
              {
                title: "KHÁCH HÀNG",
                render: (t) => (
                  <div>
                    <Text strong className="text-[12px] block">
                      {t.customer?.fullName}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      {t.customer?.phone}
                    </Text>
                  </div>
                ),
              },
              {
                title: "HẠN KPI",
                render: (t) => (
                  <Text
                    className={`text-[11px] ${dayjs().isAfter(dayjs(t.deadlineAt)) ? "text-red-500 font-bold" : ""}`}
                  >
                    {dayjs(t.deadlineAt).format("DD/MM HH:mm")}
                  </Text>
                ),
              },
              {
                title: "THAO TÁC",
                align: "right",
                render: (t) => (
                  <Space>
                    <Button
                      size="small"
                      shape="circle"
                      icon={<PhoneOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMakeCall(t.customer?.phone);
                      }}
                    />
                    <Button
                      type="primary"
                      size="small"
                      className="bg-blue-600 rounded-lg text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteMaintenance(t.id);
                      }}
                    >
                      XONG
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
