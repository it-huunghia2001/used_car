/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
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
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getRoleTag } from "@/components/role";

const { Text } = Typography;

export default function ApprovalModal({
  open,
  onCancel,
  pendingData = [],
  rejectedData = [],
  onProcess,
}: any) {
  // State quản lý việc đang xử lý một ID cụ thể
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, status: string) => {
    setProcessingId(id); // Bật loading cho dòng hiện tại
    try {
      await onProcess(id, status);
    } finally {
      setProcessingId(null); // Tắt loading sau khi xong
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined className="text-blue-600" />
          <span className="font-bold">QUẢN LÝ PHÊ DUYỆT ĐĂNG KÝ</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
      // Chặn đóng modal khi đang xử lý
      maskClosable={!processingId}
      closable={!processingId}
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
                    key: "role",
                    width: 150,
                    render: (role: string) => getRoleTag(role),
                  },
                  {
                    title: "HÀNH ĐỘNG",
                    align: "right",
                    render: (r) => {
                      const isRowLoading = processingId === r.id;
                      return (
                        <Space>
                          <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            className="bg-green-600 border-none rounded-lg shadow-sm"
                            onClick={() => handleAction(r.id, "APPROVED")}
                            loading={isRowLoading}
                            disabled={!!processingId && !isRowLoading}
                          >
                            Duyệt
                          </Button>
                          <Button
                            danger
                            ghost
                            icon={<CloseOutlined />}
                            className="rounded-lg"
                            onClick={() => handleAction(r.id, "REJECTED")}
                            loading={isRowLoading}
                            disabled={!!processingId && !isRowLoading}
                          >
                            Từ chối
                          </Button>
                        </Space>
                      );
                    },
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
                    key: "role",
                    width: 150,
                    render: (role: string) => getRoleTag(role),
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
                    render: (r) => {
                      const isRowLoading = processingId === r.id;
                      return (
                        <Tooltip title="Duyệt lại nếu từ chối nhầm">
                          <Button
                            type="link"
                            icon={<UndoOutlined />}
                            className="font-bold text-blue-600"
                            onClick={() => handleAction(r.id, "APPROVED")}
                            loading={isRowLoading}
                            disabled={!!processingId && !isRowLoading}
                          >
                            DUYỆT LẠI
                          </Button>
                        </Tooltip>
                      );
                    },
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
