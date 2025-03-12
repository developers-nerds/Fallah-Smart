module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define("Location", {
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  }  ,  {
    timestamps: true,
    tableName: "Location",
  });
  return Location;
};
