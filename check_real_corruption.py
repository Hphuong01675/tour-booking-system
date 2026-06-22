import os
import re

directory = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src'
corrupted = []
pattern = re.compile(r'(áº|á»|Ä‘|Æ°|Ă¡|Ă |Ă¢|Ăª|Ă´|Ăº|Ă½)')

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if pattern.search(content):
                corrupted.append(filepath)

for c in corrupted:
    print(c)
