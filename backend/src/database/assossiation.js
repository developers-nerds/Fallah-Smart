const sequelize = require("./connection");
const { DataTypes } = require("sequelize");
//importing models
const Accounts = require("./models/Accounts")(sequelize, DataTypes);
const Animal_doc = require("./models/Animal _doc")(sequelize, DataTypes);
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
const Recurring_Transactions = require("./models/Recurring_Transactions")(
  sequelize,
  DataTypes
);
const Scans = require("./models/Scans")(sequelize, DataTypes);
const Stock = require("./models/Stock")(sequelize, DataTypes);
const StockHistory = require("./models/StockHistory")(sequelize, DataTypes);
const Transactions = require("./models/Transactions")(sequelize, DataTypes);
const Users = require("./models/Users")(sequelize, DataTypes);

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

// For scans
Scans.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
});

// For notifications
Notification.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
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

Media.belongsTo(Posts, {
  foreignKey: "postId",
  as: "post",
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

Posts.belongsTo(Users, {
  foreignKey: "userId",
  as: "user",
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

// Sync all models with the database
async function syncModels() {
  try {
    // Use { force: true } for production to safely update schema
    // await sequelize.sync({ alter: true });
    console.log("Database models synchronized successfully");
  } catch (error) {
    console.error("Error synchronizing database models:", error);
  }
}

syncModels();

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
  AnimalGaston,
  Category,
  Pesticide,
  Stock,
  StockHistory,
  Transactions,
  Likes,
  Comments,
  Accounts,
  BackupSync,
  Media,
  Notification,
  Recurring_Transactions,
};
