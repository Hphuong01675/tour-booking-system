import re
with open(r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\components\Customer\CustomerChatWidget.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
words = set(re.findall(r'[^\x00-\x7F]+', content))
print(words)
