module.exports = (sequelize, DataTypes) => {
  const StockFertilizer = sequelize.define(
    "StockFertilizer",
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
      type: {
        type: DataTypes.ENUM('organic', 'chemical', 'mixed'),
        allowNull: false,
      },
      npkRatio: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "N-P-K ratio (e.g., '20-10-10')",
      },
      applicationRate: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Recommended application rate per hectare",
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      supplier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      safetyGuidelines: {
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
      tableName: "stock_fertilizer",
      timestamps: true,
    }
  );

  StockFertilizer.associate = function(models) {
    StockFertilizer.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
    StockFertilizer.hasMany(models.StockHistory, {
      foreignKey: 'stockFertilizerId',
      as: 'history'
    });
  };

  return StockFertilizer;
}; 