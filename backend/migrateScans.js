const { sequelize } = require('./src/database/models');
const path = require('path');

async function migrateScans() {
  try {
    console.log('Running migration to add userId column to Scans table...');
    
    // Import and run the migration
    const migration = require('./src/database/migrations/20240325_add_userId_to_scans');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateScans(); 