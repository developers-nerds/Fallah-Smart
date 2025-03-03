const { sequelize } = require('./assossiation');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Try with alter first, which is less destructive
    console.log('Synchronizing database models...');
    await sequelize.sync({ force: true });
    
    console.log('✅ Database initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Error details:', error.message);
    if (error.parent) {
      console.error('Parent error:', error.parent.message);
    }
    throw error;
  }
}

// If this file is run directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed');
      process.exit(1);
    });
}

module.exports = initializeDatabase; 