const { Stock } = require('../database/assossiation');
const { Op } = require('sequelize');

const stockStatisticsController = {
  getStatistics: async (req, res) => {
    try {
      const { startDate, endDate, category } = req.query;
      
      // Build where clause
      const whereClause = {
        userId: req.user.id
      };

      if (category) {
        whereClause.category = category;
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }

      const stocks = await Stock.findAll({
        where: whereClause,
        attributes: ['category', 'quantity', 'price', 'createdAt'],
        order: [['createdAt', 'ASC']]
      });

      const monthlyData = {};

      stocks.forEach(stock => {
        const date = new Date(stock.createdAt);
        const monthKey = date.toISOString().substring(0, 7);
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            animals: { totalQuantity: 0, totalValue: 0 },
            pesticide: { totalQuantity: 0, totalValue: 0 }
          };
        }
        
        if (stock.category === 'animals' || stock.category === 'pesticide') {
          monthlyData[monthKey][stock.category].totalQuantity += stock.quantity;
          monthlyData[monthKey][stock.category].totalValue += (stock.price || 0) * stock.quantity;
        }
      });

      const statistics = Object.entries(monthlyData).map(([date, data]) => ({
        date,
        animals: data.animals,
        pesticide: data.pesticide
      }));

      res.json(statistics);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }
};

module.exports = stockStatisticsController; 