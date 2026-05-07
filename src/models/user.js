"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Định nghĩa quan hệ (nếu có) ở đây
        }
    }
    User.init(
        {
            // Lưu ý: Không cần định nghĩa trường 'id' vì Sequelize tự hiểu
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: { isEmail: true },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            firstName: DataTypes.STRING,
            lastName: DataTypes.STRING,
            address: DataTypes.STRING,
            phoneNumber: DataTypes.STRING,
            gender: DataTypes.BOOLEAN, // true: Nam, false: Nữ
            image: DataTypes.STRING,
            roleId: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "User",
            tableName: "users", // Đảm bảo trùng với tên bảng trong Migration
        },
    );
    return User;
};
