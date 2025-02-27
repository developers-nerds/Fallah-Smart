const { faker } = require('@faker-js/faker');
const { UserAnimals, Users } = require('../assossiation');

async function seedUserAnimals() {
  try {
    console.log("🌱 Seeding user animals...");

    const users = await Users.findAll();
    if (!users.length) {
      throw new Error("No users found. Please seed users first.");
    }

    const animalTypes = ['Cow', 'Sheep', 'Chicken', 'Goat', 'Horse'];
    const healthStatuses = ['Good', 'Fair', 'Excellent', 'Needs Attention'];
    const userAnimalsToCreate = [];

    for (const user of users) {
      const animalCount = Math.floor(Math.random() * 3) + 1; // 1-3 animal types per user

      for (let i = 0; i < animalCount; i++) {
        userAnimalsToCreate.push({
          userId: user.id,
          type: faker.helpers.arrayElement(animalTypes),
          count: faker.number.int({ min: 1, max: 50 }),
          healthStatus: faker.helpers.arrayElement(healthStatuses),
          feedNeeded: faker.number.float({ min: 0.5, max: 10, multipleOf: 0.1 }),
          sex: faker.helpers.arrayElement(['Male', 'Female']),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < userAnimalsToCreate.length; i += batchSize) {
      const batch = userAnimalsToCreate.slice(i, i + batchSize);
      await UserAnimals.bulkCreate(batch, { validate: true });
      console.log(`Progress: Created ${Math.min(i + batchSize, userAnimalsToCreate.length)} of ${userAnimalsToCreate.length} animals`);
    }

    console.log(`✅ Created ${userAnimalsToCreate.length} user animals`);
    return true;
  } catch (error) {
    console.error("❌ Error seeding user animals:", error);
    throw error;
  }
}

module.exports = seedUserAnimals;