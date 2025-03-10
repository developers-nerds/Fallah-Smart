module.exports = (sequelize, DataTypes) => {
  const StockSeeds = sequelize.define(
    "StockSeeds",
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
        defaultValue: "kg",
      },
      minQuantityAlert: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 50,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      cropType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      variety: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      plantingSeasonStart: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      plantingSeasonEnd: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      germination: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Germination rate percentage",
      },
      supplier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      certificationInfo: {
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
      tableName: "stock_seeds",
      timestamps: true,
    }
  );

  StockSeeds.associate = function(models) {
    StockSeeds.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
    StockSeeds.hasMany(models.StockHistory, {
      foreignKey: 'stockSeedsId',
      as: 'history'
    });
  };

  return StockSeeds;
}; 