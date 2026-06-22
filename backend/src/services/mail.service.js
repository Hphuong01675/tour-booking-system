// Path: backend/src/services/mail.service.js
import nodemailer from 'nodemailer';
class MailService {
  constructor() {
    this.transporter = null;
    this.user = null;
  }

  getTransporter() {
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const port = process.env.EMAIL_PORT || process.env.SMTP_PORT || 587;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;
    this.user = user;

    if (this.transporter) return this.transporter;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: parseInt(port),
          secure: parseInt(port) === 465,
          auth: { user, pass },
        });
        console.log('[MAIL SERVICE] Nodemailer SMTP Transporter configured successfully.');
        return this.transporter;
      } catch (err) {
        console.error('[MAIL SERVICE] Failed to configure SMTP transporter:', err.message);
      }
    } else {
      console.warn('[MAIL SERVICE] SMTP credentials not set. Email functionality disabled.');
    }
    return null;
  }
  async sendOTP(email, otp) {
    const subject = 'Mã xác thực OTP - Chip3Chip';
    const text = `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`;

    // Professional HTML template
    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .email-wrapper {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #003d9b 0%, #0052cc 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 14px;
            opacity: 0.9;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 500;
          }
          .message {
            font-size: 14px;
            color: #555;
            line-height: 1.8;
            margin-bottom: 30px;
          }
          .otp-section {
            background: linear-gradient(135deg, #f0f4ff 0%, #eff1ff 100%);
            border-left: 4px solid #003d9b;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #666;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #003d9b;
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
            line-height: 1;
          }
          .expiration-notice {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #856404;
          }
          .expiration-notice strong {
            color: #d39e00;
            display: block;
            margin-bottom: 5px;
          }
          .security-notice {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #721c24;
          }
          .security-notice strong {
            display: block;
            margin-bottom: 5px;
          }
          .footer-section {
            border-top: 1px solid #eee;
            padding-top: 25px;
            margin-top: 30px;
          }
          .footer-text {
            font-size: 12px;
            color: #888;
            text-align: center;
            line-height: 1.6;
          }
          .footer-text a {
            color: #003d9b;
            text-decoration: none;
            font-weight: 600;
          }
          .footer-text a:hover {
            text-decoration: underline;
          }
          .divider {
            border-bottom: 1px solid #eee;
            margin: 15px 0;
          }
          .help-section {
            background-color: #f9f9f9;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #666;
          }
          .help-section strong {
            display: block;
            margin-bottom: 8px;
            color: #333;
          }
          .help-text {
            margin: 5px 0;
          }
          @media only screen and (max-width: 600px) {
            .container {
              padding: 10px;
            }
            .content {
              padding: 25px 15px;
            }
            .header h1 {
              font-size: 22px;
            }
            .otp-code {
              font-size: 28px;
              letter-spacing: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <!-- Header -->
            <div class="header">
              <h1>Chip3Chip</h1>
              <p>Nền tảng đặt tour du lịch số 1 tại Việt Nam</p>
            </div>

            <!-- Content -->
            <div class="content">
              <!-- Greeting -->
              <div class="greeting">
                Chào mừng bạn đến với Chip3Chip! 👋
              </div>

              <!-- Message -->
              <div class="message">
                Bạn vừa yêu cầu xác thực tài khoản Chip3Chip. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP (One-Time Password) dưới đây.
              </div>

              <!-- OTP Section -->
              <div class="otp-section">
                <div class="otp-label">📱 Mã xác thực của bạn</div>
                <div class="otp-code">${otp}</div>
              </div>

              <!-- Expiration Notice -->
              <div class="expiration-notice">
                <strong>⏰ Lưu ý thời hạn:</strong>
                Mã OTP này chỉ có hiệu lực trong <strong>5 phút</strong>. Sau thời gian này, bạn sẽ cần yêu cầu mã mới.
              </div>

              <!-- Security Notice -->
              <div class="security-notice">
                <strong>🔒 Nếu bạn không yêu cầu</strong>
                Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email này hoặc liên hệ với đội hỗ trợ của chúng tôi ngay lập tức.
              </div>

              <!-- How to use -->
              <div class="help-section">
                <strong>📝 Cách sử dụng mã OTP:</strong>
                <div class="help-text">1. Quay lại ứng dụng Chip3Chip hoặc trang web</div>
                <div class="help-text">2. Nhập mã OTP <strong>${otp}</strong> vào trường "Mã xác thực"</div>
                <div class="help-text">3. Nhấn nút "Xác nhận" để hoàn tất đăng ký</div>
              </div>

              <!-- Footer Section -->
              <div class="footer-section">
                <div class="footer-text">
                  <p>Đây là email tự động từ hệ thống Chip3Chip. Vui lòng không trả lời email này.</p>
                  <div class="divider"></div>
                  <p>
                    Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với 
                    <a href="mailto:support@chip3chip.vn">support@chip3chip.vn</a>
                  </p>
                  <p style="margin-top: 15px; font-size: 11px;">
                    © 2024 Chip3Chip. Tất cả quyền được bảo lưu.<br>
                    Địa chỉ: TP. Hồ Chí Minh, Việt Nam<br>
                    <a href="#">Chính sách bảo mật</a> | <a href="#">Điều khoản dịch vụ</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Print OTP to terminal console for development/fallback access
    console.log(`\n==================================================`);
    console.log(`[MAIL SERVICE] Mã OTP đăng ký của ${email} là: ${otp}`);
    console.log(`==================================================\n`);

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Chip3Chip" <${this.user}>`,
          to: email,
          subject,
          text,
          html,
        });
        return true;
      } catch (error) {
        console.error('[MAIL SERVICE] ✗ Lỗi khi gửi email SMTP:', error.message);
        return false;
      }
    }

    return true;
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(email, fullName) {
    const subject = 'Chào mừng bạn đến Chip3Chip!';

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .email-wrapper {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #003d9b 0%, #0052cc 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #003d9b;
            margin-bottom: 20px;
            font-weight: 700;
          }
          .message {
            font-size: 14px;
            color: #555;
            line-height: 1.8;
            margin-bottom: 20px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #fe6b00 0%, #a04100 100%);
            color: #ffffff;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 15px;
          }
          .footer-text {
            font-size: 12px;
            color: #888;
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>Chip3Chip</h1>
              <p>Khám phá thế giới theo cách của bạn</p>
            </div>
            <div class="content">
              <div class="greeting">
                Xin chào ${fullName}! 🎉
              </div>
              <div class="message">
                Chúc mừng bạn đã đăng ký thành công tài khoản Chip3Chip! 
                Tài khoản của bạn đã được kích hoạt và sẵn sàng sử dụng.
              </div>
              <div class="message">
                Bây giờ bạn có thể:
                <ul>
                  <li>Tìm kiếm và đặt tour du lịch theo sở thích của bạn</li>
                  <li>Lưu các tour yêu thích vào danh sách wishlist</li>
                  <li>Quản lý các đơn đặt tour của bạn</li>
                  <li>Nhận các ưu đãi đặc biệt dành riêng cho thành viên</li>
                </ul>
              </div>
              <div class="message">
                <strong>Bạn cần hỗ trợ?</strong> 
                Liên hệ với đội hỗ trợ khách hàng của chúng tôi bất cứ lúc nào tại support@chip3chip.vn
              </div>
              <div class="footer-text">
                © 2024 Chip3Chip. Tất cả quyền được bảo lưu.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Chip3Chip" <${this.user}>`,
          to: email,
          subject,
          html,
        });
        console.log(`[MAIL SERVICE] ✓ Welcome email sent to ${email}`);
        return true;
      } catch (error) {
        console.error('[MAIL SERVICE] ✗ Error sending welcome email:', error.message);
        return false;
      }
    }

  }

  /**
   * Send Forgot Password OTP
   */
  async sendForgotPasswordOTPEmail(toEmail, otp) {
    const subject = "🔐 Mã OTP đặt lại mật khẩu - Chip3Chip";
    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: #003d9b; padding: 28px 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                Chip3Chip
            </h1>
            <p style="color: #b2c5ff; margin: 4px 0 0; font-size: 13px;">Hệ thống đặt tour du lịch</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px; background: #ffffff; border: 1px solid #c3c6d6; border-top: none;">
            <h2 style="color: #191c1e; font-size: 20px; font-weight: 600; margin: 0 0 12px;">
                Khôi phục mật khẩu
            </h2>
            <p style="color: #434654; font-size: 15px; line-height: 24px; margin: 0 0 24px;">
                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này. 
                Vui lòng sử dụng mã OTP bên dưới để tiếp tục:
            </p>

            <!-- OTP Box -->
            <div style="background: #dae2ff; border-radius: 12px; padding: 24px 32px; text-align: center; margin: 0 0 24px;">
                <p style="color: #434654; font-size: 13px; margin: 0 0 10px; font-weight: 500;">
                    MÃ XÁC THỰC CỦA BẠN
                </p>
                <div style="font-size: 48px; font-weight: 700; color: #003d9b; letter-spacing: 16px; font-variant-numeric: tabular-nums;">
                    ${otp}
                </div>
            </div>

            <!-- Warning -->
            <div style="background: #fff8f3; border-left: 4px solid #fe6b00; border-radius: 4px; padding: 12px 16px; margin: 0 0 20px;">
                <p style="color: #434654; font-size: 14px; margin: 0; line-height: 20px;">
                    ⏱ Mã này chỉ có hiệu lực trong <strong style="color: #a04100;">5 phút</strong>. 
                    Vui lòng không chia sẻ mã này với bất kỳ ai.
                </p>
            </div>

            <p style="color: #737685; font-size: 13px; line-height: 20px; margin: 0;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và kiểm tra lại bảo mật tài khoản của bạn.
            </p>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 32px; background: #edeef0; border: 1px solid #c3c6d6; border-top: none; text-align: center;">
            <p style="color: #737685; font-size: 12px; margin: 0;">
                © 2024 Chip3Chip. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Chip3Chip" <${this.user}>`,
          to: toEmail,
          subject,
          html,
        });
        console.log(`[MAIL SERVICE] ✓ Forgot password OTP sent to ${toEmail}`);
        return true;
      } catch (error) {
        console.error('[MAIL SERVICE] ✗ Error sending forgot password email:', error.message);
        return false;
      }
    }
    return true;
  }

  async sendCancellationEmail(email, { tourTitle, departureDate, bookingCode, cancelledNames, refundAmount, reason }) {
    const subject = `Thông báo hủy chuyến đi và hoàn tiền - Booking ${bookingCode}`;
    const text = `Chúng tôi xin thông báo yêu cầu hủy chuyến đi cho mã đặt chỗ ${bookingCode} đã được xử lý thành công. Số tiền hoàn lại là ${refundAmount.toLocaleString('vi-VN')} đ.`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background-color: #003d9b; color: #fff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
          .content { padding: 20px; line-height: 1.6; }
          .highlight { font-weight: bold; color: #003d9b; }
          .footer { text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Thông Báo Hủy Chuyến & Hoàn Tiền</h2>
          </div>
          <div class="content">
            <p>Xin chào quý khách,</p>
            <p>Hệ thống Chip3Chip xin thông báo yêu cầu hủy chuyến đi của quý khách đã được thực hiện thành công bởi điều hành viên.</p>
            <h3>Thông tin chi tiết:</h3>
            <ul>
              <li><strong>Mã đặt chỗ:</strong> ${bookingCode}</li>
              <li><strong>Tên Tour:</strong> ${tourTitle}</li>
              <li><strong>Ngày khởi hành:</strong> ${departureDate}</li>
              <li><strong>Danh sách hành khách hủy:</strong> ${cancelledNames.join(', ')}</li>
              <li><strong>Lý do hủy:</strong> ${reason}</li>
              <li><strong>Số tiền hoàn lại:</strong> <span class="highlight">${refundAmount.toLocaleString('vi-VN')} đ</span></li>
            </ul>
            <p>Số tiền hoàn trả sẽ được chuyển vào tài khoản thanh toán của quý khách trong vòng 3-5 ngày làm việc theo chính sách hoàn tiền.</p>
            <p>Nếu có bất kỳ thắc mắc nào, quý khách vui lòng liên hệ với bộ phận hỗ trợ qua email <a href="mailto:support@chip3chip.vn">support@chip3chip.vn</a>.</p>
          </div>
          <div class="footer">
            <p>© 2024 Chip3Chip. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`\n==================================================`);
    console.log(`[MAIL SERVICE] Gửi email thông báo hủy/hoàn tiền tới ${email}`);
    console.log(`Mã booking: ${bookingCode}, Hoàn tiền: ${refundAmount.toLocaleString('vi-VN')} đ`);
    console.log(`==================================================\n`);

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Chip3Chip" <${this.user}>`,
          to: email,
          subject,
          text,
          html,
        });
        return true;
      } catch (error) {
        console.error('[MAIL SERVICE] ✗ Lỗi khi gửi email SMTP thông báo hủy:', error.message);
        return false;
      }
    }
    return true;
  }
}

export default new MailService();
