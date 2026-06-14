import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages - Register
import RegisterPage from './pages/auth/RegisterPage';
import OTPPage from './pages/auth/OTPPage';

// Auth Pages - Forgot Password
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Guide Pages
import GuideAssignedToursPage from './pages/Guide/GuideAssignedToursPage';
import GuideTourDetailPage from './pages/Guide/GuideTourDetailPage';
import GuideChatPage from './pages/Guide/GuideChatPage';
import GuideProfilePage from './pages/Guide/GuideProfilePage';

// Manager Pages
import ManagerToursPage from './pages/manager/ManagerToursPage';
import ManagerApprovalsPage from './pages/manager/ManagerApprovalsPage';
import ManagerProfilePage from './pages/manager/ManagerProfilePage';
import ManagerNewTourPage from './pages/manager/ManagerNewTourPage';
import ManagerCancelCustomerPage from './pages/manager/ManagerCancelCustomerPage';
import ManagerGuideAssignPage from './pages/manager/ManagerGuideAssignPage';
import ManagerHardApprovalPage from './pages/manager/ManagerHardApprovalPage';
import ManagerCustomerVerifyPage from './pages/manager/ManagerCustomerVerifyPage';

function App() {
  return (
    <Routes>
      {/* Redirect base URL to the Guide Tours Dashboard directly */}
      <Route path="/" element={<Navigate to="/guides/tours" replace />} />
      
      {/* Auth routes - Register */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OTPPage />} />
      <Route path="/login-success" element={<Navigate to="/guides/tours" replace />} />

      {/* Auth routes - Forgot Password */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/forgot-password-verify-otp" element={<VerifyOTPPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Guide routes */}
      <Route path="/guides/tours" element={<GuideAssignedToursPage />} />
      <Route path="/guides/tours/:id" element={<GuideTourDetailPage />} />
      <Route path="/guides/consultations" element={<GuideChatPage />} />
      <Route path="/guides/profile" element={<GuideProfilePage />} />
      
      {/* Manager routes */}
      <Route path="/managers/tours" element={<ManagerToursPage />} />
      <Route path="/managers/tours/new" element={<ManagerNewTourPage />} />
      <Route path="/managers/approvals" element={<ManagerApprovalsPage />} />
      <Route path="/managers/approvals/hard" element={<ManagerHardApprovalPage />} />
      <Route path="/managers/profile" element={<ManagerProfilePage />} />
      <Route path="/managers/customers/cancel" element={<ManagerCancelCustomerPage />} />
      <Route path="/managers/customers/verify/:id" element={<ManagerCustomerVerifyPage />} />
      <Route path="/managers/guides/assign" element={<ManagerGuideAssignPage />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/guides/tours" replace />} />
    </Routes>
  );
}


export default App;
