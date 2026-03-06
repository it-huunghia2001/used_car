/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Card, Table, Segmented, Input, Typography } from "antd";
import { SearchOutlined, TeamOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface CustomerTabProps {
  loading: boolean;
  customers: any[];
  filterUrgency: string;
  setFilterUrgency: (val: string) => void;
  setSearchText: (val: string) => void;
  columnsCustomers: any[];
  isMobile: boolean;
  setSelectedLead: (lead: any) => void;
  setIsDetailModalOpen: (open: boolean) => void;
}

export default function CustomerTab({
  loading,
  customers,
  filterUrgency,
  setFilterUrgency,
  setSearchText,
  columnsCustomers,
  isMobile,
  setSelectedLead,
  setIsDetailModalOpen,
}: CustomerTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
        <Title
          level={5}
          className="!m-0 text-slate-400 uppercase text-[11px] tracking-widest hidden md:block"
        >
          <TeamOutlined className="mr-1" /> Quản lý khách hàng
        </Title>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Segmented
            value={filterUrgency}
            onChange={(v) => setFilterUrgency(v as string)}
            className="bg-slate-200/50 p-1 rounded-xl"
            options={[
              { label: "Tất cả", value: "ALL" },
              {
                label: <span className="text-red-500 font-bold">HOT</span>,
                value: "HOT",
              },
              {
                label: <span className="text-orange-500 font-bold">WARM</span>,
                value: "WARM",
              },
              {
                label: <span className="text-blue-500 font-bold">COOL</span>,
                value: "COOL",
              },
            ]}
          />
          <Input
            placeholder="Tìm tên, SĐT..."
            prefix={<SearchOutlined className="text-slate-400" />}
            className="rounded-2xl border-none shadow-sm h-11 flex-1 md:w-64"
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white/70 backdrop-blur-sm">
        <Table
          dataSource={customers}
          columns={columnsCustomers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={isMobile ? { x: 800 } : undefined}
          onRow={(r) => ({
            onClick: () => {
              setSelectedLead({ customer: r });
              setIsDetailModalOpen(true);
            },
          })}
        />
      </Card>
    </div>
  );
}
