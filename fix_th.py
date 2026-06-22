import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the dateOfBir thử bug
content = content.replace('dateOfBirthử', 'dateOfBirth')
content = content.replace('dateOfBir thử', 'dateOfBirth')
content = content.replace('Bir thử', 'Birth')
content = content.replace('leng thử', 'length')
content = content.replace('thửis', 'this')
content = content.replace('wi thử', 'with')
content = content.replace('thửen', 'then')
content = content.replace('thửe', 'the')
content = content.replace('ma thử', 'math')
content = content.replace('Thử', 'Th')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
