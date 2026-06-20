// Path: backend/src/repositories/auth.repository.js
import db from '../models';
import redisClient from '../config/redis';

const { User } = db;

class AuthRepository {
  async findUserByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  async createUser(userData) {
    return await User.create({
      fullName: userData.fullName,
      email: userData.email,
      passwordHash: userData.passwordHash, // Password đã được hash bởi service
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
      address: userData.address,
      isActive: userData.isActive !== undefined ? userData.isActive : false, // Inactive cho đến khi verify OTP
      role: userData.role || 'customer',
    });
  }

  async activateUser(email) {
    return await User.update(
      { isActive: true },
      { where: { email } }
    );
  }

  async updateUser(email, updateData) {
    return await User.update(updateData, { where: { email } });
  }

  async getUserById(userId) {
    return await User.findByPk(userId);
  }

  // ================= Forgot Password Methods =================

  async upsertOTP(email, otp) {
    await redisClient.setEx(`otp:${email}`, 300, otp);
  }

  async getOTP(email) {
    return await redisClient.get(`otp:${email}`);
  }

  async deleteOTP(email) {
    await redisClient.del(`otp:${email}`);
  }

  async incrementOtpAttempt(email, windowSeconds = 600) {
    const attemptsKey = `otp_attempts:${email}`;
    const attempts = await redisClient.incr(attemptsKey);
    if (attempts === 1) {
      await redisClient.expire(attemptsKey, windowSeconds);
    }
    return attempts;
  }

  async getOtpAttempts(email) {
    const attempts = await redisClient.get(`otp_attempts:${email}`);
    return parseInt(attempts, 10) || 0;
  }

  async resetOtpAttempts(email) {
    await redisClient.del(`otp_attempts:${email}`);
  }

  async lockOtpVerification(email, lockSeconds = 900) {
    await redisClient.setEx(`otp_blocked:${email}`, lockSeconds, "1");
  }

  async isOtpBlocked(email) {
    const blocked = await redisClient.get(`otp_blocked:${email}`);
    return blocked !== null;
  }

  async updatePassword(email, passwordHash) {
    return await User.update(
      { passwordHash: passwordHash },
      { where: { email } }
    );
  }

  async saveResetToken(token, email) {
    await redisClient.setEx(`reset_token:${token}`, 300, email);
  }

  async deleteResetToken(token) {
    await redisClient.del(`reset_token:${token}`);
  }
}

export default new AuthRepository();
