import db from '../models';
import bcrypt from 'bcryptjs';
import mailService from '../services/mail.service';
import ParticipantSearchService from '../services/participantSearch.service';
import ParticipantSearchRepository from '../repositories/participantSearch.repository';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary';

const getAuthenticatedGuideId = (req) => req.user?.id;

const normalizeVietnamPhone = (phone) => {
  const compact = String(phone || '').trim().replace(/[\s.-]/g, '');

  if (/^\+84[35789]\d{8}$/.test(compact)) {
    return `0${compact.slice(3)}`;
  }

  if (/^84[35789]\d{8}$/.test(compact)) {
    return `0${compact.slice(2)}`;
  }

  if (/^0[35789]\d{8}$/.test(compact)) {
    return compact;
  }

  return null;
};

const getAge = (birthDate, today = new Date()) => {
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

const validateGuideDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return 'Vui lĂ²ng nháº­p ngĂ y sinh.';

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (Number.isNaN(birthDate.getTime())) return 'NgĂ y sinh khĂ´ng há»£p lá»‡.';
  if (birthDate > today) return 'NgĂ y sinh khĂ´ng Ä‘Æ°á»£c lá»›n hÆ¡n ngĂ y hiá»‡n táº¡i hoáº·c náº±m trong tÆ°Æ¡ng lai.';

  const age = getAge(birthDate, new Date());
  if (age < 18) return 'Tuá»•i khĂ´ng há»£p lá»‡, Ä‘á»™ tuá»•i pháº£i tá»« Ä‘á»§ 18 Ä‘áº¿n dÆ°á»›i 62 tuá»•i.';
  if (age >= 62) return 'Tuá»•i khĂ´ng há»£p lá»‡, Ä‘á»™ tuá»•i pháº£i tá»« Ä‘á»§ 18 Ä‘áº¿n dÆ°á»›i 62 tuá»•i';;

  return null;
};

const validatePasswordStrength = (password) => {
  if (!password || String(password).length < 8) {
    return 'Máº­t kháº©u má»›i pháº£i cĂ³ Ă­t nháº¥t 8 kĂ½ tá»±.';
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return 'Máº­t kháº©u má»›i pháº£i gá»“m chá»¯ hoa, chá»¯ thÆ°á»ng, sá»‘ vĂ  kĂ½ tá»± Ä‘áº·c biá»‡t.';
  }

  return null;
};

const uploadImageToCloudinary = (fileBuffer, folder, publicId) => new Promise((resolve, reject) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return reject(new Error('CLOUDINARY_CONFIG_MISSING'));
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const stream = cloudinary.uploader.upload_stream(
    {
      folder,
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
    },
    (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    }
  );

  stream.end(fileBuffer);
});

const getScheduleDateFilter = (month, Sequelize) => {
  if (!month || month === 'all') return {};

  const now = new Date();
  let start;
  let end;

  if (month === 'current') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (month === 'next') {
    start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    end = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  } else if (month === 'next-3') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  }

  return start && end
    ? { departureDate: { [Sequelize.Op.gte]: start, [Sequelize.Op.lt]: end } }
    : {};
};

