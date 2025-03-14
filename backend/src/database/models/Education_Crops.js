module.exports = (sequelize, DataTypes) => {
    const Education_Crop = sequelize.define('Education_Crop', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      videoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quizId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    });
  
    return Education_Crop;
  };