module.exports = (sequelize, DataTypes) => {
  const Scan = sequelize.define(
    "Scan",
    {
      ai_response: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  return Scan;
};
