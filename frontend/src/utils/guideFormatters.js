// Đường dẫn: frontend/src/utils/guideFormatters.js
/**
 * Guide Formatters - Các hàm định dạng dữ liệu cho Guide Tours
 * Chuyên biệt cho danh sách tour phân công hướng dẫn viên
 */

/**
 * Định dạng ngày từ ISO string sang DD/MM/YYYY
 * @param {string|Date} date - Ngày cần định dạng
 * @returns {string} - VD: "24/10/2024"
 */
export const formatDate = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date:', date);
    return '';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Định dạng thời gian từ ISO string sang HH:MM AM/PM
 * @param {string|Date} time - Thời gian cần định dạng
 * @returns {string} - VD: "08:00 AM"
 */
export const formatTime = (time) => {
  if (!time) return '';

  const timeObj = typeof time === 'string' ? new Date(`2000-01-01T${time}`) : time;

  if (isNaN(timeObj.getTime())) {
    console.warn('Invalid time:', time);
    return '';
  }

  const hours = timeObj.getHours();
  const minutes = String(timeObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');

  return `${displayHours}:${minutes} ${ampm}`;
};

/**
 * Tính tỷ lệ phần trăm lấp đầy số chỗ
 * @param {number} registered - Số người đã đăng ký
 * @param {number} maxCapacity - Sức chứa tối đa
 * @returns {number} - Tỷ lệ 0-100%
 */
export const calculatePercentage = (registered, maxCapacity) => {
  if (!maxCapacity || maxCapacity <= 0) return 0;
  return Math.round((registered / maxCapacity) * 100);
};

/**
 * Tính số chỗ còn lại
 * @param {number} registered - Số người đã đăng ký
 * @param {number} maxCapacity - Sức chứa tối đa
 * @returns {number} - Số chỗ trống
 */
export const calculateRemainingSlots = (registered, maxCapacity) => {
  const remaining = maxCapacity - registered;
  return remaining < 0 ? 0 : remaining;
};

/**
 * Lấy màu progress bar dựa trên tỷ lệ đông khách
 * @param {number} percentage - Tỷ lệ %
 * @returns {string} - Tên class color hoặc hex color
 */
export const getCapacityColor = (percentage) => {
  if (percentage >= 80) return '#fe6b00'; // secondary-container (warning)
  if (percentage >= 50) return '#0c56d0'; // primary
  return '#004b58'; // tertiary
};

/**
 * Dịch trạng thái từ code sang tiếng Việt
 * @param {string} status - Status code ('open', 'closed', 'cancelled')
 * @returns {string}
 */
export const translateStatus = (status) => {
  const statusMap = {
    open: 'Đang vận hành',
    closed: 'Sắp khởi hành',
    cancelled: 'Đã hủy',
  };
  return statusMap[status] || status;
};

/**
 * Kiểm tra xem status có phải "active/vận hành" không
 * @param {string} status
 * @returns {boolean}
 */
export const isActiveStatus = (status) => {
  return status === 'open';
};

/**
 * Kiểm tra xem status có phải "inactive/sắp khởi hành" không
 * @param {string} status
 * @returns {boolean}
 */
export const isInactiveStatus = (status) => {
  return ['closed', 'cancelled'].includes(status);
};

/**
 * Format tiêu đề tour ngắn gọn
 * @param {string} title - Tiêu đề gốc
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string}
 */
export const truncateTourTitle = (title, maxLength = 40) => {
  if (!title) return '';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

/**
 * Format điểm đến ngắn gọn
 * @param {string} destination - Điểm đến
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string}
 */
export const truncateDestination = (destination, maxLength = 30) => {
  if (!destination) return '';
  if (destination.length <= maxLength) return destination;
  return destination.substring(0, maxLength) + '...';
};

/**
 * Tính số ngày từ hôm nay đến ngày khác
 * @param {string|Date} departureDate
 * @returns {number} - Số ngày (âm nếu quá khứ)
 */
export const daysUntilDeparture = (departureDate) => {
  if (!departureDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const depDate = typeof departureDate === 'string'
    ? new Date(departureDate)
    : departureDate;
  depDate.setHours(0, 0, 0, 0);

  const diffTime = depDate - now;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Nhãn thân thiện "ngày sắp tới"
 * @param {string|Date} departureDate
 * @returns {string} - VD: "Hôm nay", "Ngày mai", "Trong 3 ngày", "Quá hạn"
 */
export const getFriendlyDepartureLabel = (departureDate) => {
  const days = daysUntilDeparture(departureDate);

  if (days === null) return '';
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Ngày mai';
  if (days > 1 && days <= 7) return `Trong ${days} ngày`;
  if (days < 0) return 'Quá hạn';
  return 'Sắp tới';
};

export default {
  formatDate,
  formatTime,
  calculatePercentage,
  calculateRemainingSlots,
  getCapacityColor,
  translateStatus,
  isActiveStatus,
  isInactiveStatus,
  truncateTourTitle,
  truncateDestination,
  daysUntilDeparture,
  getFriendlyDepartureLabel,
};

