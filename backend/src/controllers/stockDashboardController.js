const { 
  AnimalGaston, 
  Pesticide, 
  StockEquipment, 
  StockFeed, 
  StockFertilizer, 
  StockHarvest, 
  StockSeeds, 
  StockTools,
  Users
} = require('../database/models');
const { sequelize } = require('../database/models');
const { Op } = require('sequelize');

// Helper function to safely sum values, handling nulls and NaN
const safeSum = (items, valueAccessor) => {
  return items.reduce((sum, item) => {
    const value = valueAccessor(item);
    return sum + (Number.isFinite(Number(value)) ? Number(value) : 0);
  }, 0);
};

const stockDashboardController = {
  // Get dashboard summary for all users or a specific user
  getDashboardSummary: async (req, res) => {
    try {
      const { userId } = req.query;
      
      // Build where clause - if userId is provided, filter by that user
      const whereClause = userId ? { userId } : {};

      // Get counts and totals from each stock type
      const [
        animals,
        pesticides,
        equipment,
        feeds,
        fertilizers,
        harvests,
        seeds,
        tools
      ] = await Promise.all([
        AnimalGaston.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('sum', sequelize.col('count')), 'totalCount'],
            [sequelize.fn('count', sequelize.col('id')), 'totalItems']
          ],
          raw: true
        }),
        Pesticide.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],
            [sequelize.fn('sum', sequelize.literal('quantity * price')), 'totalValue'],
            [sequelize.fn('count', sequelize.col('id')), 'totalItems'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN quantity <= minQuantityAlert THEN 1 ELSE NULL END`)), 'lowStock'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN expiryDate IS NOT NULL AND expiryDate <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) THEN 1 ELSE NULL END`)), 'expiring']
          ],
          raw: true
        }),
        StockEquipment.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],
            [sequelize.fn('sum', sequelize.literal('COALESCE(currentValue, purchasePrice) * quantity')), 'totalValue'],
            [sequelize.fn('count', sequelize.col('id')), 'totalItems']
          ],
          raw: true
        }),
        StockFeed.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],
            [sequelize.fn('sum', sequelize.literal('quantity * price')), 'totalValue'],
            [sequelize.fn('count', sequelize.col('id')), 'totalItems'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN quantity <= minQuantityAlert THEN 1 ELSE NULL END`)), 'lowStock'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN expiryDate IS NOT NULL AND expiryDate <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) THEN 1 ELSE NULL END`)), 'expiring']
          ],
          raw: true
        }),
        StockFertilizer.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],
            [sequelize.fn('sum', sequelize.literal('quantity * price')), 'totalValue'],
            [sequelize.fn('count', sequelize.col('id')), 'totalItems'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN quantity <= minQuantityAlert THEN 1 ELSE NULL END`)), 'lowStock'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN expiryDate IS NOT NULL AND expiryDate <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) THEN 1 ELSE NULL END`)), 'expiring']
          ],
          raw: true
        }),
        StockHarvest.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],
            [sequelize.fn('sum', sequelize.literal('COALESCE(quantity * price, 0)')), 'totalValue'],
            [sequelize.fn('count', sequelize.col('id')), 'totalItems'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN expiryDate IS NOT NULL AND expiryDate <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) THEN 1 ELSE NULL END`)), 'expiring']
          ],
          raw: true
        }),
        StockSeeds.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],
            [sequelize.fn('sum', sequelize.literal('quantity * price')), 'totalValue'],
            [sequelize.fn('count', sequelize.col('id')), 'totalItems'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN quantity <= minQuantityAlert THEN 1 ELSE NULL END`)), 'lowStock'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN expiryDate IS NOT NULL AND expiryDate <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) THEN 1 ELSE NULL END`)), 'expiring']
          ],
          raw: true
        }),
        StockTools.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],
            [sequelize.fn('sum', sequelize.literal('COALESCE(replacementCost, purchasePrice, 0) * quantity')), 'totalValue'],
            [sequelize.fn('count', sequelize.col('id')), 'totalItems'],
            [sequelize.fn('count', sequelize.literal(`CASE WHEN quantity <= minQuantityAlert THEN 1 ELSE NULL END`)), 'lowStock']
          ],
          raw: true
        })
      ]);

      // Format the response
      const dashboard = {
        totalItems: {
          animals: parseInt(animals[0]?.totalItems || 0),
          pesticides: parseInt(pesticides[0]?.totalItems || 0),
          equipment: parseInt(equipment[0]?.totalItems || 0),
          feeds: parseInt(feeds[0]?.totalItems || 0),
          fertilizers: parseInt(fertilizers[0]?.totalItems || 0),
          harvests: parseInt(harvests[0]?.totalItems || 0),
          seeds: parseInt(seeds[0]?.totalItems || 0),
          tools: parseInt(tools[0]?.totalItems || 0),
          total: parseInt(animals[0]?.totalItems || 0) + 
                parseInt(pesticides[0]?.totalItems || 0) + 
                parseInt(equipment[0]?.totalItems || 0) + 
                parseInt(feeds[0]?.totalItems || 0) + 
                parseInt(fertilizers[0]?.totalItems || 0) + 
                parseInt(harvests[0]?.totalItems || 0) + 
                parseInt(seeds[0]?.totalItems || 0) + 
                parseInt(tools[0]?.totalItems || 0)
        },
        totalValue: {
          animals: 0, // No direct price for animals
          pesticides: parseFloat(pesticides[0]?.totalValue || 0),
          equipment: parseFloat(equipment[0]?.totalValue || 0),
          feeds: parseFloat(feeds[0]?.totalValue || 0),
          fertilizers: parseFloat(fertilizers[0]?.totalValue || 0),
          harvests: parseFloat(harvests[0]?.totalValue || 0),
          seeds: parseFloat(seeds[0]?.totalValue || 0),
          tools: parseFloat(tools[0]?.totalValue || 0),
          total: parseFloat(pesticides[0]?.totalValue || 0) + 
                parseFloat(equipment[0]?.totalValue || 0) + 
                parseFloat(feeds[0]?.totalValue || 0) + 
                parseFloat(fertilizers[0]?.totalValue || 0) + 
                parseFloat(harvests[0]?.totalValue || 0) + 
                parseFloat(seeds[0]?.totalValue || 0) + 
                parseFloat(tools[0]?.totalValue || 0)
        },
        lowStock: {
          animals: 0, // No low stock concept for animals
          pesticides: parseInt(pesticides[0]?.lowStock || 0),
          equipment: 0, // No low stock concept for equipment
          feeds: parseInt(feeds[0]?.lowStock || 0),
          fertilizers: parseInt(fertilizers[0]?.lowStock || 0),
          seeds: parseInt(seeds[0]?.lowStock || 0),
          tools: parseInt(tools[0]?.lowStock || 0),
          total: parseInt(pesticides[0]?.lowStock || 0) + 
                parseInt(feeds[0]?.lowStock || 0) + 
                parseInt(fertilizers[0]?.lowStock || 0) + 
                parseInt(seeds[0]?.lowStock || 0) + 
                parseInt(tools[0]?.lowStock || 0)
        },
        expiring: {
          pesticides: parseInt(pesticides[0]?.expiring || 0),
          feeds: parseInt(feeds[0]?.expiring || 0),
          fertilizers: parseInt(fertilizers[0]?.expiring || 0),
          seeds: parseInt(seeds[0]?.expiring || 0),
          harvests: parseInt(harvests[0]?.expiring || 0),
          total: parseInt(pesticides[0]?.expiring || 0) + 
                parseInt(feeds[0]?.expiring || 0) + 
                parseInt(fertilizers[0]?.expiring || 0) + 
                parseInt(seeds[0]?.expiring || 0) + 
                parseInt(harvests[0]?.expiring || 0)
        }
      };

      res.json(dashboard);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
  },

  // Get users with stock statistics
  getUsersWithStockStats: async (req, res) => {
    try {
      // Get all users
      const users = await Users.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'role', 'profilePicture'],
        where: {
          role: {
            [Op.ne]: 'ADMIN' // Exclude admin users
          }
        }
      });

      // For each user, get their stock summary
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const userId = user.id;

          // Get counts from each stock type
          const [
            animalCount,
            pesticideCount,
            equipmentCount,
            feedCount,
            fertilizerCount,
            harvestCount,
            seedCount,
            toolCount
          ] = await Promise.all([
            AnimalGaston.count({ where: { userId } }),
            Pesticide.count({ where: { userId } }),
            StockEquipment.count({ where: { userId } }),
            StockFeed.count({ where: { userId } }),
            StockFertilizer.count({ where: { userId } }),
            StockHarvest.count({ where: { userId } }),
            StockSeeds.count({ where: { userId } }),
            StockTools.count({ where: { userId } })
          ]);

          const totalItems = animalCount + pesticideCount + equipmentCount + 
                            feedCount + fertilizerCount + harvestCount + 
                            seedCount + toolCount;

          return {
            user: {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              username: user.username,
              role: user.role,
              profilePicture: user.profilePicture
            },
            stockStats: {
              totalItems,
              animalCount,
              pesticideCount,
              equipmentCount,
              feedCount,
              fertilizerCount, 
              harvestCount,
              seedCount,
              toolCount
            }
          };
        })
      );

      res.json(usersWithStats);
    } catch (error) {
      console.error('Error fetching users with stock stats:', error);
      res.status(500).json({ error: 'Failed to fetch users with stock statistics' });
    }
  },

  // Get summary statistics for all stock items (or filtered by userId)
  getSummary: async (req, res) => {
    try {
      const { userId } = req.query;
      const whereClause = userId ? { userId } : {};

      // Get animals data
      const animals = await AnimalGaston.findAll({ 
        where: whereClause,
        attributes: ['id', 'count', 'type'] 
      });
      
      // Get pesticides
      const pesticides = await Pesticide.findAll({ 
        where: whereClause,
        attributes: ['id', 'quantity', 'price', 'expiryDate'] 
      });
      
      // Get equipment
      const equipment = await StockEquipment.findAll({ 
        where: whereClause,
        attributes: ['id', 'quantity', 'currentValue', 'status'] 
      });
      
      // Get feeds
      const feeds = await StockFeed.findAll({ 
        where: whereClause,
        attributes: ['id', 'quantity', 'price', 'minQuantityAlert', 'expiryDate'] 
      });
      
      // Get fertilizers
      const fertilizers = await StockFertilizer.findAll({ 
        where: whereClause,
        attributes: ['id', 'quantity', 'price', 'minQuantityAlert', 'expiryDate'] 
      });
      
      // Get harvests
      const harvests = await StockHarvest.findAll({ 
        where: whereClause,
        attributes: ['id', 'quantity', 'price', 'expiryDate'] 
      });
      
      // Get seeds
      const seeds = await StockSeeds.findAll({ 
        where: whereClause,
        attributes: ['id', 'quantity', 'price', 'minQuantityAlert', 'expiryDate'] 
      });
      
      // Get tools
      const tools = await StockTools.findAll({ 
        where: whereClause,
        attributes: ['id', 'quantity', 'minQuantityAlert', 'purchasePrice', 'status'] 
      });

      // Current date for expiry calculations
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Calculate total item counts correctly
      const animalCount = safeSum(animals, a => a.count || 1);
      const pesticidesCount = safeSum(pesticides, p => p.quantity);
      const equipmentCount = safeSum(equipment, e => e.quantity);
      const feedsCount = safeSum(feeds, f => f.quantity);
      const fertilizersCount = safeSum(fertilizers, f => f.quantity);
      const harvestsCount = safeSum(harvests, h => h.quantity);
      const seedsCount = safeSum(seeds, s => s.quantity);
      const toolsCount = safeSum(tools, t => t.quantity);

      // Calculate total items
      const totalItems = {
        animals: animalCount,
        pesticides: pesticidesCount,
        equipment: equipmentCount,
        feeds: feedsCount,
        fertilizers: fertilizersCount,
        harvests: harvestsCount,
        seeds: seedsCount,
        tools: toolsCount,
      };
      totalItems.total = Object.values(totalItems).reduce((sum, value) => sum + value, 0);

      // Calculate total value
      const totalValue = {
        animals: 0, // We don't have a value for animals, so leaving as 0
        pesticides: safeSum(pesticides, p => p.quantity * p.price),
        equipment: safeSum(equipment, e => e.currentValue || e.quantity * 100),
        feeds: safeSum(feeds, f => f.quantity * f.price),
        fertilizers: safeSum(fertilizers, f => f.quantity * f.price),
        harvests: safeSum(harvests, h => h.quantity * h.price),
        seeds: safeSum(seeds, s => s.quantity * s.price),
        tools: safeSum(tools, t => t.purchasePrice || t.quantity * 50),
      };
      totalValue.total = Object.values(totalValue).reduce((sum, value) => sum + value, 0);

      // Calculate low stock
      const lowStock = {
        animals: 0, // We don't have a threshold for animals
        pesticides: pesticides.filter(item => item.quantity <= 10).length,
        equipment: equipment.filter(item => item.status === 'maintenance' || item.status === 'repair').length,
        feeds: feeds.filter(item => item.quantity <= item.minQuantityAlert).length,
        fertilizers: fertilizers.filter(item => item.quantity <= item.minQuantityAlert).length,
        seeds: seeds.filter(item => item.quantity <= item.minQuantityAlert).length,
        tools: tools.filter(item => item.quantity <= item.minQuantityAlert).length,
      };
      lowStock.total = Object.values(lowStock).reduce((sum, value) => sum + value, 0);

      // Calculate expiring items
      const expiring = {
        pesticides: pesticides.filter(item => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow).length,
        feeds: feeds.filter(item => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow).length,
        fertilizers: fertilizers.filter(item => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow).length,
        seeds: seeds.filter(item => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow).length,
        harvests: harvests.filter(item => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow).length,
      };
      expiring.total = Object.values(expiring).reduce((sum, value) => sum + value, 0);

      res.json({
        totalItems,
        totalValue,
        lowStock,
        expiring
      });
    } catch (error) {
      console.error('Error fetching stock dashboard summary:', error);
      res.status(500).json({ error: 'Failed to fetch stock dashboard summary' });
    }
  },

  // Get statistics for users with stock items
  getUsersStats: async (req, res) => {
    try {
      const users = await Users.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'role', 'profilePicture']
      });

      const usersWithStats = await Promise.all(users.map(async (user) => {
        // Get animals data
        const animals = await AnimalGaston.findAll({ 
          where: { userId: user.id },
          attributes: ['id', 'count', 'type'] 
        });
        const animalCount = safeSum(animals, a => a.count || 1);
        
        // Get stocks with quantities
        const pesticides = await Pesticide.findAll({ 
          where: { userId: user.id },
          attributes: ['id', 'quantity'] 
        });
        const equipment = await StockEquipment.findAll({ 
          where: { userId: user.id },
          attributes: ['id', 'quantity'] 
        });
        const feeds = await StockFeed.findAll({ 
          where: { userId: user.id },
          attributes: ['id', 'quantity'] 
        });
        const fertilizers = await StockFertilizer.findAll({ 
          where: { userId: user.id },
          attributes: ['id', 'quantity'] 
        });
        const harvests = await StockHarvest.findAll({ 
          where: { userId: user.id },
          attributes: ['id', 'quantity'] 
        });
        const seeds = await StockSeeds.findAll({ 
          where: { userId: user.id },
          attributes: ['id', 'quantity'] 
        });
        const tools = await StockTools.findAll({ 
          where: { userId: user.id },
          attributes: ['id', 'quantity'] 
        });
        
        // Calculate actual quantities
        const pesticideCount = safeSum(pesticides, p => p.quantity);
        const equipmentCount = safeSum(equipment, e => e.quantity);
        const feedCount = safeSum(feeds, f => f.quantity);
        const fertilizerCount = safeSum(fertilizers, f => f.quantity);
        const harvestCount = safeSum(harvests, h => h.quantity);
        const seedCount = safeSum(seeds, s => s.quantity);
        const toolCount = safeSum(tools, t => t.quantity);
        
        // Total items
        const totalItems = animalCount + pesticideCount + equipmentCount + 
                           feedCount + fertilizerCount + harvestCount + 
                           seedCount + toolCount;

        return {
          user: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            username: user.username,
            role: user.role,
            profilePicture: user.profilePicture
          },
          stockStats: {
            totalItems,
            animalCount,
            pesticideCount,
            equipmentCount,
            feedCount,
            fertilizerCount,
            harvestCount,
            seedCount,
            toolCount
          }
        };
      }));

      // Filter out users with no stock items
      const filteredUsers = usersWithStats.filter(user => user.stockStats.totalItems > 0);
      
      res.json(filteredUsers);
    } catch (error) {
      console.error('Error fetching users stock stats:', error);
      res.status(500).json({ error: 'Failed to fetch users stock statistics' });
    }
  }
};

module.exports = stockDashboardController; 