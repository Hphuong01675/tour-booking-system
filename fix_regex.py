import re
with open(r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'Tư vấn kh.*ch h.*ng', 'Tư vấn khách hàng', content)
content = re.sub(r'Ch.*o mừng đến với Trực Tổng Đ.*i Tư Vấn', 'Chào mừng đến với Trực Tổng Đài Tư Vấn', content)
content = re.sub(r'Đang tiếp nh.*n', 'Đang tiếp nhận', content)
content = re.sub(r'Chờ tiếp nh.*n', 'Chờ tiếp nhận', content)
content = re.sub(r'Tìm kiếm kh.*ch h.*ng\.\.\.', 'Tìm kiếm khách hàng...', content)
content = re.sub(r'Kh.*ch Vô Danh', 'Khách Vô Danh', content)
content = re.sub(r'Không có cuộc hội thoại n.*o\.', 'Không có cuộc hội thoại nào.', content)
content = re.sub(r'Bạn phải Tiếp nh.*n cuộc hội thoại n.*y trước khi g.*i tin nhắn tư vấn\.', 'Bạn phải Tiếp nhận cuộc hội thoại này trước khi gửi tin nhắn tư vấn.', content)
content = re.sub(r'Không thể g.*i tệp\. Vui lòng th.* lại\.', 'Không thể gửi tệp. Vui lòng thử lại.', content)
content = re.sub(r'Thông tin kh.*ch h.*ng', 'Thông tin khách hàng', content)

with open(r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
