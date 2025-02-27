const { faker } = require('@faker-js/faker');
const { Messages, Conversations, Users } = require('../assossiation');

async function seedMessages() {
  try {
    console.log("🌱 Seeding messages...");

    const conversations = await Conversations.findAll();
    const users = await Users.findAll();

    if (conversations.length === 0 || users.length === 0) {
      throw new Error("No conversations or users found. Please seed them first.");
    }

    const messagesToCreate = [];
    const messageTypes = ['text', 'image', 'other'];
    const senderTypes = ['user', 'ai'];

    for (const conversation of conversations) {
      const messageCount = faker.number.int({ min: 3, max: 20 });

      for (let i = 0; i < messageCount; i++) {
        messagesToCreate.push({
          conversationId: conversation.id,
          sender: faker.helpers.arrayElement(senderTypes),
          type: faker.helpers.arrayElement(messageTypes),
          content: faker.lorem.paragraph(),
          createdAt: faker.date.recent(),
          updatedAt: new Date()
        });
      }
    }

    await Messages.bulkCreate(messagesToCreate);
    console.log(`✅ Created ${messagesToCreate.length} messages`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding messages:", error);
    throw error;
  }
}

module.exports = seedMessages;