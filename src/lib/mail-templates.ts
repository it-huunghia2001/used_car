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
              "<br>",
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
              "<br>",
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

export const kpiWarningEmailTemplate = (data: {
  staffName: string;
  customerName: string;
  lateMinutes: number;
  taskTitle: string;
  deadline: string;
}) => {
  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #ffccc7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(255, 77, 79, 0.1);">
    
    <div style="background-color: #fff1f0; padding: 20px; text-align: center; border-bottom: 2px solid #ff4d4f;">
      <h1 style="color: #cf1322; margin: 0; font-size: 20px; text-transform: uppercase;">⚠️ Cảnh Báo Vi Phạm KPI</h1>
    </div>

    <div style="padding: 35px 30px; background-color: #ffffff;">
      <p style="color: #595959; font-size: 16px;">Thông báo đến: <strong>${data.staffName}</strong>,</p>
      <p style="color: #595959; font-size: 16px; line-height: 1.6;">Hệ thống ghi nhận một nhiệm vụ đã <strong>vượt quá thời hạn phản hồi</strong> quy định. Thông tin chi tiết vi phạm:</p>

      <div style="margin: 25px 0; border-radius: 8px; border: 1px solid #ffa39e; overflow: hidden;">
        <div style="background-color: #ff4d4f; color: #ffffff; padding: 10px 15px; font-weight: bold; font-size: 14px;">
          TỔNG THỜI GIAN TRỄ: ${data.lateMinutes} PHÚT
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; background-color: #fffcfc;">
          <tr>
            <td style="padding: 12px 15px; border-bottom: 1px solid #ffefef; color: #8c8c8c; width: 35%;">Nhiệm vụ</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #ffefef; color: #1f1f1f; font-weight: 600;">${data.taskTitle}</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; border-bottom: 1px solid #ffefef; color: #8c8c8c;">Khách hàng</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #ffefef; color: #1f1f1f;">${data.customerName.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; color: #8c8c8c;">Hạn chót (Deadline)</td>
            <td style="padding: 12px 15px; color: #cf1322; font-weight: bold;">${data.deadline}</td>
          </tr>
        </table>
      </div>

      <p style="color: #ff4d4f; font-size: 14px; italic"> * Lưu ý: Dữ liệu trễ hạn sẽ được ghi nhận vào báo cáo hiệu suất (KPI) hàng tháng của bạn.</p>

      <div style="text-align: center; margin-top: 35px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks" 
           style="background-color: #1f1f1f; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
           XỬ LÝ NGAY LẬP TỨC
        </a>
      </div>
    </div>

    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #f0f0f0;">
      <p style="margin: 0; font-size: 11px; color: #bfbfbf;">Đây là thông báo tự động từ hệ thống giám sát thời gian phản hồi Toyota Bình Dương.</p>
    </div>
  </div>
  `;
};

export const accountApprovedEmailTemplate = (data: {
  fullName: string;
  username: string;
  roleLabel: string;
  branchName: string;
}) => {
  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background-color: #52c41a; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Tài khoản đã sẵn sàng sử dụng</p>
    </div>

    <div style="padding: 40px 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
        <h2 style="color: #1f1f1f; margin: 0; font-size: 22px;">Chúc Mừng Phê Duyệt Thành Công</h2>
        <p style="color: #8c8c8c; font-size: 14px; margin-top: 5px;">Chào mừng bạn gia nhập hệ thống CRM</p>
      </div>

      <p style="color: #595959; font-size: 16px;">Chào <strong>${data.fullName}</strong>,</p>
      <p style="color: #595959; font-size: 16px;">Quản trị viên đã phê duyệt yêu cầu đăng ký của bạn. Hiện tại bạn đã có thể đăng nhập vào hệ thống với thông tin sau:</p>

      <div style="margin: 25px 0; background-color: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c; width: 40%;">Tên đăng nhập:</td>
            <td style="padding: 8px 0; color: #1f1f1f; font-weight: bold;">${data.username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Quyền hạn:</td>
            <td style="padding: 8px 0; color: #1f1f1f;">${data.roleLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Chi nhánh:</td>
            <td style="padding: 8px 0; color: #1f1f1f;">${data.branchName}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 35px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
           style="background-color: #52c41a; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
           ĐĂNG NHẬP NGAY
        </a>
      </div>
    </div>

    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e8e8e8;">
      <p style="margin: 0; font-size: 12px; color: #bfbfbf;">Vui lòng không chia sẻ thông tin đăng nhập cho người khác.</p>
    </div>
  </div>
  `;
};

export const newUserRegistrationEmailTemplate = (data: {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  branchName: string;
}) => {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <div style="background-color: #2563eb; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Hệ thống quản trị tài khoản</p>
    </div>

    <div style="padding: 40px 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="background-color: #eef2ff; color: #4338ca; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #c7d2fe;">
          YÊU CẦU PHÊ DUYỆT
        </span>
        <h2 style="color: #1f1f1f; margin: 15px 0 5px 0; font-size: 22px;">Có Nhân Viên Mới Đăng Ký</h2>
        <p style="color: #8c8c8c; font-size: 14px; margin: 0;">Thời gian gửi yêu cầu: ${now}</p>
      </div>

      <p style="color: #595959; font-size: 16px;">Chào Admin,</p>
      <p style="color: #595959; font-size: 16px;">Hệ thống vừa ghi nhận một yêu cầu đăng ký tài khoản từ nhân viên mới. Vui lòng kiểm tra thông tin và cấp quyền truy cập.</p>

      <div style="margin: 30px 0; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr style="background-color: #fafafa;">
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #8c8c8c; width: 35%;">Họ và tên</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #1f1f1f; font-weight: 600;">${data.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #8c8c8c;">Mã nhân viên</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #2563eb; font-weight: bold;">${data.username}</td>
          </tr>
          <tr style="background-color: #fafafa;">
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #8c8c8c;">Email</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #1f1f1f;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #8c8c8c;">Số điện thoại</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #1f1f1f;">${data.phone}</td>
          </tr>
          <tr style="background-color: #fafafa;">
            <td style="padding: 12px 15px; color: #8c8c8c;">Chi nhánh đăng ký</td>
            <td style="padding: 12px 15px; color: #1f1f1f; font-weight: 600;">${data.branchName}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/users" 
           style="background-color: #2563eb; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background 0.3s;">
           XEM DANH SÁCH & PHÊ DUYỆT
        </a>
        <p style="margin-top: 15px; font-size: 12px; color: #bfbfbf;">(Yêu cầu quyền truy cập Admin để thực hiện)</p>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 13px; color: #64748b;">Hệ thống CRM Toyota Bình Dương - Used Car Division</p>
    </div>
  </div>
  `;
};
