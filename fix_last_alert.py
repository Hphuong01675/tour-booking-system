import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('alert(err.message || "Khong the ket thửuc cuoc hoi thửoai.");', 'setAlertModal({ isOpen: true, title: \'Lỗi\', message: err.message || \'Không thể kết thúc cuộc hội thoại.\', type: \'error\' });')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
