module.exports = (sequelize, DataTypes) => {
    const Education_Quiz = sequelize.define('Education_Quiz', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('animal', 'crop'),
        allowNull: false,
      },
    });
  
    return Education_Quiz;
  };