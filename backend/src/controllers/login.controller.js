import loginService from "../services/login.service";

class LoginController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await loginService.login(email, password);

            return res.status(200).json({
                success: true,
                message: "Dang nhap thanh cong.",
                ...result,
            });
        } catch (error) {
            if (error.message === "ACCOUNT_NOT_ACTIVATED") {
                return res.status(403).json({
                    success: false,
                    error: "Tai khoan chua duoc kich hoat.",
                    code: "ACCOUNT_NOT_ACTIVATED",
                });
            }

            if (error.message === "INVALID_CREDENTIALS") {
                return res.status(401).json({
                    success: false,
                    error: "Email hoac mat khau khong dung.",
                    code: "INVALID_CREDENTIALS",
                });
            }

            return res.status(500).json({
                success: false,
                error: "Loi he thong khi dang nhap.",
                code: "LOGIN_FAILED",
            });
        }
    }

    async me(req, res) {
        try {
            const user = await loginService.getProfile(req.user.id);

            return res.status(200).json({
                success: true,
                user,
                redirectUrl: loginService.getRedirectUrl(user.role),
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: "Khong tim thay nguoi dung.",
                code: "USER_NOT_FOUND",
            });
        }
    }

    async userProfile(req, res) {
        return this.me(req, res);
    }

    async adminProfile(req, res) {
        return this.me(req, res);
    }
}

export default new LoginController();
