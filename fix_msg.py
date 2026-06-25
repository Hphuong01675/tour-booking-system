import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<ChatMessageContent \n                                    msg={msg}', '<ChatMessageContent \n                                    content={msg.content}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
