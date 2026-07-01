/**
 * ENUMS và CONSTANTS toàn bộ hệ thống
 * Tất cả các giá trị cố định được định nghĩa tại đây để tái sử dụng
 */

// ==========================================
// 1. USER ROLES
// ==========================================
const USER_ROLES = {
  CUSTOMER: 'customer',
  OPERATOR: 'operator',
  GUIDE: 'guide',
  ADMIN: 'admin',
};

// ==========================================
// 2. TOUR STATUS
// ==========================================
const TOUR_STATUS = {
  DRAFT: 'draft',           // Bản nháp
  PENDING: 'pending',       // Chờ duyệt
  UPCOMING: 'upcoming',     // Chưa mở đăng ký
  OPEN: 'open',             // Đang mở đăng ký
  CLOSED: 'closed',         // Đã đóng đăng ký
  CANCELLED: 'cancelled',   // Đã hủy
};

// ==========================================
// 3. TOUR DIFFICULTY
// ==========================================
const TOUR_DIFFICULTY = {
  NORMAL: 'normal',
  HARD: 'hard',
};

// ==========================================
// 4. BOOKING STATUS
// ==========================================
const BOOKING_STATUS = {
  PENDING_APPROVAL: 'pending_approval',   // Chờ duyệt
  PENDING_PAYMENT: 'pending_payment',     // Chờ thanh toán
  PAID: 'paid',                            // Đã thanh toán
  CANCELLED: 'cancelled',                  // Đã hủy
  REFUNDED: 'refunded',                    // Đã hoàn tiền
  REJECTED: 'rejected',                    // Từ chối duyệt hồ sơ
};

// ==========================================
// 5. SCHEDULE STATUS
// ==========================================
const SCHEDULE_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
};

// ==========================================
// 6. PARTICIPANT TYPE (Phân loại hành khách)
// ==========================================
const PARTICIPANT_TYPE = {
  ADULT: 'adult',         // Người lớn
  CHILD: 'child',         // Trẻ em
  INFANT: 'infant',       // Em bé
};

// ==========================================
// 7. VOUCHER DISCOUNT TYPE
// ==========================================
const DISCOUNT_TYPE = {
  PERCENT: 'percent',     // Phần trăm (%)
  FIXED: 'fixed',         // Cố định (VNĐ)
};

// ==========================================
// 8. VOUCHER TARGET TYPE
// ==========================================
const VOUCHER_TARGET_TYPE = {
  ALL: 'all',             // Toàn hệ thống
  SPECIFIC: 'specific',   // Đối tượng cụ thể
};

// ==========================================
// 9. PAYMENT METHOD
// ==========================================
const PAYMENT_METHOD = {
  VNPAY: 'vnpay',
};

// ==========================================
// 10. PAYMENT STATUS
// ==========================================
const PAYMENT_STATUS = {
  PENDING: 'pending',     // Chờ thanh toán
  SUCCESS: 'success',     // Thành công
  FAILED: 'failed',       // Thất bại
  REFUNDED: 'refunded',   // Đã hoàn tiền
};

// ==========================================
// 11. CONVERSATION STATUS & MESSAGE TYPES
// ==========================================
const CONVERSATION_STATUS = {
  WAITING: 'waiting',     // Chờ hỗ trợ
  ACTIVE: 'active',       // Đang hỗ trợ
  CLOSED: 'closed',       // Đã đóng
};

const MESSAGE_SENDER_TYPE = {
  GUEST: 'guest',
  USER: 'user',
  GUIDE: 'guide',
  SYSTEM: 'system',
};

// ==========================================
// 12. PACKING ITEMS CATEGORIES
// ==========================================
const PACKING_ITEM_CATEGORY = {
  DOCUMENT: 'DOCUMENT',           // Giấy tờ
  FINANCE: 'FINANCE',             // Tiền bạc
  CLOTHING: 'CLOTHING',           // Trang phục
  PERSONAL_CARE: 'PERSONAL_CARE', // Vệ sinh cá nhân
  ELECTRONICS: 'ELECTRONICS',     // Thiết bị điện tử
  HEALTH: 'HEALTH',               // Y tế & Sức khỏe
  EQUIPMENT: 'EQUIPMENT',         // Trang bị chuyên dụng
  FOOD_DRINK: 'FOOD_DRINK',       // Đồ ăn & Thức uống
};

// ==========================================
// 13. NOTIFICATION TYPE
// ==========================================
const NOTIFICATION_TYPE = {
  PACKING_REMINDER: 'packing_reminder',
  BOOKING_CONFIRMATION: 'booking_confirmation',
  PAYMENT_REMINDER: 'payment_reminder',
  TOUR_UPDATE: 'tour_update',
};

// ==========================================
// 14. TOUR INFORMATION CATEGORIES (Mã hệ thống)
// ==========================================
const TOUR_INFO_CATEGORY_CODE = {
  ATTRACTIONS: 'attractions',           // Điểm tham quan
  CUISINE: 'cuisine',                   // Ẩm thực
  TRANSPORTATION: 'transportation',     // Phương tiện
  PROMOTION: 'promotion',               // Khuyến mãi
  ACCOMMODATION: 'accommodation',       // Lưu trú
  INCLUDED: 'included',                 // Bao gồm
  NOT_INCLUDED: 'not_included',         // Không bao gồm
  REQUIREMENTS: 'requirements',         // Yêu cầu
};

// ==========================================
// Export tất cả enums
// ==========================================
module.exports = {
  USER_ROLES,
  TOUR_STATUS,
  TOUR_DIFFICULTY,
  BOOKING_STATUS,
  SCHEDULE_STATUS,
  PARTICIPANT_TYPE,
  DISCOUNT_TYPE,
  VOUCHER_TARGET_TYPE,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  CONVERSATION_STATUS,
  MESSAGE_SENDER_TYPE,
  PACKING_ITEM_CATEGORY,
  NOTIFICATION_TYPE,
  TOUR_INFO_CATEGORY_CODE,
};

