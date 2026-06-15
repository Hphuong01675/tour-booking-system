class LoginValidation {
    isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email) && email.length <= 150;
    }

    validateLogin = (req, res, next) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email va mat khau la bat buoc.",
                code: "MISSING_LOGIN_FIELDS",
            });
        }

        if (!this.isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                error: "Email khong hop le.",
                code: "INVALID_EMAIL",
            });
        }

        if (typeof password !== "string" || password.length > 128) {
            return res.status(400).json({
                success: false,
                error: "Mat khau khong hop le.",
                code: "INVALID_PASSWORD",
            });
        }

        next();
    };
}

export default new LoginValidation();
