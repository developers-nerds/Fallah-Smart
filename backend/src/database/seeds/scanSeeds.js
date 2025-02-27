const { faker } = require('@faker-js/faker');
const { Scans, Users } = require('../assossiation');

async function seedScans() {
  try {
    console.log("🌱 Seeding scans...");

    const users = await Users.findAll();
    if (!users.length) {
      throw new Error("No users found. Please seed users first.");
    }

    const scansToCreate = [];
    const scanTypes = ['disease', 'pest', 'soil', 'plant'];
    const statusTypes = ['pending', 'completed', 'processing', 'failed'];

    for (const user of users) {
      const scanCount = faker.number.int({ min: 1, max: 8 });

      for (let i = 0; i < scanCount; i++) {
        scansToCreate.push({
          userId: user.id,
          type: faker.helpers.arrayElement(scanTypes),
          result: faker.lorem.paragraph(),
          confidence: Number((Math.random() * 0.9 + 0.1).toFixed(2)),
          status: faker.helpers.arrayElement(statusTypes),
          ai_response: faker.lorem.paragraph(), // Add this line
          metadata: JSON.stringify({
            location: {
              latitude: faker.location.latitude(),
              longitude: faker.location.longitude()
            },
            weather: faker.helpers.arrayElement(['sunny', 'cloudy', 'rainy']),
            temperature: faker.number.float({ min: 15, max: 35, multipleOf: 1 })
          }),
          createdAt: faker.date.recent(),
          updatedAt: new Date()
        });
      }
    }

    await Scans.bulkCreate(scansToCreate);
    console.log(`✅ Created ${scansToCreate.length} scans`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding scans:", error);
    throw error;
  }
}

module.exports = seedScans;