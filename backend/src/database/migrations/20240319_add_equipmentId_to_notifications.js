'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('stock_notifications', 'equipmentId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'stock_equipment',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('stock_notifications', 'equipmentId');
  }
}; 