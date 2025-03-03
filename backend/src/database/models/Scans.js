module.exports = (sequelize, DataTypes) => {
  const Scan = sequelize.define(
    "Scan",
    {
      ai_response: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      picture: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      picture_mime_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return Scan;
};
