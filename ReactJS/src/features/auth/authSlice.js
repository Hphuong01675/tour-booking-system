import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authAPI from "../../utils/api";

// Async thunks
export const forgotPassword = createAsyncThunk(
    "auth/forgotPassword",
    async (email, { rejectWithValue }) => {
        try {
            const response = await authAPI.forgotPassword(email);
            return response;
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);

export const verifyOTP = createAsyncThunk(
    "auth/verifyOTP",
    async ({ email, otp }, { rejectWithValue }) => {
        try {
            const response = await authAPI.verifyOTP(email, otp);
            return response;
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);

export const resetPassword = createAsyncThunk(
    "auth/resetPassword",
    async ({ newPassword, resetToken }, { rejectWithValue }) => {
        try {
            const response = await authAPI.resetPassword(
                newPassword,
                resetToken,
            );
            return response;
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);

const authSlice = createSlice({
    name: "auth",
    initialState: {
        step: "forgot", // 'forgot', 'verify', 'reset', 'success'
        email: "",
        otp: "",
        resetToken: "",
        loading: false,
        error: null,
    },
    reducers: {
        setEmail: (state, action) => {
            state.email = action.payload;
        },
        setOTP: (state, action) => {
            state.otp = action.payload;
        },
        setStep: (state, action) => {
            state.step = action.payload;
        },
        resetState: (state) => {
            state.step = "forgot";
            state.email = "";
            state.otp = "";
            state.resetToken = "";
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(forgotPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state) => {
                state.loading = false;
                state.step = "verify";
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            })
            .addCase(verifyOTP.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyOTP.fulfilled, (state, action) => {
                state.loading = false;
                state.resetToken = action.payload.resetToken;
                state.step = "reset";
            })
            .addCase(verifyOTP.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            })
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.loading = false;
                state.step = "success";
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.payload?.message || "Đặt lại mật khẩu thất bại";
            });
    },
});

export const { setEmail, setOTP, setStep, resetState } = authSlice.actions;
export default authSlice.reducer;
