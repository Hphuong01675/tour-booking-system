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

export const exportOperatorToursCSV = async () => {
  const response = await axiosInstance.get("/api/operator/tours/export", {
    responseType: "blob",
  });
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

export const createOperatorTour = async (tourData) => {
  const response = await axiosInstance.post("/api/operator/tours", tourData);
  return response.data;
};

export const uploadTourImages = async (tourId, formData) => {
  const response = await axiosInstance.post(`/api/operator/tours/${tourId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 60000, // 60s timeout for image upload to avoid connection aborts
  });
  return response.data;
};
export const deleteTourImage = async (tourId, imageId) => {
  const response = await axiosInstance.delete(`/api/operator/tours/${tourId}/images/${imageId}`);
  return response.data;
};

export const getOperatorTourBySlug = async (slug) => {
  const response = await axiosInstance.get(`/api/operator/tours/by-slug/${slug}`);
  return response.data;
};

export const getInfoCategories = async () => {
  const response = await axiosInstance.get("/api/operator/info-categories");
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

export const approveBooking = async (bookingId, approvedParticipantIds) => {
  const response = await axiosInstance.put(`/api/operator/bookings/${bookingId}/approve`, { approvedParticipantIds });
  return response.data;
};

export const updateParticipantCCCD = async (participantId, formData) => {
  const response = await axiosInstance.put(`/api/operator/participants/${participantId}/cccd`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const addParticipantToBooking = async (bookingId, formData) => {
  const response = await axiosInstance.post(`/api/operator/bookings/${bookingId}/participants`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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

export const getRefundEstimate = async (bookingId, participantIds = []) => {
  const response = await axiosInstance.get(`/api/operator/bookings/${bookingId}/refund-estimate`, {
    params: { participantIds: participantIds.join(",") }
  });
  return response.data;
};

export const cancelBooking = async (bookingId, reason, participantIds = []) => {
  const response = await axiosInstance.post(`/api/operator/bookings/${bookingId}/cancel`, { reason, participantIds });
  return response.data;
};
