const { faker } = require('@faker-js/faker');
const { CropDetails, Crop } = require('../assossiation');

async function seedCropDetails() {
  try {
    console.log("🌱 Seeding crop details...");

    const crops = await Crop.findAll();
    if (!crops.length) {
      throw new Error("No crops found. Please seed crops first.");
    }

    const cropDetailsToCreate = [];

    for (const crop of crops) {
      cropDetailsToCreate.push({
        cropId: crop.id,
        soilType: faker.helpers.arrayElement(['Clay', 'Sandy', 'Loamy', 'Silt']),
        plantingDepth: faker.number.float({ min: 0.5, max: 10, multipleOf: 0.1 }),
        rowSpacing: faker.number.float({ min: 10, max: 100, multipleOf: 0.1 }),
        wateringSchedule: faker.helpers.arrayElement(['Daily', 'Twice weekly', 'Weekly']),
        fertilizationSchedule: faker.helpers.arrayElement(['Monthly', 'Bi-weekly', 'Weekly']),
        expectedYield: faker.number.float({ min: 100, max: 10000, multipleOf: 0.1 }),
        growthDuration: faker.number.int({ min: 30, max: 365 }),
        seasonalTiming: faker.helpers.arrayElement(['Spring', 'Summer', 'Fall', 'Winter']),
        pestManagement: faker.lorem.paragraph(),
        diseaseManagement: faker.lorem.paragraph(),
        harvestingGuidelines: faker.lorem.paragraph(),
        storageRequirements: faker.lorem.paragraph(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await CropDetails.bulkCreate(cropDetailsToCreate);
    console.log(`✅ Created ${cropDetailsToCreate.length} crop details`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding crop details:", error);
    throw error;
  }
}

module.exports = seedCropDetails;