module.exports = (connection, DataTypes) => {
  const AnimalGaston = connection.define(
    "AnimalGaston",
    {
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      healthStatus: {
        type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
        defaultValue: "good",
      },
      feedingSchedule: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: false,
      },
      feeding: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      health: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      diseases: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      medications: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      vaccination: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
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
      tableName: "animal_gaston",
      timestamps: true,
    }
  );
  return AnimalGaston;
};
