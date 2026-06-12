import { configureStore } from "@reduxjs/toolkit";
import forgotPasswordReducer from "../features/auth/forgotPasswordSlice";

const store = configureStore({
    reducer: {
        forgotPassword: forgotPasswordReducer,
    },
});

export default store;
