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
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        amount: 400,
        type: "expense",
        date: new Date("2024-03-02"),
        note: "Rent Payment",
        categoryId: 3,
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        amount: 75,
        type: "expense",
        date: new Date("2024-03-03"),
        note: "Grocery Shopping",
        categoryId: 2,
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        amount: 45,
        type: "expense",
        date: new Date("2024-03-03"),
        note: "Fuel",
        categoryId: 4,
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        amount: 300,
        type: "income",
        date: new Date("2024-03-04"),
        note: "Freelance Work",
        categoryId: 1,
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        amount: 60,
        type: "expense",
        date: new Date("2024-03-05"),
        note: "Internet Bill",
        categoryId: 5,
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        amount: 35,
        type: "expense",
        date: new Date("2024-03-05"),
        note: "Restaurant",
        categoryId: 2,
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        amount: 150,
        type: "expense",
        date: new Date("2024-03-06"),
        note: "Electricity Bill",
        categoryId: 5,
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
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

// Only execute if called directly, not when imported
if (require.main === module) {
  seedTransactions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedTransactions;