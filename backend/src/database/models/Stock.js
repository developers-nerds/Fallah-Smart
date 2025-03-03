module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define(
    "Stock",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
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
        type: DataTypes.ENUM('kg', 'g', 'l', 'ml', 'units'),
        allowNull: false, // Ex. : "kg", "litres"
      },
      category: {
        type: DataTypes.ENUM('seeds', 'fertilizer', 'harvest', 'feed', 'pesticide', 'equipment', 'tools'),
        allowNull: false,
      },
      lowStockThreshold: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 10, // Seuil pour alerte
        validate: {
          min: 0,
        },
      },
      isNatural: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      supplier: {
        type: DataTypes.STRING,
        allowNull: true
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      lastCheckDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      qualityStatus: {
        type: DataTypes.ENUM('good', 'medium', 'poor'),
        allowNull: true
      },
      batchNumber: {
        type: DataTypes.STRING,
        allowNull: true
      },
    },
    {
      timestamps: true,
    }
  );

  return Stock;
};
