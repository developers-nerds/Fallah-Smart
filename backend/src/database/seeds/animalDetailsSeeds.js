const { faker } = require('@faker-js/faker');
const { AnimalDetails, Animal_doc } = require('../assossiation');

async function seedAnimalDetails() {
  try {
    console.log("🌱 Seeding animal details...");

    const animalDocs = await Animal_doc.findAll();
    if (!animalDocs.length) {
      throw new Error("No animal documents found. Please seed animal documents first.");
    }

    const animalDetailsToCreate = [];
    const breeds = {
      Cow: ['Holstein', 'Angus', 'Jersey', 'Hereford'],
      Sheep: ['Merino', 'Suffolk', 'Dorper', 'Romney'],
      Goat: ['Nubian', 'Alpine', 'Boer', 'Saanen'],
      Chicken: ['Leghorn', 'Rhode Island Red', 'Plymouth Rock'],
      Horse: ['Arabian', 'Quarter Horse', 'Thoroughbred']
    };

    for (const doc of animalDocs) {
      const animalType = faker.helpers.arrayElement(Object.keys(breeds));
      animalDetailsToCreate.push({
        animalId: doc.id,
        breed: faker.helpers.arrayElement(breeds[animalType]),
        birthDate: faker.date.past({ years: 5 }),
        weight: faker.number.float({ min: 1, max: 1000, multipleOf: 0.1 }),
        height: faker.number.float({ min: 0.3, max: 2, multipleOf: 0.1 }),
        healthStatus: faker.helpers.arrayElement(['Healthy', 'Sick', 'Under Treatment']),
        dietaryNeeds: faker.lorem.sentence(),
        specialCare: faker.lorem.paragraph(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await AnimalDetails.bulkCreate(animalDetailsToCreate);
    console.log(`✅ Created ${animalDetailsToCreate.length} animal details`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding animal details:", error);
    throw error;
  }
}


module.exports = seedAnimalDetails;