module.exports = (sequelize, DataTypes) => {
  const UserTutorial = sequelize.define(
    "UserTutorial",
    {
      home: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      marketPlace: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      chat: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      education: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      documentary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      scan: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      wallet: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      profile: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stock: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      tableName: "UserTutorial",
    }
  );
  return UserTutorial;
};
