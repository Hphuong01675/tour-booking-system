import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the 'thử' mess
content = re.sub(r'thử(ức|ực|êm|ông|ành|oại|oáº¡i|úc)', r'th\1', content)
content = content.replace('lengthử', 'length')
content = content.replace('smoothử', 'smooth')
content = content.replace('withửin', 'within')
content = content.replace('widthử', 'width')
content = content.replace('maxWidthử', 'maxWidth')
content = content.replace('Không thửể', 'Không thể')
content = content.replace('thửử', 'thử')

# Fix remaining corruption
content = content.replace('há»™i thoại', 'hội thoại')
content = content.replace('há»™i thoáº¡i', 'hội thoại')
content = content.replace('Chá» ', 'Chờ')
content = content.replace('nĂ y', 'này')
content = content.replace('nĂ o', 'nào')
content = content.replace('HĂ£y chá» n', 'Hãy chọn')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
