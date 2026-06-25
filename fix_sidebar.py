import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Há»  tĂªn', 'Họ tên')
content = content.replace('Sá»‘ Ä T', 'Số ĐT')
content = content.replace('ChÆ°a cáº\xadp nháº\xadt', 'Chưa cập nhật')
content = content.replace('Ghi chĂº há»— trá»£', 'Ghi chú hỗ trợ')
content = content.replace('Nháº\xadp ghi chĂº nhanh vá»  khĂ¡ch hĂ ng nĂ y...', 'Nhập ghi chú nhanh về khách hàng này...')
content = content.replace('h-full w-full min-w-0', 'h-[calc(100vh-160px)] w-full min-w-0')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
