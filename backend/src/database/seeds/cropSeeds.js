const { Crop } = require("../assossiation");

async function seedCrops() {
  const popularCropsEnglish = [
    {
      name: 'Wheat',
      icon: '🌾',
      category: 'Grains',
    },
    {
      name: 'Rice',
      icon: '🍚',
      category: 'Grains',
    },
    {
      name: 'Corn',
      icon: '🌽',
      category: 'Grains',
    },
    {
      name: 'Potato',
      icon: '🥔',
      category: 'Vegetables',
    },
    {
      name: 'Tomato',
      icon: '🍅',
      category: 'Vegetables',
    },
    {
      name: 'Carrot',
      icon: '🥕',
      category: 'Vegetables',
    },
    {
      name: 'Lettuce',
      icon: '🥬',
      category: 'Vegetables',
    },
    {
      name: 'Onion',
      icon: '🧅',
      category: 'Vegetables',
    },
    {
      name: 'Garlic',
      icon: '🧄',
      category: 'Vegetables',
    },
    {
      name: 'Cucumber',
      icon: '🥒',
      category: 'Vegetables',
    },
    {
      name: 'Pumpkin',
      icon: '🎃',
      category: 'Vegetables',
    },
    {
      name: 'Apple',
      icon: '🍎',
      category: 'Fruits',
    },
    {
      name: 'Banana',
      icon: '🍌',
      category: 'Fruits',
    },
    {
      name: 'Orange',
      icon: '🍊',
      category: 'Fruits',
    },
    {
      name: 'Strawberry',
      icon: '🍓',
      category: 'Fruits',
    },
    {
      name: 'Grapes',
      icon: '🍇',
      category: 'Fruits',
    },
    {
      name: 'Watermelon',
      icon: '🍉',
      category: 'Fruits',
    },
    {
      name: 'Mango',
      icon: '🥭',
      category: 'Fruits',
    },
    {
      name: 'Pineapple',
      icon: '🍍',
      category: 'Fruits',
    },
    {
      name: 'Coffee',
      icon: '☕',
      category: 'Beverage Crops',
    },
    {
      name: 'Tea',
      icon: '🍵',
      category: 'Beverage Crops',
    },
    {
      name: 'Sugarcane',
      icon: '🎋',
      category: 'Sugar Crops',
    },
    {
      name: 'Cotton',
      icon: '🧵',
      category: 'Fiber Crops',
    },
    {
      name: 'Sunflower',
      icon: '🌻',
      category: 'Oil Crops',
    },
    {
      name: 'Soybean',
      icon: '🫘',
      category: 'Oil Crops',
    },
    {
      name: 'Peanut',
      icon: '🥜',
      category: 'Oil Crops',
    },
    {
      name: 'Almond',
      icon: '🌰',
      category: 'Nuts',
    },
    {
      name: 'Walnut',
      icon: '🌰',
      category: 'Nuts',
    },
    {
      name: 'Chickpea',
      icon: '🫘',
      category: 'Legumes',
    },
    {
      name: 'Lentil',
      icon: '🫘',
      category: 'Legumes',
    },
    {
      name: 'Peas',
      icon: '🫛',
      category: 'Legumes',
    },
];

  try {
    Crop.bulkCreate(popularCropsEnglish);
  } catch (error) {
    console.error("❌ Error seeding crops:", error);
    throw error;
  }
}
module.exports = seedCrops;
