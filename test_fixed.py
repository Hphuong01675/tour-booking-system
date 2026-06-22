import re
with open('fixed.txt', 'r', encoding='utf-8') as f:
    content = f.read()
words = set(re.findall(r'[^\x00-\x7F]+', content))
with open('non_ascii_fixed.txt', 'w', encoding='utf-8') as f:
    for w in words:
        f.write(w + '\n')
