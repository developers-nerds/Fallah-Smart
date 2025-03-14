module.exports = (sequelize, DataTypes) => {
    const Education_UserProgress = sequelize.define('Education_UserProgress', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quizId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Education_Quizzes',
          key: 'id',
        },
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    });
  
    return Education_UserProgress;
  };