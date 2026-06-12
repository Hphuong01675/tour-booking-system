// Path: backend/src/repositories/auth.repository.js
import db from '../models';

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
}

export default new AuthRepository();
