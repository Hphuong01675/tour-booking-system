import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GuideAssignedToursPage from './pages/Guide/GuideAssignedToursPage';
import GuideTourDetailPage from './pages/Guide/GuideTourDetailPage';
import GuideChatPage from './pages/Guide/GuideChatPage';
import GuideProfilePage from './pages/Guide/GuideProfilePage';
import RegisterPage from './pages/Auth/RegisterPage';
import OTPPage from './pages/Auth/OTPPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect base URL to the Guide Tours Dashboard directly */}
        <Route path="/" element={<Navigate to="/guides/tours" replace />} />
        
        {/* Auth routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPPage />} />
        <Route path="/login-success" element={<Navigate to="/guides/tours" replace />} />

        {/* Guide routes */}
        <Route path="/guides/tours" element={<GuideAssignedToursPage />} />
        <Route path="/guides/tours/:id" element={<GuideTourDetailPage />} />
        <Route path="/guides/consultations" element={<GuideChatPage />} />
        <Route path="/guides/profile" element={<GuideProfilePage />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/guides/tours" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
