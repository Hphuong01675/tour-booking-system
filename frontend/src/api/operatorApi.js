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

// --- Tours management ---
export const getOperatorTours = async (params) => {
  const response = await axiosInstance.get("/api/operator/tours", { params });
  return response.data;
};

export const getOperatorTourDetail = async (id) => {
  const response = await axiosInstance.get(`/api/operator/tours/${id}`);
  return response.data;
};

export const updateOperatorTour = async (id, tourData) => {
  const response = await axiosInstance.patch(`/api/operator/tours/${id}`, tourData);
  return response.data;
};

// --- Guide assignments ---
export const getScheduleDetail = async (scheduleId) => {
  const response = await axiosInstance.get(`/api/operator/tour-schedules/${scheduleId}`);
  return response.data;
};

export const getAvailableGuides = async (scheduleId, page) => {
  const response = await axiosInstance.get("/api/operator/guides/available", {
    params: { scheduleId, page, limit: 4 },
  });
  return response.data;
};

export const assignGuide = async (scheduleId, guideId) => {
  const response = await axiosInstance.post("/api/operator/tour-assignments", {
    scheduleId,
    guideId,
  });
  return response.data;
};

// --- Customer verifications ---
export const getHardApprovalTours = async () => {
  const response = await axiosInstance.get("/api/operator/tours/hard-approval");
  return response.data;
};

export const getTourParticipants = async (tourId, params) => {
  const response = await axiosInstance.get(`/api/operator/tours/${tourId}/participants`, { params });
  return response.data;
};

export const getBookingVerification = async (bookingId) => {
  const response = await axiosInstance.get(`/api/operator/bookings/${bookingId}/verify`);
  return response.data;
};

export const approveBooking = async (bookingId) => {
  const response = await axiosInstance.put(`/api/operator/bookings/${bookingId}/approve`);
  return response.data;
};

export const rejectBooking = async (bookingId, reason) => {
  const response = await axiosInstance.put(`/api/operator/bookings/${bookingId}/reject`, { reason });
  return response.data;
};

export const getPendingBookings = async () => {
  const response = await axiosInstance.get("/api/operator/bookings/pending");
  return response.data;
};

// --- Customer Cancellations ---
export const searchCustomer = async (search) => {
  const response = await axiosInstance.get("/api/operator/customers", { params: { search } });
  return response.data;
};

export const getCustomerBookings = async (customerId) => {
  const response = await axiosInstance.get(`/api/operator/customers/${customerId}/bookings`);
  return response.data;
};

export const getRefundEstimate = async (bookingId) => {
  const response = await axiosInstance.get(`/api/operator/bookings/${bookingId}/refund-estimate`);
  return response.data;
};

export const cancelBooking = async (bookingId, reason) => {
  const response = await axiosInstance.post(`/api/operator/bookings/${bookingId}/cancel`, { reason });
  return response.data;
};
