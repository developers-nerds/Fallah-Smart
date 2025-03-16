module.exports = (sequelize, DataTypes) => {
  const StockHarvest = sequelize.define(
    "StockHarvest",
    {
      cropName: {
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
      quality: {
        type: DataTypes.ENUM('premium', 'standard', 'secondary'),
        defaultValue: 'standard',
      },
      harvestDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      storageLocation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      batchNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Current market price per unit",
      },
      moisture: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Moisture content percentage",
      },
      storageConditions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      certifications: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
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
      tableName: "stock_harvest",
      timestamps: true,
    }
  );

  StockHarvest.associate = function(models) {
    StockHarvest.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
    StockHarvest.hasMany(models.StockHistory, {
      foreignKey: 'stockHarvestId',
      as: 'history'
    });
    StockHarvest.belongsTo(models.Crop, {
      foreignKey: 'cropId',
      as: 'crop'
    });
  };

  return StockHarvest;
}; 