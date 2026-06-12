import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    forgotPasswordApi,
    verifyForgotPasswordOTPApi,
    resetPasswordApi,
} from "../../api/authApi";

// ================================================
// Async Thunks
// ================================================

/**
 * Bước 1: Gửi email để nhận OTP quên mật khẩu
 */
export const requestForgotPassword = createAsyncThunk(
    "forgotPassword/requestOTP",
    async (email, { rejectWithValue }) => {
        try {
            const response = await forgotPasswordApi(email);
            return response.data.message;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Bước 2: Xác minh OTP và nhận resetToken
 */
export const verifyForgotPasswordOTP = createAsyncThunk(
    "forgotPassword/verifyOTP",
    async ({ email, otp }, { rejectWithValue }) => {
        try {
            const response = await verifyForgotPasswordOTPApi(email, otp);
            return response.data.resetToken;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Bước 3: Đặt lại mật khẩu mới bằng resetToken
 */
export const resetPassword = createAsyncThunk(
    "forgotPassword/resetPassword",
    async ({ newPassword, resetToken }, { rejectWithValue }) => {
        try {
            const response = await resetPasswordApi(newPassword, resetToken);
            return response.data.message;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// ================================================
// Slice
// ================================================

const forgotPasswordSlice = createSlice({
    name: "forgotPassword",
    initialState: {
        email: "",           // Email người dùng nhập ở bước 1
        resetToken: null,    // JWT token nhận được sau bước 2
        loading: false,
        error: null,
        successMessage: null,
    },
    reducers: {
        // Lưu email khi người dùng submit form bước 1
        setForgotEmail: (state, action) => {
            state.email = action.payload;
        },
        // Xóa lỗi
        clearForgotPasswordError: (state) => {
            state.error = null;
        },
        // Reset toàn bộ state
        resetForgotPasswordState: (state) => {
            state.email = "";
            state.resetToken = null;
            state.loading = false;
            state.error = null;
            state.successMessage = null;
        },
    },
    extraReducers: (builder) => {
        // ── Bước 1: requestForgotPassword ──
        builder
            .addCase(requestForgotPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(requestForgotPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload;
            })
            .addCase(requestForgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // ── Bước 2: verifyForgotPasswordOTP ──
        builder
            .addCase(verifyForgotPasswordOTP.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyForgotPasswordOTP.fulfilled, (state, action) => {
                state.loading = false;
                state.resetToken = action.payload; // Lưu resetToken
            })
            .addCase(verifyForgotPasswordOTP.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // ── Bước 3: resetPassword ──
        builder
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload;
                // Xóa token sau khi dùng xong
                state.resetToken = null;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    setForgotEmail,
    clearForgotPasswordError,
    resetForgotPasswordState,
} = forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;
