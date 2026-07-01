# 🌟 CHIP3CHIP - HỆ THỐNG ĐẶT TOUR DU LỊCH & QUẢN LÝ TOUR CAO CẤP 🌟

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
  <a href="https://sequelize.org/"><img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" alt="Sequelize" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://www.mysql.com/"><img src="https://img.shields.io/badge/MySQL-00758F?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" /></a>
</p>

---

## 🧭 GIỚI THIỆU DỰ ÁN

**Chip3Chip** là một nền tảng Web đặt tour du lịch và quản lý vận hành tour trực tuyến toàn diện, mang đến trải nghiệm mượt mà và chuyên nghiệp cho du khách cùng quy trình quản lý tối ưu cho các nhà điều hành. Hệ thống tích hợp các công nghệ hiện đại nhằm cung cấp một giải pháp tự động hóa từ khâu tìm kiếm, đặt chỗ, thanh toán, quản lý hướng dẫn viên cho đến hỗ trợ trực tuyến thời gian thực.

---

## ✨ TÍNH NĂNG NỔI BẬT THEO VAI TRÒ

### 👤 1. Khách Hàng (Customer Page)
* **Trang chủ Dynamic & Gợi ý thông minh**: Hiển thị danh sách các tour nổi bật, banner động mượt mà, phân trang và tìm kiếm theo thời gian thực.
* **Tìm kiếm & Lọc Nâng Cao**: Tìm kiếm tour theo điểm đến, phân loại danh mục, lọc theo khoảng giá, thời gian khởi hành và thời lượng tour.
* **Đặt Tour & Áp dụng Voucher**: Quy trình đặt tour nhanh chóng với việc tự động tính toán giá tiền sau khi áp dụng mã giảm giá.
* **Trang Cá Nhân & Lịch Sử Giao Dịch**: Theo dõi trạng thái các tour đã đặt, lịch sử thanh toán, và quản lý danh sách yêu thích (Wishlist).
* **Đánh Giá & Phản Hồi**: Gửi đánh giá tour kèm theo các tag trực quan từ những trải nghiệm thực tế.
* **Chat Trực Tiếp & Thông Báo**: Kênh chat trực tiếp thời gian thực với Hỗ trợ viên/Nhà vận hành.

### ⚙️ 2. Nhà Điều Hành (Operator)
* **Quản lý Tour Toàn Diện**: Tạo mới tour chi tiết (lịch trình từng ngày, danh mục thông tin, hình ảnh tour tải lên Cloudinary).
* **Điều Phối Hướng Dẫn Viên (Guide Assignment)**: Phân công hướng dẫn viên cho từng tour cụ thể dựa trên lịch trình hoạt động.
* **Quản Lý Thành Viên Tham Gia**: Theo dõi danh sách hành khách chi tiết cho từng chuyến đi, duyệt yêu cầu hủy tour và xử lý xác thực thông tin khách hàng.

### 🧭 3. Hướng Dẫn Viên (Tour Guide)
* **Xem Lịch Trình Phân Công**: Cập nhật danh sách các tour mình được giao phụ trách, ngày khởi hành và lộ trình cụ thể.
* **Quản Lý Checklist**: Sử dụng checklist chuẩn bị trước khi khởi hành và trong suốt chuyến đi để đảm bảo chất lượng dịch vụ.
* **Tương Tác Với Khách Hàng**: Xem danh sách thành viên trong đoàn để tiện việc liên lạc và hỗ trợ.

### 🛡️ 4. Quản Trị Viên (Admin Dashboard)
* **Thống Kê Doanh Thu & Hiệu Suất**: Biểu đồ trực quan hóa doanh số, số lượng đặt tour thành công, số lượng người dùng mới.
* **Quản Lý Tài Khoản**: Phân quyền các vai trò trong hệ thống (Admin, Operator, Guide, Customer).
* **Hệ Thống Voucher**: Tạo mới và phân phối các chiến dịch khuyến mãi, voucher giảm giá theo điều kiện mua sắm.

---

## 💻 CÔNG NGHỆ SỬ DỤNG

| **Frontend (Vite + React)** | **Backend (Express + Node.js)** | **Cơ sở dữ liệu & Dịch vụ** |
| :--- | :--- | :--- |
| • React 19 & React Router v7 | • Express JS (Babel Node) | • MySQL (Database chính) |
| • Redux Toolkit (State Management) | • Sequelize ORM (Quản lý Database) | • Cloudinary (Lưu trữ hình ảnh) |
| • Tailwind CSS v4 & PostCSS | • Socket.io (Chat thời gian thực) | • Nodemailer (Gửi mail OTP/Hóa đơn) |
| • Axios (HTTP Requests) | • JWT Authentication & BcryptJS | • Redis (Hỗ trợ Cache/OTP rate limit) |

