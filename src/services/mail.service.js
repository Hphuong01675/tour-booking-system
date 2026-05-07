const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true", // Chuyển string thành boolean
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false, // Giúp tránh lỗi chứng chỉ trên môi trường local
    },
});

const sendOTPEmail = async (toEmail, otp) => {
    const mailOptions = {
        from: `"Hệ thống đặt tour du lịch" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Mã OTP xác nhận đặt lại mật khẩu",
        html: `<h3>Mã xác thực của bạn là: <b style="color:red;">${otp}</b></h3>
               <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>`,
    };
    return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
