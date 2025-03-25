module.exports = (connection, DataTypes) => {
  const CropDetails = connection.define(
    "CropDetails",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cropId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'crops',
          key: 'id'
        }
      },
      plantingGuide: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      harvestingGuide: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      weatherConsiderations: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fertilizers: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      bestPractices: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      diseaseManagement: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pestControl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      waterManagement: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      soilPreparation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      storageGuidelines: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      marketValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      environmentalImpact: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      organicFarming: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "crop_details",
      timestamps: false,
    }
  );
  return CropDetails;
};
