const { faker } = require('@faker-js/faker');
const { Likes, Users, Posts, Comments } = require('../assossiation');

async function seedLikes() {
  try {
    console.log("🌱 Seeding likes...");

    const users = await Users.findAll();
    const posts = await Posts.findAll();
    const comments = await Comments.findAll();

    if (!users.length || !posts.length) {
      throw new Error("No users or posts found. Please seed them first.");
    }

    const likesToCreate = [];

    // Create likes for posts
    for (const post of posts) {
      const likeCount = faker.number.int({ min: 0, max: 20 });
      const randomUsers = faker.helpers.arrayElements(users, likeCount);

      randomUsers.forEach(user => {
        likesToCreate.push({
          userId: user.id,
          postId: post.id,
          createdAt: faker.date.recent(),
          updatedAt: new Date()
        });
      });
    }

    // Create likes for comments
    for (const comment of comments) {
      const likeCount = faker.number.int({ min: 0, max: 10 });
      const randomUsers = faker.helpers.arrayElements(users, likeCount);

      randomUsers.forEach(user => {
        likesToCreate.push({
          userId: user.id,
          commentId: comment.id,
          createdAt: faker.date.recent(),
          updatedAt: new Date()
        });
      });
    }

    await Likes.bulkCreate(likesToCreate);
    console.log(`✅ Created ${likesToCreate.length} likes`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding likes:", error);
    throw error;
  }
}
module.exports = seedLikes;