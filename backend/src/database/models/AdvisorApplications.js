module.exports = (sequelize, DataTypes) => {
  const AdvisorApplication = sequelize.define(
    "AdvisorApplication",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      specialization: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      experience: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      education: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      certifications: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      applicationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      documents: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      certificationPhotos: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'PENDING_MORE_INFO'),
        defaultValue: 'PENDING',
      },
      reviewNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return AdvisorApplication;
}; 