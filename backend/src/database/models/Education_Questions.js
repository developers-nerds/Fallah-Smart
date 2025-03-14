module.exports = (sequelize, DataTypes) => {
    const Education_Question = sequelize.define('Education_Question', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      options: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      correctAnswer: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      explanation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      quizId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Education_Quizzes',
          key: 'id',
        },
      },
    });
  
    return Education_Question;
  };