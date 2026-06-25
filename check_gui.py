import re
with open(r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

words = re.findall(r'\b\w*gửi\w*\b', content)
print(set(words))
