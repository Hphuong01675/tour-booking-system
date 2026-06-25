import os
import re

directory = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src'
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'Gá»»i' in content or 'Gá»' in content:
                content = content.replace('Gá»»i', 'Gửi')
                content = content.replace('Gá»­i', 'Gửi')
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
