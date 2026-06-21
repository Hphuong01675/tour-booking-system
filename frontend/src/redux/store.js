import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import forgotPasswordReducer from "../features/auth/forgotPasswordSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        forgotPassword: forgotPasswordReducer,
    },
});

export default store;
