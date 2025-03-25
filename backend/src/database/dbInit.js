const { sequelize } = require('./models');
const path = require('path');
const fs = require('fs');

async function initDb() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Sync models with database - use alter:true to add new columns
    await sequelize.sync({ alter: true });
    console.log('Database schema synced with alter:true');
    
    // Run migrations
    const migrationsPath = path.join(__dirname, 'migrations');
    
    // Check if migrations directory exists
    if (fs.existsSync(migrationsPath)) {
      const migrationFiles = fs.readdirSync(migrationsPath);
      
      // Now run each migration
      for (const file of migrationFiles) {
        if (file.endsWith('.js')) {
          console.log(`Running migration: ${file}`);
          const migration = require(path.join(migrationsPath, file));
          try {
            if (typeof migration.up === 'function') {
              await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
              console.log(`Migration ${file} completed successfully`);
            } else {
              console.warn(`Migration ${file} does not have an up function`);
            }
          } catch (error) {
            console.error(`Error running migration ${file}:`, error);
            // Continue with next migration even if this one fails
          }
        }
      }
    } else {
      console.log('No migrations directory found, skipping migrations');
    }

    // Also manually run the migration to add userId to Scans
    try {
      // Check if Scans table exists
      const tables = await sequelize.getQueryInterface().showAllTables();
      if (tables.includes('Scans')) {
        // Check if userId column exists
        try {
          const tableInfo = await sequelize.getQueryInterface().describeTable('Scans');
          if (!tableInfo.userId) {
            // Add userId column
            await sequelize.getQueryInterface().addColumn('Scans', 'userId', {
              type: sequelize.Sequelize.INTEGER,
              allowNull: true,
              references: {
                model: 'users',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'SET NULL'
            });
            console.log('Added userId column to Scans table manually');
          } else {
            console.log('userId column already exists in Scans table');
          }
        } catch (error) {
          console.error('Error checking or adding userId column to Scans table:', error);
        }
      } else {
        console.log('Scans table does not exist, skipping additional migration');
      }
    } catch (error) {
      console.error('Error running manual Scans migration:', error);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

initDb();

// If this file is run directly
if (require.main === module) {
  initDb()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed', error);
      process.exit(1);
    });
}

module.exports = initDb; 