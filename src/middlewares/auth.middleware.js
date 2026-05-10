const jwt = require("jsonwebtoken");

const verifyResetToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>

    if (!token)
        return res.status(403).json({ message: "Không có quyền truy cập." });

    jwt.verify(token, process.env.JWT_OTP_SECRET, (err, decoded) => {
        if (err)
            return res.status(401).json({ message: "Phiên làm việc hết hạn." });

        // Lưu email vào request để controller sử dụng
        req.userEmail = decoded.email;
        next();
    });
};

const authorizeRoles = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.user.roleId)) {

            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập",
            });
        }

        next();
    };
};
const verifyToken = (req, res, next) => {

    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {

        return res.status(401).json({
            success: false,
            message: "Không có token",
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ",
        });
    }
};

module.exports = { verifyResetToken,authorizeRoles,verifyToken };
