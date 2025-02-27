const { Sequelize } = require("sequelize");

async function dropDatabase() {
  let sequelize;

  try {
    // Close any existing connection
    if (sequelize) await sequelize.close();

    // Reconnect to the 'postgres' database
    sequelize = new Sequelize("postgres", "postgres", "root", {
      host: "localhost",
      dialect: "postgres",
      port: 5432,
    });

    // Authenticate the connection to the postgres database
    await sequelize.authenticate();
    console.log("Connected to the postgres database.");

    // Step 1: Terminate active connections to final_project
    await sequelize.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'final_project' AND pid <> pg_backend_pid();
    `);
    console.log("Terminated active connections to final_project.");

    // Step 2: Drop the database
    await sequelize.query("DROP DATABASE final_project");
    console.log("Database dropped successfully.");

  } catch (err) {
    console.error("Error dropping database:", err);
  } finally {
    if (sequelize) await sequelize.close();
  }
}

// Execute the function
dropDatabase();
