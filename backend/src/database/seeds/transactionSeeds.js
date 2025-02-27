const { faker } = require('@faker-js/faker');
const { Transactions, Accounts } = require('../assossiation');

async function seedTransactions() {
  try {
    console.log("🌱 Seeding transactions...");

    const accounts = await Accounts.findAll();
    if (!accounts.length) {
      throw new Error("No accounts found. Please seed accounts first.");
    }

    const transactionsToCreate = [];
    const categories = ['Feed', 'Equipment', 'Supplies', 'Labor', 'Maintenance', 'Sales', 'Investment'];

    for (const account of accounts) {
      const transactionCount = faker.number.int({ min: 5, max: 15 });

      for (let i = 0; i < transactionCount; i++) {
        const amount = faker.number.float({ min: 10, max: 5000, multipleOf: 0.01 });
        transactionsToCreate.push({
          accountId: account.id,
          amount: amount,
          type: amount > 0 ? 'income' : 'expense',
          description: faker.commerce.productDescription(),
          category: faker.helpers.arrayElement(categories),
          date: faker.date.recent({ days: 90 }),
          status: faker.helpers.arrayElement(['completed', 'pending', 'failed']),
          reference: faker.string.alphanumeric(10),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await Transactions.bulkCreate(transactionsToCreate);
    console.log(`✅ Created ${transactionsToCreate.length} transactions`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding transactions:", error);
    throw error;
  }
}

module.exports = seedTransactions;