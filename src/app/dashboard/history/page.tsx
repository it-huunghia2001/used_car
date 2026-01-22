import StaffHistoryTimeline from "@/components/history/StaffHistoryTimeline";
import { Card, Col, Divider, Row, Statistic } from "antd";

export default function HistoryPage() {
  return (
    <div className="p-6">
      <Row gutter={[16, 16]}>
        {/* Cột trái: Hiển thị Timeline lịch sử */}
        <Col xs={24} lg={16}>
          <StaffHistoryTimeline />
        </Col>

        {/* Cột phải: Hiển thị thống kê nhanh (KPI) */}
        <Col xs={24} lg={8}>
          <Card title="Thống kê hiệu suất" className="shadow-md">
            <Statistic title="Khách đang chăm sóc" value={12} />
            <Divider />
            <Statistic title="Hành động trong tháng" value={150} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
