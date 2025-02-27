const { faker } = require('@faker-js/faker');
const { Conversations, Users } = require('../assossiation');

async function seedConversations() {
  try {
    console.log("🌱 Seeding conversations...");

    const users = await Users.findAll();
    if (!users.length) {
      throw new Error("No users found. Please seed users first.");
    }

    const conversationsToCreate = [];
    const conversationCount = faker.number.int({ min: 10, max: 20 });

    for (let i = 0; i < conversationCount; i++) {
      conversationsToCreate.push({
        conversation_name: faker.lorem.words(2),
        createdAt: faker.date.recent(),
        updatedAt: new Date()
      });
    }

    await Conversations.bulkCreate(conversationsToCreate);
    console.log(`✅ Created ${conversationsToCreate.length} conversations`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding conversations:", error);
    throw error;
  }
}


module.exports = seedConversations;