-- Demo data for project presentation.
-- Run with: mysql -u root -p < backend/src/seed/demo_report_seed.sql
-- All seeded accounts use password: 123456

USE tour_booking_db;

SET NAMES utf8mb4;
SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Cleanup only the deterministic demo data, then insert it again.
-- ---------------------------------------------------------------------------
DELETE FROM review_details WHERE review_id IN ('d0000000-0000-0000-0000-000000000001');
DELETE FROM reviews WHERE id IN ('d0000000-0000-0000-0000-000000000001');
DELETE FROM payments WHERE id LIKE '90000000-0000-0000-0000-0000000000%';
DELETE FROM participants WHERE id LIKE '80000000-0000-0000-0000-0000000000%';
DELETE FROM bookings WHERE id LIKE '70000000-0000-0000-0000-0000000000%';
DELETE FROM messages WHERE conversation_id LIKE 'a0000000-0000-0000-0000-0000000000%';
DELETE FROM conversations WHERE id LIKE 'a0000000-0000-0000-0000-0000000000%';
DELETE FROM notifications WHERE id LIKE 'f0000000-0000-0000-0000-0000000000%';
DELETE FROM voucher_targets WHERE voucher_id IN ('b0000000-0000-0000-0000-000000000001');
DELETE FROM vouchers WHERE id IN ('b0000000-0000-0000-0000-000000000001');
DELETE FROM schedule_checklist_items WHERE checklist_id LIKE 'c0000000-0000-0000-0000-0000000000%';
DELETE FROM schedule_checklists WHERE id LIKE 'c0000000-0000-0000-0000-0000000000%';
DELETE FROM checklist_template_items WHERE template_id LIKE 'c1000000-0000-0000-0000-0000000000%';
DELETE FROM checklist_templates WHERE id LIKE 'c1000000-0000-0000-0000-0000000000%';
DELETE FROM tour_assignments WHERE id LIKE '60000000-0000-0000-0000-0000000000%';
DELETE FROM tour_itinerary_items WHERE itinerary_day_id LIKE '41000000-0000-0000-0000-0000000000%';
DELETE FROM tour_itinerary_locations WHERE itinerary_day_id LIKE '41000000-0000-0000-0000-0000000000%';
DELETE FROM tour_itinerary_days WHERE id LIKE '41000000-0000-0000-0000-0000000000%';
DELETE FROM tour_images WHERE tour_id LIKE '40000000-0000-0000-0000-0000000000%';
DELETE FROM tour_information WHERE tour_id LIKE '40000000-0000-0000-0000-0000000000%';
DELETE FROM tour_schedules WHERE id LIKE '50000000-0000-0000-0000-0000000000%';
DELETE FROM tours WHERE id LIKE '40000000-0000-0000-0000-0000000000%';
DELETE FROM packing_items
WHERE id LIKE '30000000-0000-0000-0000-0000000000%'
   OR (is_system = 1 AND title IN (
    'Căn cước công dân / CMND', 'Hộ chiếu (Passport)', 'Giấy khai sinh', 'Giấy phép lái xe',
    'Tiền mặt', 'Thẻ ATM / Thẻ tín dụng', 'Ví chống nước nhỏ',
    'Quần áo mặc hàng ngày', 'Áo khoác mỏng / Áo gió', 'Đồ bơi', 'Giày đi bộ / Giày thể thao',
    'Bàn chải & Kem đánh răng', 'Khăn mặt / Khăn tắm mini', 'Kem chống nắng', 'Sữa tắm / Dầu gội',
    'Điện thoại di động', 'Sạc dự phòng', 'Củ sạc & Cáp sạc', 'Túi chống nước điện thoại',
    'Thuốc say tàu xe', 'Thuốc tiêu hóa / Đau bụng', 'Thuốc chống muỗi / Côn trùng',
    'Băng gâu (Urgo) & Thuốc sát trùng',
    'Kính râm & Mũ rộng vành', 'Ô (Dù) / Áo mưa mỏng', 'Gối chữ U & Bịt mắt',
    'Bình nước cá nhân', 'Đồ ăn nhẹ', 'Kẹo cao su / Kẹo ngậm'
   ));
