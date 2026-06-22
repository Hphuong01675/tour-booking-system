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

const getColumnName = (index) => {
  let name = '';
  let current = index;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
};

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const createCrc32Table = () => {
  const table = new Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
};

const CRC32_TABLE = createCrc32Table();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const getDosDateTime = (date = new Date()) => {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
};

const createZipBuffer = (files) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = getDosDateTime();

  files.forEach((file) => {
    const nameBuffer = Buffer.from(file.name, 'utf8');
    const dataBuffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const checksum = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
};

const createXlsxBuffer = (rows, sheetName = 'Danh sách khách hàng') => {
  const safeSheetName = sheetName.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet1';
  const maxColumns = Math.max(...rows.map((row) => row.length), 1);
  const lastCell = `${getColumnName(maxColumns)}${Math.max(rows.length, 1)}`;
  const columnXml = Array.from({ length: maxColumns }, (_, index) => {
    const width = [8, 30, 16, 28, 18, 34, 18, 14][index] || 18;
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join('');
  const rowXml = rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cellXml = row.map((value, columnIndex) => {
      const cellRef = `${getColumnName(columnIndex + 1)}${rowNumber}`;
      const style = rowIndex === 0 || rowIndex === 11 ? 1 : rowIndex === 12 ? 2 : 0;
      return `<c r="${cellRef}" t="inlineStr" s="${style}"><is><t>${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowNumber}">${cellXml}</row>`;
  }).join('');

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${escapeXml(safeSheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Arial"/></font>
    <font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2E4057"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF4472C4"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFCFD8E3"/></left><right style="thin"><color rgb="FFCFD8E3"/></right><top style="thin"><color rgb="FFCFD8E3"/></top><bottom style="thin"><color rgb="FFCFD8E3"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  <cols>${columnXml}</cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`;

  return createZipBuffer([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'xl/workbook.xml', data: workbook },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
    { name: 'xl/styles.xml', data: styles },
    { name: 'xl/worksheets/sheet1.xml', data: worksheet },
  ]);
};

// 4b. Export customers/participants for a specific assignment/schedule
export const exportCustomers = async (req, res) => {
  try {
    const { TourAssignment, TourSchedule, Booking, Participant, User, Tour } = db;
    const targetId = req.params.id;
    const guideId = getAuthenticatedGuideId(req);

    const assignment = await TourAssignment.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ id: targetId }, { scheduleId: targetId }],
        guideId
      },
      include: [{
        model: TourSchedule,
        as: 'schedule',
        include: [{
          model: Tour,
          as: 'tour'
        }, {
          model: Booking,
          as: 'bookings',
          include: [{
            model: User,
            as: 'customer',
            attributes: ['id', 'fullName', 'phone', 'email']
          }, {
            model: Participant,
            as: 'participants'
          }]
        }]
      }]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const schedule = assignment.schedule || {};
    const bookings = schedule.bookings || [];
    const guideName = req.user?.fullName || 'Chưa rõ';

    const fmt = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    };

    const infoRows = [
      ['Tên tour', schedule.tour?.title || 'Chưa có'],
      ['Mã lịch trình', schedule.scheduleCode || 'Chưa có'],
      ['Điểm đến', schedule.tour?.destination || 'Chưa có'],
      ['Ngày khởi hành', fmt(schedule.departureDate) || 'Chưa có'],
      ['Ngày kết thúc', fmt(schedule.returnDate) || 'Chưa có'],
      ['Hướng dẫn viên', guideName],
      ['Sức chứa', schedule.maxCapacity ? `${schedule.maxCapacity} khách` : 'Chưa có'],
      ['Đã đăng ký', schedule.registered !== undefined ? `${schedule.registered} khách` : '0 khách'],
    ];

    const rows = [
      ['THÔNG TIN CHUYẾN ĐI'],
      ...infoRows,
      [],
      [],
      ['DANH SÁCH HÀNH KHÁCH'],
      ['STT', 'Họ tên', 'Ngày sinh', 'Email', 'Số điện thoại', 'Địa chỉ', 'Mã check-in', 'Đã check-in'],
    ];
    const participantRows = [];
    let stt = 0;
    for (const booking of bookings) {
      for (const participant of booking.participants || []) {
        stt += 1;
        participantRows.push([
          stt,
          participant.fullName || '',
          fmt(participant.dateOfBirth),
          booking.customer?.email || '',
          participant.phone || booking.customer?.phone || '',
          participant.address || '',
          participant.checkinCode || '',
          participant.checkinAt ? 'Có' : 'Chưa',
        ]);
      }
    }

    if (participantRows.length) {
      rows.push(...participantRows);
    } else {
      rows.push(['', 'Chưa có hành khách nào.']);
    }

    const scheduleCode = schedule.scheduleCode || targetId;
    const workbookBuffer = createXlsxBuffer(rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''danh_sach_khach_hang_${encodeURIComponent(scheduleCode)}.xlsx`);
    res.send(workbookBuffer);
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
    const { fullName, phone, dateOfBirth, address } = req.body;

    const errors = {};
    let normalizedPhone = null;

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

    if (phone !== undefined) {
      normalizedPhone = normalizeVietnamPhone(phone);
      if (normalizedPhone) {
        delete errors.phone;
      } else if (phone && String(phone).trim()) {
        errors.phone = 'Số điện thoại phải là số di động Việt Nam hợp lệ: 10 số, bắt đầu 03/05/07/08/09 hoặc +84.';
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
    if (phone !== undefined) guide.phone = normalizedPhone;
    if (dateOfBirth !== undefined) guide.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (address !== undefined) guide.address = address ? String(address).trim() : '';

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
      errors.currentPassword = 'Vui lòng nhập mật khẩu khác hiện tại.';
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
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

    if (type === 'announcement') {
      const errors = {};
      if (!String(subject || '').trim()) errors.subject = 'Vui lòng nhập tiêu đề thông báo';
      if (!String(content || '').trim()) errors.content = 'Vui lòng nhập nội dung thông báo';
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin thông báo',
          errors
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
      if (targetBookingId && String(booking.id) !== String(targetBookingId)) {
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
        
        html = `<!doctype html><html lang="vi"><head><meta charset="UTF-8"></head><body style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.6;">`;
        html += `<p>Thân gửi ${customer.fullName},</p>`;
        html += `<p>Chúc mừng bạn đã đăng ký thành công chuyến đi <strong>${tourTitle}</strong>! Chúng tôi rất háo hức được đồng hành cùng bạn trong hành trình sắp tới.</p>`;
        html += `<p>Dưới đây là các thông tin quan trọng để bạn chuẩn bị cho chuyến đi:</p>`;
        
        html += `<h3>THÔNG TIN KHỞI HÀNH:</h3>`;
        html += `<p>Thời gian tập trung: ${departureDate ? departureDate.toLocaleString('vi-VN') : ''}<br/>`;
        html += `Địa điểm đón: ${pickup || ''}</p>`;

        html += `<h3>NHÓM ZALO HỖ TRỢ:</h3>`;
        html += `<p>Quý khách vui lòng tham gia nhóm Zalo của đoàn để nhận thông tin hỗ trợ nhanh từ hướng dẫn viên/điều hành:<br/>`;
        html += `<a href="${normalizedZaloGroupLink}" target="_blank" rel="noopener noreferrer">${normalizedZaloGroupLink}</a></p>`;
        
        html += `<h3>THÔNG TIN VÉ & CHECK-IN:</h3>`;
        html += `<p>Để thuận tiện cho việc kiểm soát và sắp xếp, mã QR check-in của cả nhóm sẽ được gửi trực tiếp cho Trưởng nhóm. Trưởng nhóm vui lòng lưu lại mã QR này để xuất trình cho Hướng dẫn viên khi lên xe.</p>`;
        
        const participants = booking.participants || [];
        const leader = participants.find(p => p.isLead) || participants[0] || {};
        const members = participants.filter(p => p.id !== leader.id);

        if (leader.fullName) {
          html += `<p><strong>Đại diện Nhóm trưởng:</strong> ${leader.fullName}<br/>`;
          html += `<strong>Loại vé (Check-in):</strong> ${leader.participantType === 'adult' ? 'Người lớn' : 'Trẻ em'}<br/>`;
          html += `<strong>Mã QR:</strong><br/>`;
          if (leader.checkinCode) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&ecc=H&margin=12&data=${encodeURIComponent(leader.checkinCode)}`;
            html += `<img src="${qrUrl}" alt="QR Code" width="220" height="220" style="margin-top:5px; border:1px solid #ccc; padding:6px; border-radius:4px; background:#fff;"/><br/>`;
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
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&ecc=H&margin=12&data=${encodeURIComponent(m.checkinCode)}`;
            html += `<img src="${qrUrl}" alt="QR Code" width="220" height="220" style="margin-top:5px; border:1px solid #ccc; padding:6px; border-radius:4px; background:#fff;"/><br/>`;
            html += `<span style="font-size: 14px; color: #555;">Mã số: <strong>${m.checkinCode}</strong></span></p>`;
          } else {
            html += `<em>Chưa có mã QR</em></p>`;
          }
        });

        if (notes) {
          html += `<h3>GHI CHÚ TỪ HƯỚNG DẪN VIÊN:</h3>`;
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

        mailSubject = `Nhắc nhở quan trọng: Chuẩn bị hành trang cho chuyến đi ${tourTitle} cùng Chip3chip!`;
        
        html = `<!doctype html><html lang="vi"><head><meta charset="UTF-8"></head><body style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.6;">`;
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
          html += `<h4 style="color: #ba1a1a; margin-top: 0; margin-bottom: 10px;">LƯU Ý BẮT BUỘC TỪ HƯỚNG DẪN VIÊN:</h4>`;
          html += `<p style="color: #93000a; font-weight: bold; margin: 0; font-size: 16px;">${mandatoryNote.replace(/\\n/g, '<br/>')}</p>`;
          html += `<p style="color: #93000a; font-style: italic; margin-top: 10px; margin-bottom: 0;">(Nếu không mang theo, chúng tôi sẽ không chịu trách nhiệm)</p>`;
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
        html = `<!doctype html><html lang="vi"><head><meta charset="UTF-8"></head><body style="font-family:Arial,Helvetica,sans-serif;color:#222">`;
        html += `<h2>${mailSubject}</h2>`;
        html += `<div>${(content || '').replace(/\\n/g, '<br/>')}</div>`;
        if (notes) html += `<hr/><h4>Ghi chú</h4><p>${notes}</p>`;
        html += `<p>Trân trọng,<br/>Đội ngũ Chip3Chip</p>`;
        html += `</body></html>`;
      }

      const sendResult = await mailService.sendMail({ to: customer.email, subject: mailSubject, html });
      return {
        bookingId: booking.id,
        email: customer.email,
        ok: Boolean(sendResult?.ok),
        messageId: sendResult?.messageId,
        accepted: sendResult?.accepted,
        rejected: sendResult?.rejected,
        reason: sendResult?.error
      };
    });

    const settledResults = await Promise.allSettled(emailPromises);
    const results = settledResults.map((result) => {
      if (result.status === 'fulfilled') return result.value;
      return { ok: false, reason: result.reason?.message || 'Send failed' };
    });
    const attempted = results.filter((result) => !result.skipped);
    const sentCount = attempted.filter((result) => result.ok).length;

    if (sentCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không gửi được email nào. Vui lòng kiểm tra email khách hàng hoặc cấu hình SMTP.',
        results
      });
    }

    res.json({ success: true, sentCount, results });
  } catch (err) {
    console.error('Send group notification error:', err);
    res.status(500).json({ error: 'Không thể gửi thông báo. Vui lòng thử lại sau.' });
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
      return res.status(400).json({ error: 'Mã không hợp lệ hoặc tour không tồn tại / không thuộc về bạn.' });
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
      return res.status(404).json({ error: 'Mã không hợp lệ hoặc tour không tồn tại / không thuộc về bạn.' });
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
    res.status(500).json({ error: 'KhĂ´ng thá»ƒ check-in. Vui lĂ²ng thá»­ láº¡i sau.' });
  }
};

