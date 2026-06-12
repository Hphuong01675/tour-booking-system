const { Sequelize } = require("sequelize");

// Read DB config from environment variables with sensible dev defaults
const DB_NAME =
    process.env.DB_NAME || process.env.MYSQL_DATABASE || "tour_booking";
const DB_USER = process.env.DB_USER || process.env.MYSQL_USER || "root";
const DB_PASS =
    process.env.DB_PASS ||
    process.env.MYSQL_PASSWORD ||
    process.env.DB_PASSWORD ||
    "";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_DIALECT = process.env.DB_DIALECT || "mysql";
const DB_LOGGING = process.env.DB_LOGGING === "true" ? console.log : false;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    dialect: DB_DIALECT,
    logging: DB_LOGGING,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Kết nối Database thành công.");
    } catch (error) {
        console.error("❌ Không thể kết nối Database:", error);
    }
};

module.exports = connectDB;
