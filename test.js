require("dotenv").config();
const jwt = require("jsonwebtoken");

const token = jwt.sign(
    {
        id: 1,
        email: "test@gmail.com",
    },
    process.env.JWT_SECRET, // ✅ sửa ở đây
    { expiresIn: "1h" }
);

console.log(token);