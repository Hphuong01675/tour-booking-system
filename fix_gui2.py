import re
with open(r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Restore any a-z surrounding 'gửi' back to 'gi'
def restore_gi(match):
    # match is something like 'digửit'
    return match.group(0).replace('gửi', 'gi')

content = re.sub(r'[a-zA-Z]gửi[a-zA-Z]', restore_gi, content)
content = re.sub(r'gửi[a-zA-Z]', restore_gi, content)
content = re.sub(r'[a-zA-Z]gửi', restore_gi, content)

with open(r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
