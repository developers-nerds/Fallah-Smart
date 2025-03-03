module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
    {
      sender: {
        type: DataTypes.ENUM("user", "assistant"),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("text", "image", "other"),
        defaultValue: "text",
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
