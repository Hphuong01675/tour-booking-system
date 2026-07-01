file_path = r"c:\Users\HAI\Downloads\tour-booking-system\frontend\src\pages\customer\TourDetailPage.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

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

if "toast.type ===" not in content:
    lines = content.splitlines()
    found = -1
    for idx in range(len(lines) - 1, -1, -1):
        if lines[idx].strip() == "</div>" and lines[idx+1].strip() == ");" and lines[idx+2].strip() == "};":
            found = idx
            break
    if found != -1:
        lines.insert(found, toast_ui_code)
        new_content = "\n".join(lines)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Successfully injected toast UI into TourDetailPage.jsx!")
    else:
        print("Could not find the insertion point at the end of TourDetailPage.jsx!")
else:
    print("Toast UI seems to already exist in TourDetailPage.jsx!")
