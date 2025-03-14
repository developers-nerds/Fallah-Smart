module.exports = (sequelize, DataTypes) => {
    const Education_QuestionAndAnswer = sequelize.define('Education_QuestionAndAnswer', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      authorName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      authorImage: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      videoId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Education_Videos',
          key: 'id',
        },
      },
    });
  
    return Education_QuestionAndAnswer;
  };