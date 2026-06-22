// Đường dẫn: frontend/src/api/guideApi.js
/**
 * Guide API Layer
 * Quản lý các gọi API liên quan đến danh sách tour phân công cho hướng dẫn viên
 * Dữ liệu từ bảng: tour_assignments, tour_schedules, tours
 */

import axios from 'axios';

// Normalize VITE_API_URL so API base always ends with /api
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token vào headers nếu tồn tại
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi response
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Guide API Error:', error.message);
      return Promise.reject(error);
    }
);

/**
 * Lấy danh sách tour phân công cho guide
 * Kết hợp dữ liệu từ: tour_assignments -> tour_schedules -> tours
 *
 * @param {Object} filters - Các tham số lọc
 * @param {string} filters.status - Trạng thái: 'all', 'open', 'closed', 'cancelled'
 * @param {string} filters.month - Tháng: 'all', 'current', 'next', 'next-3'
 * @param {number} filters.page - Số trang (default: 1)
 * @param {number} filters.limit - Số item/trang (default: 10)
 *
 * @returns {Promise<Object>}
 * {
 *   tours: [
 *     {
 *       id: schedule_id,
 *       assignmentId: tour_assignment.id,
 *       tourId: tours.id,
 *       title: tours.title,
 *       destination: tours.destination,
 *       thumbnailUrl: tours.thumbnail_url,
 *       departureDate: tour_schedules.departure_date,
 *       returnDate: tour_schedules.return_date,
 *       status: tour_schedules.status,
 *       maxCapacity: tour_schedules.max_capacity,
 *       registered: tour_schedules.registered,
 *       scheduleCode: tour_schedules.schedule_code
 *     }
 *   ],
 *   total: number,
 *   page: number,
 *   limit: number
 * }
 */
