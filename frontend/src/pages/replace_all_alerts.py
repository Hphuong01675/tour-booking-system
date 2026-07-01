import re
import os

files_to_update = [
    r"c:\Users\HAI\Downloads\tour-booking-system\frontend\src\pages\Homepage.jsx",
    r"c:\Users\HAI\Downloads\tour-booking-system\frontend\src\pages\customer\TourDetailPage.jsx",
    r"c:\Users\HAI\Downloads\tour-booking-system\frontend\src\pages\customer\CustomerToursPage.jsx"
]

toast_state_code = """    const [toast, setToast] = useState(null);
    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);"""

toast_ui_code = """            {toast && (
                <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3.5 px-4.5 py-4 rounded-[20px] bg-white border border-neutral-100 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 min-w-[320px] max-w-[420px]">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                        toast.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : toast.type === 'error' 
                                ? 'bg-rose-50 text-rose-600' 
                                : 'bg-blue-50 text-blue-600'
                    }`}>
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                        </span>
                    </div>
                    <div className="flex-grow flex flex-col text-left">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider leading-none">
                            {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Thất bại' : 'Thông báo'}
                        </span>
                        <span className="text-[13px] font-semibold mt-1 text-neutral-750 leading-snug">{toast.message}</span>
                    </div>
                    <button 
                        onClick={() => setToast(null)} 
                        className="text-neutral-400 hover:text-neutral-600 shrink-0 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}"""

def update_file(file_path):
    print(f"Updating: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Inject Toast state if not present
    if "const [toast, setToast]" not in content:
        # Find where to insert state. Usually after some standard state like `const [error, setError] = useState` or `const [bookings, setBookings]`
        lines = content.splitlines()
        insert_idx = -1
        for idx, line in enumerate(lines):
            if "useState" in line and ("tour" in line or "bookings" in line or "wishlist" in line) and "=" in line:
                # insert after this line
                insert_idx = idx
                break
        if insert_idx != -1:
            lines.insert(insert_idx + 1, toast_state_code)
            content = "\n".join(lines)
            print("  -> Injected toast state code")
        else:
            print("  -> ERROR: Could not find insertion point for toast state")
            
    # 2. Replace all instances of `alert(`
    # Let's replace alerts based on message patterns or just general `showToast`
    # Replace alert("message") or alert(`message`)
    
    # For Homepage.jsx:
    if "Homepage.jsx" in file_path:
        content = content.replace('alert("Xin lỗi, tour này hiện tại chưa có lịch trình mở đăng ký.");', 'showToast("Xin lỗi, tour này hiện tại chưa có lịch trình mở đăng ký.", "info");')
        content = content.replace('alert("Đã xảy ra lỗi. Vui lòng thử lại.");', 'showToast("Đã xảy ra lỗi. Vui lòng thử lại.", "error");')
        content = content.replace('alert("Tài khoản của bạn không phải là Khách hàng. Vui lòng đăng nhập tài khoản Khách hàng để đặt tour.");', 'showToast("Tài khoản của bạn không phải là Khách hàng. Vui lòng đăng nhập tài khoản Khách hàng để đặt tour.", "warning");')
        content = content.replace('alert(err.response?.data?.error || "Không thể hoàn tất đơn đặt tour.");', 'showToast(err.response?.data?.error || "Không thể hoàn tất đơn đặt tour.", "error");')
        content = content.replace('alert("Cảm ơn yêu cầu tư vấn! Chúng tôi sẽ liên hệ lại sớm nhất.");', 'showToast("Cảm ơn yêu cầu tư vấn! Chúng tôi sẽ liên hệ lại sớm nhất.", "success");')
        content = content.replace('alert("Giao dịch thanh toán mô phỏng đã bị hủy.");', 'showToast("Giao dịch thanh toán mô phỏng đã bị hủy.", "info");')
        content = content.replace('alert("Giao dịch thanh toán MoMo mô phỏng đã hủy.");', 'showToast("Giao dịch thanh toán MoMo mô phỏng đã hủy.", "info");')
        print("  -> Replaced Homepage alerts")
    else:
        # Generic regex replace alert("...") or alert(`...`) or alert('...')
        # Let's match: alert("message") or alert('message') or alert(`message`)
        # We replace with showToast("message", "info") etc
        
        # We match alert(...) and translate it to showToast(..., "info")
        # To avoid syntax errors, we can use a regex pattern:
        def alert_replacer(match):
            inner = match.group(1)
            # If it's a success string, use 'success'
            if any(w in inner for w in ["thành công", "Thành công", "thanh cong"]):
                return f'showToast({inner}, "success")'
            elif any(w in inner for w in ["lỗi", "Lỗi", "không thể", "Không thể", "sai", "chưa", "chặn"]):
                return f'showToast({inner}, "error")'
            return f'showToast({inner}, "info")'
            
        content = re.sub(r'\balert\((.*?)\)', alert_replacer, content)
        print("  -> Replaced generic alerts via regex")
        
    # 3. Inject Toast UI before the final closing tag
    if "bottom-6 right-6" not in content:
        # Find the last `</div>` or `</>`
        # Usually we want to place it right before the last `</main>` or `</div>` or before the final `return (` block's end.
        lines = content.splitlines()
        insert_idx = -1
        # Loop backwards to find the last `return (` and its matching closing tag
        # Or look for `</main>` or `TopNavBar`
        for idx in range(len(lines) - 1, -1, -1):
            if "TopNavBar" in lines[idx]:
                # find the closing main or div or tag of the page return statement
                for j in range(len(lines) - 1, idx, -1):
                    if lines[j].strip() == "</div>" or lines[j].strip() == "</footer>" or lines[j].strip() == "</main>":
                        insert_idx = j
                        break
                break
        if insert_idx != -1:
            lines.insert(insert_idx, toast_ui_code)
            content = "\n".join(lines)
            print("  -> Injected toast UI code")
        else:
            print("  -> ERROR: Could not find insertion point for toast UI")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for fp in files_to_update:
    if os.path.exists(fp):
        update_file(fp)
    else:
        print(f"File not found: {fp}")
