// Đường dẫn: backend/src/repositories/tour.repository.example.js
/**
 * 📚 REPOSITORY LAYER EXAMPLE
 *
 * Hướng dẫn sử dụng Models trong Repository
 * Tất cả query DB phải đặt tại đây, KHÔNG query trực tiếp từ Controller/Service
 *
 * Quy tắc:
 * 1. Repository chỉ làm 1 việc: Query/Manipulate dữ liệu từ DB
 * 2. Không có logic nghiệp vụ phức tạp ở đây
 * 3. Luôn return dữ liệu nguyên sạch từ DB (Service sẽ xử lý sau)
 * 4. Xử lý errors DB tại đây, không throw tùy tiện
 */

const db = require('../models');
const { Tour, TourSchedule, TourImage, User, TourInformation } = db;
const { TOUR_STATUS, TOUR_DIFFICULTY } = require('../constants/enums');

class TourRepository {
  /**
   * Tìm tour theo ID
   * @param {string} tourId
   * @param {object} options - include, attributes,...
   * @returns {Promise<Tour|null>}
   */
  async findById(tourId, options = {}) {
    const defaultOptions = {
      attributes: { exclude: [] },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
        { model: TourSchedule, as: 'schedules', separate: true },
        { model: TourImage, as: 'images', separate: true },
      ],
    };

    try {
      const tour = await Tour.findByPk(tourId, {
        ...defaultOptions,
        ...options,
      });
      return tour;
    } catch (error) {
      console.error('TourRepository.findById error:', error.message);
      throw error;
    }
  }

  /**
   * Lấy tất cả tour (có phân trang)
   * @param {object} filters - { status, difficulty, searchText, limit, offset }
   * @returns {Promise<{rows, count}>}
   */
  async findAll(filters = {}) {
    const { status, difficulty, searchText, limit = 10, offset = 0 } = filters;

    const where = {};

    if (status) where.status = status;
    if (difficulty) where.difficulty = difficulty;
    if (searchText) {
      where[db.Sequelize.Op.or] = [
        db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('title')), 'LIKE', `%${searchText.toLowerCase()}%`),
        db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('slug')), 'LIKE', `%${searchText.toLowerCase()}%`),
      ];
    }

    try {
      const { rows, count } = await Tour.findAndCountAll({
        where,
        include: [
          { model: User, as: 'creator', attributes: ['id', 'fullName'] },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return { rows, count, limit, offset };
    } catch (error) {
      console.error('TourRepository.findAll error:', error.message);
      throw error;
    }
  }

  /**
   * Tìm tour theo slug (để hiển thị chi tiết)
   * @param {string} slug
   * @returns {Promise<Tour|null>}
   */
  async findBySlug(slug) {
    try {
      return await Tour.findOne({
        where: { slug },
        include: [
          { model: User, as: 'creator' },
          { model: TourSchedule, as: 'schedules' },
          { model: TourImage, as: 'images', order: [['sortOrder', 'ASC']] },
          { model: TourInformation, as: 'information', separate: true },
        ],
      });
    } catch (error) {
      console.error('TourRepository.findBySlug error:', error.message);
      throw error;
    }
  }

  /**
   * Tạo tour mới
   * @param {object} tourData
   * @returns {Promise<Tour>}
   */
  async create(tourData) {
    try {
      const tour = await Tour.create(tourData);
      return tour;
    } catch (error) {
      // Xử lý constraint violations
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0].path;
        throw new Error(`Tour ${field} đã tồn tại`);
      }
      throw error;
    }
  }

  /**
   * Cập nhật tour
   * @param {string} tourId
   * @param {object} updateData
   * @returns {Promise<number>} - số hàng affected
   */
  async update(tourId, updateData) {
    try {
      // Merge với default updated_at
      const data = {
        ...updateData,
        updatedAt: new Date(),
      };

      const result = await Tour.update(data, {
        where: { id: tourId },
      });

      return result[0]; // number of rows updated
    } catch (error) {
      console.error('TourRepository.update error:', error.message);
      throw error;
    }
  }

  /**
   * Xóa tour (hard delete)
   * @param {string} tourId
   * @returns {Promise<number>}
   */
  async delete(tourId) {
    try {
      return await Tour.destroy({
        where: { id: tourId },
      });
    } catch (error) {
      console.error('TourRepository.delete error:', error.message);
      throw error;
    }
  }

  /**
   * Lấy tour với tất cả chi tiết (full include)
   * @param {string} tourId
   * @returns {Promise<Tour>}
   */
  async findFullDetails(tourId) {
    try {
      return await Tour.findByPk(tourId, {
        include: [
          { model: User, as: 'creator' },
          {
            model: TourSchedule,
            as: 'schedules',
            separate: true,
            include: [
              { model: TourAssignment, as: 'assignments', include: 'guide' },
            ],
          },
          {
            model: TourItineraryDay,
            as: 'itineraryDays',
            separate: true,
            include: [
              { model: TourItineraryLocation, as: 'locations' },
              { model: TourItineraryItem, as: 'items' },
            ],
          },
          { model: TourImage, as: 'images' },
          { model: TourInformation, as: 'information' },
        ],
      });
    } catch (error) {
      console.error('TourRepository.findFullDetails error:', error.message);
      throw error;
    }
  }

  /**
   * Tìm các tour được yêu thích bởi user
   * @param {string} userId
   * @returns {Promise<Tour[]>}
   */
  async findUserWishlists(userId) {
    try {
      const wishlists = await db.Wishlist.findAll({
        where: { userId },
        include: [
          {
            model: Tour,
            as: 'tour',
            attributes: ['id', 'title', 'basePrice', 'thumbnailUrl', 'slug'],
          },
        ],
      });

      return wishlists.map((w) => w.tour);
    } catch (error) {
      console.error('TourRepository.findUserWishlists error:', error.message);
      throw error;
    }
  }

  /**
   * Kiểm tra xem tour đã có schedule nào chưa
   * @param {string} tourId
   * @returns {Promise<boolean>}
   */
  async hasSchedules(tourId) {
    try {
      const count = await TourSchedule.count({
        where: { tourId },
      });
      return count > 0;
    } catch (error) {
      console.error('TourRepository.hasSchedules error:', error.message);
      throw error;
    }
  }

  /**
   * Bulk create (tạo nhiều records cùng lúc)
   * @param {object[]} tours
   * @returns {Promise<Tour[]>}
   */
  async bulkCreate(tours) {
    try {
      return await Tour.bulkCreate(tours, { validate: true });
    } catch (error) {
      console.error('TourRepository.bulkCreate error:', error.message);
      throw error;
    }
  }
}

module.exports = new TourRepository();

/**
 * 🎯 Cách sử dụng trong SERVICE:
 *
 * const tourRepository = require('../repositories/tour.repository');
 *
 * class TourService {
 *   async getTourDetail(tourId) {
 *     const tour = await tourRepository.findById(tourId);
 *     if (!tour) throw new NotFoundError('Tour không tồn tại');
 *
 *     // Xử lý logic nghiệp vụ
 *     return this.formatTourResponse(tour);
 *   }
 * }
 */

