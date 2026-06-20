import axiosInstance from "./axiosInstance";

export const getOperatorProfile = async () => {
  const response = await axiosInstance.get("/api/operator/profile");
  return response.data;
};

export const updateOperatorProfile = async (profileData) => {
  const response = await axiosInstance.patch("/api/operator/profile", profileData);
  return response.data;
};

export const changeOperatorPassword = async (currentPassword, newPassword) => {
  const response = await axiosInstance.post("/api/operator/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const getOperatorTours = async () => {
  const response = await axiosInstance.get("/api/operator/tours");
  return response.data;
};
