module.exports = (sequelize, DataTypes) => {
  const CropOrders = sequelize.define(
    "Crop_Orders",
    {
      quantity_ordered: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0.01,
        },
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      order_status: {
        type: DataTypes.ENUM("pending", "confirmed", "completed"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      timestamps: true,
      tableName: "crop_orders",
    }
  );

  return CropOrders;
};
