import axiosInstance from "./axiosInstance";

export const getAssignedTours = async (params) => {
  const response = await axiosInstance.get("/api/guides/assigned-tours", { params });
  return response.data;
};

export const getGuideStats = async () => {
  const response = await axiosInstance.get("/api/guides/stats");
  return response.data;
};

export const exportToursReport = async (params) => {
  const response = await axiosInstance.get("/api/guides/assigned-tours/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};
