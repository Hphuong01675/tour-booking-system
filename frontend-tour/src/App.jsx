import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
// BẠN THIẾU DÒNG NÀY NÈ:
import Home from "./pages/Home";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/home" element={<Home />} />

                {/* Mặc định vào web sẽ thấy trang chủ Hero luôn */}
                <Route path="/" element={<Navigate to="/home" />} />
            </Routes>
        </BrowserRouter>
    );
}