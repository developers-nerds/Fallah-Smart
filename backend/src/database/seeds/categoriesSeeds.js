const { faker } = require('@faker-js/faker');
const { Category } = require('../assossiation');

async function seedCategories() {
  try {
    console.log("🌱 Seeding categories...");

    const categories = [
      { name: 'Livestock', type: 'animals' },
      { name: 'Crops', type: 'crops' },
      { name: 'Equipment', type: 'Expense' },
      { name: 'Supplies', type: 'Expense' },
      { name: 'Feed', type: 'Expense' },
      { name: 'Pesticides', type: 'Expense' },
      { name: 'Fertilizers', type: 'Expense' },
      { name: 'Seeds', type: 'Expense' },
      { name: 'Irrigation', type: 'Expense' },
      { name: 'Tools', type: 'Expense' },
      { name: 'Sales', type: 'Income' },
      { name: 'Services', type: 'Income' }
    ];

    await Category.bulkCreate(categories);
    console.log(`✅ Created ${categories.length} categories`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
}

module.exports = seedCategories;