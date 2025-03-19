module.exports = (sequelize, DataTypes) => {
  const UserDevice = sequelize.define(
    "UserDevice",
    {
      deviceToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      deviceType: {
        type: DataTypes.ENUM('mobile', 'tablet', 'web'),
        defaultValue: 'mobile',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lastActive: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      tableName: "user_devices",
      timestamps: true,
    }
  );

  return UserDevice;
}; 