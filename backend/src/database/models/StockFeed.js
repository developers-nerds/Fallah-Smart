module.exports = (sequelize, DataTypes) => {
  const StockFeed = sequelize.define(
    "StockFeed",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "kg",
      },
      minQuantityAlert: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 100,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      animalType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Type of animal this feed is for",
      },
      dailyConsumptionRate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: "Average daily consumption per animal in kg",
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      supplier: {
        type: DataTypes.STRING,
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
      tableName: "stock_feed",
      timestamps: true,
    }
  );

  StockFeed.associate = function(models) {
    StockFeed.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
    StockFeed.hasMany(models.StockHistory, {
      foreignKey: 'stockFeedId',
      as: 'history'
    });
  };

  return StockFeed;
}; 