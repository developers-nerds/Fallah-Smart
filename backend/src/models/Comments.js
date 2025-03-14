module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    media: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
  });

  return Comment;
}; 