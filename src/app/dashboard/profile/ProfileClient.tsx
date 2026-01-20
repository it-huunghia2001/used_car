"use client";

import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Divider,
  Space,
  Tag,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { updateProfile } from "@/actions/profile-actions";

const { Title, Text } = Typography;

interface ProfilePageProps {
  user: any;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      // ❗ Nếu nhập mật khẩu mới thì bắt buộc có mật khẩu cũ
      if (values.password && !values.oldPassword) {
        message.error("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới");
        return;
      }

      const res = await updateProfile({
        email: values.email,
        oldPassword: values.oldPassword,
        password: values.password,
      });

      if (res?.success) {
        message.success("Cập nhật thông tin thành công");
        form.setFieldsValue({
          oldPassword: "",
          password: "",
          confirm: "",
        });
      } else {
        message.error(res?.message || "Cập nhật thất bại");
      }
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Card className="shadow-md rounded-2xl border-none">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <Title level={3} className="!m-0">
              {user?.fullName || "Người dùng"}
            </Title>
            <Space size={8}>
              <Text type="secondary">@{user?.username}</Text>
              <Tag color="blue">{user?.role}</Tag>
            </Space>
          </div>
        </div>

        {/* FORM */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ email: user?.email }}
          requiredMark={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            {/* ================= THÔNG TIN CƠ BẢN ================= */}
            <section>
              <Divider orientation="vertical">Thông tin cơ bản</Divider>

              <Form.Item
                label="Địa chỉ Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  className="h-10 rounded-lg"
                />
              </Form.Item>

              <Form.Item label="Mã nhân viên">
                <Input
                  value={user?.username}
                  disabled
                  prefix={<UserOutlined className="text-gray-400" />}
                  className="h-10 rounded-lg"
                />
              </Form.Item>

              <Form.Item label="Chi nhánh">
                <Input
                  value={user?.branch?.name || ""}
                  disabled
                  className="h-10 rounded-lg"
                />
              </Form.Item>

              <Form.Item label="Phòng ban">
                <Input
                  value={user?.department?.name || ""}
                  disabled
                  className="h-10 rounded-lg"
                />
              </Form.Item>

              <Form.Item label="Chức vụ">
                <Input
                  value={user?.position?.name || ""}
                  disabled
                  className="h-10 rounded-lg"
                />
              </Form.Item>
            </section>

            {/* ================= ĐỔI MẬT KHẨU ================= */}
            <section>
              <Divider orientation="vertical">Đổi mật khẩu</Divider>

              <Form.Item name="oldPassword" label="Mật khẩu hiện tại">
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập để xác nhận đổi mật khẩu"
                  className="h-10 rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu mới"
                rules={[{ min: 6, message: "Mật khẩu tối thiểu 6 ký tự" }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Bỏ trống nếu không đổi"
                  className="h-10 rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                label="Xác nhận mật khẩu mới"
                dependencies={["password"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !getFieldValue("password") ||
                        value === getFieldValue("password")
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Mật khẩu xác nhận không khớp")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  className="h-10 rounded-lg"
                />
              </Form.Item>
            </section>
          </div>

          <Divider />

          {/* ACTION */}
          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              className="bg-indigo-600 h-10 px-8 rounded-lg"
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
