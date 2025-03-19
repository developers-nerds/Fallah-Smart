module.exports = (sequelize, DataTypes) => {
  const StockNotification = sequelize.define(
    "StockNotification",
    {
      type: {
        type: DataTypes.ENUM(
          'low_stock',
          'expiry',
          'maintenance',
          'vaccination',
          'breeding',
          'harvest',
          'feed',
          'other'
        ),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'read', 'actioned'),
        defaultValue: 'pending',
      },
      scheduledFor: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actionedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      relatedModelType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Name of the related model (e.g., 'StockFeed', 'AnimalGaston')",
      },
      relatedModelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Phone number to send SMS notification to",
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
      tableName: "stock_notifications",
      timestamps: true,
    }
  );

  StockNotification.associate = function(models) {
    StockNotification.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return StockNotification;
}; 