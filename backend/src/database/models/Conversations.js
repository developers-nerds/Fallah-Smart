module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      conversation_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return Conversation;
};
