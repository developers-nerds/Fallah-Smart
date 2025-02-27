const { faker } = require('@faker-js/faker');
const { Pesticide, Users } = require('../assossiation');

async function seedPesticides() {
  try {
    console.log("🌱 Seeding pesticides...");

    // Get all users to associate pesticides with
    const users = await Users.findAll();
    if (users.length === 0) {
      throw new Error("No users found. Please seed users first.");
    }

    const pesticidesToCreate = [];
    const units = ['litres', 'kilograms', 'gallons', 'pounds'];

    // Create 20-30 pesticide entries
    const pesticideCount = faker.number.int({ min: 20, max: 30 });

    for (let i = 0; i < pesticideCount; i++) {
      pesticidesToCreate.push({
        name: faker.commerce.productName(),
        quantity: faker.number.float({ min: 0, max: 1000, multipleOf: 0.1 }),
        unit: faker.helpers.arrayElement(units),
        isNatural: faker.datatype.boolean(),
        userId: faker.helpers.arrayElement(users).id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await Pesticide.bulkCreate(pesticidesToCreate);
    console.log(`✅ Created ${pesticidesToCreate.length} pesticides`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding pesticides:", error);
    throw error;
  }
}

module.exports = seedPesticides;