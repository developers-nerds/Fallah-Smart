const { faker } = require('@faker-js/faker');

// Remove duplicate import if it exists
const seedCategories = require('./categoriesSeeds');
const seedUsers = require('./userSeeds');
const seedAccounts = require('./accountSeeds');
const seedCrops = require('./cropSeeds');  // Keep only one import
// const seedCropDetails = require('./cropDetailsSeeds');
const seedAnimalDocs = require('./animalDocSeeds');
const seedUserAnimals = require('./userAnimalSeeds');
// const seedUserAnimalDetails = require('./animalDetailsSeeds');
const seedPesticides = require('./pesticideSeeds');
const seedStocks = require('./stockSeeds');
const seedStockHistory = require('./stockHistorySeeds');
const seedPosts = require('./postSeeds');
const seedComments = require('./commentSeeds');
const seedLikes = require('./likeSeeds');
const seedConversations = require('./conversationSeeds');
const seedMessages = require('./messageSeeds');
const seedBackupSync = require('./backupSyncSeeds');
const seedNotifications = require('./notificationSeeds');
const seedMedia = require('./mediaSeeds');
const seedRecurringTransactions = require('./recurringTransactionSeeds');
const seedTransactions = require('./transactionSeeds');
const seedScans = require('./scanSeeds');

async function seedAll() {
  try {
    console.log('🌱 Starting database seeding...');

    // Update the seeding order
    await seedUsers();
    await seedCategories();
    await seedNotifications();
    await seedStockHistory();
    await seedStocks();
    await seedUserAnimals();
    await seedAnimalDocs();
    // await seedUserAnimalDetails();
    await seedCrops();  
    // await seedCropDetails();
    await seedPesticides();
    await seedPosts();
    await seedComments();
    await seedLikes();
    await seedScans();
    await seedMedia();
    await seedConversations(); 
    await seedAccounts();
    await seedTransactions();
    await seedRecurringTransactions();
    await seedBackupSync();
    await seedMessages();



  

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
}

// Add this line to execute the function
seedAll().catch(console.error);

module.exports = seedAll;