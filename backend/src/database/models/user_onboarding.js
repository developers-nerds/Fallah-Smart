module.exports = (sequelize, DataTypes) => {
  const UserOnboarding = sequelize.define(
    "UserOnboarding",
    {
      marketPlace: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      app: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      tableName: "UserOnboarding",
    }
  );
  return UserOnboarding;
};
