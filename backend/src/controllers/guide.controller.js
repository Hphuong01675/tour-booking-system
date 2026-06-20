import db from '../models';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import mailService from '../services/mail.service';
import ParticipantSearchService from '../services/participantSearch.service';
import ParticipantSearchRepository from '../repositories/participantSearch.repository';
import path from 'path';
import fs from 'fs';

const getAuthenticatedGuideId = (req) => req.user?.id;

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
    res.status(500).json({ error: 'Không thể xuất file. Vui lòng thử lại sau.' });
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
    res.status(500).json({ error: 'Không thể xuất danh sách khách hàng. Vui lòng thử lại sau.' });
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
    const { fullName, phone, dateOfBirth, address, avatarUrl } = req.body;

    const errors = {};
    if (fullName !== undefined) {
      if (!fullName || !String(fullName).trim()) {
        errors.fullName = 'Họ và tên không được để trống.';
      } else if (String(fullName).trim().length > 50) {
        errors.fullName = 'Họ và tên không được quá 50 ký tự.';
      }
    }

    if (phone !== undefined) {
      const phoneRegex = /^0\d{9}$/;
      if (!phone || !String(phone).trim()) {
        errors.phone = 'Số điện thoại không được để trống.';
      } else if (!phoneRegex.test(String(phone).trim())) {
        errors.phone = 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.';
      }
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        if (Number.isNaN(birthDate.getTime())) {
          errors.dateOfBirth = 'Ngày sinh không hợp lệ.';
        } else if (birthDate > today) {
          errors.dateOfBirth = 'Ngày sinh không thể lớn hơn ngày hiện tại.';
        } else {
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
          }

          if (age < 18) {
            errors.dateOfBirth = 'Bạn phải đủ 18 tuổi trở lên.';
          } else if (age > 100 || birthDate.getFullYear() < 1900) {
            errors.dateOfBirth = 'Ngày sinh không hợp lý (năm sinh không hợp lệ).';
          }
        }
      } else {
        errors.dateOfBirth = 'Vui lòng nhập ngày sinh.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
        errors
      });
    }

    const guide = await User.findByPk(req.user.id);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ hướng dẫn viên.',
        error: 'Guide not found'
      });
    }

    if (fullName !== undefined) guide.fullName = String(fullName).trim();
    if (phone !== undefined) guide.phone = String(phone).trim();
    if (dateOfBirth !== undefined) guide.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (address !== undefined) guide.address = address ? String(address).trim() : '';
    if (avatarUrl !== undefined) guide.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;

    await guide.save();
    res.json({
      success: true,
      message: 'Đã cập nhật thông tin thành công.',
      user: buildGuideProfileResponse(guide)
    });
  } catch (err) {
    console.error('Update guide profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.',
      error: err.message
    });
  }
};

