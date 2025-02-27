const { faker } = require('@faker-js/faker');
const { Media, Posts, Users, Scans } = require('../assossiation');

async function seedMedia() {
  try {
    console.log("🌱 Seeding media...");

    const posts = await Posts.findAll();
    const users = await Users.findAll();
    const scans = await Scans.findAll();

    if (!posts.length || !users.length) {
      throw new Error("No posts or users found. Please seed them first.");
    }

    const mediaToCreate = [];
    const mediaTypes = ['image', 'video', 'document'];
    const mimeTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif'],
      video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
      document: ['application/pdf', 'application/msword', 'text/plain']
    };

    // Media for posts
    for (const post of posts) {
      if (faker.datatype.boolean()) {
        const type = faker.helpers.arrayElement(mediaTypes);
        mediaToCreate.push({
          postId: post.id,
          type: type,
          url: faker.image.url(),
          filename: `${faker.string.alphanumeric(10)}.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'pdf'}`,
          mimeType: faker.helpers.arrayElement(mimeTypes[type]),

          file_type: type, // Add this line
          size: faker.number.int({ min: 100000, max: 5000000 }),
          metadata: JSON.stringify({
            width: type === 'image' ? faker.number.int({ min: 800, max: 2400 }) : null,
            height: type === 'image' ? faker.number.int({ min: 600, max: 1600 }) : null,
            duration: type === 'video' ? faker.number.int({ min: 10, max: 300 }) : null
          }),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Media for scans
    for (const scan of scans) {
      mediaToCreate.push({
        scanId: scan.id,
        type: 'image',
        url: faker.image.url(),
        filename: `scan_${faker.string.alphanumeric(10)}.jpg`,
        mimeType: 'image/jpeg',
        file_type: 'image', // Add this line
        size: faker.number.int({ min: 100000, max: 5000000 }),
        metadata: JSON.stringify({
          location: {
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude()
          },
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await Media.bulkCreate(mediaToCreate);
    console.log(`✅ Created ${mediaToCreate.length} media items`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding media:", error);
    throw error;
  }
}


module.exports = seedMedia;