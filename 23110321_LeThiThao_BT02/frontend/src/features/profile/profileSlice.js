import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { setAuthToken } from "../../api/axiosConfig";

const getStoredToken = () => localStorage.getItem("tour-profile-token") || "";

export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (_, thunkAPI) => {
    const token = getStoredToken();
    if (!token) {
      return thunkAPI.rejectWithValue("Token not found. Please enter a valid access token.");
    }

    setAuthToken(token);
    const response = await axios.get("/users/profile");
    return response.data.data;
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (profileData, thunkAPI) => {
    const token = getStoredToken();
    if (!token) {
      return thunkAPI.rejectWithValue("Token not found. Please enter a valid access token.");
    }

    setAuthToken(token);
    const response = await axios.put("/users/profile", profileData);
    return response.data.data;
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    profile: null,
    token: getStoredToken(),
    loading: false,
    error: null,
    successMessage: "",
  },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem("tour-profile-token", action.payload);
      } else {
        localStorage.removeItem("tour-profile-token");
      }
    },
    clearStatus(state) {
      state.error = null;
      state.successMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = "";
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = "";
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.successMessage = "Cập nhật hồ sơ thành công.";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setToken, clearStatus } = profileSlice.actions;
export default profileSlice.reducer;
