const { faker } = require('@faker-js/faker');
const { Comments, Users, Posts } = require('../assossiation');

async function seedComments() {
  try {
    console.log("🌱 Seeding comments...");

    const users = await Users.findAll();
    const posts = await Posts.findAll();

    if (!users.length || !posts.length) {
      throw new Error("No users or posts found. Please seed them first.");
    }

    const commentsToCreate = [];

    for (const post of posts) {
      const commentCount = faker.number.int({ min: 0, max: 10 });

      for (let i = 0; i < commentCount; i++) {
        commentsToCreate.push({
          userId: faker.helpers.arrayElement(users).id,
          postId: post.id,
          content: faker.lorem.paragraph(),
          parentId: null,
          status: faker.helpers.arrayElement(['active', 'hidden', 'reported']),
          createdAt: faker.date.recent(),
          updatedAt: new Date()
        });
      }
    }

    // Create some nested comments (replies)
    const replyCount = faker.number.int({ min: 10, max: 20 });
    for (let i = 0; i < replyCount; i++) {
      const parentComment = faker.helpers.arrayElement(commentsToCreate);
      commentsToCreate.push({
        userId: faker.helpers.arrayElement(users).id,
        postId: parentComment.postId,
        content: faker.lorem.paragraph(),
        parentId: parentComment.id,
        status: faker.helpers.arrayElement(['active', 'hidden', 'reported']),
        createdAt: faker.date.recent(),
        updatedAt: new Date()
      });
    }

    await Comments.bulkCreate(commentsToCreate);
    console.log(`✅ Created ${commentsToCreate.length} comments`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding comments:", error);
    throw error;
  }
}

module.exports = seedComments;