export const changeGuidePassword = async (req, res) => {
  try {
    const { User } = db;
    const guideId = getAuthenticatedGuideId(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const guide = await User.findByPk(guideId);
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, guide.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        error: 'Password must include uppercase, lowercase, number, and special character.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    guide.passwordHash = await bcrypt.hash(newPassword, salt);
    await guide.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change guide password error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 8. Send group notification (confirm_trip or announcement)
export const sendGroupNotification = async (req, res) => {
  try {
    const { TourAssignment, TourSchedule, Booking, Participant, User, Tour } = db;
    const targetId = req.params.id;
    const guideId = getAuthenticatedGuideId(req);
    const { type = 'announcement', subject, content, notes, checklist, mandatoryNote } = req.body;

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

        mailSubject = `Xác nhận đăng ký thành công chuyến đi ${tourTitle}`;
        
        html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.6;">`;
        html += `<p>Thân gửi ${customer.fullName},</p>`;
        html += `<p>Chúc mừng bạn đã đăng ký thành công chuyến đi <strong>${tourTitle}</strong>! Chúng tôi rất háo hức được đồng hành cùng bạn trong hành trình sắp tới.</p>`;
        html += `<p>Dưới đây là các thông tin quan trọng để bạn chuẩn bị cho chuyến đi:</p>`;
        
        html += `<h3>📌 THÔNG TIN KHỞI HÀNH:</h3>`;
        html += `<p>Thời gian tập trung: ${departureDate ? departureDate.toLocaleString('vi-VN') : ''}<br/>`;
        html += `Địa điểm đón: ${pickup || ''}</p>`;
        
        html += `<h3>🎫 THÔNG TIN VÉ & CHECK-IN:</h3>`;
        html += `<p>Để thuận tiện cho việc kiểm soát và sắp xếp, mã QR check-in của cả nhóm sẽ được gửi trực tiếp cho Nhóm trưởng. Trưởng nhóm vui lòng lưu lại mã QR này để xuất trình cho Hướng dẫn viên khi lên xe.</p>`;
        
        const participants = booking.participants || [];
        const leader = participants.find(p => p.isLead) || participants[0] || {};
        const members = participants.filter(p => p.id !== leader.id);

        if (leader.fullName) {
          html += `<p><strong>Đại diện Nhóm trưởng:</strong> ${leader.fullName}<br/>`;
          html += `<strong>Loại vé (Check-in):</strong> ${leader.participantType === 'adult' ? 'Người lớn' : 'Trẻ em'}<br/>`;
          html += `<strong>Mã QR:</strong><br/>`;
          if (leader.checkinCode) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(leader.checkinCode)}`;
            html += `<img src="${qrUrl}" alt="QR Code" style="margin-top:5px; border:1px solid #ccc; padding:3px; border-radius:4px;"/><br/>`;
            html += `<span style="font-size: 14px; color: #555;">Mã số: <strong>${leader.checkinCode}</strong></span></p>`;
          } else {
            html += `<em>Chưa có mã QR</em></p>`;
          }
        }

        members.forEach((m, index) => {
          html += `<p><strong>Thành viên ${index + 1}:</strong> ${m.fullName}<br/>`;
          html += `<strong>Loại vé (Check-in):</strong> ${m.participantType === 'adult' ? 'Người lớn' : 'Trẻ em'}<br/>`;
          html += `<strong>Mã QR:</strong><br/>`;
          if (m.checkinCode) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(m.checkinCode)}`;
            html += `<img src="${qrUrl}" alt="QR Code" style="margin-top:5px; border:1px solid #ccc; padding:3px; border-radius:4px;"/><br/>`;
            html += `<span style="font-size: 14px; color: #555;">Mã số: <strong>${m.checkinCode}</strong></span></p>`;
          } else {
            html += `<em>Chưa có mã QR</em></p>`;
          }
        });

        if (notes) {
          html += `<h3>💡 GHI CHÚ TỪ HƯỚNG DẪN VIÊN:</h3>`;
          html += `<p>${notes.replace(/\\n/g, '<br/>')}</p>`;
        }

        const contactInfo = [
          hotline ? `hotline: <strong>${hotline}</strong>` : '',
          guideName || guidePhone ? `Hướng dẫn viên phụ trách: <strong>${guideName}${guidePhone ? ` - ${guidePhone}` : ''}</strong>` : ''
        ].filter(Boolean).join(' hoặc ');
        if (contactInfo) {
          html += `<p>Nếu cần hỗ trợ khẩn cấp, vui lòng liên hệ ${contactInfo}.</p>`;
        }
        html += `<p>Chúc bạn và gia đình có một chuyến đi thật tuyệt vời!</p>`;
        html += `<p>Trân trọng,<br/><strong>Chip3chip / Ban Quản Lý Chuyến Đi</strong></p>`;
        html += `</body></html>`;
      } else if (type === 'reminder') {
        const guideName = assignment.guide?.fullName || '';
        const guidePhone = assignment.guide?.phone || '';
        const hotline = process.env.SUPPORT_HOTLINE || '';

        mailSubject = `🧳 Nhắc nhở quan trọng: Chuẩn bị hành trang cho chuyến đi ${tourTitle} cùng Chip3chip!`;
        
        html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.6;">`;
        html += `<p>Kính gửi Quý khách <strong>${customer.fullName}</strong>,</p>`;
        html += `<p>Lời đầu tiên, Chip3chip xin chân thành cảm ơn Quý khách đã tin tưởng và đồng hành cùng chúng tôi.</p>`;
        html += `<p>Chúng tôi xin trân trọng nhắc lại, Quý khách có một chuyến đi <strong>${tourTitle}</strong> sẽ chính thức khởi hành vào ngày <strong>${departureDate ? departureDate.toLocaleString('vi-VN') : ''}</strong>.</p>`;
        html += `<p>Để có một chuyến đi hoàn hảo và lưu giữ lại những kỷ niệm đẹp nhất, chúng tôi xin nhắc Quý khách lưu ý chuẩn bị và mang theo một số vật dụng cần thiết sau:</p>`;
        
        if (checklist && Array.isArray(checklist)) {
          let catIndex = 1;
          checklist.forEach((cat) => {
            const checkedItems = cat.items ? cat.items.filter(i => i.checked) : [];
            if (checkedItems.length > 0) {
              html += `<h3>${catIndex}. ${cat.name}:</h3>`;
              checkedItems.forEach(item => {
                const requiredTag = item.isRequired ? ' <strong style="color: #ba1a1a;">(Bắt buộc)</strong>' : '';
                html += `<li>${item.name}${requiredTag}</li>`;
              });
              html += `</ul>`;
              catIndex++;
            }
          });
        }

        html += `<p><strong>Lưu ý nhỏ:</strong> Quý khách vui lòng có mặt tại điểm đón <strong>${pickup || ''}</strong> vào lúc <strong>${departureDate ? departureDate.toLocaleString('vi-VN') : ''}</strong> để chuyến đi được bắt đầu đúng lịch trình.</p>`;

        if (mandatoryNote && mandatoryNote.trim() !== '') {
          html += `<div style="background-color: #ffebee; border-left: 4px solid #ba1a1a; padding: 15px; margin: 20px 0; border-radius: 4px;">`;
          html += `<h4 style="color: #ba1a1a; margin-top: 0; margin-bottom: 10px;">⚠️ LƯU Ý BẮT BUỘC TỪ HƯỚNG DẪN VIÊN:</h4>`;
          html += `<p style="color: #93000a; font-weight: bold; margin: 0; font-size: 16px;">${mandatoryNote.replace(/\\n/g, '<br/>')}</p>`;
          html += `<p style="color: #93000a; font-style: italic; margin-top: 10px; margin-bottom: 0;">(Nếu không mang theo chúng tôi sẽ không chịu trách nhiệm)</p>`;
          html += `</div>`;
        }

        const contactInfo = [
          hotline ? `Hotline: <strong>${hotline}</strong>` : '',
          guideName || guidePhone ? `Hướng dẫn viên phụ trách: <strong>${guideName}${guidePhone ? ` - ${guidePhone}` : ''}</strong>` : ''
        ].filter(Boolean).join(' hoặc ');
        if (contactInfo) {
          html += `<p>Nếu Quý khách cần hỗ trợ thêm thông tin hoặc có bất kỳ thắc mắc nào trước chuyến đi, xin vui lòng liên hệ với ${contactInfo}.</p>`;
        }
        html += `<p>Chúng tôi rất háo hức được đồng hành cùng Quý khách. Chúc Quý khách có một chuyến đi thật vui vẻ, an toàn và đong đầy kỷ niệm!</p>`;
        html += `<p>Trân trọng,<br/><strong>Bộ phận Chăm sóc khách hàng</strong><br/>Chip3chip</p>`;
        html += `</body></html>`;
      } else {
        // Announcement: use provided subject & content
        mailSubject = mailSubject || `Thông báo từ Chip3Chip`;
        html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#222">`;
        html += `<h2>${mailSubject}</h2>`;
        html += `<div>${(content || '').replace(/\\n/g, '<br/>')}</div>`;
        if (notes) html += `<hr/><h4>Ghi chú</h4><p>${notes}</p>`;
        html += `<p>Trân trọng,<br/>Đội ngũ Chip3Chip</p>`;
        html += `</body></html>`;
      }

      const ok = await mailService.sendMail({ to: customer.email, subject: mailSubject, html });
      return { bookingId: booking.id, email: customer.email, ok };
    });

    const results = await Promise.all(emailPromises);

    res.json({ results });
  } catch (err) {
    console.error('Send group notification error:', err);
    res.status(500).json({ error: 'Không thể gửi thông báo. Vui lòng thử lại sau.' });
  }
};

