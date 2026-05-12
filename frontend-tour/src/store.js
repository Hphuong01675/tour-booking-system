import { configureStore, createSlice } from '@reduxjs/toolkit';

// Tạo Slice để quản lý đăng ký
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: false,
        error: null,
        emailForOTP: null, // Lưu email để dùng bên trang OTP
    },
    reducers: {
        registerStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        registerSuccess: (state, action) => {
            state.loading = false;
            state.emailForOTP = action.payload;
            state.error = null;
        },
        registerFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const { registerStart, registerSuccess, registerFailure, clearError } = authSlice.actions;

const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
    },
});

export default store;