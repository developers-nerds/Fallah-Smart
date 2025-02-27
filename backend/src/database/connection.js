const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config(); // Add this line to load environment variables

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: "postgres",
  port: process.env.DB_PORT || 5432,  // Use environment variable for port or default to 5432
  // logging: false, // Optional: Disable query logging

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
})();

module.exports = sequelize;