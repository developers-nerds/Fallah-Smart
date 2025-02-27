module.exports = (sequelize, DataTypes) => {
  const BackupSync = sequelize.define(
    "BackupSync",
    {
      backup_data: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  return BackupSync;
};
