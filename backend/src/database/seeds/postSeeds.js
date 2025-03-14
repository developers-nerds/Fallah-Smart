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
    const categories = ['CROPS', 'LIVESTOCK', 'EQUIPMENT', 'WEATHER', 'MARKET', 'TIPS'];

    // Generate farming-related titles based on category
    const getTitleForCategory = (category) => {
      switch (category) {
        case 'CROPS':
          return faker.helpers.arrayElement([
            'Best practices for growing wheat',
            'How to deal with crop diseases',
            'Organic farming techniques',
            'Seasonal planting guide',
            'Soil preparation tips'
          ]);
        case 'LIVESTOCK':
          return faker.helpers.arrayElement([
            'Cattle feeding guidelines',
            'Poultry management tips',
            'Animal health care basics',
            'Dairy farming practices',
            'Livestock breeding advice'
          ]);
        case 'EQUIPMENT':
          return faker.helpers.arrayElement([
            'Tractor maintenance guide',
            'Modern farming tools review',
            'Irrigation system setup',
            'Equipment repair tips',
            'New technology in farming'
          ]);
        case 'WEATHER':
          return faker.helpers.arrayElement([
            'Weather forecast analysis',
            'Preparing for drought season',
            'Rain patterns and farming',
            'Climate change adaptation',
            'Protecting crops from extreme weather'
          ]);
        case 'MARKET':
          return faker.helpers.arrayElement([
            'Current crop prices',
            'Market trends analysis',
            'Best time to sell produce',
            'Export opportunities',
            'Local market insights'
          ]);
        case 'TIPS':
          return faker.helpers.arrayElement([
            'Sustainable farming practices',
            'Cost-saving farming tips',
            'Pest control methods',
            'Water conservation techniques',
            'Farm management advice'
          ]);
        default:
          return faker.lorem.sentence().substring(0, 255);
      }
    };

    const postCount = faker.number.int({ min: 30, max: 50 });

    for (let i = 0; i < postCount; i++) {
      const category = faker.helpers.arrayElement(categories);
      postsToCreate.push({
        userId: faker.helpers.arrayElement(users).id,
        title: getTitleForCategory(category),
        description: faker.lorem.paragraphs(2).substring(0, 255), // Limit description length
        category: category,
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