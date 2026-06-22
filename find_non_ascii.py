import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

words = set(re.findall(r'[^\x00-\x7F]+', content))
with open('non_ascii.txt', 'w', encoding='utf-8') as f:
    for w in words:
        f.write(w + '\n')
