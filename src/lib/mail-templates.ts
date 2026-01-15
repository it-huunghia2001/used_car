export const referralEmailTemplate = (data: {
  customerName: string;
  typeLabel: string;
  referrerName: string;
  details: string;
  branchName?: string;
}) => {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <div style="background-color: #eb0a1e; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Hệ thống ghi nhận khách hàng (CRM)</p>
    </div>

    <div style="padding: 40px 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="background-color: #fff1f0; color: #cf1322; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #ffa39e;">
          THÔNG BÁO MỚI
        </span>
        <h2 style="color: #1f1f1f; margin: 15px 0 5px 0; font-size: 22px;">Có Lời Giới Thiệu Khách Hàng</h2>
        <p style="color: #8c8c8c; font-size: 14px; margin: 0;">Thời gian ghi nhận: ${now}</p>
      </div>

      <p style="color: #595959; font-size: 16px;">Chào Quản lý,</p>
      <p style="color: #595959; font-size: 16px;">Hệ thống vừa tiếp nhận thông tin khách hàng tiềm năng từ nhân viên. Vui lòng kiểm tra và phân bổ nhân sự xử lý ngay.</p>

      <div style="margin: 30px 0; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr style="background-color: #fafafa;">
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #8c8c8c; width: 35%;">Khách hàng</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #1f1f1f; font-weight: 600;">${data.customerName.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #8c8c8c;">Nhu cầu khách</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #eb0a1e; font-weight: bold;">${
              data.typeLabel
            }</td>
          </tr>
          <tr style="background-color: #fafafa;">
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #8c8c8c;">Chi nhánh</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #1f1f1f;">${
              data.branchName || "Tổng công ty"
            }</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #8c8c8c;">Người giới thiệu</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #1f1f1f;">${
              data.referrerName
            }</td>
          </tr>
          <tr style="background-color: #fafafa;">
            <td style="padding: 12px 15px; color: #8c8c8c; vertical-align: top;">Chi tiết yêu cầu</td>
            <td style="padding: 12px 15px; color: #595959; line-height: 1.5;">${data.details.replace(
              /\n/g,
              "<br>"
            )}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customers" 
           style="background-color: #1f1f1f; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background 0.3s;">
           PHÊ DUYỆT & PHÂN BỔ NGAY
        </a>
        <p style="margin-top: 15px; font-size: 12px; color: #bfbfbf;">(Link này yêu cầu đăng nhập bằng tài khoản Quản lý)</p>
      </div>
    </div>

    <div style="background-color: #f5f5f5; padding: 25px; text-align: center; border-top: 1px solid #e8e8e8;">
      <p style="margin: 0; font-size: 13px; color: #8c8c8c;">© 2024 Toyota Bình Dương - Used Car Division</p>
      <div style="margin-top: 10px; font-size: 12px; color: #bfbfbf;">
        Địa chỉ: Thủ Dầu Một, Bình Dương<br>
        Hotline hỗ trợ kỹ thuật: 09xx xxx xxx
      </div>
    </div>
  </div>
  `;
};

// Hàm tạo nội dung HTML cho email thông báo NHIỆM VỤ cho nhân viên
export const staffAssignmentEmailTemplate = (data: {
  customerName: string;
  customerPhone: string;
  typeLabel: string;
  details: string;
  branchName?: string;
}) => {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <div style="background-color: #1f1f1f; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Thông báo nhận nhiệm vụ mới</p>
    </div>

    <div style="padding: 40px 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="background-color: #e6f7ff; color: #1890ff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #91d5ff;">
          NHIỆM VỤ MỚI
        </span>
        <h2 style="color: #1f1f1f; margin: 15px 0 5px 0; font-size: 22px;">Bạn Được Phân Bổ Khách Hàng</h2>
        <p style="color: #8c8c8c; font-size: 14px; margin: 0;">Ngày giao: ${now}</p>
      </div>

      <p style="color: #595959; font-size: 16px;">Chào bạn,</p>
      <p style="color: #595959; font-size: 16px;">Quản lý đã phân bổ bạn xử lý khách hàng tiềm năng dưới đây. Vui lòng liên hệ và phản hồi trạng thái trên hệ thống sớm nhất.</p>

      <div style="margin: 30px 0; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; background-color: #fffbe6;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 15px; color: #8c8c8c; width: 35%;">Khách hàng</td>
            <td style="padding: 12px 15px; color: #1f1f1f; font-weight: 600;">${data.customerName.toUpperCase()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 15px; color: #8c8c8c;">Số điện thoại</td>
            <td style="padding: 12px 15px;">
                <a href="tel:${
                  data.customerPhone
                }" style="color: #eb0a1e; font-weight: bold; text-decoration: none; font-size: 18px;">
                    ${data.customerPhone}
                </a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 15px; color: #8c8c8c;">Nhu cầu</td>
            <td style="padding: 12px 15px; color: #1f1f1f; font-weight: bold;">${
              data.typeLabel
            }</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; color: #8c8c8c; vertical-align: top;">Thông tin chi tiết</td>
            <td style="padding: 12px 15px; color: #595959; line-height: 1.5;">${data.details.replace(
              /\n/g,
              "<br>"
            )}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customers" 
           style="background-color: #eb0a1e; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
           XEM CHI TIẾT & CẬP NHẬT
        </a>
      </div>
    </div>

    <div style="background-color: #f5f5f5; padding: 25px; text-align: center; border-top: 1px solid #e8e8e8;">
      <p style="margin: 0; font-size: 13px; color: #8c8c8c;">Hệ thống CRM Toyota Bình Dương</p>
    </div>
  </div>
  `;
};
