const { faker } = require('@faker-js/faker');
const { Transactions } = require('../assossiation');

async function seedTransactions() {
  try {
    console.log("🌱 Seeding transactions...");

    const transactions = [
      {
        amount: 1200,
        type: "income",
        date: new Date("2024-03-01"),
        note: "Monthly Salary",
        categoryId: 1,
        accountId: 18
      },
      {
        amount: 400,
        type: "expense",
        date: new Date("2025-03-03"),
        note: "kaskrout",
        categoryId: 2,
        accountId: 18
      },
      {
        amount: 75,
        type: "expense",
        date: new Date("2024-03-03"),
        note: "Grocery Shopping",
        categoryId: 2,
        accountId: 18
      },
      {
        amount: 45,
        type: "expense",
        date: new Date("2025-03-03"),
        note: "pizza",
        categoryId: 2,
        accountId: 18
      },
      {
        amount: 50,
        type: "expense",
        date: new Date("2025-03-03"),
        note: "essence",
        categoryId: 4,
        accountId: 18
      },
      {
        amount: 60,
        type: "expense",
        date: new Date("2024-03-05"),
        note: "Internet Bill",
        categoryId: 5,
        accountId: 18
      },
      {
        amount: 35,
        type: "expense",
        date: new Date("2024-03-05"),
        note: "Restaurant",
        categoryId: 2,
        accountId: 18
      },
      {
        amount: 100,
        type: "income",
        date: new Date("2024-02-20"),
        note: "bousta",
        categoryId: 1,
        accountId: 18
      },
      {
        amount: 1000,
        type: "income",
        date: new Date("2024-02-20"),
        note: "cha9a9a",
        categoryId: 1,
        accountId: 18
      },
      {
        amount: 150,
        type: "expense",
        date: new Date("2024-02-20"),
        note: "mazout",
        categoryId: 4,
        accountId: 18
      }
    ];

    // Bulk create with validation and error handling
    const createdTransactions = await Transactions.bulkCreate(transactions, {
      validate: true, // Validate each record before insertion
      individualHooks: true // Run any model hooks if they exist
    });

    console.log(`✅ Created ${createdTransactions.length} transactions`);
    return true;

  } catch (error) {
    console.error("❌ Error seeding transactions:", error);
    throw error;
  }
}
seedTransactions()
module.exports = seedTransactions;
