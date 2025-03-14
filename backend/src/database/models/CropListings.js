module.exports = (sequelize, DataTypes) => {
  const CropListings = sequelize.define(
    "Crop_Listings",
    {
      crop_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      sub_category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true, // Null for auctions
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      unit: {
        type: DataTypes.ENUM(
          "kg",
          "g",
          "l",
          "ml",
          "pcs",
          "bag",
          "box",
          "can",
          "bottle",
          "jar",
          "packet",
          "piece",
          "roll",
          "sheet",
          "tube",
          "unit"
        ),
        allowNull: false,
      },

      listing_type: {
        type: DataTypes.ENUM("fixed", "auction"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "sold", "expired"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      timestamps: true,
      tableName: "crop_listings",
    }
  );

  return CropListings;
};
