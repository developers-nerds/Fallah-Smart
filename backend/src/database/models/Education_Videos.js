module.exports = (sequelize, DataTypes) => {
    const Education_Video = sequelize.define('Education_Video', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      youtubeId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('animal', 'crop'),
        allowNull: false,
      },
    });
  
    return Education_Video;
  };