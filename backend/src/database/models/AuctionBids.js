module.exports = (sequelize, DataTypes) => {
    const AuctionBids = sequelize.define(
      "Auction_Bids",
      {
        bid_amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            isDecimal: true,
            min: 0.01,
          },
        },
        bid_time: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        timestamps: false,
        tableName: "auction_bids",
      }
    );
  
    return AuctionBids;
  };