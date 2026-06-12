import { useRef } from "react";

/**
 * OtpInput – Component nhập 4 ô OTP riêng biệt
 * Hỗ trợ: auto-focus, backspace, paste toàn bộ OTP
 *
 * @param {string[]} value - Mảng 4 ký tự OTP
 * @param {function} onChange - Callback khi giá trị thay đổi: (newValues: string[]) => void
 */
const OtpInput = ({ value = ["", "", "", ""], onChange }) => {
    const inputsRef = useRef([]);

    const handleChange = (e, index) => {
        const digit = e.target.value.replace(/\D/g, "").slice(-1); // Chỉ lấy 1 chữ số cuối
        const newValues = [...value];
        newValues[index] = digit;
        onChange(newValues);

        // Tự động focus ô tiếp theo
        if (digit && index < 3) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        // Backspace: xóa ký tự hiện tại hoặc focus ô trước
        if (e.key === "Backspace") {
            if (value[index]) {
                const newValues = [...value];
                newValues[index] = "";
                onChange(newValues);
            } else if (index > 0) {
                inputsRef.current[index - 1]?.focus();
            }
        }
        // Mũi tên trái/phải
        if (e.key === "ArrowLeft" && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < 3) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 4);
        if (!pasted) return;

        const newValues = [...value];
        for (let i = 0; i < 4; i++) {
            newValues[i] = pasted[i] || "";
        }
        onChange(newValues);

        // Focus ô cuối cùng được điền
        const lastFilled = Math.min(pasted.length - 1, 3);
        inputsRef.current[lastFilled]?.focus();
    };

    return (
        <div className="flex justify-center gap-3">
            {value.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className="otp-input w-14 h-16 text-center text-2xl font-bold rounded-lg outline-none transition-all select-none"
                    style={{
                        border: digit
                            ? "2px solid #003d9b"
                            : "2px solid #c3c6d6",
                        backgroundColor: digit ? "#dae2ff" : "#ffffff",
                        color: "#003d9b",
                        boxShadow: digit
                            ? "0 0 0 4px rgba(0,61,155,0.1)"
                            : "none",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = "#003d9b";
                        e.target.style.boxShadow = "0 0 0 4px rgba(0,61,155,0.12)";
                    }}
                    onBlur={(e) => {
                        if (!digit) {
                            e.target.style.borderColor = "#c3c6d6";
                            e.target.style.boxShadow = "none";
                        }
                    }}
                    aria-label={`Chữ số OTP thứ ${index + 1}`}
                />
            ))}
        </div>
    );
};

export default OtpInput;
