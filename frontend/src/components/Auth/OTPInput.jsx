import React, { useRef, useEffect } from 'react';

const OTPInput = ({ value, onChange, onComplete }) => {
  const inputRefs = useRef([]);

  const handleInputChange = (index, e) => {
    const val = e.target.value;

    // Chỉ cho phép chữ số
    if (!/^\d*$/.test(val)) return;

    // Giới hạn 1 ký tự
    const digit = val.slice(-1);

    // Cập nhật mảng OTP
    const newOtp = value.split('');
    newOtp[index] = digit;
    const otpString = newOtp.join('');
    onChange(otpString);

    // Chuyển tiếp đến input tiếp theo nếu có input
    if (digit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Gọi onComplete khi nhập đủ 4 chữ số
    if (otpString.length === 4) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    // Xử lý phím Backspace
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    // Xử lý phím Enter
    if (e.key === 'Enter' && value.length === 4) {
      onComplete(value);
    }
  };

  return (
    <div className="flex justify-center gap-md">
      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          value={value[index] || ''}
          onChange={(e) => handleInputChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          maxLength="1"
          className="otp-input w-14 h-16 text-center text-headline-md font-headline-md rounded-lg border border-outline bg-surface focus:border-primary-container focus:ring-2 focus:ring-primary-fixed outline-none transition-all"
          placeholder="0"
        />
      ))}
    </div>
  );
};

export default OTPInput;

