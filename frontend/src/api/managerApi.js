import axiosInstance from "./axiosInstance";

export const getManagerProfile = async () => {
  const response = await axiosInstance.get("/api/managers/profile");
  return response.data;
};

export const updateManagerProfile = async (profileData) => {
  const response = await axiosInstance.patch("/api/managers/profile", profileData);
  return response.data;
};

export const changeManagerPassword = async (currentPassword, newPassword) => {
  const response = await axiosInstance.post("/api/managers/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};
