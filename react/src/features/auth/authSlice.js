import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axiosClient";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/login", credentials);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Lỗi đăng nhập";
      return rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    status: "idle",
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        const payload = action.payload?.data || action.payload;
        state.user = payload;
        state.token = payload?.token || null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
