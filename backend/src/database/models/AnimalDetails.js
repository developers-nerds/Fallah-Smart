module.exports = (connection, DataTypes) => {
  const AnimalDetails = connection.define(
    "AnimalDetails",
    {
      feeding: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      care: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      health: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      housing: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      breeding: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      diseases: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      medications: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      behavior: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      economics: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      vaccination: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "animal_details",
      timestamps: false,
    }
  );
  return AnimalDetails;
};
