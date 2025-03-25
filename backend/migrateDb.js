// Run database migrations
require('./src/database/dbInit');
require('dotenv').config();
const { Sequelize } = require('sequelize');

async function createTables() {
  // Create a direct connection to the database
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');

    // First, create device_type enum if it doesn't exist
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_type_enum') THEN
            CREATE TYPE device_type_enum AS ENUM ('mobile', 'tablet', 'web');
          END IF;
        END$$;
      `);
      console.log('Enum device_type_enum created or verified');
    } catch (error) {
      console.error('Error creating enum:', error);
    }

    // Check if user_devices table exists
    const tablesQuery = await sequelize.query(
      "SELECT * FROM information_schema.tables WHERE table_name = 'user_devices';"
    );
    
    const tableExists = tablesQuery[0].length > 0;
    
    if (!tableExists) {
      console.log('Creating user_devices table...');
      
      // Create the user_devices table
      await sequelize.query(`
        CREATE TABLE user_devices (
          id SERIAL PRIMARY KEY,
          "deviceToken" VARCHAR(255) UNIQUE NOT NULL,
          "deviceType" device_type_enum DEFAULT 'mobile',
          "isActive" BOOLEAN DEFAULT TRUE,
          "lastActive" TIMESTAMP,
          "userId" INTEGER NOT NULL REFERENCES users(id),
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      console.log('✅ user_devices table created successfully!');
    } else {
      console.log('user_devices table already exists, skipping creation.');
    }

    // Check if stock_notifications table has the correct structure
    try {
      const notificationsQuery = await sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'stock_notifications';"
      );
      
      const columns = notificationsQuery[0].map(col => col.column_name);
      
      // If there's a column named equipmentId, we need to drop it since it's causing issues
      if (columns.includes('equipmentId')) {
        console.log('Column equipmentId found in stock_notifications table, removing it...');
        await sequelize.query(`
          ALTER TABLE stock_notifications DROP COLUMN IF EXISTS "equipmentId";
        `);
        console.log('Column equipmentId removed successfully');
      }
    } catch (error) {
      console.error('Error fixing stock_notifications table:', error);
    }

    await sequelize.close();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
createTables(); 