module.exports = (sequelize, DataTypes) => {
  const Scan = sequelize.define(
    "Scan",
    {
      ai_response: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      picture: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      picture_mime_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      timestamps: true,
      tableName: "Scans"
    }
  );

  Scan.associate = function(models) {
    if (models.Users) {
      Scan.belongsTo(models.Users, {
        foreignKey: 'userId',
        as: 'user',
        constraints: false // To prevent SQL errors if column doesn't exist yet
      });
    }
  };

  return Scan;
};
