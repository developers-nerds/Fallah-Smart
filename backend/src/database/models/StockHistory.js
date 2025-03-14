module.exports = (sequelize, DataTypes) => {
  const StockHistory = sequelize.define(
    "StockHistory",
    {
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      quantity: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('add', 'remove', 'expired', 'damaged', 'initial', 'update', 'addition', 'reduction', 'status_change'),
        allowNull: false
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true
      },
      previousQuantity: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      newQuantity: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      // Foreign keys for different stock types
      stockId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      stockSeedsId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      stockFeedId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      stockFertilizerId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      stockEquipmentId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      stockHarvestId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      stockToolsId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      pesticideId: {
        type: DataTypes.BIGINT,
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
      timestamps: true,
    }
  );

  StockHistory.associate = (models) => {
    StockHistory.belongsTo(models.Stock, {
      foreignKey: 'stockId',
      as: 'stock'
    });
    StockHistory.belongsTo(models.StockSeeds, {
      foreignKey: 'stockSeedsId',
      as: 'stockSeeds'
    });
    StockHistory.belongsTo(models.StockFeed, {
      foreignKey: 'stockFeedId',
      as: 'stockFeed'
    });
    StockHistory.belongsTo(models.StockFertilizer, {
      foreignKey: 'stockFertilizerId',
      as: 'stockFertilizer'
    });
    StockHistory.belongsTo(models.StockEquipment, {
      foreignKey: 'stockEquipmentId',
      as: 'stockEquipment'
    });
    StockHistory.belongsTo(models.StockHarvest, {
      foreignKey: 'stockHarvestId',
      as: 'stockHarvest'
    });
    StockHistory.belongsTo(models.StockTools, {
      foreignKey: 'stockToolsId',
      as: 'stockTools'
    });
    StockHistory.belongsTo(models.Pesticide, {
      foreignKey: 'pesticideId',
      as: 'pesticide'
    });
    StockHistory.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return StockHistory;
};
