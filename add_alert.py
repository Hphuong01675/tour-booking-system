import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\Guide\GuideChatPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
state_code = "  const [showCCCDModal, setShowCCCDModal] = useState(false);\n  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });"
content = content.replace("  const [showCCCDModal, setShowCCCDModal] = useState(false);", state_code)

# Replace the alert
old_alert = "alert('Vui lòng Tiếp nhận cuộc hỗ trợ này trước khi thao tác duyệt CCCD.');"
new_alert = "setAlertModal({ isOpen: true, title: 'Không thể thao tác', message: 'Vui lòng Tiếp nhận cuộc hỗ trợ này trước khi thao tác duyệt CCCD.', type: 'error' });"
content = content.replace(old_alert, new_alert)

# Add Modal JSX just before {/* Preview Image */} or {/* CCCD Approval Modal */}
modal_jsx = """
        {/* Custom Alert Modal */}
        {alertModal.isOpen && (
            <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-fadeIn">
                <span className={material-symbols-outlined text-4xl mb-3 }>
                  {alertModal.type === 'error' ? 'error' : 'info'}
                </span>
                <h3 className="text-lg font-bold text-on-surface mb-2">{alertModal.title}</h3>
                <p className="text-on-surface-variant text-sm mb-6">{alertModal.message}</p>
                <button 
                  onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Đóng
                </button>
              </div>
            </div>
        )}
"""

content = content.replace("{/* Preview Image */}", modal_jsx + "\n        {/* Preview Image */}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
