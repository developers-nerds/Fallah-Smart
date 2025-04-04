module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define(
    "Users",
    {
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          isAlphanumeric: true,
        },
      },
      firstName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("ADMIN", "USER","ADVISOR"),
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      phoneNumber: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [8, 255],
        },
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      profilePicture: {
        type: DataTypes.STRING(255),
        allowNull: true,
      }
    },
    {
      timestamps: true,
      tableName: "users",
      indexes: [
        {
          unique: true,
          fields: ["email"]
        },
        {
          unique: true,
          fields: ["username"]
        }
      ]
    }
  );

  return Users;
};
