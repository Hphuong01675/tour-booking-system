import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def try_fix(match):
    s = match.group(0)
    try:
        # Many corrupted files are UTF-8 bytes interpreted as Windows-1252
        b = s.encode('cp1252')
        return b.decode('utf-8')
    except Exception:
        return s

fixed_content = re.sub(r'[^\x00-\x7F]+', try_fix, content)

with open('fixed.txt', 'w', encoding='utf-8') as f:
    f.write(fixed_content)
