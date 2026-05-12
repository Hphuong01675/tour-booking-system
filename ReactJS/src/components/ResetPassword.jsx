import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "../features/auth/authSlice";
import Button from "./ui/Button";
import Input from "./ui/Input";

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const dispatch = useDispatch();
    const { resetToken, loading, error } = useSelector((state) => state.auth);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!resetToken) {
            alert(
                "Phiên làm việc không hợp lệ, vui lòng thực hiện lại từ bước gửi mã OTP.",
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp");
            return;
        }
        dispatch(resetPassword({ newPassword, resetToken }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Đặt lại mật khẩu
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Nhập mật khẩu mới
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        label="Mật khẩu mới"
                        type="password"
                        placeholder="Mật khẩu mới"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Xác nhận mật khẩu"
                        type="password"
                        placeholder="Xác nhận mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
