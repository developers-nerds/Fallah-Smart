module.exports = (sequelize, DataTypes) => {
    const Education_AdditionalVideo = sequelize.define('Education_AdditionalVideo', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      youtubeId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      videoId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Education_Videos',
          key: 'id',
        },
      },
    });
  
    return Education_AdditionalVideo;
  };