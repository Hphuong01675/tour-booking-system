// backend/config/db.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const dialect = process.env.DB_DIALECT || (process.env.DB_NAME ? "mysql" : "sqlite");
const config = { dialect };

if (dialect === "mysql") {
    config.host = process.env.DB_HOST || "localhost";
} else {
    config.storage = process.env.DB_STORAGE || "database.sqlite";
}

const sequelize = new Sequelize(
    process.env.DB_NAME || "tour_profile_db",
    process.env.DB_USER || null,
    process.env.DB_PASS || null,
    config
);

module.exports = sequelize;
