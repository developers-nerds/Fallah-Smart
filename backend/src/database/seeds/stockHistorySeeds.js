const { faker } = require('@faker-js/faker');
const { StockHistory, Users } = require('../assossiation');

async function seedStockHistory() {
  try {
    console.log("🌱 Seeding stock history...");

    const users = await Users.findAll();
    if (users.length === 0) {
      throw new Error("No users found. Please seed users first.");
    }

    const stockHistoryToCreate = [];

    for (const user of users) {
      const historyCount = faker.number.int({ min: 5, max: 15 });

      for (let i = 0; i < historyCount; i++) {
        stockHistoryToCreate.push({
          userId: user.id,
          type: faker.helpers.arrayElement(['add', 'remove']),
          quantity: faker.number.float({ min: 1, max: 100, multipleOf: 0.1 }),
          createdAt: faker.date.past(),
          updatedAt: new Date()
        });
      }
    }

    await StockHistory.bulkCreate(stockHistoryToCreate);
    console.log(`✅ Created ${stockHistoryToCreate.length} stock history records`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding stock history:", error);
    throw error;
  }
}

module.exports = seedStockHistory;