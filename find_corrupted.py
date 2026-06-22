import os
import re

directory = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src'
corrupted = []

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                try:
                    content = f.read()
                    if 'TÆ°' in content or 'Ä' in content or 'áº' in content:
                        corrupted.append(filepath)
                except Exception:
                    pass

for c in corrupted:
    print(c)