// 9. Get checklist templates
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
    res.json(templates);
  } catch (err) {
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
    const { ChecklistTemplate, ChecklistTemplateItem } = db;
    const { name, items = [], itemIds = [] } = req.body; // items: [{ itemId, isRequired }]
    const guideId = getAuthenticatedGuideId(req);
    
    // Create Template
    const template = await ChecklistTemplate.create({
      name,
      guideId
    });

    // Create Template Items
    const normalizedItems = items.length > 0
      ? items
      : itemIds.map(itemId => ({ itemId, isRequired: true }));

    if (normalizedItems.length > 0) {
      const templateItems = normalizedItems.map(i => ({
        templateId: template.id,
        itemId: i.itemId,
        isRequired: i.isRequired !== undefined ? i.isRequired : true
      }));
      await ChecklistTemplateItem.bulkCreate(templateItems);
    }
    
    res.status(201).json(template);
  } catch (err) {
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
      return res.status(400).json({ error: 'Mã check-in không được để trống' });
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
      return res.status(404).json({ error: 'Mã check-in không hợp lệ hoặc tour không tồn tại / không thuộc về bạn.' });
    } else if (participant.checkinAt) {
      return res.status(400).json({ error: 'Khách hàng này đã được check-in trước đó.' });
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
    res.status(500).json({ error: 'Không thể check-in. Vui lòng thử lại sau.' });
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
    res.status(500).json({ error: 'Không thể tải ảnh. Vui lòng thử lại sau.' });
  }
};

