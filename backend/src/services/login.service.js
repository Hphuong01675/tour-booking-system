import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models";

const { User } = db;

class LoginService {
    getRedirectUrl(role) {
        const redirectByRole = {
            customer: "/customer/tours",
            operator: "/operator/dashboard",
            guide: "/guides/tours",
            admin: "/admin/dashboard",
        };

        return redirectByRole[role] || "/login";
    }

    sanitizeUser(user) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            dateOfBirth: user.dateOfBirth,
            role: user.role,
            avatarUrl: user.avatarUrl,
        };
    }

    async login(email, password) {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw new Error("INVALID_CREDENTIALS");
        }

        if (!user.isActive) {
            throw new Error("ACCOUNT_NOT_ACTIVATED");
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = jwt.sign(
            tokenPayload,
            process.env.JWT_ACCESS_SECRET || "default_access_secret",
            { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h" },
        );

        return {
            accessToken,
            user: this.sanitizeUser(user),
            redirectUrl: this.getRedirectUrl(user.role),
        };
    }

    async getProfile(userId) {
        const user = await User.findByPk(userId);
        if (!user || !user.isActive) {
            throw new Error("USER_NOT_FOUND");
        }

        return this.sanitizeUser(user);
    }
}

export default new LoginService();
