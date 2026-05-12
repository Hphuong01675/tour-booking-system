import { useSelector } from "react-redux";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";

function App() {
    const { step } = useSelector((state) => state.auth);

    const renderStep = () => {
        switch (step) {
            case "forgot":
                return <ForgotPassword />;
            case "verify":
                return <VerifyOTP />;
            case "reset":
                return <ResetPassword />;
            case "success":
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full space-y-8 text-center">
                            <h2 className="text-3xl font-extrabold text-gray-900">
                                Thành công!
                            </h2>
                            <p className="text-gray-600">
                                Mật khẩu của bạn đã được đặt lại thành công.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Quay lại
                            </button>
                        </div>
                    </div>
                );
            default:
                return <ForgotPassword />;
        }
    };

    return <div className="App">{renderStep()}</div>;
}

export default App;
