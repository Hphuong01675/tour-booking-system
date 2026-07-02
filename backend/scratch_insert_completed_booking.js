const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const db = require('./src/models');

async function run() {
    try {
        console.log('Inserting completed tour booking for evaluation testing...');
        
        // 1. Find or create user by email
        const userEmail = 'lehai332k5@gmail.com';
        const passwordHash = require('bcryptjs').hashSync("Levuhai2@5", 10);
        let user = await db.User.findOne({ where: { email: userEmail } });
        let userCreated = false;
        if (!user) {
            user = await db.User.create({
                id: 'customer-lehai',
                fullName: 'Lê Vũ Hải',
                email: userEmail,
                passwordHash: passwordHash,
                phone: '0901234567',
                role: 'customer',
                isActive: true
            });
            userCreated = true;
        }
        console.log(`${userCreated ? 'Created' : 'Found'} customer: ${user.fullName} (${user.id})`);

        // 2. Find or create tour 'tour-1'
        const [tour, tourCreated] = await db.Tour.findOrCreate({
            where: { id: 'tour-1' },
            defaults: {
                id: 'tour-1',
                tourCode: 'GE-VN-1024',
                title: 'Kỳ nghỉ Thượng hạng: Đà Nẵng - Hội An - Huế',
                slug: 'ky-nghi-thuong-hang-da-nang-hoi-an-hue',
                description: 'Quản lý lịch trình, điều phối khách hàng và theo dõi tiến độ đoàn du lịch miền Trung.',
                highlights: 'Đà Nẵng - Hội An - Cố đô Huế (5 Ngày 4 Đêm)',
                departureLocation: 'Sài Gòn',
                destination: 'Đà Nẵng - Hội An - Cố đô Huế',
                basePrice: 15000000.0,
                durationDays: 5,
                durationNights: 4,
                thumbnailUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop',
                isPublished: true,
                status: 'open'
            }
        });
        console.log(`${tourCreated ? 'Created' : 'Found'} tour: ${tour.title} (${tour.id})`);

        // 3. Create a schedule in the past
        const departureDate = new Date();
        departureDate.setDate(departureDate.getDate() - 5); // 5 days ago
        
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() - 2); // 2 days ago

        const [schedule, scheduleCreated] = await db.TourSchedule.findOrCreate({
            where: { scheduleCode: 'SCH-REV-TEST' },
            defaults: {
                id: 'schedule-rev-test',
                tourId: tour.id,
                scheduleCode: 'SCH-REV-TEST',
                departureDate: departureDate,
                returnDate: returnDate,
                price: 15000000.0,
                maxCapacity: 10,
                registered: 1,
                status: 'open'
            }
        });
        console.log(`${scheduleCreated ? 'Created new' : 'Found existing'} schedule: ${schedule.scheduleCode} (${schedule.id})`);

        // If the schedule already existed, update its dates to be in the past to ensure it matches filters
        if (!scheduleCreated) {
            schedule.departureDate = departureDate;
            schedule.returnDate = returnDate;
            await schedule.save();
            console.log('Updated existing schedule dates to the past.');
        }

        // 4. Create a paid Booking for customer-1
        const [booking, bookingCreated] = await db.Booking.findOrCreate({
            where: { bookingCode: 'BK-REV-TEST' },
            defaults: {
                id: 'booking-rev-test',
                customerId: user.id,
                scheduleId: schedule.id,
                bookingCode: 'BK-REV-TEST',
                status: 'paid',
                totalPrice: 15000000.0,
                discountAmount: 0,
                finalPrice: 15000000.0,
                bookedAt: departureDate
            }
        });
        console.log(`${bookingCreated ? 'Created new' : 'Found existing'} booking: ${booking.bookingCode} (${booking.id})`);

        // If booking already exists, make sure status is 'paid'
        if (!bookingCreated && booking.status !== 'paid') {
            booking.status = 'paid';
            await booking.save();
            console.log('Updated existing booking status to PAID.');
        }

        // 5. Create a checked-in Participant
        const [participant, participantCreated] = await db.Participant.findOrCreate({
            where: { id: 'participant-rev-test' },
            defaults: {
                id: 'participant-rev-test',
                bookingId: booking.id,
                fullName: user.fullName,
                dateOfBirth: new Date('1995-01-01'),
                participantType: 'adult',
                isLead: true,
                checkinAt: departureDate, // Checked in at start of tour
                status: 'active'
            }
        });
        console.log(`${participantCreated ? 'Created new' : 'Found existing'} participant: ${participant.fullName} (${participant.id})`);

        // Ensure checkinAt is set
        if (!participantCreated && !participant.checkinAt) {
            participant.checkinAt = departureDate;
            await participant.save();
            console.log('Updated existing participant to have checkinAt date.');
        }

        // 6. Delete any existing review for this booking to let user test creating/submitting a new review
        const deletedReviews = await db.Review.destroy({
            where: { bookingId: booking.id }
        });
        if (deletedReviews > 0) {
            console.log('Deleted existing reviews for this booking so you can submit a new one.');
        }

        console.log('\n--- SUCCESS ---');
        console.log(`You can now log in as Customer: ${userEmail} / Levuhai2@5`);
        console.log('Go to "Đánh giá chuyến đi" or the corresponding tab to write a review.');
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.sequelize.close();
    }
}

run();
