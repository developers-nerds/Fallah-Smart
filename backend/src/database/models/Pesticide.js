module.exports = (sequelize, DataTypes) => {
  const Pesticide = sequelize.define(
    "Pesticide",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "litres",
      },
      isNatural: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    },
    {
      timestamps: true,
    }
  );

  Pesticide.associate = function(models) {
    Pesticide.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return Pesticide;
};
