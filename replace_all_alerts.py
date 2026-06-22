import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"alert\('Đã duyệt và upload CCCD thành công!'\);", "setAlertModal({ isOpen: true, title: 'Thành công', message: 'Đã duyệt và upload CCCD thành công!', type: 'info' });", content)
content = re.sub(r"alert\('Lỗi upload CCCD: ' \+ \((err.response\?.data\?.error \|\| err.message)\)\);", r"setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Lỗi upload CCCD: ' + (\1), type: 'error' });", content)
content = re.sub(r"alert\((err.response\?.data\?.message \|\| err.response\?.data\?.error \|\| 'Không thể gửi tệp. Vui lòng thử lại.')\);", r"setAlertModal({ isOpen: true, title: 'Lỗi', message: \1, type: 'error' });", content)
content = re.sub(r"alert\('Không thể lấy thông tin CCCD. Vui lòng thử lại.'\);", "setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Không thể lấy thông tin CCCD. Vui lòng thử lại.', type: 'error' });", content)
content = re.sub(r"alert\('Không có thông tin assignment hoặc participant. Vui lòng thử lại.'\);", "setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Không có thông tin assignment hoặc participant. Vui lòng thử lại.', type: 'error' });", content)
content = re.sub(r"alert\((err.response\?.data\?.error \|\| err.message \|\| \"Không thể tiếp nhận cuộc hội thoại.\")\);", r"setAlertModal({ isOpen: true, title: 'Lỗi', message: \1, type: 'error' });", content)
content = re.sub(r"alert\((err.message \|\| \"Khong the ket thuc cuoc hoi thoai.\")\);", r"setAlertModal({ isOpen: true, title: 'Lỗi', message: \1, type: 'error' });", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
