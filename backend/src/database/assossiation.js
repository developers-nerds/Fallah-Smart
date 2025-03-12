const sequelize = require("./connection");
const { DataTypes } = require("sequelize");
//importing models
const Accounts = require("./models/Accounts")(sequelize, DataTypes);
const Animal_doc = require("./models/Animal _doc")(sequelize, DataTypes);
const AnimalDetails = require("./models/AnimalDetails")(sequelize, DataTypes);
const AnimalGaston = require("./models/AnimalGaston")(sequelize, DataTypes);
const BackupSync = require("./models/BackupSync")(sequelize, DataTypes);
const Category = require("./models/Categories")(sequelize, DataTypes);
const Comments = require("./models/Comments")(sequelize, DataTypes);
const Conversations = require("./models/Conversations")(sequelize, DataTypes);
const Crop = require("./models/Crop")(sequelize, DataTypes);
const CropDetails = require("./models/CropDetails")(sequelize, DataTypes);
const Likes = require("./models/likes")(sequelize, DataTypes);
const Media = require("./models/media")(sequelize, DataTypes);
const Messages = require("./models/Messages")(sequelize, DataTypes);
const Notification = require("./models/notification")(sequelize, DataTypes);
const Pesticide = require("./models/Pesticide")(sequelize, DataTypes);
const Posts = require("./models/Posts")(sequelize, DataTypes);
const Suppliers = require("./models/Suppliers")(sequelize, DataTypes);
const CropOrders = require("./models/CropOrders")(sequelize, DataTypes);
const CropListings = require("./models/CropListings")(sequelize, DataTypes);
const AuctionBids = require("./models/AuctionBids")(sequelize, DataTypes);
const Auctions = require("./models/Auctions")(sequelize, DataTypes);
const TradingCategories = require("./models/TradingCategoreies")(
  sequelize,
  DataTypes
);
const Location = require("./models/location")(sequelize, DataTypes);
const Recurring_Transactions = require("./models/Recurring_Transactions")(
  sequelize,
  DataTypes
);
const Scans = require("./models/Scans")(sequelize, DataTypes);
const Stock = require("./models/Stock")(sequelize, DataTypes);
const StockHistory = require("./models/StockHistory")(sequelize, DataTypes);
const Transactions = require("./models/Transactions")(sequelize, DataTypes);
const Users = require("./models/Users")(sequelize, DataTypes);
const Reports = require('./models/Reports')(sequelize, DataTypes);
const AdvisorApplications = require("./models/AdvisorApplications")(sequelize, DataTypes);

