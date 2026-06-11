// Đường dẫn: backend/src/migrations/20240611000000-create-all-tables.js
/**
 * Migration: Tạo tất cả bảng dữ liệu theo DBML Schema
 * Chạy lệnh: npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Bảng Users
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
      },
      date_of_birth: {
        type: Sequelize.DATE,
      },
      address: {
        type: Sequelize.TEXT,
      },
      avatar_url: {
        type: Sequelize.STRING(500),
      },
      role: {
        type: Sequelize.ENUM('customer', 'operator', 'guide', 'admin'),
        allowNull: false,
        defaultValue: 'customer',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Tạo indexes cho bảng users
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);

    // Bảng Tours
    await queryInterface.createTable('tours', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      tour_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(220),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      highlights: {
        type: Sequelize.TEXT,
      },
      departure_location: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      destination: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      difficulty: {
        type: Sequelize.ENUM('normal', 'hard'),
        allowNull: false,
        defaultValue: 'normal',
      },
      status: {
        type: Sequelize.ENUM('draft', 'pending', 'upcoming', 'open', 'closed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      duration_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      duration_nights: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      base_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Tạo indexes cho bảng tours
    await queryInterface.addIndex('tours', ['status']);
    await queryInterface.addIndex('tours', ['difficulty']);
    await queryInterface.addIndex('tours', ['created_by']);
    await queryInterface.addIndex('tours', ['tour_code']);

    // Bảng Tour Information Categories
    await queryInterface.createTable('tour_information_categories', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      icon: {
        type: Sequelize.STRING(100),
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Tour Information
    await queryInterface.createTable('tour_information', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      tour_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tours',
          key: 'id',
        },
      },
      category_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tour_information_categories',
          key: 'id',
        },
      },
      content: {
        type: Sequelize.TEXT('long'),
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Tạo indexes cho bảng tour_information
    await queryInterface.addIndex('tour_information', ['tour_id']);
    await queryInterface.addIndex('tour_information', ['category_id']);
    await queryInterface.addIndex('tour_information', ['tour_id', 'category_id'], {
      unique: true,
    });

    // Bảng Tour Schedules
    await queryInterface.createTable('tour_schedules', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      tour_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tours',
          key: 'id',
        },
      },
      schedule_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      departure_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      return_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      max_capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      registered: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('open', 'closed', 'cancelled'),
        allowNull: false,
        defaultValue: 'open',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Tạo indexes cho bảng tour_schedules
    await queryInterface.addIndex('tour_schedules', ['tour_id']);
    await queryInterface.addIndex('tour_schedules', ['departure_date']);
    await queryInterface.addIndex('tour_schedules', ['schedule_code']);

    // Bảng Tour Itinerary Days
    await queryInterface.createTable('tour_itinerary_days', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      tour_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tours',
          key: 'id',
        },
      },
      day_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      meals: {
        type: Sequelize.STRING(200),
      },
      main_activity: {
        type: Sequelize.STRING(255),
      },
      description: {
        type: Sequelize.TEXT,
      },
      image_url: {
        type: Sequelize.STRING(500),
      },
    });

    // Bảng Tour Itinerary Locations
    await queryInterface.createTable('tour_itinerary_locations', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      itinerary_day_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tour_itinerary_days',
          key: 'id',
        },
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING(500),
      },
      visit_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    });

    // Bảng Tour Itinerary Items
    await queryInterface.createTable('tour_itinerary_items', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      itinerary_day_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tour_itinerary_days',
          key: 'id',
        },
      },
      title: {
        type: Sequelize.STRING(255),
      },
      description: {
        type: Sequelize.TEXT,
      },
      activity_time: {
        type: Sequelize.TIME,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    });

    // Bảng Tour Images
    await queryInterface.createTable('tour_images', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      tour_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tours',
          key: 'id',
        },
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });

    // Bảng Tour Assignments
    await queryInterface.createTable('tour_assignments', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      schedule_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tour_schedules',
          key: 'id',
        },
      },
      guide_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      assigned_by: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Vouchers
    await queryInterface.createTable('vouchers', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      discount_type: {
        type: Sequelize.ENUM('percent', 'fixed'),
        allowNull: false,
      },
      discount_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      max_discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
      },
      min_order_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      valid_from: {
        type: Sequelize.DATE,
      },
      valid_until: {
        type: Sequelize.DATE,
      },
      total_quantity: {
        type: Sequelize.INTEGER,
      },
      usage_limit_per_user: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      target_type: {
        type: Sequelize.ENUM('all', 'specific'),
        allowNull: false,
        defaultValue: 'all',
      },
      used_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Voucher Targets
    await queryInterface.createTable('voucher_targets', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      voucher_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      used_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });

    // Tạo index composite cho bảng voucher_targets
    await queryInterface.addIndex('voucher_targets', ['voucher_id', 'user_id'], {
      unique: true,
    });

    // Bảng Bookings
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      schedule_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tour_schedules',
          key: 'id',
        },
      },
      booking_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('pending_approval', 'pending_payment', 'paid', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending_payment',
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      final_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      voucher_id: {
        type: Sequelize.CHAR(36),
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
      },
      refund_amount: {
        type: Sequelize.DECIMAL(12, 2),
      },
      booked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Participants
    await queryInterface.createTable('participants', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      booking_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id',
        },
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      date_of_birth: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      participant_type: {
        type: Sequelize.ENUM('adult', 'child', 'infant'),
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
      },
      is_lead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      cccd_front_url: {
        type: Sequelize.STRING(500),
      },
      cccd_back_url: {
        type: Sequelize.STRING(500),
      },
      checkin_code: {
        type: Sequelize.STRING(50),
        unique: true,
      },
      checkin_at: {
        type: Sequelize.DATE,
      },
    });

    // Bảng Payments
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      booking_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id',
        },
      },
      transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      payment_method: {
        type: Sequelize.ENUM('vnpay'),
        allowNull: false,
        defaultValue: 'vnpay',
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      raw_response: {
        type: Sequelize.JSON,
      },
      paid_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Reviews
    await queryInterface.createTable('reviews', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      booking_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        unique: true,
        references: {
          model: 'bookings',
          key: 'id',
        },
      },
      overall_rating: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      general_comment: {
        type: Sequelize.TEXT,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Review Tags
    await queryInterface.createTable('review_tags', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });

    // Bảng Review Details
    await queryInterface.createTable('review_details', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      review_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'reviews',
          key: 'id',
        },
      },
      tag_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'review_tags',
          key: 'id',
        },
      },
      tag_rating: {
        type: Sequelize.SMALLINT,
      },
      specific_comment: {
        type: Sequelize.TEXT,
      },
    });

    // Tạo index composite cho bảng review_details
    await queryInterface.addIndex('review_details', ['review_id', 'tag_id'], {
      unique: true,
    });

    // Bảng Wishlists
    await queryInterface.createTable('wishlists', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      tour_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'tours',
          key: 'id',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Tạo index composite cho bảng wishlists
    await queryInterface.addIndex('wishlists', ['user_id', 'tour_id'], {
      unique: true,
    });

    // Bảng Conversations
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      session_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      guest_name: {
        type: Sequelize.STRING(50),
      },
      customer_id: {
        type: Sequelize.CHAR(36),
        references: {
          model: 'users',
          key: 'id',
        },
      },
      support_user_id: {
        type: Sequelize.CHAR(36),
        references: {
          model: 'users',
          key: 'id',
        },
      },
      status: {
        type: Sequelize.ENUM('waiting', 'active', 'closed'),
        allowNull: false,
        defaultValue: 'waiting',
      },
      last_message: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Messages
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      conversation_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id',
        },
      },
      sender_type: {
        type: Sequelize.ENUM('guest', 'user', 'guide', 'system'),
        allowNull: false,
      },
      sender_id: {
        type: Sequelize.CHAR(36),
        references: {
          model: 'users',
          key: 'id',
        },
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Packing Items
    await queryInterface.createTable('packing_items', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('DOCUMENT', 'FINANCE', 'CLOTHING', 'PERSONAL_CARE', 'ELECTRONICS', 'HEALTH', 'EQUIPMENT', 'FOOD_DRINK'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.CHAR(36),
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Checklist Templates
    await queryInterface.createTable('checklist_templates', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      guide_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Checklist Template Items
    await queryInterface.createTable('checklist_template_items', {
      template_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        references: {
          model: 'checklist_templates',
          key: 'id',
        },
      },
      item_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        references: {
          model: 'packing_items',
          key: 'id',
        },
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });

    // Tạo index composite (unique)
    await queryInterface.addIndex('checklist_template_items', ['template_id', 'item_id'], {
      unique: true,
    });

    // Bảng Schedule Checklists
    await queryInterface.createTable('schedule_checklists', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      schedule_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        unique: true,
        references: {
          model: 'tour_schedules',
          key: 'id',
        },
      },
      guide_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      custom_message: {
        type: Sequelize.TEXT,
      },
      last_sent_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Bảng Schedule Checklist Items
    await queryInterface.createTable('schedule_checklist_items', {
      checklist_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        references: {
          model: 'schedule_checklists',
          key: 'id',
        },
      },
      item_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        references: {
          model: 'packing_items',
          key: 'id',
        },
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });

    // Tạo index composite (unique)
    await queryInterface.addIndex('schedule_checklist_items', ['checklist_id', 'item_id'], {
      unique: true,
    });

    // Bảng Notifications
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      type: {
        type: Sequelize.ENUM('packing_reminder', 'booking_confirmation', 'payment_reminder', 'tour_update'),
        allowNull: false,
        defaultValue: 'packing_reminder',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    console.log('✅ Tất cả bảng đã được tạo thành công!');
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa bảng theo thứ tự ngược lại (các bảng có FK phải xóa trước)
    const tables = [
      'notifications',
      'schedule_checklist_items',
      'schedule_checklists',
      'checklist_template_items',
      'checklist_templates',
      'packing_items',
      'messages',
      'conversations',
      'wishlists',
      'review_details',
      'review_tags',
      'reviews',
      'payments',
      'participants',
      'bookings',
      'voucher_targets',
      'vouchers',
      'tour_assignments',
      'tour_images',
      'tour_itinerary_items',
      'tour_itinerary_locations',
      'tour_itinerary_days',
      'tour_schedules',
      'tour_information',
      'tour_information_categories',
      'tours',
      'users',
    ];

    for (const table of tables) {
      await queryInterface.dropTable(table, { force: true });
    }

    console.log('✅ Tất cả bảng đã được xóa thành công!');
  },
};

