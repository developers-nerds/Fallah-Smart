const { faker } = require('@faker-js/faker');
const { Category } = require('../assossiation');

async function seedCategories() {
  try {
    console.log("🌱 Seeding categories...");

    const categories = [
      // Farming Categories
      { name: 'Livestock', type: 'animals', icon: 'cow', color: '#8D6E63' },
      { name: 'Crops', type: 'crops', icon: 'seed', color: '#558B2F' },
      { name: 'Equipment', type: 'Expense', icon: 'tractor', color: '#F57C00' },
      { name: 'Supplies', type: 'Expense', icon: 'package', color: '#6D4C41' },
      { name: 'Feed', type: 'Expense', icon: 'wheat', color: '#827717' },
      { name: 'Pesticides', type: 'Expense', icon: 'spray', color: '#C62828' },
      { name: 'Fertilizers', type: 'Expense', icon: 'fertilizer', color: '#33691E' },
      { name: 'Seeds', type: 'Expense', icon: 'seed', color: '#1B5E20' },
      { name: 'Irrigation', type: 'Expense', icon: 'water', color: '#0288D1' },
      { name: 'Tools', type: 'Expense', icon: 'tools', color: '#455A64' },
      { name: 'Sales', type: 'Income', icon: 'cash-register', color: '#2E7D32' },
      { name: 'Services', type: 'Income', icon: 'handshake', color: '#1976D2' },
      // Personal Finance Categories
      {
        name: "Salary",
        icon: "money-bill-wave",
        type: "Income",
        color: "#7BC29A"
      },
      {
        name: "Food",
        icon: "shopping-basket",
        type: "Expense",
        color: "#FF9999"
      },
      {
        name: "Car",
        icon: "car",
        type: "Expense",
        color: "#5B9BD5"
      },
      {
        name: "Entertainment",
        icon: "glass-martini-alt",
        type: "Expense",
        color: "#E9B97A"
      },
      {
        name: "Eating out",
        icon: "utensils",
        type: "Expense",
        color: "#A5D6A7"
      },
      {
        name: "Taxi",
        icon: "taxi",
        type: "Expense",
        color: "#D6A01D"
      },
      {
        name: "Pets",
        icon: "cat",
        type: "Expense",
        color: "#A5D6A7"
      }
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