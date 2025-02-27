  module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define(
      "Category",
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM("Income", "Expense", "crops", "animals"),
          allowNull: false,
        },
      },
      {
        timestamps: false,
      }
    );

    return Category;
  };
