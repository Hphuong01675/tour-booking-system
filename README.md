# Hệ thống đặt tour du lịch

Backend API và một client React mới cho chức năng hồ sơ người dùng.

## Chạy backend
1. Tạo file .env theo mẫu .env.example.
2. 
pm install
3. 
pm run dev

## Chạy frontend
1. cd client
2. 
pm install
3. 
pm run dev

## Ghi chú
- Frontend sẽ proxy tới http://localhost:5000/api.
- Dán JWT token vào phần token để tải và cập nhật hồ sơ người dùng.
- Nếu không muốn dùng MySQL, backend sẽ tự động dùng SQLite khi không có biến môi trường DB_NAME.
