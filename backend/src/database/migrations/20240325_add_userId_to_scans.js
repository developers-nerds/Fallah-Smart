'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if the Scans table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('Scans')) {
        console.log('Scans table does not exist, skipping migration');
        return;
      }
      
      // First check if the column already exists
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable('Scans');
      } catch (error) {
        console.error('Error describing Scans table:', error);
        return;
      }
      
      if (!tableInfo.userId) {
        // Add userId column if it doesn't exist
        await queryInterface.addColumn('Scans', 'userId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        console.log('Added userId column to Scans table');
      } else {
        console.log('userId column already exists in Scans table');
      }
    } catch (error) {
      console.error('Error adding userId column to Scans table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Scans', 'userId');
      console.log('Removed userId column from Scans table');
    } catch (error) {
      console.error('Error removing userId column from Scans table:', error);
      throw error;
    }
  }
}; 