module.exports = (sequelize, DataTypes) => {
  const StockTools = sequelize.define(
    "StockTools",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      minQuantityAlert: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      category: {
        type: DataTypes.ENUM(
          'hand_tools',
          'power_tools',
          'pruning_tools',
          'irrigation_tools',
          'harvesting_tools',
          'measuring_tools',
          'safety_equipment',
          'other'
        ),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('available', 'in_use', 'maintenance', 'broken', 'lost'),
        defaultValue: 'available',
      },
      condition: {
        type: DataTypes.ENUM('new', 'good', 'fair', 'poor'),
        defaultValue: 'good',
      },
      purchaseDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastMaintenanceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nextMaintenanceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      maintenanceInterval: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Maintenance interval in days",
      },
      brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      purchasePrice: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      replacementCost: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      storageLocation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      assignedTo: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Name of person currently using the tool",
      },
      checkoutDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expectedReturnDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      maintenanceNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      usageInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      safetyGuidelines: {
        type: DataTypes.TEXT,
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
      tableName: "stock_tools",
      timestamps: true,
    }
  );

  StockTools.associate = function(models) {
    StockTools.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
    StockTools.hasMany(models.StockHistory, {
      foreignKey: 'stockToolsId',
      as: 'history'
    });
    StockTools.hasMany(models.Media, {
      foreignKey: 'stockToolsId',
      as: 'images'
    });
  };

  return StockTools;
}; 