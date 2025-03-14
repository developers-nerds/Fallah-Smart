module.exports = (sequelize, DataTypes) => {
  const ScanHistory = sequelize.define(
    "ScanHistory",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return ScanHistory;
};
