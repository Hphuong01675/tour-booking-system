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

module.exports = { verifyResetToken };
