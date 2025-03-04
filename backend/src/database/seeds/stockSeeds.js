// const { faker } = require('@faker-js/faker');
// const { Stock, StockHistory } = require('../assossiation');

// async function seedStocks() {
//   try {
//     console.log("🌱 Seeding stocks...");

//     const stockHistory = await StockHistory.findAll();
//     if (stockHistory.length === 0) {
//       throw new Error("No stock history found. Please seed stock history first.");
//     }

//     const categories = ['Céréales', 'Fruits', 'Légumes', 'Viande', 'Produits laitiers', 'Fourrage', 'Autre'];
//     const batchSize = 100;
//     let totalCreated = 0;

//     for (const history of stockHistory) {
//       const stockCount = faker.number.int({ min: 1, max: 5 });
//       const stocksToCreate = [];

//       for (let i = 0; i < stockCount; i++) {
//         stocksToCreate.push({
//           stockHistoryId: history.id,
//           userId: history.userId,
//           name: faker.commerce.productName(),
//           quantity: faker.number.float({ min: 1, max: 1000, precision: 0.1 }),
//           unit: faker.helpers.arrayElement(['kg', 'L', 'unités', 'bottes', 'sacs']),
//           lowStockThreshold: faker.number.float({ min: 5, max: 50, precision: 0.1 }),
//           category: faker.helpers.arrayElement(categories),
//           createdAt: new Date(),
//           updatedAt: new Date()
//         });

//         // Process in batches
//         if (stocksToCreate.length >= batchSize) {
//           await Stock.bulkCreate(stocksToCreate, { validate: true });
//           totalCreated += stocksToCreate.length;
//           console.log(`Progress: Created ${totalCreated} stocks`);
//           stocksToCreate.length = 0;
//         }
//       }

//       // Create remaining stocks
//       if (stocksToCreate.length > 0) {
//         await Stock.bulkCreate(stocksToCreate, { validate: true });
//         totalCreated += stocksToCreate.length;
//       }
//     }

//     console.log(`✅ Created ${totalCreated} stocks successfully`);
//     return true;
//   } catch (error) {
//     console.error("❌ Error seeding stocks:", error);
//     throw error;
//   }
// }

// module.exports = seedStocks;