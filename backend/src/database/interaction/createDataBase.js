const { Sequelize } = require("sequelize");
const config = require("../../config/db").development;

async function createDatabase() {
  let sequelize;

  try {
    // Close any existing connection
    if (sequelize) await sequelize.close();

    // Connect to the default 'postgres' database
    sequelize = new Sequelize("postgres", config.username, config.password, {
      host: config.host,
      dialect: config.dialect,
      port: config.port,
    });

    // Authenticate the connection to the postgres database
    await sequelize.authenticate();
    console.log("Connected to the postgres database.");

    // Step 1: Create the new database 'final_project'
    await sequelize.query(`CREATE DATABASE ${config.database};`);
    console.log(`Database '${config.database}' created successfully.`);
  } catch (err) {
    // Handle case where database already exists or other errors
    if (err.name === "SequelizeDatabaseError" && err.parent.code === "42P04") {
      console.log(`Database '${config.database}' already exists.`);
    } else {
      console.error("Error creating database:", err);
    }
  } finally {
    if (sequelize) await sequelize.close();
  }
}

// Execute the function
createDatabase();
