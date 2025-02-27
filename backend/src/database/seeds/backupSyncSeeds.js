const { faker } = require('@faker-js/faker');
const { BackupSync, Users } = require('../assossiation');

async function seedBackupSync() {
  try {
    console.log("🌱 Seeding backup sync records...");

    const users = await Users.findAll();
    if (!users.length) {
      throw new Error("No users found. Please seed users first.");
    }

    const backupSyncsToCreate = [];

    for (const user of users) {
      const syncCount = faker.number.int({ min: 1, max: 5 });

      for (let i = 0; i < syncCount; i++) {
        backupSyncsToCreate.push({
          userId: user.id,
          backup_data: JSON.stringify({
            timestamp: new Date().toISOString(),
            data: faker.lorem.paragraphs(3),
            metadata: {
              size: faker.number.int({ min: 1000, max: 50000 }),
              type: faker.helpers.arrayElement(['full', 'incremental']),
              version: faker.system.semver()
            }
          }),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await BackupSync.bulkCreate(backupSyncsToCreate);
    console.log(`✅ Created ${backupSyncsToCreate.length} backup sync records`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding backup sync records:", error);
    throw error;
  }
}

module.exports = seedBackupSync;