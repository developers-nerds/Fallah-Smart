module.exports = (sequelize, DataTypes) => {
  const TradingCategories = sequelize.define("TradingCategories", {
    category_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return TradingCategories;
};
