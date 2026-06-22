import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'ChĂ o má»«ng': 'Chào mừng',
    'Trá»±c Tá»•ng Ä Ă i': 'Trực Tổng Đài',
    'Trá»±c Tá»•ng': 'Trực Tổng',
    'Ä Ă i': 'Đài',
    'Cho': 'Chào',
    'Đi': 'Đài',
    'hng': 'hàng',
    'nhn': 'nhận',
    'ny': 'này',
    'gi': 'gửi',
    'th': 'thử',
    'Tư vấn khĂ¡ch hĂ ng': 'Tư vấn khách hàng',
    'khĂ¡ch hĂ ng': 'khách hàng',
    'khĂ¡ch hĂ\xa0ng': 'khách hàng',
    'khĂ¡ch hĂ ng...': 'khách hàng...',
    'Ä ang tiáº¿p nháº\xadn': 'Đang tiếp nhận',
    'Chá»  tiáº¿p nháº\xadn': 'Chờ tiếp nhận',
    'tiáº¿p nháº\xadn': 'tiếp nhận',
    'Má»›i': 'mới',
    'má»›i': 'mới',
    'Chá» ': 'Chờ',
    'Ä ang': 'Đang',
    'Ä‘áº¿n': 'đến',
    'vá»›i': 'với',
    'TÆ° Váº¥n': 'Tư Vấn',
    'TÆ°': 'Tư',
    'Váº¥n': 'Vấn',
    'KhĂ¡ch': 'Khách',
    'VĂ´': 'Vô',
    'Ä‘ang': 'đang',
    'trá»±c tuyáº¿n': 'trực tuyến',
    'Káº¿t thĂºc': 'Kết thúc',
    'Nháº\xadp': 'Nhập',
    'tin nháº¯n': 'tin nhắn',
    'há»— trá»£': 'hỗ trợ',
    'Gá»\xad': 'Gửi',
    'Gá»»i': 'Gửi',
    'Báº¡n pháº£i': 'Bạn phải',
    'cuá»™c': 'cuộc',
    'trÆ°á»›c': 'trước',
    'Há»  tĂªn': 'Họ tên',
    'Sá»‘ Ä T': 'Số ĐT',
    'ChÆ°a cáº\xadp nháº\xadt': 'Chưa cập nhật',
    'Ghi chĂº': 'Ghi chú',
    'nhanh vá» ': 'nhanh về',
    'nĂ y': 'này'
}

for k, v in replacements.items():
    content = content.replace(k, v)

# Fix some specifics that might have 
content = content.replace('Cho mừng đến với Trực Tổng Đi Tư Vấn', 'Chào mừng đến với Trực Tổng Đài Tư Vấn')
content = content.replace('Thông tin khách hng', 'Thông tin khách hàng')
content = content.replace('Bạn phải Tiếp nhn cuộc hội thoại ny trước khi gi tin nhắn tư vấn.', 'Bạn phải Tiếp nhận cuộc hội thoại này trước khi gửi tin nhắn tư vấn.')
content = content.replace('Không thể gi tệp. Vui lòng th lại.', 'Không thể gửi tệp. Vui lòng thử lại.')
content = content.replace('Cho', 'Chào')
content = content.replace('Đi', 'Đài')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
