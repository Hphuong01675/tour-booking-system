const db = require('../models');
const bcrypt = require('bcryptjs');
const { USER_ROLES, TOUR_STATUS, PARTICIPANT_TYPE, BOOKING_STATUS, SCHEDULE_STATUS } = require('../constants/enums');

async function seedDemoTour() {
  try {
    const { User, Tour, TourSchedule, TourAssignment, Booking, Participant } = db;

    // Config
    const guideEmail = 'phoai4355@gmail.com';
    const guidePassword = 'Hoaiphuong01675@';
    const totalCustomers = 15;
    const leadCount = 4;

    // 1. Create or find guide user
    let guide = await User.findOne({ where: { email: guideEmail } });
    if (!guide) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(guidePassword, salt);
      guide = await User.create({
        fullName: 'Demo Guide Phoai',
        email: guideEmail,
        passwordHash,
        phone: '0900000000',
        role: USER_ROLES.GUIDE,
        isActive: true,
      });
      console.log('Created guide:', guide.email);
    } else {
      // Update existing guide password to the provided demo password to ensure known credentials
      try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(guidePassword, salt);
        guide.passwordHash = passwordHash;
        guide.phone = guide.phone || '0900000000';
        guide.isActive = true;
        await guide.save();
        console.log('Guide exists - updated password and ensured active:', guide.email);
      } catch (e) {
        console.warn('Failed to update existing guide password (continuing):', e.message);
      }
    }

    // 2. Create a demo tour
    const timestamp = Date.now();
    const tourCode = `TOUR_DEMO_${timestamp}`;
    const slug = `tour-demo-${timestamp}`;

    const tour = await Tour.create({
      createdBy: guide.id,
      tourCode,
      title: 'Tour Demo: Hành trình 3 ngày 2 đêm',
      slug,
      description: 'Tour demo tạo bởi seeder cho môi trường phát triển.',
      departureLocation: 'Hà Nội',
      destination: 'Hạ Long',
      durationDays: 3,
      durationNights: 2,
      basePrice: 1500000,
      thumbnailUrl: null,
      status: TOUR_STATUS.OPEN,
      isPublished: true
    });
    console.log('Created tour:', tour.tourCode);

    // 3. Create a schedule
    const depDate = new Date();
    depDate.setDate(depDate.getDate() + 7); // one week from now
    const retDate = new Date(depDate);
    retDate.setDate(depDate.getDate() + 2);

    const scheduleCode = `SCD_DEMO_${timestamp}`;
    const schedule = await TourSchedule.create({
      tourId: tour.id,
      scheduleCode,
      departureDate: depDate,
      returnDate: retDate,
      price: tour.basePrice,
      maxCapacity: 30,
      registered: totalCustomers,
      status: SCHEDULE_STATUS.OPEN
    });
    console.log('Created schedule:', schedule.scheduleCode);

    // 4. Create assignment (assign guide)
    const assignment = await TourAssignment.create({
      scheduleId: schedule.id,
      guideId: guide.id,
      assignedBy: guide.id
    });
    console.log('Created assignment:', assignment.id);

    // 5. Create customers / bookings / participants
    const customers = [];
    for (let i = 0; i < totalCustomers; i++) {
      const idx = i + 1;
      const email = `demo_customer_${timestamp}_${idx}@example.com`;
      const password = 'Customer@123';
      const salt = await bcrypt.genSalt(8);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        fullName: `Cus_${idx}`,
        email,
        passwordHash,
        phone: `0900${String(1000 + idx).slice(-4)}`,
        role: USER_ROLES.CUSTOMER,
        isActive: true
      });
      customers.push(user);
    }

    // Create bookings & participants
    for (let i = 0; i < totalCustomers; i++) {
      const customer = customers[i];
      const bookingCode = `BKG_DEMO_${String(i + 1).padStart(3, '0')}`;

      const booking = await Booking.create({
        customerId: customer.id,
        scheduleId: schedule.id,
        bookingCode,
        status: BOOKING_STATUS.PAID,
        totalPrice: schedule.price,
        discountAmount: 0,
        finalPrice: schedule.price,
      });

      const isLead = i < leadCount; // first N are leads
      const participantType = i % 6 === 0 ? PARTICIPANT_TYPE.CHILD : PARTICIPANT_TYPE.ADULT; // some children
      const checkinCode = `QR-DEMO-${timestamp}-${i + 1}`;

      await Participant.create({
        bookingId: booking.id,
        fullName: customer.fullName,
        dateOfBirth: new Date(1990, 0, 1),
        participantType,
        address: 'Địa chỉ demo',
        isLead: !!isLead,
        checkinCode
      });
    }

    console.log('Seeded demo tour with', totalCustomers, 'customers (', leadCount, 'leads ).');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding demo tour:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDemoTour();
}

module.exports = seedDemoTour;

