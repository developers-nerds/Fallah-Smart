module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define(
    "Stock",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false, // Ex. : "Graines de maïs"
      },
      quantity: {
        type: DataTypes.FLOAT,
        allowNull: false, // Ex. : 50 (en kg, litres, etc.)
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false, // Ex. : "kg", "litres"
        validate: {
          isIn: [["kg", "L", "unités", "bottes", "sacs"]],
        },
      },
      lowStockThreshold: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 10, // Seuil pour alerte
        validate: {
          min: 0,
        },
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [
            [
              "Céréales",
              "Fruits",
              "Légumes",
              "Viande",
              "Produits laitiers",
              "Fourrage",
              "Autre",
            ],
          ],
        },
      },
    },
    {
      timestamps: true,
    }
  );

  return Stock;
};
