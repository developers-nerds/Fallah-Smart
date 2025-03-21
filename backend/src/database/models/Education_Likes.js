module.exports = (sequelize, DataTypes) => {
  const Education_Like = sequelize.define('Education_Like', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // contentType will be either 'question' or 'reply'
    contentType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // contentId is the ID of either the question or reply
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // This combination must be unique to prevent duplicate likes
    // defined in the model options below
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'contentType', 'contentId'],
        name: 'education_like_unique_constraint'
      }
    ]
  });

  return Education_Like;
}; 