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
        type: DataTypes.ENUM('add', 'remove', 'expired', 'damaged'),
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
      stockId: {
        type: DataTypes.BIGINT,
        allowNull: false,
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
  };

  return StockHistory;
};
