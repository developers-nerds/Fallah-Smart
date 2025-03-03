const { faker } = require('@faker-js/faker');
const { Media, Posts, Users, Scans } = require('../assossiation');
const path = require('path');
const fs = require('fs');

async function seedMedia() {
  try {
    console.log("🌱 Seeding media...");

    const posts = await Posts.findAll();
    const users = await Users.findAll();
    const scans = await Scans.findAll();

    if (!posts.length || !users.length) {
      throw new Error("No posts or users found. Please seed them first.");
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const mediaToCreate = [];
    const mediaTypes = ['image', 'video', 'document'];
    const mimeTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif'],
      video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
      document: ['application/pdf', 'application/msword', 'text/plain']
    };

    // Use stable, reliable image URLs
    const sampleImageUrls = [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Harry_Potter_wordmark.svg/330px-Harry_Potter_wordmark.svg.png',
      '/uploads/seed_image_2.jpg',
      '/uploads/seed_image_3.jpg',
      '/uploads/seed_image_4.jpg',
      '/uploads/seed_image_5.jpg',
    ];

    // Media for posts
    for (const post of posts) {
      // Always create at least one image for each post
      const type = 'image';
      const imageUrl = faker.helpers.arrayElement(sampleImageUrls);
      
      mediaToCreate.push({
        postId: post.id,
        type: type,
        url: imageUrl, // Use our predefined URLs
        filename: `seed_image_${post.id}.jpg`,
        mimeType: 'image/jpeg',
        file_type: type,
        size: faker.number.int({ min: 100000, max: 5000000 }),
        metadata: JSON.stringify({
          width: faker.number.int({ min: 800, max: 2400 }),
          height: faker.number.int({ min: 600, max: 1600 }),
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Media for scans
    for (const scan of scans) {
      mediaToCreate.push({
        scanId: scan.id,
        type: 'image',
        url: '/uploads/scan_image.jpg', // More reliable URL
        filename: `scan_${scan.id}.jpg`,
        mimeType: 'image/jpeg',
        file_type: 'image',
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

    // Create empty image files in the uploads directory for our seeds
    const createEmptyImageFiles = () => {
      const dummyImageBuffer = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
      );
      
      sampleImageUrls.forEach(url => {
        const filename = url.split('/').pop();
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, dummyImageBuffer);
      });
      
      // Create scan image file
      fs.writeFileSync(path.join(uploadsDir, 'scan_image.jpg'), dummyImageBuffer);
      
      console.log('Created empty image files for seeding');
    };
    
    // Create dummy image files
    createEmptyImageFiles();

    await Media.bulkCreate(mediaToCreate);
    console.log(`✅ Created ${mediaToCreate.length} media items`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding media:", error);
    throw error;
  }
}

module.exports = seedMedia;