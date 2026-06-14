import { Routes, Route, Navigate } from "react-router-dom";

// Auth Pages - Login
import LoginPage from "./pages/Auth/LoginPage";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

// Auth Pages - Register
import RegisterPage from "./pages/Auth/RegisterPage";
import OTPPage from "./pages/Auth/OTPPage";

// Auth Pages - Forgot Password
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import VerifyOTPPage from "./pages/Auth/VerifyOTPPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";

// Guide Pages
import GuideDashboardPage from "./pages/Guide/GuideDashboardPage";
import GuideAssignedToursPage from "./pages/Guide/GuideAssignedToursPage";
import GuideTourDetailPage from "./pages/Guide/GuideTourDetailPage";
import GuideChatPage from "./pages/Guide/GuideChatPage";
import GuideProfilePage from "./pages/Guide/GuideProfilePage";

// Manager Pages
import ManagerToursPage from "./pages/manager/ManagerToursPage";
import ManagerApprovalsPage from "./pages/manager/ManagerApprovalsPage";
import ManagerProfilePage from "./pages/manager/ManagerProfilePage";
import ManagerNewTourPage from "./pages/manager/ManagerNewTourPage";
import ManagerCancelCustomerPage from "./pages/manager/ManagerCancelCustomerPage";
import ManagerGuideAssignPage from "./pages/manager/ManagerGuideAssignPage";
import ManagerHardApprovalPage from "./pages/manager/ManagerHardApprovalPage";
import ManagerCustomerVerifyPage from "./pages/manager/ManagerCustomerVerifyPage";

// Profile Pages
import CustomerToursPage from "./pages/Customer/CustomerToursPage";
import CustomerProfilePage from "./pages/Customer/CustomerProfilePage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminProfilePage from "./pages/Admin/AdminProfilePage";
import OperatorDashboardPage from "./pages/Operator/OperatorDashboardPage";
import OperatorProfilePage from "./pages/Operator/OperatorProfilePage";

function App() {
    return (
        <Routes>
            {/* Redirect base URL to the Guide Tours Dashboard directly */}
            <Route path="/" element={<Navigate to="/guides/tours" replace />} />

            {/* Auth routes - Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Auth routes - Register */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OTPPage />} />
            <Route
                path="/login-success"
                element={<Navigate to="/guides/tours" replace />}
            />

            {/* Auth routes - Forgot Password */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
                path="/forgot-password-verify-otp"
                element={<VerifyOTPPage />}
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Role based home routes */}
            <Route
                path="/customer/tours"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <CustomerToursPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorDashboardPage />
                    </ProtectedRoute>
                }
            />

            {/* Role based profile routes */}
            <Route
                path="/customer/profile"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <CustomerProfilePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/profile"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminProfilePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/profile"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorProfilePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/guide/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["guide"]}>
                        <GuideDashboardPage />
                    </ProtectedRoute>
                }
            />

            {/* Guide routes */}
            <Route
                path="/guides/tours"
                element={
                    <ProtectedRoute allowedRoles={["guide"]}>
                        <GuideAssignedToursPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/guides/tours/:id"
                element={
                    <ProtectedRoute allowedRoles={["guide"]}>
                        <GuideTourDetailPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/guides/consultations"
                element={
                    <ProtectedRoute allowedRoles={["guide"]}>
                        <GuideChatPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/guide/profile"
                element={
                    <ProtectedRoute allowedRoles={["guide"]}>
                        <GuideProfilePage />
                    </ProtectedRoute>
                }
            />

            {/* Manager routes */}
            <Route path="/managers/tours" element={<ManagerToursPage />} />
            <Route
                path="/managers/tours/new"
                element={<ManagerNewTourPage />}
            />
            <Route
                path="/managers/approvals"
                element={<ManagerApprovalsPage />}
            />
            <Route
                path="/managers/approvals/hard"
                element={<ManagerHardApprovalPage />}
            />
            <Route path="/managers/profile" element={<ManagerProfilePage />} />
            <Route
                path="/managers/customers/cancel"
                element={<ManagerCancelCustomerPage />}
            />
            <Route
                path="/managers/customers/verify/:id"
                element={<ManagerCustomerVerifyPage />}
            />
            <Route
                path="/managers/guides/assign"
                element={<ManagerGuideAssignPage />}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/guides/tours" replace />} />
        </Routes>
    );
}

export default App;