// 1. Get Guide Stats
export const getGuideStats = async (req, res) => {
  try {
    const { TourAssignment, TourSchedule } = db;
    const guideId = getAuthenticatedGuideId(req);
    // Total assigned schedules
    const totalTours = await TourAssignment.count({ where: { guideId } });
    
    // Count schedules that are upcoming/open
    const upcomingTours = await TourAssignment.count({
      where: { guideId },
      include: [{
        model: TourSchedule,
        as: 'schedule',
        where: { status: 'open' }
      }]
    });

    res.json({
      totalTours,
      upcomingTours,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get Assigned Tours list
export const getAssignedTours = async (req, res) => {
  try {
    const { TourAssignment, TourSchedule, Tour } = db;
    const { status = 'all', month = 'all', page = 1, limit = 10 } = req.query;
    const guideId = getAuthenticatedGuideId(req);

    const offset = (page - 1) * limit;

    // Filter by assignment
    const whereAssignment = { guideId };
    const whereSchedule = getScheduleDateFilter(month, db.Sequelize);

    if (status !== 'all') {
      whereSchedule.status = status;
    }

    const { count, rows } = await TourAssignment.findAndCountAll({
      where: whereAssignment,
      include: [{
        model: TourSchedule,
        as: 'schedule',
        where: whereSchedule,
        include: [{
          model: Tour,
          as: 'tour'
        }]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const tours = rows.map(row => {
      const sch = row.schedule || {};
      const t = sch.tour || {};
      return {
        id: sch.id,
        assignmentId: row.id,
        tourId: t.id,
        title: t.title,
        destination: t.destination,
        thumbnailUrl: t.thumbnailUrl,
        departureDate: sch.departureDate,
        returnDate: sch.returnDate,
        status: sch.status,
        maxCapacity: sch.maxCapacity,
        registered: sch.registered,
        scheduleCode: sch.scheduleCode
      };
    });

    res.json({
      tours,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Export Assigned Tours to Excel
export const exportAssignedTours = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { TourAssignment, TourSchedule, Tour } = db;
    // Reuse the same filters but return all results (no pagination)
    const { status = 'all', month = 'all' } = req.query;
    const guideId = getAuthenticatedGuideId(req);

    const whereAssignment = { guideId };
    const whereSchedule = getScheduleDateFilter(month, db.Sequelize);
    if (status !== 'all') whereSchedule.status = status;

    const rows = await TourAssignment.findAll({
      where: whereAssignment,
      include: [{
        model: TourSchedule,
        as: 'schedule',
        where: whereSchedule,
        include: [{ model: Tour, as: 'tour' }]
      }]
    });

    const tours = rows.map(row => {
      const sch = row.schedule || {};
      const t = sch.tour || {};
      return {
        id: sch.id,
        assignmentId: row.id,
        tourId: t.id,
        title: t.title,
        destination: t.destination,
        thumbnailUrl: t.thumbnailUrl,
        departureDate: sch.departureDate,
        returnDate: sch.returnDate,
        status: sch.status,
        maxCapacity: sch.maxCapacity,
        registered: sch.registered,
        scheduleCode: sch.scheduleCode
      };
    });

    // Build Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Assigned Tours');

    sheet.columns = [
      { header: 'Assignment ID', key: 'assignmentId', width: 24 },
      { header: 'Schedule ID', key: 'id', width: 24 },
      { header: 'Schedule Code', key: 'scheduleCode', width: 20 },
      { header: 'Tour ID', key: 'tourId', width: 24 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Destination', key: 'destination', width: 30 },
      { header: 'Departure Date', key: 'departureDate', width: 20 },
      { header: 'Return Date', key: 'returnDate', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Max Capacity', key: 'maxCapacity', width: 12 },
      { header: 'Registered', key: 'registered', width: 12 }
    ];

    tours.forEach(t => {
      sheet.addRow({
        assignmentId: t.assignmentId,
        id: t.id,
        scheduleCode: t.scheduleCode,
        tourId: t.tourId,
        title: t.title,
        destination: t.destination,
        departureDate: t.departureDate ? new Date(t.departureDate) : null,
        returnDate: t.returnDate ? new Date(t.returnDate) : null,
        status: t.status,
        maxCapacity: t.maxCapacity,
        registered: t.registered
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=assigned-tours.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Export assigned tours error:', err);
    res.status(500).json({ error: 'KhĂ´ng thá»ƒ xuáº¥t file. Vui lĂ²ng thá»­ láº¡i sau.' });
  }
};


// NOTE: Old filtering functions removed - replaced by ParticipantSearchService
// These functions are now in the service layer for better testability
// - normalizeGuideParticipantFilters
// - participantMatchesGuideSearch
// - participantMatchesGuideCheckinStatus
// - filterGuideAssignmentParticipants


// 3. Get Tour Assignment Detail (including bookings, customers, itinerary days)
export const getTourAssignmentDetail = async (req, res) => {
  try {
    const targetId = req.params.id;
    const guideId = getAuthenticatedGuideId(req);

    // Use new service to normalize and validate filters
    const filters = ParticipantSearchService.normalizeFilters(req.query);

    // Fetch assignment using repository pattern
    const repository = new ParticipantSearchRepository(db);
    const assignment = await repository.findAssignmentWithDetails(targetId, guideId);

    if (!assignment) {
      return res.status(404).json({ error: 'Tour assignment not found' });
    }

    // Apply advanced filtering with multiple branching logic
    const filteredAssignment = ParticipantSearchService.filterParticipants(assignment, filters);

    // Apply sorting
    const bookings = filteredAssignment.schedule?.bookings || [];
    bookings.forEach((booking) => {
      if (booking.participants && booking.participants.length > 0) {
        booking.participants = ParticipantSearchService.sortParticipants(
          booking.participants,
          filters.sortBy
        );
      }
    });

    res.json(filteredAssignment);
  } catch (err) {
    console.error('Get tour assignment detail error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 4b. Export customers/participants for a specific assignment/schedule
export const exportCustomers = async (req, res) => {
  try {
    const { TourAssignment, TourSchedule, Booking, Participant, User } = db;
    const targetId = req.params.id;
    const guideId = getAuthenticatedGuideId(req);

    // Find assignment including schedule -> bookings -> customers & participants
    const assignment = await TourAssignment.findOne({
      where: {
        [db.Sequelize.Op.or]: [ { id: targetId }, { scheduleId: targetId } ],
        guideId
      },
      include: [{
        model: TourSchedule,
        as: 'schedule',
        include: [{
          model: Booking,
          as: 'bookings',
          include: [
            { model: User, as: 'customer', attributes: ['id', 'fullName', 'phone', 'email'] },
            { model: Participant, as: 'participants' }
          ]
        }]
      }]
    });

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const bookings = (assignment.schedule && assignment.schedule.bookings) || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Customers');

    sheet.columns = [
      { header: 'Booking ID', key: 'bookingId', width: 24 },
      { header: 'Booking Code', key: 'bookingCode', width: 20 },
      { header: 'Booking Status', key: 'bookingStatus', width: 16 },
      { header: 'Customer ID', key: 'customerId', width: 24 },
      { header: 'Customer Name', key: 'customerName', width: 30 },
      { header: 'Customer Phone', key: 'customerPhone', width: 16 },
      { header: 'Participant ID', key: 'participantId', width: 24 },
      { header: 'Participant Name', key: 'participantName', width: 30 },
      { header: 'Type', key: 'participantType', width: 12 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 16 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Is Lead', key: 'isLead', width: 8 },
      { header: 'Checkin Code', key: 'checkinCode', width: 16 },
      { header: 'Checkin At', key: 'checkinAt', width: 20 }
    ];

    for (const booking of bookings) {
      const bookingId = booking.id;
      const bookingCode = booking.bookingCode;
      const bookingStatus = booking.status;
      const customer = booking.customer || {};
      const participants = booking.participants || [];

      if (participants.length === 0) {
        sheet.addRow({
          bookingId,
          bookingCode,
          bookingStatus,
          customerId: customer.id,
          customerName: customer.fullName,
          customerPhone: customer.phone
        });
      } else {
        for (const p of participants) {
          sheet.addRow({
            bookingId,
            bookingCode,
            bookingStatus,
            customerId: customer.id,
            customerName: customer.fullName,
            customerPhone: customer.phone,
            participantId: p.id,
            participantName: p.fullName,
            participantType: p.participantType,
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
            address: p.address,
            isLead: p.isLead,
            checkinCode: p.checkinCode,
            checkinAt: p.checkinAt ? new Date(p.checkinAt) : null
          });
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=customers-${targetId}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Export customers error:', err);
    res.status(500).json({ error: 'KhĂ´ng thá»ƒ xuáº¥t danh sĂ¡ch khĂ¡ch hĂ ng. Vui lĂ²ng thá»­ láº¡i sau.' });
  }
};

// 5. Update Status
export const updateAssignmentStatus = async (req, res) => {
  try {
    const { TourAssignment, TourSchedule } = db;
    const { status } = req.body;
    const guideId = getAuthenticatedGuideId(req);

    const assignment = await TourAssignment.findOne({
      where: {
        id: req.params.assignmentId,
        guideId
      }
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const schedule = await TourSchedule.findByPk(assignment.scheduleId);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    schedule.status = status;
    await schedule.save();

    res.json({ message: 'Status updated successfully', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Get Guide Profile
const buildGuideProfileResponse = (guide) => {
  if (!guide) return null;

  const data = guide.toJSON ? guide.toJSON() : guide;
  const { passwordHash, ...profile } = data;
  return profile;
};

export const getGuideProfile = async (req, res) => {
  try {
    const { User } = db;
    const guide = await User.findByPk(req.user.id);
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }
    res.json(buildGuideProfileResponse(guide));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Update Guide Profile
export const updateGuideProfile = async (req, res) => {
  try {
    const { User } = db;
    const { fullName, phone, dateOfBirth, address } = req.body;

    const errors = {};
    let normalizedPhone = null;
    if (fullName !== undefined) {
      if (!fullName || !String(fullName).trim()) {
        errors.fullName = 'Há» vĂ  tĂªn khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.';
      } else if (String(fullName).trim().length > 50) {
        errors.fullName = 'Há» vĂ  tĂªn khĂ´ng Ä‘Æ°á»£c quĂ¡ 50 kĂ½ tá»±.';
      }
    }

    if (phone !== undefined) {
      const phoneRegex = /^0\d{9}$/;
      if (!phone || !String(phone).trim()) {
        errors.phone = 'Sá»‘ Ä‘iá»‡n thoáº¡i khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.';
      } else if (!phoneRegex.test(String(phone).trim())) {
        errors.phone = 'Sá»‘ Ä‘iá»‡n thoáº¡i pháº£i báº¯t Ä‘áº§u báº±ng sá»‘ 0 vĂ  cĂ³ Ä‘Ăºng 10 chá»¯ sá»‘.';
      }
    }

    if (phone !== undefined) {
      normalizedPhone = normalizeVietnamPhone(phone);
      if (normalizedPhone) {
        delete errors.phone;
      } else if (phone && String(phone).trim()) {
        errors.phone = 'Sá»‘ Ä‘iá»‡n thoáº¡i pháº£i lĂ  sá»‘ di Ä‘á»™ng Viá»‡t Nam há»£p lá»‡: 10 sá»‘, báº¯t Ä‘áº§u 03/05/07/08/09 hoáº·c +84.';
      }
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        if (Number.isNaN(birthDate.getTime())) {
          errors.dateOfBirth = 'NgĂ y sinh khĂ´ng há»£p lá»‡.';
        } else if (birthDate > today) {
          errors.dateOfBirth = 'NgĂ y sinh khĂ´ng thá»ƒ lá»›n hÆ¡n ngĂ y hiá»‡n táº¡i.';
        } else {
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
          }

          if (age < 18) {
            errors.dateOfBirth = 'Báº¡n pháº£i Ä‘á»§ 18 tuá»•i trá»Ÿ lĂªn.';
          } else if (age > 100 || birthDate.getFullYear() < 1900) {
            errors.dateOfBirth = 'NgĂ y sinh khĂ´ng há»£p lĂ½ (nÄƒm sinh khĂ´ng há»£p lá»‡).';
          }
        }
      } else {
        errors.dateOfBirth = 'Vui lĂ²ng nháº­p ngĂ y sinh.';
      }
    }

    if (dateOfBirth !== undefined) {
      const dateError = validateGuideDateOfBirth(dateOfBirth);
      if (dateError) {
        errors.dateOfBirth = dateError;
      } else {
        delete errors.dateOfBirth;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dá»¯ liá»‡u khĂ´ng há»£p lá»‡. Vui lĂ²ng kiá»ƒm tra láº¡i thĂ´ng tin.',
        errors
      });
    }

    const guide = await User.findByPk(req.user.id);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'KhĂ´ng tĂ¬m tháº¥y há»“ sÆ¡ hÆ°á»›ng dáº«n viĂªn.',
        error: 'Guide not found'
      });
    }

    if (fullName !== undefined) guide.fullName = String(fullName).trim();
    if (phone !== undefined) guide.phone = normalizedPhone;
    if (dateOfBirth !== undefined) guide.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (address !== undefined) guide.address = address ? String(address).trim() : '';

    await guide.save();
    res.json({
      success: true,
      message: 'ÄĂ£ cáº­p nháº­t thĂ´ng tin thĂ nh cĂ´ng.',
      user: buildGuideProfileResponse(guide)
    });
  } catch (err) {
    console.error('Update guide profile error:', err);
    res.status(500).json({
      success: false,
      message: 'CĂ³ lá»—i xáº£y ra khi lÆ°u thĂ´ng tin. Vui lĂ²ng thá»­ láº¡i.',
      error: err.message
    });
  }
};

export const uploadGuideAvatar = async (req, res) => {
  try {
    const { User } = db;
    const guideId = getAuthenticatedGuideId(req);
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh đại diện.',
        error: 'Vui lòng chọn ảnh đại diện.'
      });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WEBP.',
        error: 'Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WEBP.'
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Ảnh đại diện không được vượt quá 5MB.',
        error: 'Ảnh đại diện không được vượt quá 5MB.'
      });
    }

    const guide = await User.findByPk(guideId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ hướng dẫn viên.',
        error: 'Không tìm thấy hồ sơ hướng dẫn viên.'
      });
    }

    const publicId = `guide_${guideId}_${Date.now()}`;
    const avatarUrl = await uploadImageToCloudinary(
      file.buffer,
      'tour-booking-system/guides/avatars',
      publicId
    );

    guide.avatarUrl = avatarUrl;
    await guide.save();

    res.json({
      success: true,
      message: 'Đã cập nhật ảnh đại diện thành công.',
      user: buildGuideProfileResponse(guide)
    });
  } catch (err) {
    console.error('Upload guide avatar error:', err);

    const isConfigMissing = err.message === 'CLOUDINARY_CONFIG_MISSING';
    const message = isConfigMissing
      ? 'Cloudinary chưa được cấu hình. Vui lòng kiểm tra biến môi trường.'
      : 'Không thể tải ảnh đại diện lên cloud. Vui lòng thử lại.';

    res.status(503).json({
      success: false,
      message,
      error: message
    });
  }
};
export const changeGuidePassword = async (req, res) => {
  try {
    const { User } = db;
    const guideId = getAuthenticatedGuideId(req);
    const { currentPassword, newPassword } = req.body;
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Vui lĂ²ng nháº­p máº­t kháº©u hiá»‡n táº¡i.';
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lĂ²ng nháº­p máº­t kháº©u má»›i.';
    } else {
      const passwordError = validatePasswordStrength(newPassword);
      if (passwordError) errors.newPassword = passwordError;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dá»¯ liá»‡u khĂ´ng há»£p lá»‡. Vui lĂ²ng kiá»ƒm tra láº¡i thĂ´ng tin.',
        errors
      });
    }

    const guide = await User.findByPk(guideId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        error: 'KhĂ´ng tĂ¬m tháº¥y há»“ sÆ¡ hÆ°á»›ng dáº«n viĂªn.'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, guide.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        errors: {
          currentPassword: 'Máº­t kháº©u hiá»‡n táº¡i khĂ´ng chĂ­nh xĂ¡c.'
        }
      });
    }

    const salt = await bcrypt.genSalt(10);
    guide.passwordHash = await bcrypt.hash(newPassword, salt);
    await guide.save();

    res.json({ success: true, message: 'ÄĂ£ Ä‘á»•i máº­t kháº©u thĂ nh cĂ´ng.' });
  } catch (err) {
    console.error('Change guide password error:', err);
    res.status(500).json({
      success: false,
      error: 'KhĂ´ng thá»ƒ Ä‘á»•i máº­t kháº©u. Vui lĂ²ng thá»­ láº¡i.'
    });
  }
};

// 8. Send group notification (confirm_trip or announcement)
export const sendGroupNotification = async (req, res) => {
  try {
    const { TourAssignment, TourSchedule, Booking, Participant, User, Tour } = db;
    const targetId = req.params.id;
    const guideId = getAuthenticatedGuideId(req);
    const { type = 'announcement', subject, content, notes, checklist, mandatoryNote, zaloGroupLink } = req.body;
    const normalizedZaloGroupLink = String(zaloGroupLink || '').trim();

    if (type === 'confirm_trip') {
      if (!normalizedZaloGroupLink) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập link Group Zalo để hỗ trợ hành khách',
          errors: {
            zaloGroupLink: 'Vui lòng nhập link Group Zalo để hỗ trợ hành khách'
          }
        });
      }

      try {
        const zaloUrl = new URL(normalizedZaloGroupLink);
        if (!['http:', 'https:'].includes(zaloUrl.protocol)) {
          throw new Error('INVALID_ZALO_URL');
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Link Group Zalo không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://',
          errors: {
            zaloGroupLink: 'Link Group Zalo không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://'
          }
        });
      }
    }

    const assignment = await TourAssignment.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ id: targetId }, { scheduleId: targetId }],
        guideId
      },
      include: [
        {
          model: User,
          as: 'guide',
          attributes: ['id', 'fullName', 'phone']
        },
        {
          model: TourSchedule,
          as: 'schedule',
          include: [
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'title']
            },
            {
              model: Booking,
              as: 'bookings',
              include: [
                { model: User, as: 'customer', attributes: ['id', 'fullName', 'phone', 'email'] },
                { model: Participant, as: 'participants' }
              ]
            }
          ]
        }
      ]
    });

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const schedule = assignment.schedule;
    const tourTitle = (schedule.tour && schedule.tour.title) || '';
    const departureDate = schedule.departureDate ? new Date(schedule.departureDate) : null;
    const pickup = schedule.pickupLocation || schedule.departureLocation || '';

    // Build emails per booking (customer)
    const targetBookingId = req.body.bookingId;

    const emailPromises = (schedule.bookings || []).map(async (booking) => {
      if (targetBookingId && booking.id !== targetBookingId) {
        return { bookingId: booking.id, ok: true, skipped: true };
      }
      const customer = booking.customer || {};
      if (!customer.email) {
        return { bookingId: booking.id, ok: false, reason: 'No customer email' };
      }

      let mailSubject = subject || '';
      let html = '';

      if (type === 'confirm_trip') {
        const guideName = assignment.guide?.fullName || '';
        const guidePhone = assignment.guide?.phone || '';
        const hotline = process.env.SUPPORT_HOTLINE || '';

        mailSubject = `XĂ¡c nháº­n Ä‘Äƒng kĂ½ thĂ nh cĂ´ng chuyáº¿n Ä‘i ${tourTitle}`;
        
        html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.6;">`;
        html += `<p>ThĂ¢n gá»­i ${customer.fullName},</p>`;
        html += `<p>ChĂºc má»«ng báº¡n Ä‘Ă£ Ä‘Äƒng kĂ½ thĂ nh cĂ´ng chuyáº¿n Ä‘i <strong>${tourTitle}</strong>! ChĂºng tĂ´i ráº¥t hĂ¡o há»©c Ä‘Æ°á»£c Ä‘á»“ng hĂ nh cĂ¹ng báº¡n trong hĂ nh trĂ¬nh sáº¯p tá»›i.</p>`;
        html += `<p>DÆ°á»›i Ä‘Ă¢y lĂ  cĂ¡c thĂ´ng tin quan trá»ng Ä‘á»ƒ báº¡n chuáº©n bá»‹ cho chuyáº¿n Ä‘i:</p>`;
        
        html += `<h3>đŸ“Œ THĂ”NG TIN KHá»I HĂ€NH:</h3>`;
        html += `<p>Thá»i gian táº­p trung: ${departureDate ? departureDate.toLocaleString('vi-VN') : ''}<br/>`;
        html += `Äá»‹a Ä‘iá»ƒm Ä‘Ă³n: ${pickup || ''}</p>`;

        html += `<h3>NHÓM ZALO HỖ TRỢ:</h3>`;
        html += `<p>Quý khách vui lòng tham gia nhóm Zalo của đoàn để nhận thông tin hỗ trợ nhanh từ hướng dẫn viên/điều hành:<br/>`;
        html += `<a href="${normalizedZaloGroupLink}" target="_blank" rel="noopener noreferrer">${normalizedZaloGroupLink}</a></p>`;
        
        html += `<h3>đŸ« THĂ”NG TIN VĂ‰ & CHECK-IN:</h3>`;
        html += `<p>Äá»ƒ thuáº­n tiá»‡n cho viá»‡c kiá»ƒm soĂ¡t vĂ  sáº¯p xáº¿p, mĂ£ QR check-in cá»§a cáº£ nhĂ³m sáº½ Ä‘Æ°á»£c gá»­i trá»±c tiáº¿p cho NhĂ³m trÆ°á»Ÿng. TrÆ°á»Ÿng nhĂ³m vui lĂ²ng lÆ°u láº¡i mĂ£ QR nĂ y Ä‘á»ƒ xuáº¥t trĂ¬nh cho HÆ°á»›ng dáº«n viĂªn khi lĂªn xe.</p>`;
        
        const participants = booking.participants || [];
        const leader = participants.find(p => p.isLead) || participants[0] || {};
        const members = participants.filter(p => p.id !== leader.id);

        if (leader.fullName) {
          html += `<p><strong>Äáº¡i diá»‡n NhĂ³m trÆ°á»Ÿng:</strong> ${leader.fullName}<br/>`;
          html += `<strong>Loáº¡i vĂ© (Check-in):</strong> ${leader.participantType === 'adult' ? 'NgÆ°á»i lá»›n' : 'Tráº» em'}<br/>`;
          html += `<strong>MĂ£ QR:</strong><br/>`;
          if (leader.checkinCode) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(leader.checkinCode)}`;
            html += `<img src="${qrUrl}" alt="QR Code" style="margin-top:5px; border:1px solid #ccc; padding:3px; border-radius:4px;"/><br/>`;
            html += `<span style="font-size: 14px; color: #555;">MĂ£ sá»‘: <strong>${leader.checkinCode}</strong></span></p>`;
          } else {
            html += `<em>ChÆ°a cĂ³ mĂ£ QR</em></p>`;
          }
        }

        members.forEach((m, index) => {
          html += `<p><strong>ThĂ nh viĂªn ${index + 1}:</strong> ${m.fullName}<br/>`;
          html += `<strong>Loáº¡i vĂ© (Check-in):</strong> ${m.participantType === 'adult' ? 'NgÆ°á»i lá»›n' : 'Tráº» em'}<br/>`;
          html += `<strong>MĂ£ QR:</strong><br/>`;
          if (m.checkinCode) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(m.checkinCode)}`;
            html += `<img src="${qrUrl}" alt="QR Code" style="margin-top:5px; border:1px solid #ccc; padding:3px; border-radius:4px;"/><br/>`;
            html += `<span style="font-size: 14px; color: #555;">MĂ£ sá»‘: <strong>${m.checkinCode}</strong></span></p>`;
          } else {
            html += `<em>ChÆ°a cĂ³ mĂ£ QR</em></p>`;
          }
        });

        if (notes) {
          html += `<h3>đŸ’¡ GHI CHĂ Tá»ª HÆ¯á»NG DáºªN VIĂN:</h3>`;
          html += `<p>${notes.replace(/\\n/g, '<br/>')}</p>`;
        }

        const contactInfo = [
          hotline ? `hotline: <strong>${hotline}</strong>` : '',
          guideName || guidePhone ? `HÆ°á»›ng dáº«n viĂªn phá»¥ trĂ¡ch: <strong>${guideName}${guidePhone ? ` - ${guidePhone}` : ''}</strong>` : ''
        ].filter(Boolean).join(' hoáº·c ');
        if (contactInfo) {
          html += `<p>Náº¿u cáº§n há»— trá»£ kháº©n cáº¥p, vui lĂ²ng liĂªn há»‡ ${contactInfo}.</p>`;
        }
        html += `<p>ChĂºc báº¡n vĂ  gia Ä‘Ă¬nh cĂ³ má»™t chuyáº¿n Ä‘i tháº­t tuyá»‡t vá»i!</p>`;
        html += `<p>TrĂ¢n trá»ng,<br/><strong>Chip3chip / Ban Quáº£n LĂ½ Chuyáº¿n Äi</strong></p>`;
        html += `</body></html>`;
      } else if (type === 'reminder') {
        const guideName = assignment.guide?.fullName || '';
        const guidePhone = assignment.guide?.phone || '';
        const hotline = process.env.SUPPORT_HOTLINE || '';

        mailSubject = `đŸ§³ Nháº¯c nhá»Ÿ quan trá»ng: Chuáº©n bá»‹ hĂ nh trang cho chuyáº¿n Ä‘i ${tourTitle} cĂ¹ng Chip3chip!`;
        
        html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.6;">`;
        html += `<p>KĂ­nh gá»­i QuĂ½ khĂ¡ch <strong>${customer.fullName}</strong>,</p>`;
        html += `<p>Lá»i Ä‘áº§u tiĂªn, Chip3chip xin chĂ¢n thĂ nh cáº£m Æ¡n QuĂ½ khĂ¡ch Ä‘Ă£ tin tÆ°á»Ÿng vĂ  Ä‘á»“ng hĂ nh cĂ¹ng chĂºng tĂ´i.</p>`;
        html += `<p>ChĂºng tĂ´i xin trĂ¢n trá»ng nháº¯c láº¡i, QuĂ½ khĂ¡ch cĂ³ má»™t chuyáº¿n Ä‘i <strong>${tourTitle}</strong> sáº½ chĂ­nh thá»©c khá»Ÿi hĂ nh vĂ o ngĂ y <strong>${departureDate ? departureDate.toLocaleString('vi-VN') : ''}</strong>.</p>`;
        html += `<p>Äá»ƒ cĂ³ má»™t chuyáº¿n Ä‘i hoĂ n háº£o vĂ  lÆ°u giá»¯ láº¡i nhá»¯ng ká»· niá»‡m Ä‘áº¹p nháº¥t, chĂºng tĂ´i xin nháº¯c QuĂ½ khĂ¡ch lÆ°u Ă½ chuáº©n bá»‹ vĂ  mang theo má»™t sá»‘ váº­t dá»¥ng cáº§n thiáº¿t sau:</p>`;
        
        if (checklist && Array.isArray(checklist)) {
          let catIndex = 1;
          checklist.forEach((cat) => {
            const checkedItems = cat.items ? cat.items.filter(i => i.checked) : [];
            if (checkedItems.length > 0) {
              html += `<h3>${catIndex}. ${cat.name}:</h3>`;
              checkedItems.forEach(item => {
                const requiredTag = item.isRequired ? ' <strong style="color: #ba1a1a;">(Báº¯t buá»™c)</strong>' : '';
                html += `<li>${item.name}${requiredTag}</li>`;
              });
              html += `</ul>`;
              catIndex++;
            }
          });
        }

        html += `<p><strong>LÆ°u Ă½ nhá»:</strong> QuĂ½ khĂ¡ch vui lĂ²ng cĂ³ máº·t táº¡i Ä‘iá»ƒm Ä‘Ă³n <strong>${pickup || ''}</strong> vĂ o lĂºc <strong>${departureDate ? departureDate.toLocaleString('vi-VN') : ''}</strong> Ä‘á»ƒ chuyáº¿n Ä‘i Ä‘Æ°á»£c báº¯t Ä‘áº§u Ä‘Ăºng lá»‹ch trĂ¬nh.</p>`;

        if (mandatoryNote && mandatoryNote.trim() !== '') {
          html += `<div style="background-color: #ffebee; border-left: 4px solid #ba1a1a; padding: 15px; margin: 20px 0; border-radius: 4px;">`;
          html += `<h4 style="color: #ba1a1a; margin-top: 0; margin-bottom: 10px;">â ï¸ LÆ¯U Ă Báº®T BUá»˜C Tá»ª HÆ¯á»NG DáºªN VIĂN:</h4>`;
          html += `<p style="color: #93000a; font-weight: bold; margin: 0; font-size: 16px;">${mandatoryNote.replace(/\\n/g, '<br/>')}</p>`;
          html += `<p style="color: #93000a; font-style: italic; margin-top: 10px; margin-bottom: 0;">(Náº¿u khĂ´ng mang theo chĂºng tĂ´i sáº½ khĂ´ng chá»‹u trĂ¡ch nhiá»‡m)</p>`;
          html += `</div>`;
        }

        const contactInfo = [
          hotline ? `Hotline: <strong>${hotline}</strong>` : '',
          guideName || guidePhone ? `HÆ°á»›ng dáº«n viĂªn phá»¥ trĂ¡ch: <strong>${guideName}${guidePhone ? ` - ${guidePhone}` : ''}</strong>` : ''
        ].filter(Boolean).join(' hoáº·c ');
        if (contactInfo) {
          html += `<p>Náº¿u QuĂ½ khĂ¡ch cáº§n há»— trá»£ thĂªm thĂ´ng tin hoáº·c cĂ³ báº¥t ká»³ tháº¯c máº¯c nĂ o trÆ°á»›c chuyáº¿n Ä‘i, xin vui lĂ²ng liĂªn há»‡ vá»›i ${contactInfo}.</p>`;
        }
        html += `<p>ChĂºng tĂ´i ráº¥t hĂ¡o há»©c Ä‘Æ°á»£c Ä‘á»“ng hĂ nh cĂ¹ng QuĂ½ khĂ¡ch. ChĂºc QuĂ½ khĂ¡ch cĂ³ má»™t chuyáº¿n Ä‘i tháº­t vui váº», an toĂ n vĂ  Ä‘ong Ä‘áº§y ká»· niá»‡m!</p>`;
        html += `<p>TrĂ¢n trá»ng,<br/><strong>Bá»™ pháº­n ChÄƒm sĂ³c khĂ¡ch hĂ ng</strong><br/>Chip3chip</p>`;
        html += `</body></html>`;
      } else {
        // Announcement: use provided subject & content
        mailSubject = mailSubject || `ThĂ´ng bĂ¡o tá»« Chip3Chip`;
        html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#222">`;
        html += `<h2>${mailSubject}</h2>`;
        html += `<div>${(content || '').replace(/\\n/g, '<br/>')}</div>`;
        if (notes) html += `<hr/><h4>Ghi chĂº</h4><p>${notes}</p>`;
        html += `<p>TrĂ¢n trá»ng,<br/>Äá»™i ngÅ© Chip3Chip</p>`;
        html += `</body></html>`;
      }

      const ok = await mailService.sendMail({ to: customer.email, subject: mailSubject, html });
      return { bookingId: booking.id, email: customer.email, ok };
    });

    const results = await Promise.all(emailPromises);

    res.json({ results });
  } catch (err) {
    console.error('Send group notification error:', err);
    res.status(500).json({ error: 'KhĂ´ng thá»ƒ gá»­i thĂ´ng bĂ¡o. Vui lĂ²ng thá»­ láº¡i sau.' });
  }
};

