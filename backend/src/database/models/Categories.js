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
      icon: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'default-icon',
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '#000000',
      },
    },
    {
      timestamps: false,
    }
  );

  return Category;
};
