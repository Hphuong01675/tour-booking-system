import re

file_path = r'd:\HKII_25-26\CCNM\DUAN\1\tour-booking-system\frontend\src\pages\guide\GuideChatPage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''const ChatMessageContent = ({ content, isGuide, onPreviewImage, onCCCDApproval }) => {
  const parsed = parseChatContent(content);
  if (parsed.type === \\'image\\') {
    return (
      <button type="button" onClick={() => onPreviewImage?.(parsed)} className="block text-left">
        <img src={parsed.url} alt={parsed.name || \\'Ảnh đã gửi\\'} className="max-h-64 rounded-xl object-contain bg-black/5 cursor-zoom-in" />
      </button>
    );
  }
  if (parsed.type === \\'video\\') {
    return <video src={parsed.url} controls className="max-h-64 rounded-xl bg-black" />;
  }
  if (parsed.type === \\'cccd_review\\') {
    const images = [
      { label: \\'Mặt trước\\', url: parsed.frontUrl },
      { label: \\'Mặt sau\\', url: parsed.backUrl },
    ].filter((item) => item.url);

    return (
      <div className={w-72 max-w-full space-y-3 }>
        <div>
          <p className="font-bold text-sm">Khách gửi CCCD cần kiểm tra</p>
          <p className="text-xs opacity-80 mt-1">Hành khách: {parsed.participantName || \\'Chưa rõ\\'}</p>
          {parsed.dateOfBirth && (
            <p className="text-[11px] opacity-70">Ngày sinh: {new Date(parsed.dateOfBirth).toLocaleDateString(\\'vi-VN\\')}</p>
          )}
          <p className="text-[11px] opacity-70">Tour: {parsed.tourTitle || \\'Chưa rõ\\'}</p>
          {parsed.departureDate && (
            <p className="text-[11px] opacity-70">
              Khởi hành: {new Date(parsed.departureDate).toLocaleDateString(\\'vi-VN\\')}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {images.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onPreviewImage?.({ url: item.url, name: CCCD  -  })}
              className="text-left"
            >
              <img src={item.url} alt={CCCD } className="w-full h-24 object-cover rounded-lg bg-black/5 cursor-zoom-in" />
              <span className="block mt-1 text-[10px] opacity-75">{item.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] opacity-75">
          Sau khi kiểm tra, HDV cập nhật ảnh chính thức tại danh sách hành khách của tour.
        </p>
        {!isGuide && (
          <button
            type="button"
            onClick={() => onCCCDApproval?.()}
            className="w-full px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition"
          >
            Duyệt & Upload CCCD
          </button>
        )}
      </div>
    );
  }
  return <span className={isGuide ? \\'text-on-primary\\' : \\'text-on-surface\\'}>{parsed.text}</span>;
};'''

pattern = re.compile(r'const ChatMessageContent.*?return <span className=\{isGuide \? \'text-on-primary\' : \'text-on-surface\'\}>\{parsed\.text\}</span>;\n\};\n', re.DOTALL)

new_content = pattern.sub(replacement + '\n', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
