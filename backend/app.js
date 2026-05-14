// backend/app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./models");
const userRoutes = require("./routes/user.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

db.sequelize.sync().then(() => {
    console.log("DB connected");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
