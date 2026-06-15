import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import loginApi from "../../api/loginApi";

const readStoredUser = () => {
    try {
        const rawUser = localStorage.getItem("currentUser");
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        localStorage.removeItem("currentUser");
        return null;
    }
};

const getInitialState = () => {
    const accessToken = localStorage.getItem("accessToken");
    const user = readStoredUser();

    return {
        user,
        accessToken,
        redirectUrl: null,
        loading: false,
        error: null,
        isAuthenticated: Boolean(accessToken && user),
    };
};

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await loginApi.login({ email, password });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchCurrentUser = createAsyncThunk(
    "auth/fetchCurrentUser",
    async (_, { rejectWithValue }) => {
        try {
            const response = await loginApi.getMe();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState: getInitialState(),
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
        logoutUser: (state) => {
            state.user = null;
            state.accessToken = null;
            state.redirectUrl = null;
            state.loading = false;
            state.error = null;
            state.isAuthenticated = false;
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.redirectUrl = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                const { accessToken, user, redirectUrl } = action.payload;

                state.loading = false;
                state.user = user;
                state.accessToken = accessToken;
                state.redirectUrl = redirectUrl;
                state.isAuthenticated = Boolean(accessToken && user);

                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("currentUser", JSON.stringify(user));
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Dang nhap that bai.";
                state.isAuthenticated = false;
            })
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                const user = action.payload.user;

                state.loading = false;
                state.user = user;
                state.isAuthenticated = Boolean(state.accessToken && user);
                localStorage.setItem("currentUser", JSON.stringify(user));
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Khong the tai thong tin nguoi dung.";
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
                localStorage.removeItem("accessToken");
                localStorage.removeItem("currentUser");
            });
    },
});

export const { clearAuthError, logoutUser } = authSlice.actions;

export default authSlice.reducer;
