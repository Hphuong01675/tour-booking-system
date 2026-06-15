const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
const port = process.env.EMAIL_PORT || process.env.SMTP_PORT || 587;
const user = process.env.EMAIL_USER || process.env.SMTP_USER;
const pass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;

console.log('Cấu hình SMTP đọc được:');
console.log('Host:', host);
console.log('Port:', port);
console.log('User:', user);
console.log('Pass:', pass ? '****** (Đã nhập)' : '(Trống)');

if (!host || !user || !pass) {
  console.error('Lỗi: Thiếu thông tin cấu hình trong .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port: parseInt(port),
  secure: parseInt(port) === 465,
  auth: { user, pass },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('✗ Lỗi kết nối SMTP:', error.message);
  } else {
    console.log('✓ Kết nối SMTP thành công! Transporter đã sẵn sàng gửi thư.');
  }
});
