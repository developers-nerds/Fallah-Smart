module.exports = (sequelize, DataTypes) => {
  const Auctions = sequelize.define(
    "Auctions",
    {
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      highest_bid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Starts null
      },
      highest_bidder_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("active", "ended", "sold"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      timestamps: true,
      tableName: "auctions",
    }
  );

  return Auctions;
};
