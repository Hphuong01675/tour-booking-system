files_to_fix = [
    r"c:\Users\HAI\Downloads\tour-booking-system\frontend\src\pages\customer\TourDetailPage.jsx",
    r"c:\Users\HAI\Downloads\tour-booking-system\frontend\src\pages\customer\CustomerToursPage.jsx"
]

target = 'showToast("Vui lòng nhập đúng số thẻ ATM test NCB (9704198526191432119, "info")")'
replacement = 'showToast("Vui lòng nhập đúng số thẻ ATM test NCB (9704198526191432119)", "info")'

for fp in files_to_fix:
    with open(fp, "r", encoding="utf-8") as f:
        content = f.read()
    if target in content:
        content = content.replace(target, replacement)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully fixed quote syntax error in {fp}!")
    else:
        # Check for single-quote variations or differences in spacing
        content = content.replace('NCB (9704198526191432119, "info")', 'NCB (9704198526191432119)", "info"')
        with open(fp, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Applied fallback replacement on {fp}")
