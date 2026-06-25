import jwt from "jsonwebtoken";
import db from "../models";

export const verifyAccessToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Token truy cap bi thieu.",
            code: "ACCESS_TOKEN_MISSING",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || "default_access_secret",
        );

        const user = await db.User.findByPk(decoded.id, {
            attributes: ["id", "email", "role", "isActive"],
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: "Tai khoan khong ton tai hoac da bi khoa.",
                code: "ACCOUNT_INACTIVE",
            });
        }

        if (user.role !== decoded.role) {
            return res.status(401).json({
                success: false,
                error: "Thong tin phien dang nhap khong con hop le.",
                code: "STALE_ACCESS_TOKEN",
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error:
                error.name === "TokenExpiredError"
                    ? "Phien dang nhap da het han."
                    : "Token truy cap khong hop le.",
            code: "INVALID_ACCESS_TOKEN",
        });
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: "Ban khong co quyen truy cap tai nguyen nay.",
                code: "FORBIDDEN",
            });
        }

        next();
    };
};
