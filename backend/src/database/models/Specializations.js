module.exports = (sequelize, DataTypes) => {
  const Specializations = sequelize.define(
    "Specializations",
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [2, 100],
          notEmpty: true,
        },
      },
      icon: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

    },
    {
      timestamps: true,
      tableName: "specializations",
    }
  );



  return Specializations;
};
