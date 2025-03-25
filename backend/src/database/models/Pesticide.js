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
      minQuantityAlert: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 10,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      isNatural: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      type: {
        type: DataTypes.ENUM('insecticide', 'herbicide', 'fungicide', 'other'),
        allowNull: false,
      },
      activeIngredients: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      targetPests: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Pests that this pesticide targets",
      },
      applicationRate: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Recommended application rate per hectare",
      },
      safetyInterval: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Days to wait after application before harvest",
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      manufacturer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      registrationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Government registration/approval number",
      },
      storageConditions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      safetyPrecautions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      emergencyProcedures: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastApplicationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      supplier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      tableName: "pesticides",
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