---

## 📂 CẤU TRÚC THƯ MỤC CHÍNH

```text
tour-booking-system/
├── backend/                  # Mã nguồn server Node.js & Express
│   ├── src/
│   │   ├── config/           # Cấu hình Database, Cloudinary, Mailer...
│   │   ├── controllers/      # Bộ điều khiển xử lý logic nghiệp vụ
│   │   ├── middlewares/      # Middleware xác thực, phân quyền, giới hạn yêu cầu
│   │   ├── models/           # Định nghĩa các bảng Database bằng Sequelize (28+ tables)
│   │   ├── routes/           # Các endpoint API của hệ thống
│   │   └── server.js         # Điểm khởi chạy Backend server
│   └── .env.example          # Mẫu cấu hình biến môi trường backend
│
├── frontend/                 # Giao diện người dùng React & Vite
│   ├── src/
│   │   ├── components/       # Các UI Component dùng chung (Navbar, Footer, Modal...)
│   │   ├── pages/            # Các trang theo vai trò (Customer, Operator, Guide, Admin)
│   │   ├── redux/            # Quản lý Global State (Auth, Cart, UI...)
│   │   ├── App.jsx           # Cấu hình Routing chính của app
│   │   └── main.jsx          # Điểm khởi chạy React app
│   └── .env.example          # Mẫu cấu hình API URL cho frontend
```

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Chuẩn Bị Môi Trường
Đảm bảo máy tính của bạn đã cài đặt các phần mềm sau:
* **Node.js** (Khuyến nghị phiên bản 18.x trở lên)
* **MySQL Server**
* (Tùy chọn) **Redis Server** (cho tính năng lưu trữ cache OTP)

---

### 2. Cài Đặt Backend

1. Di chuyển vào thư mục backend và cài đặt thư viện:
   ```bash
   cd backend
   npm install
   ```

2. Tạo file cấu hình môi trường `.env`:
   * Sao chép file `.env.example` thành `.env`.
   * Cập nhật thông tin kết nối database MySQL của bạn:
     ```env
     PORT=8080
     DB_HOST=127.0.0.1
     DB_NAME=tour_booking
     DB_USERNAME=your_mysql_username
     DB_PASSWORD=your_mysql_password
     ```
   * Cập nhật cấu hình Cloudinary & Gmail SMTP để sử dụng đầy đủ chức năng gửi mail xác nhận và tải ảnh lên.

3. Khởi tạo cơ sở dữ liệu và dữ liệu mẫu:
   ```bash
   # Tạo database và chạy các migrations của Sequelize
   npx sequelize-cli db:migrate
   
   # Nạp dữ liệu mẫu (Seeding) nếu có cấu hình seed
   npx sequelize-cli db:seed:all
   ```

4. Khởi chạy server ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   * Server backend sẽ chạy tại: `http://localhost:8080`

---

### 3. Cài Đặt Frontend

1. Di chuyển vào thư mục frontend và cài đặt thư viện:
   ```bash
   cd ../frontend
   npm install
   ```

2. Cấu hình biến môi trường `.env`:
   * Sao chép file `.env.example` thành `.env`.
   * Đảm bảo API URL trỏ đúng về backend port (mặc định: `http://localhost:8080`).

3. Khởi chạy React App:
   ```bash
   npm run dev
   ```
   * Truy cập giao diện ứng dụng tại: `http://localhost:5173`

---

## 👥 THÀNH VIÊN THỰC HIỆN

<table align="center">
  <tr>
    <td align="center">
      <b>Phạm Trần Thiên Đăng</b><br>
      <sub>MSSV: 23110203</sub>
    </td>
    <td align="center">
      <b>Lê Vũ Hải</b><br>
      <sub>MSSV: 23110209</sub>
    </td>
    <td align="center">
      <b>Huỳnh Hoài Phương</b><br>
      <sub>MSSV: 23110289</sub>
    </td>
    <td align="center">
      <b>Lê Thị Thảo</b><br>
      <sub>MSSV: 23110321</sub>
    </td>
  </tr>
</table>

---

<p align="center">
  <i>Được phát triển với 💖 bởi đội ngũ Chip3Chip Team. Chúc bạn có những hành trình tuyệt vời! ✈️</i>
</p>

