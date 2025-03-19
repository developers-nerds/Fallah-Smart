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
        type: DataTypes.STRING,
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

  UserDevice.associate = function(models) {
    UserDevice.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return UserDevice;
}; 