// Helper function to upload file to Cloudinary
const uploadCCCDToCloudinary = (fileBuffer, folder, publicId) => uploadImageToCloudinary(fileBuffer, folder, publicId);

// 10. Upload CCCD images for a participant (front/back)
export const uploadParticipantCccd = async (req, res) => {
  try {
    const { Participant } = db;
    const { participantId, assignmentId } = req.params;

    const files = req.files || {};
    const front = files.front && files.front[0];
    const back = files.back && files.back[0];

    console.log('[CCCD Upload] Files received:', { 
      hasFiles: !!req.files, 
      fileKeys: Object.keys(req.files || {}),
      front: !!front,
      back: !!back
    });

    if (!front && !back) {
      console.error('[CCCD Upload] No files uploaded');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const participant = await Participant.findByPk(participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    // Upload CCCD images to Cloudinary
    try {
      if (front && front.buffer) {
        const frontUrl = await uploadCCCDToCloudinary(
          front.buffer,
          `tour-booking-system/participants/${participantId}/cccd`,
          `cccd_front_${participantId}`
        );
        participant.cccdFrontUrl = frontUrl;
      }

      if (back && back.buffer) {
        const backUrl = await uploadCCCDToCloudinary(
          back.buffer,
          `tour-booking-system/participants/${participantId}/cccd`,
          `cccd_back_${participantId}`
        );
        participant.cccdBackUrl = backUrl;
      }

      await participant.save();

      res.json({ success: true, participant });
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      
      const isConfigMissing = uploadErr.message === 'CLOUDINARY_CONFIG_MISSING';
      const message = isConfigMissing
        ? 'Cloudinary chưa được cấu hình. Vui lòng kiểm tra biến môi trường.'
        : 'Không thể tải ảnh lên. Vui lòng thử lại sau.';
      
      res.status(isConfigMissing ? 503 : 500).json({ error: message });
    }
  } catch (err) {
    console.error('Upload participant cccd error:', err);
    res.status(500).json({ error: 'Không thể tải ảnh. Vui lòng thử lại sau.' });
  }
};

