const { faker } = require('@faker-js/faker');
const { Transactions, Accounts } = require('../assossiation');

async function seedTransactions() {
  try {
    console.log("🌱 Seeding transactions...");

    const transactions = [
      {
        amount: 999,
        type: "income",
        date: new Date("2025-03-03"),
        note: "chahreya",
        categoryId: 1,
        accountId: 1
      },
      {
        amount: 200,
        type: "expense",
        date: new Date("2025-03-03"),
        note: "kaskrout",
        categoryId: 2,
        accountId: 1
      },
      {
        amount: 100,
        type: "expense",
        date: new Date("2025-03-03"),
        note: "mekla",
        categoryId: 2,
        accountId: 1
      },
      {
        amount: 100,
        type: "expense",
        date: new Date("2025-03-03"),
        note: "pizza",
        categoryId: 2,
        accountId: 1
      },
      {
        amount: 50,
        type: "expense",
        date: new Date("2025-03-03"),
        note: "essence",
        categoryId: 4,
        accountId: 1
      },
      {
        amount: 30,
        type: "expense",
        date: new Date("2025-03-03"),
        note: "micho",
        categoryId: 5,
        accountId: 1
      },
      {
        amount: 100,
        type: "expense",
        date: new Date("2024-02-20"),
        note: "talyatelyy",
        categoryId: 2,
        accountId: 1
      },
      {
        amount: 100,
        type: "income",
        date: new Date("2024-02-20"),
        note: "bousta",
        categoryId: 1,
        accountId: 1
      },
      {
        amount: 1000,
        type: "income",
        date: new Date("2024-02-20"),
        note: "cha9a9a",
        categoryId: 1,
        accountId: 1
      },
      {
        amount: 109,
        type: "expense",
        date: new Date("2024-02-20"),
        note: "mazout",
        categoryId: 4,
        accountId: 1
      }
    ];

    await Transactions.bulkCreate(transactions);
    console.log(`✅ Created ${transactions.length} transactions`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding transactions:", error);
    throw error;
  }
}

module.exports = seedTransactions;