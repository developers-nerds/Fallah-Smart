module.exports = (sequelize, DataTypes) => {
  const UserAnimals = sequelize.define("UserAnimals", {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    healthStatus: {
      type: DataTypes.STRING,
      defaultValue: "Good",
    },
    feedNeeded: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    sex: {
      type: DataTypes.ENUM("Male", "Female"),
      allowNull: false,
    },
  });

  return UserAnimals;
};
