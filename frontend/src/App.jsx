import { Routes, Route, Navigate } from "react-router-dom";

// Auth Pages - Login
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Auth Pages - Register
import RegisterPage from "./pages/auth/RegisterPage";
import OTPPage from "./pages/auth/OTPPage";

// Auth Pages - Forgot Password
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Layouts
import GuideLayout from "./layouts/GuideLayout";

// Guide Pages
import GuideAssignedToursPage from "./pages/guide/GuideAssignedToursPage";
import GuideTourDetailPage from "./pages/guide/GuideTourDetailPage";
import GuideChatPage from "./pages/guide/GuideChatPage";
import GuideProfilePage from "./pages/guide/GuideProfilePage";

// Operator Pages
import OperatorToursPage from "./pages/operator/OperatorToursPage";
import OperatorApprovalsPage from "./pages/operator/OperatorApprovalsPage";
import OperatorProfilePage from "./pages/operator/OperatorProfilePage";
import OperatorNewTourPage from "./pages/operator/OperatorNewTourPage";
import OperatorCancelCustomerPage from "./pages/operator/OperatorCancelCustomerPage";
import OperatorGuideAssignPage from "./pages/operator/OperatorGuideAssignPage";
import OperatorHardApprovalPage from "./pages/operator/OperatorHardApprovalPage";
import OperatorCustomerVerifyPage from "./pages/operator/OperatorCustomerVerifyPage";
import OperatorDashboardPage from "./pages/operator/OperatorDashboardPage";
// Removed missing imports: OperatorTourDetailPage, OperatorParticipantsPage

// Profile/Dashboard Pages for other roles
import CustomerToursPage from "./pages/customer/CustomerToursPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import Homepage from "./pages/Homepage";

function App() {
    return (
        <Routes>
            {/* Base URL Route */}
            <Route path="/" element={<Homepage />} />

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

            {/* Customer routes */}
            <Route
                path="/customer/tours"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <CustomerToursPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/customer/profile"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <CustomerProfilePage />
                    </ProtectedRoute>
                }
            />

            {/* Admin routes */}
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboardPage />
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

            {/* Operator routes */}
            <Route
                path="/operator/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorDashboardPage />
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
                path="/operator/tours"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorToursPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/tours/:id"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorToursPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/tours/:id/participants"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorToursPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/tours/new"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorNewTourPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/approvals"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorApprovalsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/approvals/hard"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorHardApprovalPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/customers/cancel"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorCancelCustomerPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/customers/verify/:id"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorCustomerVerifyPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/operator/guides/assign"
                element={
                    <ProtectedRoute allowedRoles={["operator"]}>
                        <OperatorGuideAssignPage />
                    </ProtectedRoute>
                }
            />

            {/* Guide routes sharing GuideLayout */}
            <Route element={<GuideLayout />}>
                <Route
                    path="/guide/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["guide"]}>
                            <GuideAssignedToursPage />
                        </ProtectedRoute>
                    }
                />
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
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/guides/tours" replace />} />
        </Routes>
    );
}

export default App;