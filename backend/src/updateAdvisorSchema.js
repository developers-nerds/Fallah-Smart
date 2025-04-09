// This is a one-time script to fix the database schema for AdvisorApplications
// It adds the missing certificationPhotos column

const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables

async function updateSchema() {
  try {
    // Get database config from environment variables
    const dbName = process.env.DB_NAME || 'final_project';
    const username = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASS || '110golfp.';
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 5432;
    const dialect = 'postgres';

    console.log(`Connecting to database: ${dbName} on ${host}:${port} as ${username}`);

    // Create a connection to the database
    const sequelize = new Sequelize(dbName, username, password, {
      host,
      port,
      dialect,
      logging: console.log
    });

    // Test the connection
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');

    // Add the missing column
    console.log('Attempting to add certificationPhotos column to AdvisorApplications table...');
    await sequelize.query(
      `ALTER TABLE "AdvisorApplications" 
       ADD COLUMN IF NOT EXISTS "certificationPhotos" TEXT[] DEFAULT '{}'::TEXT[]`
    );

    console.log('Schema updated successfully - certificationPhotos column added to AdvisorApplications table');
    
    // Close the connection
    await sequelize.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

// Run the update
updateSchema(); 