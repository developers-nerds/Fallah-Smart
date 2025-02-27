const { faker } = require('@faker-js/faker');
const { Recurring_Transactions, Accounts } = require('../assossiation');

async function seedRecurringTransactions() {
  try {
    console.log("🌱 Seeding recurring transactions...");

    const accounts = await Accounts.findAll();
    if (!accounts.length) {
      throw new Error("No accounts found. Please seed accounts first.");
    }

    const recurringTransactionsToCreate = [];
    const frequencies = ['daily', 'weekly', 'monthly', 'yearly'];
    const types = ['income', 'expense'];

    for (const account of accounts) {
      const recurringCount = faker.number.int({ min: 1, max: 3 });

      for (let i = 0; i < recurringCount; i++) {
        recurringTransactionsToCreate.push({
          accountId: account.id,
          amount: faker.number.float({ min: 50, max: 2000, multipleOf: 0.01 }),
          type: faker.helpers.arrayElement(types),
          frequency: faker.helpers.arrayElement(frequencies),
          start_date: faker.date.recent(),
          end_date: faker.date.future(),
          description: faker.lorem.sentence(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await Recurring_Transactions.bulkCreate(recurringTransactionsToCreate);
    console.log(`✅ Created ${recurringTransactionsToCreate.length} recurring transactions`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding recurring transactions:", error);
    throw error;
  }
}

module.exports = seedRecurringTransactions;