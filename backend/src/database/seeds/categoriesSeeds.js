const { faker } = require('@faker-js/faker');
const { Category } = require('../assossiation');

async function seedCategories() {
  try {
    console.log("🌱 Seeding categories...");

    const categories = [
      // Farming Categories
      { name: 'المعدات', type: 'Expense', icon: 'tractor', color: '#F57C00' },
      { name: 'الإمدادات', type: 'Expense', icon: 'package', color: '#6D4C41' },
      { name: 'الأعلاف', type: 'Expense', icon: 'wheat', color: '#827717' },
      { name: 'المبيدات', type: 'Expense', icon: 'spray', color: '#C62828' },
      { name: 'الأسمدة', type: 'Expense', icon: 'sprout', color: '#33691E' },
      { name: 'البذور', type: 'Expense', icon: 'seed', color: '#1B5E20' },
      { name: 'الري', type: 'Expense', icon: 'water', color: '#0288D1' },
      { name: 'الأدوات', type: 'Expense', icon: 'tools', color: '#455A64' },
      { name: 'المبيعات', type: 'Income', icon: 'cash-register', color: '#2E7D32' },
      { name: 'الخدمات', type: 'Income', icon: 'handshake', color: '#1976D2' },
      // Personal Finance Categories
      {
        name: "الراتب",
        icon: "bank",
        type: "Income",
        color: "#7BC29A"
      },
      {
        name: "الطعام",
        icon: "shopping-basket",
        type: "Expense",
        color: "#FF9999"
      },
      {
        name: "السيارة",
        icon: "car",
        type: "Expense",
        color: "#5B9BD5"
      },
      {
        name: "الترفيه",
        icon: "glass-martini-alt",
        type: "Expense",
        color: "#E9B97A"
      },
      {
        name: "مطعم",
        icon: "utensils",
        type: "Expense",
        color: "#A5D6A7"
      },
      {
        name: "تاكسي",
        icon: "taxi",
        type: "Expense",
        color: "#D6A01D"
      },
      {
        name: "الحيوانات",
        icon: "paw",
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