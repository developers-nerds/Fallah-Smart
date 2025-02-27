const { faker } = require('@faker-js/faker');
const { Posts, Users } = require('../assossiation');

async function seedPosts() {
  try {
    console.log("🌱 Seeding posts...");

    const users = await Users.findAll();
    if (!users.length) {
      throw new Error("No users found. Please seed users first.");
    }

    const postsToCreate = [];
    const categories = ['Question', 'Market', 'News'];

    const postCount = faker.number.int({ min: 30, max: 50 });

    for (let i = 0; i < postCount; i++) {
      postsToCreate.push({
        userId: faker.helpers.arrayElement(users).id,
        title: faker.lorem.sentence().substring(0, 255),
        description: faker.lorem.paragraph().substring(0, 255), // Limit description length
        category: faker.helpers.arrayElement(categories),
        counter: faker.number.int({ min: 0, max: 1000 }),
        createdAt: faker.date.recent(),
        updatedAt: new Date()
      });
    }

    await Posts.bulkCreate(postsToCreate);
    console.log(`✅ Created ${postsToCreate.length} posts`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding posts:", error);
    throw error;
  }
}

module.exports = seedPosts;