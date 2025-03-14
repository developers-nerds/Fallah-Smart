module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          "CROPS", 
          "LIVESTOCK", 
          "EQUIPMENT", 
          "WEATHER", 
          "MARKET", 
          "TIPS"
        ),
        allowNull: false,
        defaultValue: "CROPS"
      },
      counter: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
    }
  );
  return Post;
};
