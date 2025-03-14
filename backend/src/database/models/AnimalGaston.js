module.exports = (sequelize, DataTypes) => {
  const AnimalGaston = sequelize.define(
    "AnimalGaston",
    {
      type: {
        type: DataTypes.STRING,
        allowNull: true,
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
      birthDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      weight: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      lastWeightUpdate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dailyFeedConsumption: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Daily feed consumption in kg",
      },
      lastFeedingTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      breedingStatus: {
        type: DataTypes.ENUM('not_breeding', 'in_heat', 'pregnant', 'nursing'),
        defaultValue: 'not_breeding',
      },
      lastBreedingDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expectedBirthDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      offspringCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      nextVaccinationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      vaccinationHistory: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Array of vaccination records with dates and types",
      },
      motherId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'animal_gaston',
          key: 'id'
        }
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

  AnimalGaston.associate = function(models) {
    // User association
    AnimalGaston.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user'
    });

   

    // Self-referential associations for breeding tracking
    AnimalGaston.belongsTo(sequelize.models.AnimalGaston, {
      foreignKey: 'motherId',
      as: 'mother'
    });

    AnimalGaston.hasMany(sequelize.models.AnimalGaston, {
      foreignKey: 'motherId',
      as: 'offspring'
    });
  };

  return AnimalGaston;
};
