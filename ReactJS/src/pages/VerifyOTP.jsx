import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyOTP, setOTP } from "../features/auth/authSlice";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const VerifyOTP = () => {
    const [otpInput, setOtpInput] = useState("");
    const dispatch = useDispatch();
    const { email, loading, error } = useSelector((state) => state.auth);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(setOTP(otpInput));
        dispatch(verifyOTP({ email, otp: otpInput }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Xác minh OTP
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Nhập mã OTP đã gửi đến email {email}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        label="Mã OTP"
                        type="text"
                        placeholder="Mã OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        required
                    />
                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Đang xác minh..." : "Xác minh OTP"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default VerifyOTP;
