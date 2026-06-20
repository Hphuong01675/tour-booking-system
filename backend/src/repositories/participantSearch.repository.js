/**
 * Participant Search Repository
 * Handles database queries for participant search operations
 */

class ParticipantSearchRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Find tour assignment with full participant data
   */
  async findAssignmentWithDetails(targetId, guideId) {
    const { TourAssignment, TourSchedule, Tour, Booking, User, Participant, TourItineraryDay } = this.db;

    const assignment = await TourAssignment.findOne({
      where: {
        [this.db.Sequelize.Op.or]: [
          { id: targetId },
          { scheduleId: targetId }
        ],
        guideId
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
                  attributes: ['id', 'fullName', 'phone', 'email']
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

    return assignment;
  }

  /**
   * Find participant by check-in code for check-in operation
   */
  async findParticipantByCheckinCode(checkinCode, guideId, targetId) {
    const { Participant, Booking, TourSchedule, TourAssignment } = this.db;

    const participant = await Participant.findOne({
      where: { checkinCode },
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          include: [
            {
              model: TourSchedule,
              as: 'schedule',
              required: true,
              include: [
                {
                  model: TourAssignment,
                  as: 'assignments',
                  where: {
                    guideId,
                    [this.db.Sequelize.Op.or]: [
                      { id: targetId },
                      { scheduleId: targetId }
                    ]
                  },
                  required: true
                }
              ]
            }
          ]
        }
      ]
    });

    return participant;
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(targetId, guideId) {
    const { TourAssignment, Booking, Participant } = this.db;

    const assignment = await TourAssignment.findOne({
      where: {
        [this.db.Sequelize.Op.or]: [
          { id: targetId },
          { scheduleId: targetId }
        ],
        guideId
      },
      attributes: ['id'],
      include: [
        {
          model: TourAssignment.associations.schedule?.target,
          as: 'schedule',
          attributes: ['id'],
          include: [
            {
              model: Booking,
              as: 'bookings',
              attributes: ['id'],
              include: [
                {
                  model: Participant,
                  as: 'participants',
                  attributes: ['id', 'checkinAt']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!assignment || !assignment.schedule) {
      return null;
    }

    let total = 0;
    let checkedInTotal = 0;

    (assignment.schedule.bookings || []).forEach((booking) => {
      (booking.participants || []).forEach((participant) => {
        total++;
        if (participant.checkinAt) {
          checkedInTotal++;
        }
      });
    });

    return {
      total,
      checkedInTotal
    };
  }

  /**
   * Update participant check-in status
   */
  async updateParticipantCheckin(participantId, checkinAt) {
    const { Participant } = this.db;

    const participant = await Participant.findByPk(participantId);
    if (!participant) {
      return null;
    }

    participant.checkinAt = checkinAt ? new Date(checkinAt) : null;
    await participant.save();

    return participant;
  }

  /**
   * Get all bookings for an assignment
   */
  async getAssignmentBookings(targetId, guideId) {
    const { TourAssignment, TourSchedule, Booking, User, Participant } = this.db;

    const assignment = await TourAssignment.findOne({
      where: {
        [this.db.Sequelize.Op.or]: [
          { id: targetId },
          { scheduleId: targetId }
        ],
        guideId
      },
      include: [
        {
          model: TourSchedule,
          as: 'schedule',
          include: [
            {
              model: Booking,
              as: 'bookings',
              include: [
                {
                  model: User,
                  as: 'customer',
                  attributes: ['id', 'fullName', 'phone', 'email']
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

    return assignment;
  }
}

export default ParticipantSearchRepository;

