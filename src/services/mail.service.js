const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// 1. Template dùng chung để tránh viết lại code HTML
const otpEmailTemplate = (otp, firstName, title) => {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #003ec7; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TravelSync</h1>
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
            <h2 style="color: #1a1c1e; margin-top: 0;">Xin chào ${firstName || 'Quý khách'},</h2>
            <p style="color: #434656; line-height: 1.6; font-size: 16px;">
                ${title}. Vui lòng sử dụng mã xác thực dưới đây:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; padding: 15px 30px; background-color: #f3f3f6; border-radius: 8px; border: 2px dashed #003ec7;">
                    <span style="font-size: 32px; font-weight: bold; color: #003ec7; letter-spacing: 5px;">${otp}</span>
                </div>
                <p style="color: #737688; font-size: 12px; margin-top: 10px;">Mã này sẽ hết hạn trong vòng 5 phút.</p>
            </div>
            <p style="color: #434656; line-height: 1.6; font-size: 14px;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ hỗ trợ.
            </p>
        </div>
        <div style="background-color: #f9f9fc; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #737688; font-size: 12px; margin: 0;">
                © 2026 TravelSync Management. <br>
                Số 1 Võ Văn Ngân, Thủ Đức, TP. Hồ Chí Minh <br>
                Hotline: 1900 xxxx | Email: ${process.env.EMAIL_USER}
            </p>
        </div>
    </div>`;
};

// 2. Hàm gửi mail kích hoạt tài khoản (Lúc đăng ký)
const sendActivationOTPEmail = async (toEmail, otp, firstName) => {
    const mailOptions = {
        from: `"TravelSync Activation" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `[TravelSync] ${otp} là mã kích hoạt tài khoản của bạn`,
        html: otpEmailTemplate(otp, firstName, "Cảm ơn bạn đã lựa chọn TravelSync. Để hoàn tất kích hoạt tài khoản, hãy dùng mã này"),
    };
    return transporter.sendMail(mailOptions);
};

// 3. Hàm gửi mail đặt lại mật khẩu (Lúc quên mật khẩu)
const sendOTPEmail = async (toEmail, otp, firstName) => {
    const mailOptions = {
        from: `"TravelSync Security" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `[TravelSync] ${otp} là mã xác thực đặt lại mật khẩu`,
        html: otpEmailTemplate(otp, firstName, "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn"),
    };
    return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendActivationOTPEmail };