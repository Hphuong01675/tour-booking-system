// Đường dẫn: backend/src/config/database.js
'use strict';

const Sequelize = require('sequelize');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const config = require('./config.json')[env];

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      port: config.port || 3306,
      logging: config.logging === 'true' ? console.log : false,
      timezone: '+07:00', // GMT+7 cho Việt Nam
      define: {
        timestamps: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    }
  );
}

module.exports = sequelize;