// 9. Get checklist templates
const buildChecklistTemplateResponse = (template) => {
  const data = template?.toJSON ? template.toJSON() : template;

  return {
    id: data.id,
    name: data.name,
    guideId: data.guideId,
    createdAt: data.createdAt,
    items: (data.items || []).map((templateItem) => ({
      templateId: templateItem.templateId,
      itemId: templateItem.itemId,
      isRequired: templateItem.isRequired,
      item: templateItem.item || null,
    })),
  };
};

export const getChecklistTemplates = async (req, res) => {
  try {
    const { ChecklistTemplate, ChecklistTemplateItem, PackingItem } = db;
    const guideId = getAuthenticatedGuideId(req);
    const templates = await ChecklistTemplate.findAll({
      where: { guideId },
      include: [{
        model: ChecklistTemplateItem,
        as: 'items',
        include: [{ model: PackingItem, as: 'item' }]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(templates.map(buildChecklistTemplateResponse));
  } catch (err) {
    console.error('Get checklist templates error:', err);
    res.status(500).json({ error: err.message });
  }
};

// --- CHECKLIST & PACKING ITEMS API ---
export const getPackingItems = async (req, res) => {
  try {
    const { PackingItem } = db;
    const guideId = getAuthenticatedGuideId(req); 
    const items = await PackingItem.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { isSystem: true },
          { createdBy: guideId }
        ]
      },
      order: [['category', 'ASC'], ['title', 'ASC']]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createPackingItem = async (req, res) => {
  try {
    const { PackingItem } = db;
    const { title, category, content, isSystem } = req.body;
    const guideId = getAuthenticatedGuideId(req);
    const item = await PackingItem.create({
      title,
      category,
      content: content || '',
      isSystem: false,
      createdBy: guideId
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePackingItem = async (req, res) => {
  try {
    const { PackingItem } = db;
    const guideId = getAuthenticatedGuideId(req);
    const { title, category, content } = req.body;

    const item = await PackingItem.findOne({
      where: {
        id: req.params.itemId,
        createdBy: guideId,
        isSystem: false
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Packing item not found' });
    }

    if (title !== undefined) item.title = String(title).trim();
    if (category !== undefined) item.category = category;
    if (content !== undefined) item.content = content || '';

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePackingItem = async (req, res) => {
  try {
    const { PackingItem } = db;
    const guideId = getAuthenticatedGuideId(req);

    const deleted = await PackingItem.destroy({
      where: {
        id: req.params.itemId,
        createdBy: guideId,
        isSystem: false
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Packing item not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createChecklistTemplate = async (req, res) => {
  try {
    const { ChecklistTemplate, ChecklistTemplateItem, PackingItem } = db;
    const { name, items = [], itemIds = [] } = req.body; // items: [{ itemId, isRequired }]
    const guideId = getAuthenticatedGuideId(req);

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }
    
    // Create Template
    const template = await ChecklistTemplate.create({
      name: String(name).trim(),
      guideId
    });

    // Create Template Items
    const requestItems = Array.isArray(items) ? items : [];
    const requestItemIds = Array.isArray(itemIds) ? itemIds : [];
    const normalizedItems = requestItems.length > 0
      ? requestItems
      : requestItemIds.map(itemId => ({ itemId, isRequired: true }));

    if (normalizedItems.length > 0) {
      const templateItems = normalizedItems.map(i => ({
        templateId: template.id,
        itemId: i.itemId,
        isRequired: i.isRequired !== undefined ? i.isRequired : true
      }));
      await ChecklistTemplateItem.bulkCreate(templateItems);
    }

    const templateWithItems = await ChecklistTemplate.findByPk(template.id, {
      include: [{
        model: ChecklistTemplateItem,
        as: 'items',
        include: [{ model: PackingItem, as: 'item' }]
      }]
    });
    
    res.status(201).json(buildChecklistTemplateResponse(templateWithItems));
  } catch (err) {
    console.error('Create checklist template error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 9. Scan QR Code to checkin participant
export const checkinParticipant = async (req, res) => {
  try {
    const { TourAssignment, TourSchedule, Booking, Participant } = db;
    const targetId = req.params.id;
    const { checkinCode } = req.body;
    const guideId = getAuthenticatedGuideId(req);

    if (!checkinCode) {
      return res.status(400).json({ error: 'MĂ£ check-in khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng' });
    }

    const participant = await Participant.findOne({
      where: { checkinCode },
      include: [{
        model: Booking,
        as: 'booking',
        required: true,
        include: [{
          model: TourSchedule,
          as: 'schedule',
          required: true,
          include: [{
            model: TourAssignment,
            as: 'assignments',
            where: {
              guideId,
              [db.Sequelize.Op.or]: [{ id: targetId }, { scheduleId: targetId }]
            },
            required: true
          }]
        }]
      }]
    });

    if (!participant) {
      return res.status(404).json({ error: 'MĂ£ check-in khĂ´ng há»£p lá»‡ hoáº·c tour khĂ´ng tá»“n táº¡i / khĂ´ng thuá»™c vá» báº¡n.' });
    } else if (participant.checkinAt) {
      return res.status(400).json({ error: 'KhĂ¡ch hĂ ng nĂ y Ä‘Ă£ Ä‘Æ°á»£c check-in trÆ°á»›c Ä‘Ă³.' });
    } else {
      participant.checkinAt = new Date();
      await participant.save();

      return res.json({
        success: true,
        participant: {
          id: participant.id,
          fullName: participant.fullName,
          checkinCode: participant.checkinCode,
          checkinAt: participant.checkinAt
        }
      });
    }
  } catch (err) {
    console.error('Checkin error:', err);
    res.status(500).json({ error: 'KhĂ´ng thá»ƒ check-in. Vui lĂ²ng thá»­ láº¡i sau.' });
  }
};

// 10. Upload CCCD images for a participant (front/back)
export const uploadParticipantCccd = async (req, res) => {
  try {
    const { Participant } = db;
    const { participantId } = req.params;

    const files = req.files || {};
    const front = files.front && files.front[0];
    const back = files.back && files.back[0];

    if (!front && !back) return res.status(400).json({ error: 'No files uploaded' });

    const participant = await Participant.findByPk(participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    // Cloudinary path is stored in file.path
    if (front && front.path) participant.cccdFrontUrl = front.path;
    if (back && back.path) participant.cccdBackUrl = back.path;
    await participant.save();

    res.json({ success: true, participant });
  } catch (err) {
    console.error('Upload participant cccd error:', err);
    res.status(500).json({ error: 'KhĂ´ng thá»ƒ táº£i áº£nh. Vui lĂ²ng thá»­ láº¡i sau.' });
  }
};

