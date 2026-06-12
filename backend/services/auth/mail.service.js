const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true", // false cho port 587 (STARTTLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false, // Tránh lỗi certificate trên môi trường local
    },
});

/**
 * Gửi OTP xác nhận quên mật khẩu
 * @param {string} toEmail - Email người nhận
 * @param {string} otp - Mã OTP 4 chữ số
 */
const sendForgotPasswordOTPEmail = async (toEmail, otp) => {
    const mailOptions = {
        from: `"GlobalExplore - Đặt tour du lịch" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "🔐 Mã OTP đặt lại mật khẩu - GlobalExplore",
        html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background: #003d9b; padding: 28px 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                    GlobalExplore
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
                    © 2024 GlobalExplore. Tất cả quyền được bảo lưu.
                </p>
            </div>
        </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendForgotPasswordOTPEmail };
