module.exports = (sequelize, DataTypes) => {
  const StockHistory = sequelize.define(
    "StockHistory",
    {
      type: {
        type: DataTypes.ENUM("add", "remove"),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
    },
    {
      timestamps: true,
    }
  );
  return StockHistory;
};