// Define associations
// For users
Users.hasMany(Scans, {
  foreignKey: "userId",
  as: "scans",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Users.hasMany(Conversations, {
  foreignKey: "userId",
  as: "conversations",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Users.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// User and AnimalGaston associations
Users.hasMany(AnimalGaston, {
  foreignKey: "userId",
  as: "animals",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

AnimalGaston.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});
Users.hasOne(Suppliers, {
  foreignKey: "userId",
  as: "supplier",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Suppliers.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});
// For scans
Scans.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

Suppliers.hasMany(CropListings, {
  foreignKey: "supplierId",
  as: "cropListings",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
CropListings.belongsTo(Suppliers, {
  foreignKey: "supplierId",
  as: "supplier",
});

Users.hasMany(CropOrders, {
  foreignKey: "userId",
  as: "cropOrders",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
CropOrders.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

Suppliers.hasMany(CropOrders, {
  foreignKey: "supplierId",
  as: "supplierOrders",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
CropOrders.belongsTo(Suppliers, {
  foreignKey: "supplierId",
  as: "supplier",
});

// 4. CropListings one-to-many with Auctions
CropListings.hasMany(Auctions, {
  foreignKey: "cropListingId",
  as: "auctions",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Auctions.belongsTo(CropListings, {
  foreignKey: "cropListingId",
  as: "cropListing",
});

// 5. Auctions one-to-many with AuctionBids
Auctions.hasMany(AuctionBids, {
  foreignKey: "auctionId",
  as: "bids",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
AuctionBids.belongsTo(Auctions, {
  foreignKey: "auctionId",
  as: "auction",
});

// 6. TradingCategories one-to-many with CropListings (assuming this is what you meant instead of TradingCategories with itself)
TradingCategories.hasMany(CropListings, {
  foreignKey: "categoryId",
  as: "cropListings",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
CropListings.belongsTo(TradingCategories, {
  foreignKey: "categoryId",
  as: "category",
});

// 7. User one-to-one with Location
Users.hasOne(Location, {
  foreignKey: "userId",
  as: "location",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Location.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// 8. Suppliers one-to-many with Location
Suppliers.hasMany(Location, {
  foreignKey: "supplierId",
  as: "locations",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Location.belongsTo(Suppliers, {
  foreignKey: "supplierId",
  as: "supplier",
});

// Additional associations to complete the relationships
AuctionBids.belongsTo(Users, {
  foreignKey: "userId",
  as: "bidder",
});
Users.hasMany(AuctionBids, {
  foreignKey: "userId",
  as: "auctionBids",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// ... existing imports and associations ...
// Update User and Accounts association to Many-to-One with unique alias
Users.hasMany(Accounts, {
  foreignKey: "userId",
  as: "userAccounts", // Changed from "accounts"
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Accounts.belongsTo(Users, {
  foreignKey: "userId",
  as: "accountOwner", // Changed from "user"
});

// Add Category and Transactions association
Category.hasMany(Transactions, {
  foreignKey: "categoryId",
  as: "transactions",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Transactions.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

// Add BackupSync associations with Transactions
BackupSync.belongsTo(Transactions, {
  foreignKey: "transactionId",
  as: "transaction",
});

Transactions.hasMany(BackupSync, {
  foreignKey: "transactionId",
  as: "backupSyncs",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Media associations with other tables
AnimalGaston.hasMany(Media, {
  foreignKey: "animalGastonId",
  as: "media",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Media.belongsTo(AnimalGaston, {
  foreignKey: "animalGastonId",
  as: "animalGaston",
});

Animal_doc.hasMany(Media, {
  foreignKey: "animalDocId",
  as: "media",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Media.belongsTo(Animal_doc, {
  foreignKey: "animalDocId",
  as: "animalDoc",
});

Category.hasMany(Media, {
  foreignKey: "categoryId",
  as: "media",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Media.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

Comments.hasMany(Media, {
  foreignKey: "commentId",
  as: "media",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Media.belongsTo(Comments, {
  foreignKey: "commentId",
  as: "comment",
});

Crop.hasMany(Media, {
  foreignKey: "cropId",
  as: "media",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Media.belongsTo(Crop, {
  foreignKey: "cropId",
  as: "crop",
});

CropDetails.hasMany(Media, {
  foreignKey: "cropDetailsId",
  as: "media",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Media.belongsTo(CropDetails, {
  foreignKey: "cropDetailsId",
  as: "cropDetails",
});

Posts.hasMany(Media, {
  foreignKey: "postId",
  as: "media",
  onDelete: "CASCADE",
});

Posts.belongsTo(Users, {
  foreignKey: "userId",
  as: "author",
});

Scans.hasMany(Media, {
  foreignKey: "scanId",
  as: "media",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Media.belongsTo(Scans, {
  foreignKey: "scanId",
  as: "scan",
});

// For conversations
Conversations.hasMany(Messages, {
  foreignKey: "conversationId",
  as: "messages",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Conversations.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// For messages
Messages.belongsTo(Conversations, {
  foreignKey: "conversationId",
  as: "conversation",
});

// Animal and AnimalGaston associations
Crop.hasOne(CropDetails, {
  foreignKey: "cropId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

CropDetails.belongsTo(Crop, {
  foreignKey: "cropId",
});

AnimalGaston.belongsTo(Animal_doc, {
  foreignKey: "animalId",
});

Animal_doc.hasOne(AnimalGaston, {
  foreignKey: "animalId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// User associations with StockHistory, UserAnimals, and Pesticide
Users.hasMany(StockHistory, {
  foreignKey: "userId",
  as: "stockHistories",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

StockHistory.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

StockHistory.hasMany(Stock, {
  foreignKey: "stockHistoryId",
  as: "stocks",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Stock.belongsTo(StockHistory, {
  foreignKey: "stockHistoryId",
  as: "stockHistory",
});

Users.hasMany(Pesticide, {
  foreignKey: "userId",
  as: "pesticides",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Pesticide.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// User and Posts associations
Users.hasMany(Posts, {
  foreignKey: "userId",
  as: "posts",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Posts and Comments associations
Posts.hasMany(Comments, {
  foreignKey: "postId",
  as: "comments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Comments.belongsTo(Posts, {
  foreignKey: "postId",
  as: "post",
});

// Posts and Likes associations
Posts.hasMany(Likes, {
  foreignKey: "postId",
  as: "likes",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Likes.belongsTo(Posts, {
  foreignKey: "postId",
  as: "post",
});

// Comments and Likes associations
Comments.hasMany(Likes, {
  foreignKey: "commentId",
  as: "likes",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Likes.belongsTo(Comments, {
  foreignKey: "commentId",
  as: "comment",
});

// User and Account associations (one-to-one)
Users.hasOne(Accounts, {
  foreignKey: "userId",
  as: "account",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Accounts.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// Account and Transactions associations (one-to-many)
Accounts.hasMany(Transactions, {
  foreignKey: "accountId",
  as: "transactions",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Transactions.belongsTo(Accounts, {
  foreignKey: "accountId",
  as: "account",
});

// Account and Recurring_Transactions associations (one-to-many)
Accounts.hasMany(Recurring_Transactions, {
  foreignKey: "accountId",
  as: "recurringTransactions",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Recurring_Transactions.belongsTo(Accounts, {
  foreignKey: "accountId",
  as: "account",
});

// User and BackupSync associations (one-to-many)
Users.hasMany(BackupSync, {
  foreignKey: "userId",
  as: "backups",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

BackupSync.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// Users and Comments associations
Users.hasMany(Comments, {
  foreignKey: "userId",
  as: "comments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Comments.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// Users and Likes associations
Users.hasMany(Likes, {
  foreignKey: "userId",
  as: "likes",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Likes.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// User and Stock associations
Users.hasMany(Stock, {
  foreignKey: "userId",
  as: "stocks",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Stock.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// Reports associations
Reports.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
Reports.belongsTo(Posts, { foreignKey: 'postId', as: 'post' });

// Create associations
AdvisorApplications.belongsTo(Users, { foreignKey: 'userId' });
Users.hasMany(AdvisorApplications, { foreignKey: 'userId' });

// Sync all models with the database
async function syncModels() {
  try {
    // Use { force: true } for production to safely update schema
    await sequelize.sync({ force: true });
    console.log("Database models synchronized successfully");
  } catch (error) {
    console.error("Error synchronizing database models:", error);
  }
}

// syncModels();

// Export models AFTER defining associations
module.exports = {
  sequelize,
  Users,
  Posts,
  Scans,
  Conversations,
  Messages,
  Crop,
  CropDetails,
  Animal_doc,
  AnimalDetails,
  AnimalGaston,
  Category,
  Pesticide,
  Stock,
  StockHistory,
  Transactions,
  Likes,
  Comments,
  Accounts,
  Suppliers,
  CropOrders,
  CropListings,
  AuctionBids,
  Auctions,
  TradingCategories,
  BackupSync,
  Media,
  Notification,
  Recurring_Transactions,
  Reports,
  AdvisorApplications
};
