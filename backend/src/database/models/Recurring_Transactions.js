module.exports = (sequelize, DataTypes) => {
  const RecurringTransaction = sequelize.define(
    "RecurringTransaction",
    {
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("income", "expense"),
        allowNull: false,
      },
      frequency: {
        type: DataTypes.ENUM("daily", "weekly", "monthly", "yearly"),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return RecurringTransaction;
};
