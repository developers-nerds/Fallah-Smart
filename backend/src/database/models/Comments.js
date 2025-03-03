module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define(
      "Comment",
      {
        content: {
          type: DataTypes.TEXT, // Use TEXT for long content
          allowNull: false,
        },
        image: {
          type: DataTypes.STRING,
          allowNull: true
        },
      },
      {
        timestamps: true, // This will create `createdAt` and `updatedAt` automatically
      }
    );
    return Comment;
  };
  