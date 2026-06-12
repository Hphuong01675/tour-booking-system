// Path: backend/src/services/auth.service.js
import bcrypt from 'bcryptjs';
import authRepository from '../repositories/auth.repository';
import mailService from './mail.service';
import redisClient from '../config/redis';

class AuthService {
  async registerStep1(userData) {
    const { email, password, fullName, phone, dateOfBirth, address } = userData;

    // 1. Validate input
    if (!email || !password || !fullName) {
      throw new Error('Email, mật khẩu và họ tên là bắt buộc.');
    }

    // 2. Check if user already exists and is active
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser && existingUser.isActive) {
      throw new Error('Email đã được đăng ký và kích hoạt.');
    }

    // 3. Hash password with bcrypt (cost factor = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create or update user in inactive state
    let user;
    if (existingUser) {
      // Update existing inactive user
      await authRepository.updateUser(email, {
        fullName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        passwordHash, // Store hashed password
      });
      user = await authRepository.findUserByEmail(email);
    } else {
      // Create new inactive user
      user = await authRepository.createUser({
        fullName,
        email,
        passwordHash, // Hashed password stored in DB
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        isActive: false, // Inactive until OTP verified
        role: 'customer',
      });
    }

    // 5. Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 6. Store OTP in Redis ONLY (expires in 5 minutes = 300 seconds)
    try {
      await redisClient.setEx(`otp:${email}`, 300, otp);
      console.log(`[AUTH SERVICE] OTP stored in Redis for ${email}`);
    } catch (err) {
      console.error('Redis error storing OTP:', err.message);
      throw new Error('Không thể tạo OTP. Vui lòng thử lại.');
    }

    // 7. Send OTP via email
    try {
      await mailService.sendOTP(email, otp);
    } catch (err) {
      console.error('Mail service error:', err.message);
      // Even if email fails, continue (OTP in Redis is enough for testing)
    }

    return { email };
  }

  async verifyOTP(email, otp) {
    if (!email || !otp) {
      throw new Error('Email và mã OTP là bắt buộc.');
    }

    // 1. Fetch OTP from Redis
    let cachedOtp = null;
    try {
      cachedOtp = await redisClient.get(`otp:${email}`);
    } catch (err) {
      console.warn('Redis error fetching OTP:', err.message);
      throw new Error('Không thể xác nhận OTP. Vui lòng thử lại.');
    }

    if (!cachedOtp) {
      throw new Error('Mã OTP không tồn tại hoặc đã hết hạn.');
    }

    // 2. Verify OTP value
    if (cachedOtp !== otp) {
      throw new Error('Mã OTP không chính xác.');
    }

    // 3. Activate user account
    let user;
    try {
      await authRepository.activateUser(email);
      user = await authRepository.findUserByEmail(email);
    } catch (err) {
      console.error('Error activating user:', err.message);
      throw new Error('Lỗi kích hoạt tài khoản. Vui lòng thử lại.');
    }

    // 4. Send Welcome Email
    if (user) {
      try {
        await mailService.sendWelcomeEmail(email, user.fullName);
      } catch (err) {
        console.error('[AUTH SERVICE] Error sending welcome email:', err.message);
      }
    }

    // 5. Delete OTP from Redis
    try {
      await redisClient.del(`otp:${email}`);
      console.log(`[AUTH SERVICE] OTP deleted from Redis for ${email}`);
    } catch (err) {
      console.warn('Redis error deleting OTP:', err.message);
    }

    return { message: 'Kích hoạt tài khoản thành công.' };
  }

  async resendOTP(email) {
    if (!email) {
      throw new Error('Email là bắt buộc.');
    }

    // 1. Check if user exists
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('Email không tồn tại.');
    }

    // 2. Check if already activated
    if (user.isActive) {
      throw new Error('Tài khoản đã được kích hoạt.');
    }

    // 3. Generate new OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Store OTP in Redis (5 minutes)
    try {
      await redisClient.setEx(`otp:${email}`, 300, otp);
      console.log(`[AUTH SERVICE] New OTP generated and stored in Redis for ${email}`);
    } catch (err) {
      console.error('Redis error storing new OTP:', err.message);
      throw new Error('Không thể gửi lại OTP. Vui lòng thử lại.');
    }

    // 5. Send OTP via email
    try {
      await mailService.sendOTP(email, otp);
    } catch (err) {
      console.error('Mail service error:', err.message);
      // Continue - OTP in Redis is sufficient
    }

    return { email };
  }

  /**
   * Verify password (for login)
   * Compare plaintext password with bcrypt hash
   */
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
      console.error('Password verification error:', err.message);
      return false;
    }
  }
}

export default new AuthService();