export const getAssignedTours = async (filters = {}) => {
  try {
    const { status = 'all', month = 'all', page = 1, limit = 10 } = filters;

    const response = await apiClient.get('/guides/assigned-tours', {
      params: {
        status,
        month,
        page,
        limit,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch assigned tours:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết một tour phân công
 * @param {string} assignmentId - ID của tour assignment
 * @returns {Promise<Object>}
 */
export const getTourAssignmentDetail = async (assignmentId, filters = {}) => {
  try {
    const response = await apiClient.get(`/guides/assigned-tours/${assignmentId}`, {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch assignment detail (${assignmentId}):`, error);
    throw error;
  }
};

/**
 * Lấy thống kê tổng quan cho guide
 * @returns {Promise<Object>}
 * { totalTours: number, upcomingTours: number, completedTours: number, ... }
 */
export const getGuideStats = async () => {
  try {
    const response = await apiClient.get('/guides/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch guide stats:', error);
    throw error;
  }
};

/**
 * Xuất báo cáo danh sách tour phân công thành file
 * @param {Object} filters - Bộ lọc để xuất
 * @returns {Promise<Blob>} - File blob (Excel, PDF, ...)
 */
export const exportToursReport = async (filters = {}) => {
  try {
    const response = await apiClient.get('/guides/assigned-tours/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to export report:', error);
    throw error;
  }
};

/**
 * Xuất danh sách khách hàng của một lịch trình (assignment/schedule)
 * @param {string} assignmentId
 * @returns {Promise<Blob>}
 */
export const exportCustomers = async (assignmentId) => {
  try {
    const response = await apiClient.get(`/guides/assigned-tours/${assignmentId}/export-customers`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to export customers for ${assignmentId}:`, error);
    throw error;
  }
};

/**
 * Gửi thông báo toàn đoàn (confirm_trip | announcement)
 * @param {string} assignmentId
 * @param {Object} payload - { type, subject, content, notes }
 */
export const sendGroupNotification = async (assignmentId, payload) => {
  try {
    const response = await apiClient.post(`/guides/assigned-tours/${assignmentId}/notify`, payload);
    return response.data;
  } catch (error) {
    console.error(`Failed to send group notification for ${assignmentId}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách template vật dụng từ hệ thống
 */
export const getChecklistTemplates = async () => {
  try {
    const response = await apiClient.get('/guides/checklist-templates');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch checklist templates:', error);
    throw error;
  }
};

/**
 * Lấy danh sách vật dụng của guide
 */
export const getPackingItems = async () => {
  try {
    const response = await apiClient.get('/guides/packing-items');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch packing items:', error);
    throw error;
  }
};

/**
 * Thêm vật dụng mới
 */
export const createPackingItem = async (payload) => {
  try {
    const response = await apiClient.post('/guides/packing-items', payload);
    return response.data;
  } catch (error) {
    console.error('Failed to create packing item:', error);
    throw error;
  }
};

/**
 * Sửa vật dụng
 */
export const updatePackingItem = async (itemId, payload) => {
  try {
    const response = await apiClient.patch(`/guides/packing-items/${itemId}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Failed to update packing item ${itemId}:`, error);
    throw error;
  }
};

/**
 * Xóa vật dụng
 */
export const deletePackingItem = async (itemId) => {
  try {
    const response = await apiClient.delete(`/guides/packing-items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete packing item ${itemId}:`, error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái tour assignment
 * @param {string} assignmentId - ID của assignment
 * @param {string} newStatus - Trạng thái mới
 * @returns {Promise<Object>}
 */
export const updateAssignmentStatus = async (assignmentId, newStatus) => {
  try {
    const response = await apiClient.patch(
        `/guides/assigned-tours/${assignmentId}/status`,
        { status: newStatus }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update assignment status (${assignmentId}):`, error);
    throw error;
  }
};

/**
 * Scan QR Code to checkin a participant
 * @param {string} assignmentId
 * @param {string} checkinCode
 */
export const checkinParticipant = async (assignmentId, checkinCode) => {
  try {
    const response = await apiClient.post(
        `/guides/assigned-tours/${assignmentId}/checkin`,
        { checkinCode }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to checkin participant for ${assignmentId}:`, error);
    throw error;
  }
};

/**
 * Upload CCCD images (front/back) for a participant
 * @param {string} assignmentId
 * @param {string} participantId
 * @param {FormData} formData - multipart form data containing files: front, back
 */
export const uploadParticipantCccd = async (assignmentId, participantId, formData) => {
  try {
    const response = await apiClient.post(
        `/guides/assigned-tours/${assignmentId}/participants/${participantId}/cccd`,
        formData,
        { timeout: 60000 }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to upload CCCD for participant ${participantId}:`, error);
    throw error;
  }
};

export const getGuideProfile = async () => {
  try {
    const response = await apiClient.get('/guides/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch guide profile:', error);
    throw error;
  }
};

export const updateGuideProfile = async (data) => {
  try {
    const response = await apiClient.patch('/guides/profile', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update guide profile:', error);
    throw error;
  }
};

export const uploadGuideAvatar = async (formData) => {
  try {
    const response = await apiClient.post('/guides/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload guide avatar:', error);
    throw error;
  }
};

export const changeGuidePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.post('/guides/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to change guide password:', error);
    throw error;
  }
};



export const saveChecklistTemplate = async (data) => {
  try {
    const response = await apiClient.post('/guides/checklist-templates', data);
    return response.data;
  } catch (error) {
    console.error('Failed to save checklist template:', error);
    throw error;
  }
};

export default {
  getAssignedTours,
  getTourAssignmentDetail,
  getGuideStats,
  exportToursReport,
  updateAssignmentStatus,
  checkinParticipant,
  getGuideProfile,
  updateGuideProfile,
  uploadGuideAvatar,
  changeGuidePassword,
  getPackingItems,
  createPackingItem,
  getChecklistTemplates,
  saveChecklistTemplate,
  uploadParticipantCccd,
};