DELETE FROM tour_information_categories WHERE id LIKE '20000000-0000-0000-0000-0000000000%';
DELETE FROM users
WHERE id LIKE '10000000-0000-0000-0000-0000000000%'
   OR email IN (
    '23110321@student.hcmute.edu.vn',
    '23110209@student.hcmute.edu.vn',
    'phoai4355@gmail.com',
    '23110289@student.hcmute.edu.vn',
    '23110321.operator@student.hcmute.edu.vn'
   );

-- ---------------------------------------------------------------------------
-- Users: admin, operator, guide, and two customers.
-- NOTE: users.email is unique. The operator account uses a distinct email.
-- ---------------------------------------------------------------------------
INSERT INTO users
(id, full_name, email, password_hash, phone, date_of_birth, address, avatar_url, role, is_active, created_at)
VALUES
('10000000-0000-0000-0000-000000000001', 'Nguyễn Minh Quản Trị', '23110321@student.hcmute.edu.vn', '$2b$10$i6IG6nOyTw.EbirDult.4enmSBZ.Y9y6aQZer/L94yAiCwv0b34na', '0901000001', '2003-03-21', 'Ký túc xá HCMUTE, TP. Thủ Đức', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&h=240&fit=crop', 'admin', 1, NOW()),
('10000000-0000-0000-0000-000000000002', 'Trần Hoàng Điều Hành', '23110321.operator@student.hcmute.edu.vn', '$2b$10$i6IG6nOyTw.EbirDult.4enmSBZ.Y9y6aQZer/L94yAiCwv0b34na', '0901000002', '2002-09-21', 'Quận 1, TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=240&h=240&fit=crop', 'operator', 1, NOW()),
('10000000-0000-0000-0000-000000000003', 'Lê Anh Hướng Dẫn', '23110289@student.hcmute.edu.vn', '$2b$10$i6IG6nOyTw.EbirDult.4enmSBZ.Y9y6aQZer/L94yAiCwv0b34na', '0901000003', '1996-12-08', 'Đà Lạt, Lâm Đồng', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop', 'guide', 1, NOW()),
('10000000-0000-0000-0000-000000000004', 'Phạm Ngọc Khách Hàng', '23110209@student.hcmute.edu.vn', '$2b$10$i6IG6nOyTw.EbirDult.4enmSBZ.Y9y6aQZer/L94yAiCwv0b34na', '0901000004', '2003-02-09', 'TP. Thủ Đức, TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop', 'customer', 1, NOW()),
('10000000-0000-0000-0000-000000000005', 'Phạm Hoài Phương', 'phoai4355@gmail.com', '$2b$10$i6IG6nOyTw.EbirDult.4enmSBZ.Y9y6aQZer/L94yAiCwv0b34na', '0901000005', '1999-04-16', 'Biên Hòa, Đồng Nai', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&h=240&fit=crop', 'customer', 1, NOW());

-- ---------------------------------------------------------------------------
-- Tour information categories.
-- ---------------------------------------------------------------------------
INSERT INTO tour_information_categories
(id, code, title, icon, sort_order, is_active, created_at, updated_at)
VALUES
('20000000-0000-0000-0000-000000000001', 'included', 'Dịch vụ bao gồm', 'check_circle', 1, 1, NOW(), NOW()),
('20000000-0000-0000-0000-000000000002', 'not_included', 'Dịch vụ không bao gồm', 'cancel', 2, 1, NOW(), NOW()),
('20000000-0000-0000-0000-000000000003', 'requirements', 'Điều kiện bắt buộc', 'assignment_late', 3, 1, NOW(), NOW()),
('20000000-0000-0000-0000-000000000004', 'transportation', 'Phương tiện di chuyển', 'directions_bus', 4, 1, NOW(), NOW()),
('20000000-0000-0000-0000-000000000005', 'accommodation', 'Lưu trú', 'hotel', 5, 1, NOW(), NOW()),
('20000000-0000-0000-0000-000000000006', 'attractions', 'Điểm tham quan', 'map', 6, 1, NOW(), NOW()),
('20000000-0000-0000-0000-000000000007', 'cuisine', 'Ẩm thực', 'restaurant', 7, 1, NOW(), NOW()),
('20000000-0000-0000-0000-000000000008', 'promotion', 'Ưu đãi', 'local_activity', 8, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
title = VALUES(title),
icon = VALUES(icon),
sort_order = VALUES(sort_order),
is_active = VALUES(is_active),
updated_at = NOW();

SET @cat_included = (SELECT id FROM tour_information_categories WHERE code = 'included' LIMIT 1);
SET @cat_not_included = (SELECT id FROM tour_information_categories WHERE code = 'not_included' LIMIT 1);
SET @cat_requirements = (SELECT id FROM tour_information_categories WHERE code = 'requirements' LIMIT 1);
SET @cat_cuisine = (SELECT id FROM tour_information_categories WHERE code = 'cuisine' LIMIT 1);

-- ---------------------------------------------------------------------------
-- Packing items requested by the user.
-- ---------------------------------------------------------------------------
INSERT INTO packing_items (id, category, title, content, is_system, created_by, created_at) VALUES
('30000000-0000-0000-0000-000000000001', 'DOCUMENT', 'Căn cước công dân / CMND', 'Mang theo bản gốc và 1-2 bản photo dự phòng', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000002', 'DOCUMENT', 'Hộ chiếu (Passport)', 'Bắt buộc nếu đi nước ngoài, kiểm tra hạn phải còn trên 6 tháng', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000003', 'DOCUMENT', 'Giấy khai sinh', 'Bản sao trích lục dành cho trẻ em dưới 14 tuổi đi cùng', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000004', 'DOCUMENT', 'Giấy phép lái xe', 'Cần thiết nếu có kế hoạch thuê xe tự lái tại điểm du lịch', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000005', 'FINANCE', 'Tiền mặt', 'Nên mang theo một lượng tiền mặt lẻ vừa đủ để mua sắm lặt vặt', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000006', 'FINANCE', 'Thẻ ATM / Thẻ tín dụng', 'Nên có 1 thẻ Visa/Mastercard dự phòng để thanh toán tại các điểm lớn', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000007', 'FINANCE', 'Ví chống nước nhỏ', 'Bảo quản tiền và các giấy tờ quan trọng khi đi biển hoặc các tour sông nước', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000008', 'CLOTHING', 'Quần áo mặc hàng ngày', 'Chất liệu thoáng mát, thấm hút mồ hôi. Tính đủ số lượng theo số ngày lưu trú', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000009', 'CLOTHING', 'Áo khoác mỏng / Áo gió', 'Dùng để chống nắng hoặc mặc khi trời se lạnh, trên xe điều hòa', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000010', 'CLOTHING', 'Đồ bơi', 'Mang theo ít nhất 1-2 bộ nếu lịch trình có tắm biển, hồ bơi', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000011', 'CLOTHING', 'Giày đi bộ / Giày thể thao', 'Nên mang đôi giày đã đi quen để tránh đau chân, xước gót khi di chuyển nhiều', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000012', 'PERSONAL_CARE', 'Bàn chải & Kem đánh răng', 'Nên mang đồ cá nhân dù khách sạn thường có sẵn để hợp vệ sinh', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000013', 'PERSONAL_CARE', 'Khăn mặt / Khăn tắm mini', 'Mang theo dạng nén hoặc khăn mỏng nhẹ để lau mồ hôi khi tham quan', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000014', 'PERSONAL_CARE', 'Kem chống nắng', 'Rất quan trọng để bảo vệ da, chọn loại có chỉ số SPF 50+ chống nước', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000015', 'PERSONAL_CARE', 'Sữa tắm / Dầu gội', 'Tiết kiệm diện tích vali bằng cách mang các chai chiết nhỏ', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000016', 'ELECTRONICS', 'Điện thoại di động', 'Hãy chắc chắn đã cài đặt sẵn các ứng dụng dịch thuật, bản đồ offline nếu đi xa', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000017', 'ELECTRONICS', 'Sạc dự phòng', 'Dung lượng từ 10.000mAh trở lên để đủ năng lượng sử dụng máy ảnh cả ngày', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000018', 'ELECTRONICS', 'Củ sạc & Cáp sạc', 'Nên mang theo củ sạc có từ 2-3 cổng USB để sạc được nhiều thiết bị', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000019', 'ELECTRONICS', 'Túi chống nước điện thoại', 'Cực kỳ cần thiết cho các hoạt động vui chơi lặn biển, công viên nước', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000020', 'HEALTH', 'Thuốc say tàu xe', 'Nhớ uống trước 30-45 phút trước khi lên xe/máy bay, dán miếng dán chống say', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000021', 'HEALTH', 'Thuốc tiêu hóa / Đau bụng', 'Đề phòng khi ăn đồ hải sản, thức ăn lạ không hợp bụng', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000022', 'HEALTH', 'Thuốc chống muỗi / Côn trùng', 'Cần mang theo chai xịt muỗi khi đi tour rừng núi, cắm trại ban đêm', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000023', 'HEALTH', 'Băng gâu (Urgo) & Thuốc sát trùng', 'Xử lý ngay các vết trầy xước nhỏ ngoài da khi leo trèo, tham quan', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000024', 'EQUIPMENT', 'Kính râm & Mũ rộng vành', 'Bảo vệ mắt và đầu khỏi ánh nắng gắt nhiệt đới', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000025', 'EQUIPMENT', 'Ô (Dù) / Áo mưa mỏng', 'Phòng trường hợp thời tiết thay đổi bất chợt có mưa rào', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000026', 'EQUIPMENT', 'Gối chữ U & Bịt mắt', 'Giúp nghỉ ngơi, chợp mắt lấy lại sức trên những chuyến xe khách đường dài', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000027', 'FOOD_DRINK', 'Bình nước cá nhân', 'Nên mang bình nước giữ nhiệt nhỏ gọn, vừa bảo vệ môi trường vừa bù nước nhanh', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000028', 'FOOD_DRINK', 'Đồ ăn nhẹ', 'Bánh quy, xúc xích, lương khô... để nạp năng lượng nhanh giữa các chặng đi bộ', 1, NULL, NOW()),
('30000000-0000-0000-0000-000000000029', 'FOOD_DRINK', 'Kẹo cao su / Kẹo ngậm', 'Giảm tình trạng ù tai khi máy bay cất cánh hoặc làm thơm miệng, giữ tỉnh táo', 1, NULL, NOW());

-- ---------------------------------------------------------------------------
-- Tours for every important lifecycle state.
-- ---------------------------------------------------------------------------
INSERT INTO tours
(id, created_by, tour_code, title, slug, description, highlights, departure_location, destination, difficulty, status, duration_days, duration_nights, base_price, thumbnail_url, is_published, created_at, updated_at)
VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'DEMO-DRAFT-001', 'Bản nháp khám phá Cần Giờ cuối tuần', 'demo-ban-nhap-can-gio-cuoi-tuan', 'Tour nháp để operator kiểm tra chức năng tạo và chỉnh sửa tour.', 'Rừng ngập mặn, hải sản, lịch trình nhẹ trong ngày.', 'TP. Hồ Chí Minh', 'Cần Giờ', 'normal', 'draft', 1, 0, 690000.00, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=600&fit=crop', 0, NOW(), NOW()),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'DEMO-PENDING-001', 'Tour gia đình Phú Quốc chờ duyệt', 'demo-phu-quoc-cho-duyet', 'Tour đang gửi admin duyệt, dùng để test trạng thái pending.', 'Resort biển, Safari, Grand World, lịch trình phù hợp gia đình.', 'TP. Hồ Chí Minh', 'Phú Quốc', 'normal', 'pending', 4, 3, 7590000.00, 'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=900&h=600&fit=crop', 0, NOW(), NOW()),
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'DEMO-UPCOMING-001', 'Trekking Tà Năng - Phan Dũng sắp vận hành', 'demo-trekking-ta-nang-phan-dung', 'Tour hard đã duyệt nhưng chưa mở đăng ký, dùng để test chuẩn bị vận hành.', 'Cung trekking nổi tiếng, cắm trại, yêu cầu thể lực tốt.', 'TP. Hồ Chí Minh', 'Lâm Đồng - Bình Thuận', 'hard', 'upcoming', 3, 2, 4290000.00, 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&h=600&fit=crop', 1, NOW(), NOW()),
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'DEMO-CANCEL-001', 'Đà Lạt mùa hoa đã hủy', 'demo-da-lat-mua-hoa-da-huy', 'Tour đã hủy để test trạng thái cancelled và thông báo thay đổi tour.', 'Săn mây, vườn hoa, cà phê view đồi.', 'TP. Hồ Chí Minh', 'Đà Lạt', 'normal', 'cancelled', 3, 2, 2990000.00, 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&h=600&fit=crop', 0, NOW(), NOW()),
('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'DEMO-OPEN-NORMAL', 'Đà Nẵng - Hội An đang đăng ký', 'demo-da-nang-hoi-an-dang-dang-ky', 'Tour normal đang mở bán, có booking mẫu để customer và operator kiểm tra.', 'Bà Nà Hills, phố cổ Hội An, biển Mỹ Khê.', 'TP. Hồ Chí Minh', 'Đà Nẵng - Hội An', 'normal', 'open', 3, 2, 3590000.00, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&h=600&fit=crop', 1, NOW(), NOW()),
('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'DEMO-OPEN-HARD', 'Fansipan hard tour đang đăng ký', 'demo-fansipan-hard-dang-dang-ky', 'Tour hard đang mở đăng ký, dùng để test CCCD, duyệt hồ sơ và guide checklist.', 'Trekking, cáp treo chiều xuống, yêu cầu CCCD người lớn.', 'Hà Nội', 'Sa Pa - Fansipan', 'hard', 'open', 2, 1, 4690000.00, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&h=600&fit=crop', 1, NOW(), NOW()),
('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'DEMO-CLOSED-001', 'Nha Trang - Phú Yên đã đóng đăng ký', 'demo-nha-trang-phu-yen-da-dong-dang-ky', 'Tour đã đóng đăng ký, có booking đã thanh toán để customer xem lịch sử.', 'Biển xanh, Gành Đá Đĩa, ẩm thực Phú Yên.', 'TP. Hồ Chí Minh', 'Nha Trang - Phú Yên', 'normal', 'closed', 3, 2, 3290000.00, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=600&fit=crop', 1, NOW(), NOW());

INSERT INTO tour_schedules
(id, tour_id, schedule_code, departure_date, return_date, price, max_capacity, registered, status, created_at)
VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'SCH-DEMO-DRAFT', '2026-08-02 07:00:00', '2026-08-02 18:00:00', 690000.00, 20, 0, 'open', NOW()),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'SCH-DEMO-PENDING', '2026-08-15 06:00:00', '2026-08-18 20:00:00', 7590000.00, 30, 0, 'open', NOW()),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'SCH-DEMO-UPCOMING', '2026-09-05 05:30:00', '2026-09-07 22:00:00', 4290000.00, 18, 0, 'open', NOW()),
('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', 'SCH-DEMO-CANCEL', '2026-07-20 06:00:00', '2026-07-22 21:00:00', 2990000.00, 35, 0, 'cancelled', NOW()),
('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', 'SCH-DEMO-OPEN-NORMAL', '2026-08-09 06:30:00', '2026-08-11 21:00:00', 3590000.00, 40, 3, 'open', NOW()),
('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', 'SCH-DEMO-OPEN-HARD', '2026-08-22 05:00:00', '2026-08-23 22:30:00', 4690000.00, 16, 1, 'open', NOW()),
('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', 'SCH-DEMO-CLOSED', '2026-07-12 06:00:00', '2026-07-14 22:00:00', 3290000.00, 35, 32, 'closed', NOW());

INSERT INTO tour_assignments (id, schedule_id, guide_id, assigned_by, assigned_at)
VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', NOW());

INSERT INTO tour_information
(id, tour_id, category_id, content, sort_order, created_at, updated_at)
VALUES
('42000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', @cat_included, 'Xe du lịch đời mới, khách sạn 3 sao, vé tham quan Bà Nà Hills, bảo hiểm du lịch, hướng dẫn viên theo đoàn.', 1, NOW(), NOW()),
('42000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000005', @cat_not_included, 'Chi phí cá nhân, giặt ủi, minibar, phụ thu phòng đơn và các dịch vụ ngoài chương trình.', 2, NOW(), NOW()),
('42000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', @cat_requirements, 'Người lớn bắt buộc có CCCD hai mặt. Khách cần có sức khỏe tốt, không mắc bệnh tim mạch hoặc huyết áp nặng.', 1, NOW(), NOW()),
('42000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000006', @cat_included, 'Xe đưa đón Hà Nội - Sa Pa, porter, lều trại, bữa ăn theo lịch trình, bộ sơ cứu và bảo hiểm du lịch.', 2, NOW(), NOW()),
('42000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000007', @cat_cuisine, 'Đặc sản cơm gà Phú Yên, hải sản Nha Trang và bữa tối gala nhỏ cho đoàn.', 1, NOW(), NOW());

INSERT INTO tour_images (id, tour_id, image_url, sort_order)
VALUES
('43000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&h=800&fit=crop', 1),
('43000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop', 2),
('43000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=800&fit=crop', 1),
('43000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop', 1);

INSERT INTO tour_itinerary_days
(id, tour_id, day_number, title, meals, main_activity, description, image_url)
VALUES
('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 1, 'Đà Nẵng - Bà Nà Hills', 'Sáng, Trưa, Tối', 'Tham quan Bà Nà Hills', 'Đón khách tại sân bay, tham quan Bà Nà Hills và Cầu Vàng.', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&h=600&fit=crop'),
('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000005', 2, 'Hội An - Mỹ Khê', 'Sáng, Trưa', 'Phố cổ và biển', 'Dạo phố cổ Hội An, tự do tắm biển Mỹ Khê.', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&h=600&fit=crop'),
('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', 1, 'Sa Pa - Trạm Tôn - Lán nghỉ', 'Sáng, Trưa, Tối', 'Trekking vào rừng', 'Kiểm tra thể lực, phổ biến an toàn và trekking đến lán nghỉ.', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&h=600&fit=crop'),
('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000006', 2, 'Chinh phục Fansipan', 'Sáng, Trưa', 'Lên đỉnh Fansipan', 'Chinh phục đỉnh Fansipan, nhận huy chương và trở về Sa Pa.', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&h=600&fit=crop');

INSERT INTO tour_itinerary_locations
(id, itinerary_day_id, name, description, latitude, longitude, image_url, visit_order)
VALUES
('44000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', 'Cầu Vàng', 'Biểu tượng du lịch Đà Nẵng tại Bà Nà Hills.', 15.99500000, 107.99600000, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&h=600&fit=crop', 1),
('44000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000002', 'Phố cổ Hội An', 'Không gian di sản, đèn lồng và ẩm thực miền Trung.', 15.88010000, 108.33800000, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&h=600&fit=crop', 1),
('44000000-0000-0000-0000-000000000003', '41000000-0000-0000-0000-000000000003', 'Trạm Tôn', 'Điểm xuất phát cung trekking Fansipan.', 22.33330000, 103.78330000, 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&h=600&fit=crop', 1);

INSERT INTO tour_itinerary_items
(id, itinerary_day_id, title, description, activity_time, sort_order)
VALUES
('45000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', 'Đón khách', 'HDV đón đoàn tại sân bay Đà Nẵng.', '07:30:00', 1),
('45000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000001', 'Tham quan Cầu Vàng', 'Di chuyển cáp treo và check-in Cầu Vàng.', '10:00:00', 2),
('45000000-0000-0000-0000-000000000003', '41000000-0000-0000-0000-000000000003', 'Kiểm tra trang bị', 'HDV kiểm tra giày, áo mưa, nước và giấy tờ.', '06:00:00', 1),
('45000000-0000-0000-0000-000000000004', '41000000-0000-0000-0000-000000000004', 'Lên đỉnh Fansipan', 'Đoàn xuất phát sớm để kịp thời tiết đẹp.', '05:30:00', 1);

-- ---------------------------------------------------------------------------
-- Customer demo bookings: each customer has one open-registration booking and
-- one closed-registration booking.
-- ---------------------------------------------------------------------------
INSERT INTO bookings
(id, customer_id, schedule_id, booking_code, status, total_price, discount_amount, final_price, voucher_id, cancellation_reason, refund_amount, booked_at, updated_at)
VALUES
('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000005', 'BKG-DEMO-001', 'paid', 10770000.00, 500000.00, 10270000.00, NULL, NULL, NULL, NOW() - INTERVAL 2 DAY, NOW()),
('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000007', 'BKG-DEMO-002', 'paid', 3290000.00, 0.00, 3290000.00, NULL, NULL, NULL, NOW() - INTERVAL 25 DAY, NOW()),
('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000006', 'BKG-DEMO-003', 'pending_approval', 4690000.00, 0.00, 4690000.00, NULL, NULL, NULL, NOW() - INTERVAL 1 DAY, NOW()),
('70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000007', 'BKG-DEMO-004', 'paid', 6580000.00, 300000.00, 6280000.00, NULL, NULL, NULL, NOW() - INTERVAL 18 DAY, NOW()),
('70000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000007', 'BKG-DEMO-005', 'paid', 16450000.00, 0.00, 16450000.00, NULL, NULL, NULL, NOW() - INTERVAL 17 DAY, NOW()),
('70000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000007', 'BKG-DEMO-006', 'paid', 16450000.00, 0.00, 16450000.00, NULL, NULL, NULL, NOW() - INTERVAL 17 DAY, NOW()),
('70000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000007', 'BKG-DEMO-007', 'paid', 13160000.00, 0.00, 13160000.00, NULL, NULL, NULL, NOW() - INTERVAL 16 DAY, NOW()),
('70000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000007', 'BKG-DEMO-008', 'paid', 13160000.00, 0.00, 13160000.00, NULL, NULL, NULL, NOW() - INTERVAL 16 DAY, NOW()),
('70000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000007', 'BKG-DEMO-009', 'paid', 13160000.00, 0.00, 13160000.00, NULL, NULL, NULL, NOW() - INTERVAL 15 DAY, NOW());

INSERT INTO participants
(id, booking_id, full_name, date_of_birth, participant_type, address, is_lead, cccd_front_url, cccd_back_url, checkin_code, checkin_at, phone, status)
VALUES
('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Phạm Ngọc Khách Hàng', '2003-02-09', 'adult', 'TP. Thủ Đức, TP. Hồ Chí Minh', 1, NULL, NULL, 'CHK-DEMO-001', NULL, '0901000004', 'active'),
('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Nguyễn Minh Anh', '2005-06-12', 'adult', 'Quận Bình Thạnh, TP. Hồ Chí Minh', 0, NULL, NULL, 'CHK-DEMO-002', NULL, '0901000012', 'active'),
('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'Nguyễn Gia Bảo', '2016-05-20', 'child', 'Quận Bình Thạnh, TP. Hồ Chí Minh', 0, NULL, NULL, 'CHK-DEMO-003', NULL, '0901000013', 'active'),
('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', 'Phạm Hoài Phương', '1999-04-16', 'adult', 'Biên Hòa, Đồng Nai', 1, NULL, NULL, 'CHK-DEMO-004', NULL, '0901000005', 'active');

INSERT INTO participants
(id, booking_id, full_name, date_of_birth, participant_type, address, is_lead, cccd_front_url, cccd_back_url, checkin_code, checkin_at, phone, status)
SELECT
  CONCAT('80000000-0000-0000-0000-000000000', LPAD(n, 3, '0')),
  CASE
    WHEN n BETWEEN 5 AND 9 THEN '70000000-0000-0000-0000-000000000002'
    WHEN n BETWEEN 10 AND 14 THEN '70000000-0000-0000-0000-000000000004'
    WHEN n BETWEEN 15 AND 19 THEN '70000000-0000-0000-0000-000000000005'
    WHEN n BETWEEN 20 AND 24 THEN '70000000-0000-0000-0000-000000000006'
    WHEN n BETWEEN 25 AND 28 THEN '70000000-0000-0000-0000-000000000007'
    WHEN n BETWEEN 29 AND 32 THEN '70000000-0000-0000-0000-000000000008'
    ELSE '70000000-0000-0000-0000-000000000009'
  END,
  CONCAT('Khách đoàn Phú Yên ', LPAD(n - 4, 2, '0')),
  DATE_ADD('1985-01-01', INTERVAL n * 173 DAY),
  'adult',
  'TP. Hồ Chí Minh',
  IF(n IN (5, 10, 15, 20, 25, 29, 33), 1, 0),
  NULL,
  NULL,
  CONCAT('CHK-DEMO-', LPAD(n, 3, '0')),
  NULL,
  CONCAT('0912', LPAD(300000 + n, 6, '0')),
  'active'
FROM (
  SELECT 5 AS n UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
  UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
  UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
  UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
  UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28
  UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL SELECT 32
  UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL SELECT 36
) seq;

INSERT INTO payments
(id, booking_id, transaction_id, payment_method, amount, status, raw_response, paid_at, created_at)
VALUES
('90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'VNPAY-DEMO-001', 'vnpay', 10270000.00, 'success', JSON_OBJECT('vnp_ResponseCode', '00', 'demo', true), NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
('90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', 'VNPAY-DEMO-002', 'vnpay', 3290000.00, 'success', JSON_OBJECT('vnp_ResponseCode', '00', 'demo', true), NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 25 DAY),
('90000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000003', 'VNPAY-DEMO-003', 'vnpay', 4690000.00, 'pending', JSON_OBJECT('demo', true, 'note', 'waiting hard tour approval'), NULL, NOW() - INTERVAL 1 DAY),
('90000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000004', 'VNPAY-DEMO-004', 'vnpay', 6280000.00, 'success', JSON_OBJECT('vnp_ResponseCode', '00', 'demo', true), NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY),
('90000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000005', 'VNPAY-DEMO-005', 'vnpay', 16450000.00, 'success', JSON_OBJECT('vnp_ResponseCode', '00', 'demo', true), NOW() - INTERVAL 17 DAY, NOW() - INTERVAL 17 DAY),
('90000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000006', 'VNPAY-DEMO-006', 'vnpay', 16450000.00, 'success', JSON_OBJECT('vnp_ResponseCode', '00', 'demo', true), NOW() - INTERVAL 17 DAY, NOW() - INTERVAL 17 DAY),
('90000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000007', 'VNPAY-DEMO-007', 'vnpay', 13160000.00, 'success', JSON_OBJECT('vnp_ResponseCode', '00', 'demo', true), NOW() - INTERVAL 16 DAY, NOW() - INTERVAL 16 DAY),
('90000000-0000-0000-0000-000000000008', '70000000-0000-0000-0000-000000000008', 'VNPAY-DEMO-008', 'vnpay', 13160000.00, 'success', JSON_OBJECT('vnp_ResponseCode', '00', 'demo', true), NOW() - INTERVAL 16 DAY, NOW() - INTERVAL 16 DAY),
('90000000-0000-0000-0000-000000000009', '70000000-0000-0000-0000-000000000009', 'VNPAY-DEMO-009', 'vnpay', 13160000.00, 'success', JSON_OBJECT('vnp_ResponseCode', '00', 'demo', true), NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY);

-- ---------------------------------------------------------------------------
-- Guide checklists, voucher, notification, review.
-- ---------------------------------------------------------------------------
INSERT INTO checklist_templates (id, guide_id, name, created_at)
VALUES
('c1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Checklist chung cho tour demo', NOW()),
('c1000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Checklist hard tour Fansipan', NOW());

INSERT INTO checklist_template_items (template_id, item_id, is_required)
VALUES
('c1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1),
('c1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 1),
('c1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000017', 1),
('c1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000020', 0),
('c1000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 1),
('c1000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000011', 1),
('c1000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000022', 1),
('c1000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000028', 1);

INSERT INTO schedule_checklists (id, schedule_id, guide_id, custom_message, last_sent_at, updated_at)
VALUES
('c0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'Tour đã đóng đăng ký và đạt hơn 90% khách. Vui lòng gửi checklist giấy tờ, sạc dự phòng và đồ dùng cá nhân trước ngày khởi hành.', NOW() - INTERVAL 1 DAY, NOW());

INSERT INTO schedule_checklist_items (checklist_id, item_id, is_required)
VALUES
('c0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1),
('c0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000017', 1),
('c0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000014', 0),
('c0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000020', 0);

INSERT INTO vouchers
(id, name, code, description, discount_type, discount_value, max_discount_amount, min_order_value, valid_from, valid_until, total_quantity, usage_limit_per_user, target_type, used_count, is_active, created_by, created_at)
VALUES
('b0000000-0000-0000-0000-000000000001', 'Voucher báo cáo đồ án', 'DEMO2026', 'Voucher mẫu để admin/operator test quản lý khuyến mãi.', 'fixed', 300000.00, 300000.00, 2000000.00, '2026-07-01 00:00:00', '2026-12-31 23:59:59', 100, 1, 'all', 2, 1, '10000000-0000-0000-0000-000000000001', NOW());

INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
VALUES
('f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'booking_confirmation', 'Đặt tour thành công', 'Booking BKG-DEMO-001 đã thanh toán thành công cho tour Đà Nẵng - Hội An.', 0, NOW()),
('f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'payment_reminder', 'Chờ duyệt hard tour', 'Booking BKG-DEMO-003 đang chờ operator duyệt hồ sơ CCCD trước khi thanh toán.', 0, NOW()),
('f0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'packing_reminder', 'Checklist cần gửi', 'Bạn có một checklist hard tour Fansipan cần gửi cho khách trước ngày khởi hành.', 0, NOW());

INSERT INTO reviews
(id, booking_id, overall_rating, general_comment, is_featured, created_at)
VALUES
('d0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', 5, 'Tour Nha Trang - Phú Yên tổ chức tốt, HDV nhiệt tình, lịch trình hợp lý.', 1, NOW() - INTERVAL 10 DAY);

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;

SELECT 'Demo report seed completed' AS message;
