module.exports = (sequelize, DataTypes) => {
    const Like = sequelize.define(
      "Like",
      {
        isClicked: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false, // Default to false if not specified
        },
      },
      {
        timestamps: true, // This will create `createdAt` and `updatedAt` automatically
      }
    );
    return Like;
  };
  