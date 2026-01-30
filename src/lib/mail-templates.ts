/* eslint-disable @typescript-eslint/no-unused-vars */
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

export const dealApprovalRequestEmailTemplate = (data: {
  staffName: string;
  customerName: string;
  carName: string;
  licensePlate: string;
  dealPrice: number;
  contractNo: string;
  type: "PURCHASE" | "SALE";
  branchName: string;
}) => {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const isPurchase = data.type === "PURCHASE";
  const themeColor = isPurchase ? "#f59e0b" : "#10b981"; // Vàng cho Thu mua, Xanh lá cho Bán
  const typeLabel = isPurchase
    ? "ĐỀ NGHỊ DUYỆT THU MUA"
    : "ĐỀ NGHỊ DUYỆT BÁN XE";

  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <div style="background-color: ${themeColor}; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Yêu cầu phê duyệt giao dịch tài chính</p>
    </div>

    <div style="padding: 40px 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="background-color: #f8fafc; color: ${themeColor}; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid ${themeColor}44;">
          ${typeLabel}
        </span>
        <h2 style="color: #1f1f1f; margin: 15px 0 5px 0; font-size: 22px;">Xác Nhận Chốt Giao Dịch</h2>
        <p style="color: #8c8c8c; font-size: 14px; margin: 0;">Thời gian gửi: ${now}</p>
      </div>

      <p style="color: #595959; font-size: 16px;">Chào Quản lý,</p>
      <p style="color: #595959; font-size: 16px;">Nhân viên <strong>${data.staffName}</strong> vừa gửi yêu cầu phê duyệt chốt giao dịch với chi tiết như sau:</p>

      <div style="margin: 25px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 5px solid ${themeColor};">
        <div style="font-size: 13px; color: #8c8c8c; margin-bottom: 5px; text-transform: uppercase; font-weight: bold;">Giá trị chốt giao dịch:</div>
        <div style="font-size: 32px; color: ${themeColor}; font-weight: 800; margin-bottom: 15px;">
          ${new Intl.NumberFormat("vi-VN").format(data.dealPrice)} <span style="font-size: 18px;">VNĐ</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c; width: 40%;">Khách hàng:</td>
            <td style="padding: 8px 0; color: #1f1f1f; font-weight: 600;">${data.customerName.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Sản phẩm:</td>
            <td style="padding: 8px 0; color: #1f1f1f;">${data.carName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Biển số:</td>
            <td style="padding: 8px 0; color: #1f1f1f; font-weight: 600;">${data.licensePlate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Số hợp đồng:</td>
            <td style="padding: 8px 0; color: #1f1f1f; font-family: monospace; font-weight: bold;">${data.contractNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Chi nhánh:</td>
            <td style="padding: 8px 0; color: #1f1f1f;">${data.branchName}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/approval-customer" 
           style="background-color: #1f1f1f; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
           TRUY CẬP TRANG PHÊ DUYỆT
        </a>
        <p style="margin-top: 15px; font-size: 12px; color: #bfbfbf;">Vui lòng kiểm tra kỹ hồ sơ và hình ảnh đính kèm trước khi phê duyệt.</p>
      </div>
    </div>

    <div style="background-color: #f5f5f5; padding: 25px; text-align: center; border-top: 1px solid #e8e8e8;">
      <p style="margin: 0; font-size: 13px; color: #8c8c8c;">Hệ thống CRM Toyota Bình Dương - Used Car Division</p>
    </div>
  </div>
  `;
};

export const loseApprovalRequestEmailTemplate = (data: {
  staffName: string;
  customerName: string;
  customerPhone: string;
  reason: string;
  note: string;
  targetStatus: string;
  branchName: string;
}) => {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <div style="background-color: #64748b; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Yêu cầu phê duyệt dừng hồ sơ khách hàng</p>
    </div>

    <div style="padding: 40px 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="background-color: #f1f5f9; color: #475569; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #e2e8f0;">
          DUYỆT HỦY / DỪNG HỒ SƠ
        </span>
        <h2 style="color: #1f1f1f; margin: 15px 0 5px 0; font-size: 22px;">Đề Nghị Đóng Hồ Sơ</h2>
        <p style="color: #8c8c8c; font-size: 14px; margin: 0;">Thời gian yêu cầu: ${now}</p>
      </div>

      <p style="color: #595959; font-size: 16px;">Chào Quản lý,</p>
      <p style="color: #595959; font-size: 16px;">Nhân viên <strong>${data.staffName}</strong> đã gửi yêu cầu kết thúc hồ sơ khách hàng với mục tiêu chuyển sang trạng thái <strong>${data.targetStatus}</strong>.</p>

      <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 5px solid #64748b;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c; width: 35%;">Khách hàng:</td>
            <td style="padding: 8px 0; color: #1f1f1f; font-weight: 600;">${data.customerName.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Số điện thoại:</td>
            <td style="padding: 8px 0; color: #1f1f1f;">${data.customerPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Lý do chính:</td>
            <td style="padding: 8px 0; color: #cf1322; font-weight: bold;">${data.reason}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c; vertical-align: top;">Giải trình sale:</td>
            <td style="padding: 8px 0; color: #595959; font-style: italic; line-height: 1.5;">"${data.note}"</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c8c8c;">Chi nhánh:</td>
            <td style="padding: 8px 0; color: #1f1f1f;">${data.branchName}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/approval-customer" 
           style="background-color: #1f1f1f; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
           XEM CHI TIẾT & PHÊ DUYỆT
        </a>
      </div>
    </div>

    <div style="background-color: #f5f5f5; padding: 25px; text-align: center; border-top: 1px solid #e8e8e8;">
      <p style="margin: 0; font-size: 13px; color: #8c8c8c;">Hệ thống CRM Toyota Bình Dương</p>
    </div>
  </div>
  `;
};

export const dealResultEmailTemplate = (data: {
  staffName: string;
  customerName: string;
  decision: "APPROVE" | "REJECT";
  adminNote: string;
  contractNo?: string;
  carName: string;
}) => {
  const isApprove = data.decision === "APPROVE";
  const themeColor = isApprove ? "#10b981" : "#ef4444";
  const resultText = isApprove ? "ĐÃ ĐƯỢC PHÊ DUYỆT" : "KHÔNG ĐƯỢC PHÊ DUYỆT";
  const icon = isApprove ? "✅" : "❌";

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    <div style="background-color: ${themeColor}; padding: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Thông báo kết quả phê duyệt chốt đơn</p>
    </div>

    <div style="padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
        <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Yêu Cầu Của Bạn ${resultText}</h2>
      </div>

      <p style="color: #475569; font-size: 16px;">Chào <strong>${data.staffName}</strong>,</p>
      <p style="color: #475569; font-size: 16px;">Quản lý đã xem xét yêu cầu chốt giao dịch cho khách hàng <strong>${data.customerName.toUpperCase()}</strong>. Dưới đây là phản hồi chi tiết:</p>

      <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-top: 4px solid ${themeColor};">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 35%;">Xe giao dịch:</td>
            <td style="font-weight: bold; color: #1e293b;">${data.carName}</td>
          </tr>
          ${
            isApprove && data.contractNo
              ? `
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Số hợp đồng:</td>
            <td style="font-weight: bold; color: #10b981; font-family: monospace;">${data.contractNo}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Ghi chú từ Admin:</td>
            <td style="padding: 8px 0; color: #1e293b; font-style: italic;">"${data.adminNote || "Không có ghi chú thêm"}"</td>
          </tr>
        </table>
      </div>

      ${
        !isApprove
          ? `
      <div style="background-color: #fff1f0; border: 1px solid #ffa39e; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <p style="color: #cf1322; margin: 0; font-size: 14px;">
          <strong>Hành động:</strong> Vui lòng kiểm tra lại thông tin hồ sơ, cập nhật theo yêu cầu của Admin và gửi lại phê duyệt nếu cần thiết.
        </p>
      </div>
      `
          : `
      <p style="color: #10b981; font-weight: bold; text-align: center; margin-top: 20px;">
        Chúc mừng bạn đã hoàn tất giao dịch thành công!
      </p>
      `
      }

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assigned-tasks" 
           style="background-color: #1e293b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
           TRUY CẬP HỆ THỐNG
        </a>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © Hệ thống Toyota Bình Dương - Used Car Division
    </div>
  </div>
  `;
};

export const purchaseResultEmailTemplate2 = (data: {
  staffName: string;
  customerName: string;
  decision: "APPROVE" | "REJECT";
  reason?: string;
  stockCode?: string;
  carName: string;
  price: number;
}) => {
  const isApprove = data.decision === "APPROVE";
  const themeColor = isApprove ? "#f59e0b" : "#ef4444"; // Vàng cho Thu mua, Đỏ cho Từ chối
  const resultText = isApprove ? "ĐÃ ĐƯỢC DUYỆT NHẬP KHO" : "CẦN CHỈNH SỬA LẠI";
  const icon = isApprove ? "📥" : "⚠️";

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    <div style="background-color: ${themeColor}; padding: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Kết quả phê duyệt hồ sơ thu mua</p>
    </div>

    <div style="padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
        <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Hồ Sơ ${resultText}</h2>
      </div>

      <p style="color: #475569; font-size: 16px;">Chào <strong>${data.staffName}</strong>,</p>
      <p style="color: #475569; font-size: 16px;">Quản trị viên đã xem xét yêu cầu thu mua xe từ khách hàng <strong>${data.customerName.toUpperCase()}</strong>.</p>

      <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-top: 4px solid ${themeColor};">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 35%;">Mẫu xe:</td>
            <td style="font-weight: bold; color: #1e293b;">${data.carName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Giá thu mua:</td>
            <td style="font-weight: bold; color: #1e293b;">${new Intl.NumberFormat("vi-VN").format(data.price)} VNĐ</td>
          </tr>
          ${
            isApprove
              ? `
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Mã kho (Stock):</td>
            <td style="font-weight: bold; color: #f59e0b; font-family: monospace; font-size: 16px;">${data.stockCode}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Ghi chú Admin:</td>
            <td style="padding: 8px 0; color: #1e293b; font-style: italic;">"${data.reason || "Không có ghi chú thêm"}"</td>
          </tr>
        </table>
      </div>

      ${
        !isApprove
          ? `
      <div style="background-color: #fff1f0; border: 1px solid #ffa39e; padding: 15px; border-radius: 6px;">
        <p style="color: #cf1322; margin: 0; font-size: 14px;">
          <strong>Yêu cầu:</strong> Vui lòng kiểm tra lại Task "Sửa hồ sơ" trên hệ thống, hoàn thiện thông tin theo yêu cầu của Admin và gửi duyệt lại.
        </p>
      </div>
      `
          : `
      <p style="text-align: center; color: #475569; font-size: 14px;">Xe đã chính thức được ghi nhận vào kho với trạng thái <strong>ĐANG TÂN TRANG</strong>.</p>
      `
      }

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assigned-tasks" 
           style="background-color: #1e293b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
           XEM NHIỆM VỤ CỦA TÔI
        </a>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      Hệ thống CRM Toyota Bình Dương - Quản lý xe qua sử dụng
    </div>
  </div>
  `;
};

export const loseResultEmailTemplate = (data: {
  staffName: string;
  customerName: string;
  decision: "APPROVE" | "REJECT";
  adminNote?: string;
  targetStatus?: string;
}) => {
  const isApprove = data.decision === "APPROVE";
  const themeColor = isApprove ? "#475569" : "#f59e0b"; // Slate cho Đồng ý, Amber cho Từ chối
  const resultText = isApprove
    ? "ĐÃ ĐƯỢC CHẤP THUẬN DỪNG"
    : "KHÔNG ĐƯỢC DUYỆT DỪNG";
  const icon = isApprove ? "📁" : "🔄";

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    <div style="background-color: ${themeColor}; padding: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Thông báo kết quả duyệt dừng hồ sơ</p>
    </div>

    <div style="padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
        <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Hồ Sơ ${resultText}</h2>
      </div>

      <p style="color: #475569; font-size: 16px;">Chào <strong>${data.staffName}</strong>,</p>
      <p style="color: #475569; font-size: 16px;">Quản lý đã phản hồi yêu cầu dừng chăm sóc khách hàng <strong>${data.customerName.toUpperCase()}</strong> của bạn.</p>

      <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-top: 4px solid ${themeColor};">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 35%;">Khách hàng:</td>
            <td style="font-weight: bold; color: #1e293b;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Trạng thái hiện tại:</td>
            <td style="font-weight: bold; color: ${themeColor};">${isApprove ? data.targetStatus : "TIẾP TỤC CHĂM SÓC"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Phản hồi từ Admin:</td>
            <td style="padding: 8px 0; color: #1e293b; font-style: italic;">"${data.adminNote || (isApprove ? "Đồng ý đóng hồ sơ theo đề xuất." : "Cần khai thác thêm nhu cầu khách hàng.")}"</td>
          </tr>
        </table>
      </div>

      ${
        !isApprove
          ? `
      <div style="background-color: #fffbe6; border: 1px solid #ffe58f; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <p style="color: #d46b08; margin: 0; font-size: 14px;">
          <strong>Hành động:</strong> Một nhiệm vụ mới đã được tạo. Vui lòng kiểm tra lại danh sách "Nhiệm vụ của tôi" và tiếp tục tương tác với khách hàng này.
        </p>
      </div>
      `
          : `
      <p style="text-align: center; color: #64748b; font-size: 14px;">Hồ sơ đã được lưu trữ vào danh sách khách hàng ${data.targetStatus === "FROZEN" ? "tạm đóng" : "thất bại"}.</p>
      `
      }

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background-color: #1e293b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
           TRUY CẬP NHIỆM VỤ
        </a>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © Hệ thống CRM Toyota Bình Dương
    </div>
  </div>
  `;
};

export const unfreezeAssignmentEmailTemplate = (data: {
  staffName: string;
  customerName: string;
  customerPhone: string;
  unfreezeNote: string;
  typeLabel: string;
  branchName: string;
}) => {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #bae7ff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background-color: #0050b3; padding: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: #bae7ff; margin: 5px 0 0 0; font-size: 14px;">Thông báo rã băng hồ sơ khách hàng</p>
    </div>

    <div style="padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="background-color: #e6f7ff; color: #1890ff; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #91d5ff;">
          NHIỆM VỤ RÃ BĂNG
        </span>
        <h2 style="color: #1e293b; margin: 15px 0 5px 0;">Hồ Sơ Đã Được Kích Hoạt Lại</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">Ngày thực hiện: ${now}</p>
      </div>

      <p style="color: #475569; font-size: 16px;">Chào <strong>${data.staffName}</strong>,</p>
      <p style="color: #475569; font-size: 16px;">Quản lý đã thực hiện rã băng cho khách hàng <strong>${data.customerName.toUpperCase()}</strong> và phân bổ cho bạn trực tiếp xử lý.</p>

      <div style="margin: 20px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #1890ff;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 35%;">Khách hàng:</td>
            <td style="font-weight: bold; color: #1e293b;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Số điện thoại:</td>
            <td><a href="tel:${data.customerPhone}" style="color: #1890ff; font-weight: bold; text-decoration: none;">${data.customerPhone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Nghiệp vụ:</td>
            <td><span style="font-weight: bold;">${data.typeLabel}</span></td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; color: #64748b; vertical-align: top;">Chỉ đạo Admin:</td>
            <td style="padding: 10px 0 0 0; color: #1e293b; font-style: italic;">"${data.unfreezeNote}"</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fff7e6; border: 1px solid #ffd591; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <p style="color: #d46b08; margin: 0; font-size: 13px;">
          <strong>Lưu ý:</strong> Bạn có 120 phút để thực hiện cuộc gọi đầu tiên kể từ khi rã băng. Vui lòng cập nhật kết quả lên hệ thống để tránh bị tính LATE KPI.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background-color: #1e293b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
           BẮT ĐẦU XỬ LÝ NGAY
        </a>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      CRM Toyota Bình Dương - Used Car Division
    </div>
  </div>
  `;
};

export const purchaseResultEmailTemplate = (data: {
  staffName: string;
  customerName: string;
  decision: "APPROVE" | "REJECT";
  reason?: string;
  stockCode?: string;
  carName: string;
  price: number;
}) => {
  const isApprove = data.decision === "APPROVE";
  const themeColor = isApprove ? "#f59e0b" : "#ef4444"; // Vàng cho Thu mua, Đỏ cho Từ chối
  const resultText = isApprove ? "ĐÃ ĐƯỢC DUYỆT NHẬP KHO" : "CẦN CHỈNH SỬA LẠI";
  const icon = isApprove ? "📥" : "⚠️";

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <div style="background-color: ${themeColor}; padding: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Kết quả phê duyệt hồ sơ thu mua</p>
    </div>

    <div style="padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
        <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Hồ Sơ ${resultText}</h2>
      </div>

      <p style="color: #475569; font-size: 16px;">Chào <strong>${data.staffName}</strong>,</p>
      <p style="color: #475569; font-size: 16px;">Quản trị viên đã xem xét yêu cầu thu mua xe từ khách hàng <strong>${data.customerName.toUpperCase()}</strong>.</p>

      <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-top: 4px solid ${themeColor};">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 35%;">Mẫu xe:</td>
            <td style="font-weight: bold; color: #1e293b;">${data.carName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Giá thu mua:</td>
            <td style="font-weight: bold; color: #1e293b;">${new Intl.NumberFormat("vi-VN").format(data.price)} VNĐ</td>
          </tr>
          ${
            isApprove
              ? `
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Mã kho (Stock):</td>
            <td style="font-weight: bold; color: #f59e0b; font-family: monospace; font-size: 16px;">${data.stockCode}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Ghi chú Admin:</td>
            <td style="padding: 8px 0; color: #1e293b; font-style: italic;">"${data.reason || "Không có ghi chú thêm"}"</td>
          </tr>
        </table>
      </div>

      ${
        !isApprove
          ? `
      <div style="background-color: #fff1f0; border: 1px solid #ffa39e; padding: 15px; border-radius: 6px;">
        <p style="color: #cf1322; margin: 0; font-size: 14px;">
          <strong>Yêu cầu:</strong> Vui lòng kiểm tra lại Task "Sửa hồ sơ" trên hệ thống, hoàn thiện thông tin theo yêu cầu của Admin và gửi duyệt lại.
        </p>
      </div>
      `
          : `
      <p style="text-align: center; color: #475569; font-size: 14px;">Xe đã chính thức được ghi nhận vào kho với trạng thái <strong>ĐANG TÂN TRANG</strong>.</p>
      `
      }

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background-color: #1e293b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
           XEM NHIỆM VỤ CỦA TÔI
        </a>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      Hệ thống CRM Toyota Bình Dương - Quản lý xe qua sử dụng
    </div>
  </div>
  `;
};

export const saleApprovalRequestEmailTemplate = (data: {
  staffName: string;
  customerName: string;
  carName: string;
  stockCode: string;
  finalPrice: number;
  paymentMethod: string;
  contractNo: string; // THÊM TRƯỜNG NÀY
  note: string;
  branchName: string;
}) => {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background-color: #10b981; padding: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-transform: uppercase;">Toyota Bình Dương</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Yêu cầu phê duyệt chốt bán xe</p>
    </div>

    <div style="padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="background-color: #ecfdf5; color: #059669; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #d1fae5;">
          HỒ SƠ CHỜ DUYỆT
        </span>
        <h2 style="color: #1e293b; margin: 15px 0 5px 0;">Đề Nghị Chốt Bán Lẻ</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">Số HĐ: <strong>${data.contractNo}</strong></p>
      </div>

      <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 5px solid #10b981;">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Giá trị chốt (VNĐ):</div>
        <div style="font-size: 28px; color: #10b981; font-weight: bold; margin-bottom: 15px;">
          ${new Intl.NumberFormat("vi-VN").format(data.finalPrice)}
        </div>

        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; width: 35%;">Số hợp đồng:</td>
            <td style="font-weight: bold; color: #1e293b; font-family: monospace;">${data.contractNo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Khách hàng:</td>
            <td style="font-weight: bold; color: #1e293b;">${data.customerName.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Xe giao dịch:</td>
            <td style="color: #1e293b;">${data.carName} (<strong>${data.stockCode}</strong>)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Thanh toán:</td>
            <td style="color: #1e293b;">${data.paymentMethod}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/approvals" 
           style="background-color: #1e293b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
           XEM CHI TIẾT & PHÊ DUYỆT
        </a>
      </div>
    </div>
  </div>
  `;
};
