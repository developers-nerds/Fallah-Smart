module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define(
    "Media",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      animalDocId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      animalDetailsId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      commentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cropId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cropDetailsId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      scanId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userAnimalId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return Media;
};
