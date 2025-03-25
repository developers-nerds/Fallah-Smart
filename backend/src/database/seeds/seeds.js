const { faker } = require('@faker-js/faker');

// Remove duplicate import if it exists
const seedCategories = require('./categoriesSeeds');
const seedUsers = require('./userSeeds');

const seedCrops = require('./cropSeeds');  // Keep only one import
const seedCropDetails = require('./cropDetailsSeeds');
const seedAnimalDocs = require('./animalDocSeeds');
// const seedUserAnimals = require('./userAnimalSeeds');
const seedUserAnimalDetails = require('./animalDetailsSeeds');  
// const seedPesticides = require('./pesticideSeeds');
// const seedStocks = require('./stockSeeds');
// const seedStockHistory = require('./stockHistorySeeds');
const seedPosts = require('./postSeeds');
const seedComments = require('./commentSeeds');
const seedLikes = require('./likeSeeds');
// const seedConversations = require('./conversationSeeds');
// const seedMessages = require('./messageSeeds');
// const seedBackupSync = require('./backupSyncSeeds');
// const seedNotifications = require('./notificationSeeds');
// const seedMedia = require('./mediaSeeds');
// const seedRecurringTransactions = require('./recurringTransactionSeeds');
// const seedTransactions = require('./transactionSeeds');
// const seedScans = require('./scanSeeds');



//////////////////////SEEDS FOR EDUCATION//////////////////////
const seedEducationQuizzes = require('./Education_QuizzesSeeds');
const seedEducationQuestions = require('./Education_QuestionsSeeds');
const seedEducationVideos = require('./Education_VideosSeeds');
const seedEducationAdditionalVideos = require('./Education_AdditionalVideosSeeds');
const seedEducationCrops = require('./Education_CropsSeeds');
const seedEducationAnimals = require('./EducationAnimalsSeeds');

const initializeDatabase = require('../dbInit');

async function seedAll() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize database first (create tables)
    await initializeDatabase();
    
    // Then proceed with seeding in correct order
    await seedUsers();
    console.log("🌱 Seeding users...");
    
    await seedCategories();
    console.log("🌱 Seeding categories...");
    
    // First seed crops
    await seedCrops(); 
    console.log("🌱 Seeding crops...");
    
    // Then seed crop details that depend on crops
    await seedCropDetails();
    console.log("🌱 Seeding crop details...");
    
    await seedAnimalDocs();
    console.log("🌱 Seeding animal docs...");
    
    await seedUserAnimalDetails();
    console.log("🌱 Seeding user animal details...");
    
    await seedPosts();
    console.log("🌱 Seeding posts...");
    
    await seedComments();
    console.log("🌱 Seeding comments...");
    
    await seedLikes();
    console.log("🌱 Seeding likes...");

    ///////////////////SEEDS FOR EDUCATION//////////////////////
    await seedEducationQuizzes();
    await seedEducationQuestions();
    await seedEducationVideos();
    await seedEducationAdditionalVideos();
    await seedEducationCrops();
    await seedEducationAnimals();
    
    console.log('✅ All data seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('Database seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedAll;