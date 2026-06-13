import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './models';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount authentication routes
app.use('/', authRoutes);



// Helper function to seed data
const seedDatabase = async () => {
  try {
    const { User, Tour, TourSchedule, TourItineraryDay, TourAssignment, Booking, Participant, Conversation, Message } = db;
    
    // Check if Guide user exists
    const guideCount = await User.count({ where: { role: 'guide' } });
    if (guideCount > 0) {
      console.log('Database already has seed data.');
      return;
    }

    console.log('Seeding database with realistic MySQL data...');

    // 1. Create Users (Guide & Operator & Customers)
    const guide = await User.create({
      id: 'guide-1',
      fullName: 'Lê Quang Huy',
      email: 'lequanghuy@chip3chip.com',
      passwordHash: 'hashedpassword',
      phone: '+84 912 999 888',
      role: 'guide',
      dateOfBirth: new Date('1990-05-15'),
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATCJY4L4fRlD3bcOygRQBoG2wmsge1P2bVDFZgggSGNWLuE-o3z-j8UoBBSNdZ3xboszKGIVouUMx_SHJCWuqTRXFNB7i_85kd3gDCVizXP6wH11DatyRu6PLWrfVagoWpu_hwhiSCU6J5M95gypzG6JYddiZNt5WqR-84HKSqxQK2NFLThV2aVUjSe6qj-mpQWvDIo89N-R7_EhvEZKzP03AV40tKrGY1XeH67_CsFs-1C2uvhKhwY8lTCbjS83uKNLR454I1z-w',
      isActive: true,
    });

    const operator = await User.create({
      id: 'operator-1',
      fullName: 'Nguyễn Minh Tuấn',
      email: 'minhtuan.nguyen@chip3chip.com',
      passwordHash: 'hashedpassword',
      phone: '+84 908 123 456',
      role: 'operator',
      isActive: true,
    });

    // Customer Users
    const customer1 = await User.create({
      id: 'customer-1',
      fullName: 'Nguyễn Thành Trung',
      email: 'trung@gmail.com',
      passwordHash: 'hashedpassword',
      phone: '090 123 4567',
      role: 'customer',
    });

    const customer2 = await User.create({
      id: 'customer-2',
      fullName: 'Lê Thị Thu Hà',
      email: 'ha@gmail.com',
      passwordHash: 'hashedpassword',
      phone: '098 765 4321',
      role: 'customer',
    });

    const customer3 = await User.create({
      id: 'customer-3',
      fullName: 'Nguyễn Văn An',
      email: 'an@gmail.com',
      passwordHash: 'hashedpassword',
      phone: '0903 112 233',
      role: 'customer',
    });

    const customer4 = await User.create({
      id: 'customer-4',
      fullName: 'Lê Hồng Phúc',
      email: 'phuc@gmail.com',
      passwordHash: 'hashedpassword',
      phone: '0944 556 677',
      role: 'customer',
    });

    const customer5 = await User.create({
      id: 'customer-5',
      fullName: 'Vũ Nam Khánh',
      email: 'khanh@gmail.com',
      passwordHash: 'hashedpassword',
      phone: '0977 889 900',
      role: 'customer',
    });

    const customer6 = await User.create({
      id: 'customer-6',
      fullName: 'Phạm Minh Khang',
      email: 'khang@gmail.com',
      passwordHash: 'hashedpassword',
      phone: '090 111 2222',
      role: 'customer',
    });

    // 2. Create Tours
    const tour = await Tour.create({
      id: 'tour-1',
      tourCode: 'GE-VN-1024',
      title: 'Kỳ nghỉ Thượng hạng: Đà Nẵng - Hội An - Huế',
      slug: 'ky-nghi-thuong-hang-da-nang-hoi-an-hue',
      description: 'Quản lý lịch trình, điều phối khách hàng và theo dõi tiến độ đoàn du lịch miền Trung.',
      highlights: 'Đà Nẵng - Hội An - Cố đô Huế (5 Ngày 4 Đêm)',
      departureLocation: 'Sài Gòn',
      destination: 'Đà Nẵng - Hội An - Cố đô Huế',
      basePrice: 15000000.00,
      durationDays: 5,
      durationNights: 4,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDs1Mr0_dgReT3krj2jRYtZ4bn606q3sV7djP6gQpWaWEFvdU1zaODdGuIrCJqb-KRO7IbrXNKDPq78QoXm2irNrN-_nP6NkNF7FXpuHX4X7iuyNAU30DiZG0WDV_WZTqxL8_fXDN7U2_nkTBYlpaBbMAL1WZaQlbG242e1vpr4ceK6_PGU6RQxyB7KAc75qB1QALVFFOWt81qvSIPk_4u1V4fgTmUzN64FwsZN8suCQKGOJnf-Ui_djYOp8figa0P4SyQsZzG0U1GE',
      isPublished: true,
      status: 'open',
      createdBy: 'operator-1',
    });

    // 3. Create Itinerary Days
    await TourItineraryDay.bulkCreate([
      {
        id: 'itinerary-day-1',
        tourId: 'tour-1',
        dayNumber: 1,
        title: 'Khởi hành & Biển Mỹ Khê',
        meals: 'Trưa, Tối',
        mainActivity: 'Đón sân bay & Tắm biển',
        description: 'Đón đoàn tại Sân bay Đà Nẵng, dùng bữa trưa đặc sản Trần. Nhận phòng resort và tự do tắm biển Mỹ Khê.',
      },
      {
        id: 'itinerary-day-2',
        tourId: 'tour-1',
        dayNumber: 2,
        title: 'Bà Nà Hills - Cầu Vàng',
        meals: 'Sáng, Trưa, Tối',
        mainActivity: 'Bà Nà Hills Tour',
        description: 'Tham quan KDL Bà Nà Hills, trải nghiệm cáp treo đạt kỷ lục và check-in Cầu Vàng trong sương sớm.',
      },
      {
        id: 'itinerary-day-3',
        tourId: 'tour-1',
        dayNumber: 3,
        title: 'Phố cổ Hội An - Show Ký ức',
        meals: 'Sáng, Trưa, Tối',
        mainActivity: 'Dạo cổ trấn & Xem diễn show',
        description: 'Tham quan làng gốm Thanh Hà, dạo bộ Phố Cổ và xem show diễn thực cảnh lớn nhất Việt Nam.',
      }
    ]);

    // 4. Create Tour Schedule
    const schedule = await TourSchedule.create({
      id: 'schedule-1',
      tourId: 'tour-1',
      scheduleCode: 'GE-VN-1024',
      departureDate: new Date('2024-10-15T08:00:00Z'),
      returnDate: new Date('2024-10-20T17:00:00Z'),
      price: 15000000.00,
      maxCapacity: 20,
      registered: 18,
      status: 'open',
    });

    // 5. Create Tour Assignment
    await TourAssignment.create({
      id: 'assignment-1',
      scheduleId: 'schedule-1',
      guideId: 'guide-1',
      assignedBy: 'operator-1',
      assignedAt: new Date(),
    });

    // 6. Create Bookings & Participants
    const booking1 = await Booking.create({
      id: 'booking-1',
      customerId: 'customer-1',
      scheduleId: 'schedule-1',
      bookingCode: 'BOOKING-101',
      status: 'paid',
      totalPrice: 45000000.00,
      finalPrice: 45000000.00,
    });

    await Participant.bulkCreate([
      {
        id: 'participant-1',
        bookingId: 'booking-1',
        fullName: 'Nguyễn Thành Trung',
        dateOfBirth: new Date('1985-05-12'),
        participantType: 'adult',
        address: 'Hồ Chí Minh',
        isLead: true,
        checkinCode: 'QR-NT-101',
        checkinAt: new Date('2024-10-15T08:30:00.000Z'),
      },
      {
        id: 'participant-2',
        bookingId: 'booking-1',
        fullName: 'Trần Thị Tuyết Mai',
        dateOfBirth: new Date('1985-05-12'),
        participantType: 'adult',
        address: 'Hồ Chí Minh',
        isLead: false,
        checkinCode: 'QR-TM-102',
        checkinAt: new Date('2024-10-15T08:30:00.000Z'),
      },
      {
        id: 'participant-3',
        bookingId: 'booking-1',
        fullName: 'Phạm Gia Huy',
        dateOfBirth: new Date('2018-11-08'),
        participantType: 'child',
        address: 'Hồ Chí Minh',
        isLead: false,
        checkinCode: 'QR-GH-103',
        checkinAt: null,
      }
    ]);

    const booking2 = await Booking.create({
      id: 'booking-2',
      customerId: 'customer-2',
      scheduleId: 'schedule-1',
      bookingCode: 'BOOKING-102',
      status: 'pending_payment',
      totalPrice: 35000000.00,
      finalPrice: 30000000.00,
    });

    await Participant.bulkCreate([
      {
        id: 'participant-4',
        bookingId: 'booking-2',
        fullName: 'Lê Thị Thu Hà',
        dateOfBirth: new Date('1990-09-24'),
        participantType: 'adult',
        address: 'Hà Nội',
        isLead: true,
        checkinCode: 'QR-TH-104',
        checkinAt: new Date('2024-10-15T09:12:00.000Z'),
      },
      {
        id: 'participant-5',
        bookingId: 'booking-2',
        fullName: 'Hoàng Minh Tuấn',
        dateOfBirth: new Date('1992-01-22'),
        participantType: 'adult',
        address: 'Hà Nội',
        isLead: false,
        checkinCode: 'QR-MT-105',
        checkinAt: new Date('2024-10-15T08:45:00.000Z'),
      }
    ]);

    const booking3 = await Booking.create({
      id: 'booking-3',
      customerId: 'customer-3',
      scheduleId: 'schedule-1',
      bookingCode: 'BOOKING-103',
      status: 'paid',
      totalPrice: 15000000.00,
      finalPrice: 15000000.00,
    });

    await Participant.create({
      id: 'participant-6',
      bookingId: 'booking-3',
      fullName: 'Nguyễn Văn An',
      dateOfBirth: new Date('1980-09-15'),
      participantType: 'adult',
      address: 'Đồng Nai',
      isLead: true,
      checkinCode: 'QR-VA-106',
      checkinAt: null,
    });

    const booking4 = await Booking.create({
      id: 'booking-4',
      customerId: 'customer-4',
      scheduleId: 'schedule-1',
      bookingCode: 'BOOKING-104',
      status: 'paid',
      totalPrice: 30000000.00,
      finalPrice: 30000000.00,
    });

    await Participant.bulkCreate([
      {
        id: 'participant-7',
        bookingId: 'booking-4',
        fullName: 'Lê Hồng Phúc',
        dateOfBirth: new Date('2015-03-30'),
        participantType: 'child',
        address: 'Bình Dương',
        isLead: true,
        checkinCode: 'QR-HP-107',
        checkinAt: new Date('2024-10-15T08:35:00.000Z'),
      },
      {
        id: 'participant-8',
        bookingId: 'booking-4',
        fullName: 'Đặng Thu Thảo',
        dateOfBirth: new Date('1988-07-18'),
        participantType: 'adult',
        address: 'Bình Dương',
        isLead: false,
        checkinCode: 'QR-TT-108',
        checkinAt: null,
      }
    ]);

    const booking5 = await Booking.create({
      id: 'booking-5',
      customerId: 'customer-5',
      scheduleId: 'schedule-1',
      bookingCode: 'BOOKING-105',
      status: 'paid',
      totalPrice: 30000000.00,
      finalPrice: 30000000.00,
    });

    await Participant.bulkCreate([
      {
        id: 'participant-9',
        bookingId: 'booking-5',
        fullName: 'Vũ Nam Khánh',
        dateOfBirth: new Date('1995-12-05'),
        participantType: 'adult',
        address: 'Vũng Tàu',
        isLead: true,
        checkinCode: 'QR-NK-109',
        checkinAt: new Date('2024-10-15T08:30:00.000Z'),
      },
      {
        id: 'participant-10',
        bookingId: 'booking-5',
        fullName: 'Bùi Minh Đức',
        dateOfBirth: new Date('1982-02-10'),
        participantType: 'adult',
        address: 'Vũng Tàu',
        isLead: false,
        checkinCode: 'QR-MD-110',
        checkinAt: null,
      }
    ]);

    const booking6 = await Booking.create({
      id: 'booking-6',
      customerId: 'customer-6',
      scheduleId: 'schedule-1',
      bookingCode: 'BOOKING-106',
      status: 'paid',
      totalPrice: 15000000.00,
      finalPrice: 15000000.00,
    });

    await Participant.create({
      id: 'participant-11',
      bookingId: 'booking-6',
      fullName: 'Phạm Minh Khang',
      dateOfBirth: new Date('2020-05-12'),
      participantType: 'child',
      address: 'Hồ Chí Minh',
      isLead: true,
      checkinCode: 'QR-MK-111',
      checkinAt: new Date('2024-10-15T08:30:00.000Z'),
    });

    // 7. Create Conversations
    await Conversation.create({
      id: 'conv-1',
      sessionKey: 'session_minhanh',
      guestName: null,
      customerId: 'customer-1',
      supportUserId: 'guide-1',
      status: 'active',
      lastMessage: 'Dạ có ạ, gửi giúp mình nhé. Đặc biệt là các hoạt động cho trẻ em ấy ạ...',
    });

    await Message.bulkCreate([
      {
        id: 'msg-1-1',
        conversationId: 'conv-1',
        senderType: 'user',
        senderId: 'customer-1',
        content: 'Chào admin, tôi muốn hỏi về tour Hạ Long ngày 25/12 còn chỗ không ạ? Nhóm tôi có 4 người lớn và 2 trẻ em.',
        sentAt: new Date('2026-06-11T14:20:00.000Z'),
      },
      {
        id: 'msg-1-2',
        conversationId: 'conv-1',
        senderType: 'guide',
        senderId: 'guide-1',
        content: 'Chào chị Minh Anh! Chip3Chip rất vui được hỗ trợ chị. Ngày 25/12 bên em vẫn còn chỗ cho đoàn 6 người trên tàu Heritage Cruises chị nhé.',
        sentAt: new Date('2026-06-11T14:22:00.000Z'),
      },
      {
        id: 'msg-1-3',
        conversationId: 'conv-1',
        senderType: 'guide',
        senderId: 'guide-1',
        content: 'Chị có cần em gửi bảng giá chi tiết kèm ưu đãi cho trẻ em không ạ?',
        sentAt: new Date('2026-06-11T14:22:30.000Z'),
      },
      {
        id: 'msg-1-4',
        conversationId: 'conv-1',
        senderType: 'user',
        senderId: 'customer-1',
        content: 'Dạ có ạ, gửi giúp mình nhé. Đặc biệt là các hoạt động cho trẻ em ấy ạ, vì các bé nhà mình khá năng động.',
        sentAt: new Date('2026-06-11T14:25:00.000Z'),
      }
    ]);

    await Conversation.create({
      id: 'conv-2',
      sessionKey: 'session_lequockhanh',
      guestName: null,
      customerId: 'customer-2',
      supportUserId: 'guide-1',
      status: 'active',
      lastMessage: 'Cảm ơn bạn, mình cần hỏi thêm về chính sách hủy tour.',
    });

    await Message.bulkCreate([
      {
        id: 'msg-2-1',
        conversationId: 'conv-2',
        senderType: 'user',
        senderId: 'customer-2',
        content: 'Gói bảo hiểm du lịch có bao gồm cứu hộ núi không bạn?',
        sentAt: new Date('2026-06-11T14:10:00.000Z'),
      },
      {
        id: 'msg-2-2',
        conversationId: 'conv-2',
        senderType: 'guide',
        senderId: 'guide-1',
        content: 'Dạ chào anh Khánh, gói bảo hiểm của Chip3Chip đã bao gồm toàn bộ chi phí y tế khẩn cấp và cứu hộ tại chỗ ở Sapa ạ.',
        sentAt: new Date('2026-06-11T14:13:00.000Z'),
      },
      {
        id: 'msg-2-3',
        conversationId: 'conv-2',
        senderType: 'user',
        senderId: 'customer-2',
        content: 'Cảm ơn bạn, mình cần hỏi thêm về chính sách hủy tour.',
        sentAt: new Date('2026-06-11T14:15:00.000Z'),
      }
    ]);

    // WAITING conversations
    await Conversation.create({
      id: 'conv-3',
      sessionKey: 'session_guest01',
      guestName: 'Guest#01',
      customerId: null,
      supportUserId: null,
      status: 'waiting',
      lastMessage: 'Tôi muốn đặt tour du lịch cho gia đình vào tuần tới tại Nha Trang.',
    });

    await Message.create({
      id: 'msg-3-1',
      conversationId: 'conv-3',
      senderType: 'guest',
      senderId: null,
      content: 'Tôi muốn đặt tour du lịch cho gia đình vào tuần tới tại Nha Trang. Cho mình xin thông tin khách sạn.',
      sentAt: new Date('2026-06-11T14:02:00.000Z'),
    });

    await Conversation.create({
      id: 'conv-4',
      sessionKey: 'session_phamthithanh',
      guestName: null,
      customerId: 'customer-3',
      supportUserId: null,
      status: 'waiting',
      lastMessage: 'Thanh toán bằng thẻ Visa có mất phí chuyển khoản không ạ?',
    });

    await Message.create({
      id: 'msg-4-1',
      conversationId: 'conv-4',
      senderType: 'user',
      senderId: 'customer-3',
      content: 'Thanh toán bằng thẻ Visa có mất phí chuyển khoản không ạ?',
      sentAt: new Date('2026-06-11T14:05:00.000Z'),
    });

    await Conversation.create({
      id: 'conv-5',
      sessionKey: 'session_guest02',
      guestName: 'Guest#02',
      customerId: null,
      supportUserId: null,
      status: 'waiting',
      lastMessage: 'I\'m looking for a private guide in Ho Chi Minh City.',
    });

    await Message.create({
      id: 'msg-5-1',
      conversationId: 'conv-5',
      senderType: 'guest',
      senderId: null,
      content: 'Hello! I\'m looking for a private English-speaking guide in Ho Chi Minh City for a food tour.',
      sentAt: new Date('2026-06-11T13:55:00.000Z'),
    });

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

// ==================== API ROUTING ====================

// 1. Get Guide Stats
app.get('/api/guides/stats', async (req, res) => {
  try {
    const { TourAssignment, TourSchedule } = db;
    // Total assigned schedules
    const totalTours = await TourAssignment.count({ where: { guideId: 'guide-1' } });
    
    // Count schedules that are upcoming/open
    const upcomingTours = await TourAssignment.count({
      where: { guideId: 'guide-1' },
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
});

// 2. Get Assigned Tours list
app.get('/api/guides/assigned-tours', async (req, res) => {
  try {
    const { TourAssignment, TourSchedule, Tour } = db;
    const { status = 'all', page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    // Filter by assignment
    const whereAssignment = { guideId: 'guide-1' };
    const whereSchedule = {};

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
});

// 3. Get Tour Assignment Detail (including bookings, customers, itinerary days)
app.get('/api/guides/assigned-tours/:id', async (req, res) => {
  try {
    const { TourAssignment, TourSchedule, Tour, Booking, User, Participant, TourItineraryDay } = db;
    const targetId = req.params.id;

    // Try finding by schedule_id or assignment_id
    let assignment = await TourAssignment.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { id: targetId },
          { scheduleId: targetId }
        ],
        guideId: 'guide-1'
      },
      include: [
        {
          model: User,
          as: 'guide',
          attributes: ['id', 'fullName', 'role', 'phone']
        },
        {
          model: TourSchedule,
          as: 'schedule',
          include: [
            {
              model: Tour,
              as: 'tour',
              include: [
                {
                  model: TourItineraryDay,
                  as: 'itineraryDays'
                }
              ]
            },
            {
              model: Booking,
              as: 'bookings',
              include: [
                {
                  model: User,
                  as: 'customer',
                  attributes: ['id', 'fullName', 'phone']
                },
                {
                  model: Participant,
                  as: 'participants'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Tour assignment not found' });
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Export excel dummy route
app.get('/api/guides/assigned-tours/export', (req, res) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
  res.send(Buffer.from([]));
});

// 5. Update Status
app.patch('/api/guides/assigned-tours/:assignmentId/status', async (req, res) => {
  try {
    const { TourAssignment, TourSchedule } = db;
    const { status } = req.body;

    const assignment = await TourAssignment.findByPk(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const schedule = await TourSchedule.findByPk(assignment.scheduleId);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    schedule.status = status;
    await schedule.save();

    res.json({ message: 'Status updated successfully', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get Guide Profile
app.get('/api/guides/profile', async (req, res) => {
  try {
    const { User } = db;
    const guide = await User.findByPk('guide-1');
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }
    res.json(guide);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Guide Profile
app.patch('/api/guides/profile', async (req, res) => {
  try {
    const { User } = db;
    const { fullName, phone, dateOfBirth, address, avatarUrl } = req.body;
    const guide = await User.findByPk('guide-1');
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    if (fullName !== undefined) guide.fullName = fullName;
    if (phone !== undefined) guide.phone = phone;
    if (dateOfBirth !== undefined) guide.dateOfBirth = dateOfBirth;
    if (address !== undefined) guide.address = address;
    if (avatarUrl !== undefined) guide.avatarUrl = avatarUrl;

    await guide.save();
    res.json(guide);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==================== START SERVER & DATABASE CONNECTION ====================

db.sequelize.authenticate()
  .then(async () => {
    console.log('MySQL Database Connected.');
    // Alter: true to automatically add missing columns (like role) without wiping data
    await db.sequelize.sync({ alter: true });
    
    // Seed default records if empty
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Backend Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database Connection Error:', err);
  });
