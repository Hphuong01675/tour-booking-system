// Path: backend/src/validations/auth.validation.js

class AuthValidation {
  /**
   * Kiểm tra tên theo chuẩn Việt Nam
   * - Chỉ chứa chữ cái (tiếng Anh + tiếng Việt), số, space, dấu gạch ngang, dấu phẩy
   * - Không có ký tự đặc biệt (@, #, !, v.v.)
   * - Min 3, Max 100 ký tự
   */
  isValidVietnameseName(fullName) {
    const vietnameseNameRegex = /^[a-zA-Z0-9\s\-.,ăâêôơƯưàáảãạằắẳẵặèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵđ]+$/;

    if (!fullName || fullName.trim().length < 3 || fullName.length > 100) {
      return false;
    }

    return vietnameseNameRegex.test(fullName.trim());
  }

  /**
   * Kiểm tra email hợp lệ
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 150;
  }

  /**
   * Kiểm tra số điện thoại theo chuẩn Việt Nam
   * - Format: 0XXXXXXXXX, +84XXXXXXXXX, hoặc (XX) XXXX XXXX
   * - Min 9 digits, Max 20 ký tự
   */
  isValidVietnamesePhone(phone) {
    // Remove spaces, dashes, parentheses for validation
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    // Check if it's a valid length (9-15 digits)
    if (!/^\d{9,15}$/.test(cleanPhone)) {
      return false;
    }

    // Vietnamese phone formats:
    // - Starts with 0 (domestic): 0XXXXXXXXX (10-11 digits)
    // - Starts with +84 (international): +84XXXXXXXXX (11-13 digits after +)
    // - Format variations allowed: 0912 345 678, (091) 2345 678

    return /^[\d+\s\-()]{9,20}$/.test(phone) && cleanPhone.length >= 9;
  }

  /**
   * Kiểm tra mật khẩu mạnh
   * - Ít nhất 8 ký tự
   * - Có ít nhất 1 chữ in hoa (A-Z)
   * - Có ít nhất 1 chữ thường (a-z)
   * - Có ít nhất 1 chữ số (0-9)
   * - Có ít nhất 1 ký tự đặc biệt (!@#$%^&*)
   * - Max 128 ký tự
   */
  isValidStrongPassword(password) {
    const minLength = 8;
    const maxLength = 128;

    if (!password || password.length < minLength || password.length > maxLength) {
      return false;
    }

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // Check for digit
    if (!/[0-9]/.test(password)) {
      return false;
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Main validation for register endpoint
   */
  validateRegister = (req, res, next) => {
    const { fullName, email, password, confirmPassword, phone, dateOfBirth, address } = req.body;

    // 1. Check required fields
    if (!fullName || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({
        error: 'Vui lòng điền đầy đủ các thông tin bắt buộc (họ tên, email, mật khẩu, xác nhận mật khẩu, số điện thoại).',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 2. Validate full name (Vietnamese standard)
    if (!this.isValidVietnameseName(fullName)) {
      return res.status(400).json({
        error: 'Họ và tên phải từ 3 đến 100 ký tự, chỉ chứa chữ cái, số, dấu gạch ngang và dấu phẩy. Không được chứa ký tự đặc biệt.',
        code: 'INVALID_FULLNAME'
      });
    }

    // 3. Validate email
    if (!this.isValidEmail(email)) {
      return res.status(400).json({
        error: 'Email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: user@example.com).',
        code: 'INVALID_EMAIL'
      });
    }

    // 4. Validate phone (Vietnamese format)
    if (!this.isValidVietnamesePhone(phone)) {
      return res.status(400).json({
        error: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại theo định dạng Việt Nam (0912345678 hoặc +84912345678).',
        code: 'INVALID_PHONE'
      });
    }

    // 5. Validate password strength
    if (!this.isValidStrongPassword(password)) {
      return res.status(400).json({
        error: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm: 1 chữ in hoa, 1 chữ thường, 1 chữ số, 1 ký tự đặc biệt (!@#$%^&*).',
        code: 'WEAK_PASSWORD'
      });
    }

    // 6. Validate password confirmation match
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Xác nhận mật khẩu không khớp. Vui lòng kiểm tra lại.',
        code: 'PASSWORD_MISMATCH'
      });
    }

    // 7. Validate dateOfBirth (optional but if provided, validate)
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          error: 'Ngày tháng năm sinh không hợp lệ.',
          code: 'INVALID_DATE'
        });
      }

      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 10 || age > 120) {
        return res.status(400).json({
          error: 'Tuổi không hợp lệ. Vui lòng nhập ngày sinh từ 10 đến 120 tuổi.',
          code: 'INVALID_AGE'
        });
      }
    }

    // 8. Validate address (optional but if provided, validate)
    if (address && address.length > 500) {
      return res.status(400).json({
        error: 'Địa chỉ không được vượt quá 500 ký tự.',
        code: 'ADDRESS_TOO_LONG'
      });
    }

    next();
  }

  /**
   * Validate OTP verification
   */
  validateVerifyOTP = (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email và mã OTP là bắt buộc.',
        code: 'MISSING_OTP_FIELDS'
      });
    }

    if (!this.isValidEmail(email)) {
      return res.status(400).json({
        error: 'Email không hợp lệ.',
        code: 'INVALID_EMAIL'
      });
    }

    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        error: 'Mã OTP phải có chính xác 4 chữ số.',
        code: 'INVALID_OTP_FORMAT'
      });
    }

    next();
  }

  /**
   * Validate resend OTP
   */
  validateResendOTP = (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email là bắt buộc.',
        code: 'MISSING_EMAIL'
      });
    }

    if (!this.isValidEmail(email)) {
      return res.status(400).json({
        error: 'Email không hợp lệ.',
        code: 'INVALID_EMAIL'
      });
    }

    next();
  }
}

export default new AuthValidation();
