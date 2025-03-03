const { Media } = require('../database/assossiation');
const path = require('path');
const fs = require('fs');

async function fixMediaUrls() {
  try {
    // Get all media with NULL url
    const mediaRecords = await Media.findAll({
      where: {
        url: null,
        postId: {
          [Op.not]: null
        }
      }
    });

    console.log(`Found ${mediaRecords.length} media records with NULL URLs`);

    // Update each record with a default URL pattern
    for (const media of mediaRecords) {
      const url = `/uploads/post_${media.postId}_media_${media.id}.jpg`;
      
      await media.update({
        url,
        type: 'image'
      });
      
      console.log(`Updated media ID ${media.id} with URL: ${url}`);
    }

    console.log('Media URL fix complete');
  } catch (error) {
    console.error('Error fixing media URLs:', error);
  }
}

fixMediaUrls(); 