import jwt from "jsonwebtoken";

export const verifyAccessToken = (req, res, next) => {
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
