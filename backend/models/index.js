"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];
const db = {};

let sequelize;
// Allow DATABASE_URL (full connection string) or env vars to override JSON config
const DATABASE_URL = process.env.DATABASE_URL;
const jsonConfig = require(__dirname + "/../config/config.json")[env] || {};
const DB_NAME =
    process.env.DB_NAME || process.env.MYSQL_DATABASE || jsonConfig.database;
const DB_USER =
    process.env.DB_USER || process.env.MYSQL_USER || jsonConfig.username;
const DB_PASS =
    process.env.DB_PASS ||
    process.env.MYSQL_PASSWORD ||
    process.env.DB_PASSWORD ||
    jsonConfig.password;
const DB_HOST = process.env.DB_HOST || jsonConfig.host || "127.0.0.1";
const DB_DIALECT = process.env.DB_DIALECT || jsonConfig.dialect || "mysql";
const DB_LOGGING =
    process.env.DB_LOGGING === "true"
        ? console.log
        : jsonConfig.logging || false;

if (DATABASE_URL) {
    sequelize = new Sequelize(DATABASE_URL, { logging: DB_LOGGING });
} else {
    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
        host: DB_HOST,
        dialect: DB_DIALECT,
        logging: DB_LOGGING,
    });
}

fs.readdirSync(__dirname)
    .filter((file) => {
        return (
            file.indexOf(".") !== 0 &&
            file !== basename &&
            file.slice(-3) === ".js" &&
            file.indexOf(".test.js") === -1
        );
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, file))(
            sequelize,
            Sequelize.DataTypes,
        );
        db[model.name] = model;
    });

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
