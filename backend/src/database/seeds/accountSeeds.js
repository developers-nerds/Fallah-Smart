const { faker } = require('@faker-js/faker');
const { Accounts, Users } = require('../assossiation');

async function seedAccounts() {
  try {
    console.log("🌱 Seeding accounts...");

    const users = await Users.findAll();
    if (!users.length) {
      throw new Error("No users found. Please seed users first.");
    }

    const accountsToCreate = [];
    const methods = ['Cash', 'Bank Transfer', 'Credit Card', 'Mobile Money'];
    const currencies = ['USD', 'EUR', 'GBP', 'JPY'];

    for (const user of users) {
      const accountCount = faker.number.int({ min: 1, max: 3 });

      for (let i = 0; i < accountCount; i++) {
        accountsToCreate.push({
          userId: user.id,
          Methods: faker.helpers.arrayElement(methods),
          balance: faker.number.float({ min: 100, max: 50000, multipleOf: 0.01 }),
          currency: faker.helpers.arrayElement(currencies),
          createdAt: faker.date.past(),
          updatedAt: new Date()
        });
      }
    }

    await Accounts.bulkCreate(accountsToCreate);
    console.log(`✅ Created ${accountsToCreate.length} accounts`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding accounts:", error);
    throw error;
  }
}

module.exports = seedAccounts;