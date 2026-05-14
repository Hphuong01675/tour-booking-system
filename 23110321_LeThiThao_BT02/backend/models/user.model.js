// backend/models/user.model.js
module.exports = (sequelize, DataTypes) => {
    return sequelize.define("User", {
        email: {
            type: DataTypes.STRING,
            unique: true,
        },
        password: DataTypes.STRING,
        fullName: DataTypes.STRING,
        age: DataTypes.INTEGER,
        gender: DataTypes.STRING,
        phone: DataTypes.STRING,
        role: DataTypes.STRING,
    });
};
