/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Tag,
  Tabs,
  Typography,
  Tooltip,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  UndoOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function ApprovalModal({
  open,
  onCancel,
  pendingData = [], // Gán mặc định là mảng rỗng để tránh lỗi .length
  rejectedData = [],
  onProcess,
}: any) {
  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined className="text-blue-600" /> QUẢN LÝ PHÊ DUYỆT
          ĐĂNG KÝ
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
    >
      <Tabs
        defaultActiveKey="1"
        type="card"
        className="mt-2"
        items={[
          {
            key: "1",
            label: (
              <Space>
                <ClockCircleOutlined />
                <span>CHỜ DUYỆT ({pendingData?.length || 0})</span>
              </Space>
            ),
            children: (
              <Table
                dataSource={pendingData}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                columns={[
                  {
                    title: "NHÂN VIÊN",
                    render: (r) => (
                      <div className="py-1">
                        <div className="font-bold text-slate-700">
                          {r.fullName}
                        </div>
                        <Text type="secondary" className="text-[11px]">
                          {r.username} • {r.email}
                        </Text>
                      </div>
                    ),
                  },
                  {
                    title: "VAI TRÒ",
                    dataIndex: "role",
                    render: (role) => (
                      <Tag
                        color="blue"
                        className="border-none font-bold uppercase text-[10px]"
                      >
                        {role}
                      </Tag>
                    ),
                  },
                  {
                    title: "HÀNH ĐỘNG",
                    align: "right",
                    render: (r) => (
                      <Space>
                        <Button
                          type="primary"
                          icon={<CheckOutlined />}
                          className="bg-green-600 border-none rounded-lg shadow-sm"
                          onClick={() => onProcess(r.id, "APPROVED")}
                        >
                          Duyệt
                        </Button>
                        <Button
                          danger
                          ghost
                          icon={<CloseOutlined />}
                          className="rounded-lg"
                          onClick={() => onProcess(r.id, "REJECTED")}
                        >
                          Từ chối
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: "2",
            label: (
              <Space>
                <HistoryOutlined />
                <span>ĐÃ TỪ CHỐI ({rejectedData?.length || 0})</span>
              </Space>
            ),
            children: (
              <Table
                dataSource={rejectedData}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                columns={[
                  {
                    title: "NHÂN VIÊN",
                    render: (r) => (
                      <div className="py-1">
                        <div className="font-bold text-slate-400">
                          {r.fullName}
                        </div>
                        <Text type="secondary" className="text-[11px]">
                          {r.username} • {r.email}
                        </Text>
                      </div>
                    ),
                  },
                  {
                    title: "VAI TRÒ",
                    dataIndex: "role",
                    render: (role) => (
                      <Tag className="text-[10px] uppercase font-bold">
                        {role}
                      </Tag>
                    ),
                  },
                  {
                    title: "TRẠNG THÁI",
                    render: () => (
                      <Tag
                        color="error"
                        className="border-none uppercase font-black text-[10px]"
                      >
                        REJECTED
                      </Tag>
                    ),
                  },
                  {
                    title: "KHÔI PHỤC",
                    align: "right",
                    render: (r) => (
                      <Tooltip title="Duyệt lại nếu từ chối nhầm">
                        <Button
                          type="link"
                          icon={<UndoOutlined />}
                          className="font-bold text-blue-600"
                          onClick={() => onProcess(r.id, "APPROVED")}
                        >
                          DUYỆT LẠI
                        </Button>
                      </Tooltip>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
}

import { CheckCircleOutlined } from "@ant-design/icons";
