module.exports = (sequelize, DataTypes) => {
  const StockEquipment = sequelize.define(
    "StockEquipment",
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
      type: {
        type: DataTypes.ENUM(
          'tractor',
          'harvester',
          'irrigation_system',
          'planter',
          'sprayer',
          'tillage_equipment',
          'generator',
          'pump',
          'storage_unit',
          'processing_equipment',
          'transport_vehicle',
          'other'
        ),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'operational',
          'in_use',
          'maintenance',
          'repair',
          'broken',
          'retired',
          'reserved'
        ),
        defaultValue: 'operational',
      },
      operationalStatus: {
        type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'critical'),
        defaultValue: 'good',
      },
      purchaseDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      warrantyExpiryDate: {
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
      maintenanceSchedule: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Scheduled maintenance tasks and their intervals",
      },
      serialNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      manufacturer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      yearOfManufacture: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      purchasePrice: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      currentValue: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Estimated current value after depreciation",
      },
      depreciationRate: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Annual depreciation rate as percentage",
      },
      fuelType: {
        type: DataTypes.ENUM('diesel', 'petrol', 'electric', 'hybrid', 'none'),
        allowNull: true,
      },
      fuelCapacity: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Fuel tank capacity in liters",
      },
      fuelEfficiency: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Fuel consumption rate (L/hour or L/km)",
      },
      powerOutput: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Power output (e.g., HP, kW)",
      },
      dimensions: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Physical dimensions (LxWxH)",
      },
      weight: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Weight in kg",
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Current storage or operation location",
      },
      assignedOperator: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Primary operator responsible for the equipment",
      },
      operatingHours: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
        comment: "Total operating hours",
      },
      lastOperationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      insuranceInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Insurance details including policy number and expiry",
      },
      registrationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Government registration number if applicable",
      },
      certifications: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Required certifications and their expiry dates",
      },
      maintenanceHistory: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "History of maintenance and repairs",
      },
      partsInventory: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "List of spare parts and their quantities",
      },
      operatingCost: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Cost per hour of operation",
      },
      maintenanceCosts: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
        comment: "Total maintenance costs to date",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      operatingInstructions: {
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
      tableName: "stock_equipment",
      timestamps: true,
    }
  );

  StockEquipment.associate = function(models) {
    StockEquipment.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });
    StockEquipment.hasMany(models.StockHistory, {
      foreignKey: 'stockEquipmentId',
      as: 'history'
    });
    StockEquipment.hasMany(models.Media, {
      foreignKey: 'stockEquipmentId',
      as: 'documents'
    });
    // For maintenance scheduling
    StockEquipment.hasMany(models.StockNotification, {
      foreignKey: 'equipmentId',
      as: 'notifications'
    });
  };

  return StockEquipment;
}; 