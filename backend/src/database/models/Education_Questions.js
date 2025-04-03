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
        allowNull: true,
        defaultValue: '',
      },
      quizId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Education_Quizzes',
          key: 'id',
        },
      },
    });
  
    Education_Question.resetSequence = async function() {
      try {
        await sequelize.query(`
          SELECT setval(pg_get_serial_sequence('"Education_Questions"', 'id'), 
          (SELECT MAX(id) FROM "Education_Questions")+1);
        `);
        console.log('Education_Questions sequence reset successfully');
      } catch (error) {
        console.error('Error resetting Education_Questions sequence:', error);
      }
    };
  
    return Education_Question;
  };