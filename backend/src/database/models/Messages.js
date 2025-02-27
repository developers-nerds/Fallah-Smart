module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define(
      "Message",
      {
        sender: {
          type: DataTypes.ENUM("user", "ai"),
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM("text", "image", "other"),
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        timestamps: true,
      }
    );
  
    return Message;
  };