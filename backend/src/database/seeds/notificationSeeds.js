const { faker } = require('@faker-js/faker');
const { Notification, Users } = require('../assossiation');

async function seedNotifications() {
  try {
    console.log("🌱 Seeding notifications...");

    const users = await Users.findAll();
    if (users.length === 0) {
      throw new Error("No users found. Please seed users first.");
    }

    const notificationsToCreate = [];
    const notificationTypes = ['system', 'message', 'alert', 'reminder'];

    for (const user of users) {
      const notificationCount = faker.number.int({ min: 3, max: 10 });

      for (let i = 0; i < notificationCount; i++) {
        notificationsToCreate.push({
          userId: user.id,
          type: faker.helpers.arrayElement(notificationTypes),
          message: faker.lorem.sentence(),
          isRead: faker.datatype.boolean(),
          createdAt: faker.date.recent(),
          updatedAt: new Date()
        });
      }
    }

    await Notification.bulkCreate(notificationsToCreate);
    console.log(`✅ Created ${notificationsToCreate.length} notifications`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding notifications:", error);
    throw error;
  }
}

module.exports = seedNotifications;