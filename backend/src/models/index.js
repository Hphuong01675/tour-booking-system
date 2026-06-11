// Đường dẫn: backend/src/models/index.js
/**
 * Khởi tạo toàn bộ Models và Associations
 * Entry point duy nhất để import các models từ nơi khác
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

// Đọc tất cả file model (trừ index.js và các file không phải .js)
fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-3) === '.js'
  )
  .forEach((file) => {
    // Import model
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    // Lưu model vào object db với key là tên model
    db[model.name] = model;
  });

// Thiết lập tất cả associations sau khi load xong tất cả models
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Export các hằng số và utilities
Object.assign(db, {
  sequelize,
  Sequelize,
});

module.exports = db;

