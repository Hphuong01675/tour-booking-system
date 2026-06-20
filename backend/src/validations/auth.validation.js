// Path: backend/src/validations/auth.validation.js

class AuthValidation {
  isValidVietnameseName(fullName) {
    const value = String(fullName || '').trim().replace(/\s+/g, ' ');
    const vietnameseNameRegex = /^[\p{L}\s'.-]+$/u;

    return value.length >= 3 && value.length <= 100 && vietnameseNameRegex.test(value);
  }

  isValidEmail(email) {
    const value = String(email || '').trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return value.length <= 150 && emailRegex.test(value);
  }

  normalizePhone(phone) {
    return String(phone || '').trim().replace(/[\s\-()]/g, '');
  }

  isValidVietnamesePhone(phone) {
    const value = this.normalizePhone(phone);

    return /^0\d{9}$/.test(value) || /^\+84\d{9}$/.test(value) || /^84\d{9}$/.test(value);
  }

  isValidStrongPassword(password) {
    const value = String(password || '');

    return (
      value.length >= 8 &&
      value.length <= 128 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /\d/.test(value) &&
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
    );
  }

  calculateAge(birthDate, today = new Date()) {
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  }

  sendValidationErrors(res, errors) {
    return res.status(400).json({
      success: false,
      error: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đăng ký.',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  validateRegister = (req, res, next) => {
    const errors = {};
    const fullName = String(req.body.fullName || '').trim().replace(/\s+/g, ' ');
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const dateOfBirth = req.body.dateOfBirth || null;
    const address = req.body.address === undefined || req.body.address === null
      ? null
      : String(req.body.address).trim();

    if (!fullName) {
      errors.fullName = 'Họ và tên là bắt buộc.';
    } else if (!this.isValidVietnameseName(fullName)) {
      errors.fullName = 'Họ và tên phải từ 3 đến 100 ký tự và chỉ chứa chữ cái, khoảng trắng, dấu chấm, dấu nháy hoặc dấu gạch ngang.';
    }

    if (!email) {
      errors.email = 'Email là bắt buộc.';
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Email không hợp lệ. Vui lòng nhập đúng định dạng, ví dụ: user@example.com.';
    }

    if (!phone) {
      errors.phone = 'Số điện thoại là bắt buộc.';
    } else if (!this.isValidVietnamesePhone(phone)) {
      errors.phone = 'Số điện thoại không hợp lệ. Vui lòng nhập dạng 0912345678 hoặc +84912345678.';
    }

    if (!password) {
      errors.password = 'Mật khẩu là bắt buộc.';
    } else if (!this.isValidStrongPassword(password)) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu không khớp.';
    }

    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();

      if (Number.isNaN(birthDate.getTime())) {
        errors.dateOfBirth = 'Ngày sinh không hợp lệ.';
      } else if (birthDate > today) {
        errors.dateOfBirth = 'Ngày sinh không được lớn hơn ngày hiện tại.';
      } else {
        const age = this.calculateAge(birthDate, today);
        if (age < 10 || age > 120 || birthDate.getFullYear() < 1900) {
          errors.dateOfBirth = 'Tuổi không hợp lệ. Vui lòng nhập ngày sinh từ 10 đến 120 tuổi.';
        }
      }
    }

    if (address && address.length > 500) {
      errors.address = 'Địa chỉ không được vượt quá 500 ký tự.';
    }

    if (Object.keys(errors).length > 0) {
      return this.sendValidationErrors(res, errors);
    }

    req.body = {
      ...req.body,
      fullName,
      email,
      phone,
      dateOfBirth,
      address,
      password,
      confirmPassword,
    };

    return next();
  }

  validateVerifyOTP = (req, res, next) => {
    const errors = {};
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();

    if (!email) {
      errors.email = 'Email là bắt buộc.';
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Email không hợp lệ.';
    }

    if (!otp) {
      errors.otp = 'Mã OTP là bắt buộc.';
    } else if (!/^\d{4}$/.test(otp)) {
      errors.otp = 'Mã OTP phải có chính xác 4 chữ số.';
    }

    if (Object.keys(errors).length > 0) {
      return this.sendValidationErrors(res, errors);
    }

    req.body.email = email;
    req.body.otp = otp;
    return next();
  }

  validateResendOTP = (req, res, next) => {
    const errors = {};
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      errors.email = 'Email là bắt buộc.';
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Email không hợp lệ.';
    }

    if (Object.keys(errors).length > 0) {
      return this.sendValidationErrors(res, errors);
    }

    req.body.email = email;
    return next();
  }

  validateForgotPassword = (req, res, next) => {
    const errors = {};
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      errors.email = 'Email là bắt buộc.';
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Email không hợp lệ.';
    }

    if (Object.keys(errors).length > 0) {
      return this.sendValidationErrors(res, errors);
    }

    req.body.email = email;
    return next();
  }

  validateResetPassword = (req, res, next) => {
    const errors = {};
    const newPassword = String(req.body.newPassword || '');

    if (!newPassword) {
      errors.newPassword = 'Mật khẩu mới là bắt buộc.';
    } else if (!this.isValidStrongPassword(newPassword)) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.';
    }

    if (Object.keys(errors).length > 0) {
      return this.sendValidationErrors(res, errors);
    }

    return next();
  }
}

export default new AuthValidation();
