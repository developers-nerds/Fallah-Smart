const { Animal_doc } = require("../assossiation");

async function seedAnimalDocs() {
  const animalsData = [
    {
      name: "Cow",
      icon: "🐄",
      category: "Livestock",
    },
    {
      name: "Pig",
      icon: "🐖",
      category: "Livestock",
    },
    {
      name: "Sheep",
      icon: "🐑",
      category: "Livestock",
    },
    {
      name: "Goat",
      icon: "🐐",
      category: "Livestock",
    },
    {
      name: "Horse",
      icon: "🐎",
      category: "Livestock",
    },
    {
      name: "Donkey",
      icon: "🐴",
      category: "Livestock",
    },
    {
      name: "Chicken",
      icon: "🐔",
      category: "Poultry",
    },
    {
      name: "Duck",
      icon: "🦆",
      category: "Poultry",
    },
    {
      name: "Turkey",
      icon: "🦃",
      category: "Poultry",
    },
    {
      name: "Goose",
      icon: "🦢",
      category: "Poultry",
    },
    {
      name: "Quail",
      icon: "🐦",
      category: "Poultry",
    },
    {
      name: "Rabbit",
      icon: "🐇",
      category: "Small Animals",
    },
    {
      name: "Guinea Pig",
      icon: "🐹",
      category: "Small Animals",
    },
    {
      name: "Alpaca",
      icon: "🦙",
      category: "Livestock",
    },
    {
      name: "Llama",
      icon: "🦙",
      category: "Livestock",
    },
    {
      name: "Buffalo",
      icon: "🐃",
      category: "Livestock",
    },
    {
      name: "Yak",
      icon: "🐂",
      category: "Livestock",
    },
    {
      name: "Reindeer",
      icon: "🦌",
      category: "Livestock",
    },
    {
      name: "Emu",
      icon: "🐦",
      category: "Poultry",
    },
    {
      name: "Ostrich",
      icon: "🦘",
      category: "Poultry",
    },
    {
      name: "Peacock",
      icon: "🦚",
      category: "Poultry",
    },
    {
      name: "Pigeon",
      icon: "🐦",
      category: "Poultry",
    },
    {
      name: "Bee",
      icon: "🐝",
      category: "Insects",
    },
    {
      name: "Silkworm",
      icon: "🐛",
      category: "Insects",
    },
    {
      name: "Fish (Tilapia)",
      icon: "🐟",
      category: "Aquaculture",
    },
    {
      name: "Fish (Catfish)",
      icon: "🐟",
      category: "Aquaculture",
    },
    {
      name: "Fish (Salmon)",
      icon: "🐟",
      category: "Aquaculture",
    },
    {
      name: "Shrimp",
      icon: "🦐",
      category: "Aquaculture",
    },
    {
      name: "Crab",
      icon: "🦀",
      category: "Aquaculture",
    },
    {
      name: "Snail",
      icon: "🐌",
      category: "Small Animals",
    },
    {
      name: "Frog",
      icon: "🐸",
      category: "Small Animals",
    },
    {
      name: "Deer",
      icon: "🦌",
      category: "Livestock",
    },
    {
      name: "Mule",
      icon: "🐴",
      category: "Livestock",
    },
    {
      name: "Ox",
      icon: "🐂",
      category: "Livestock",
    },
    {
      name: "Zebu",
      icon: "🐂",
      category: "Livestock",
    },
    {
      name: "Banteng",
      icon: "🐂",
      category: "Livestock",
    },
    {
      name: "Water Buffalo",
      icon: "🐃",
      category: "Livestock",
    },
    {
      name: "Pheasant",
      icon: "🐦",
      category: "Poultry",
    },
    {
      name: "Partridge",
      icon: "🐦",
      category: "Poultry",
    },
    {
      name: "Guinea Fowl",
      icon: "🐦",
      category: "Poultry",
    },
    {
      name: "Swan",
      icon: "🦢",
      category: "Poultry",
    },
    {
      name: "Camel",
      icon: "🐪",
      category: "Livestock",
    },
    {
      name: "Bactrian Camel",
      icon: "🐫",
      category: "Livestock",
    },
  ];
  try {
    Animal_doc.bulkCreate(animalsData);
  } catch (error) {
    console.error("❌ Error seeding animal documents:", error);
    throw error;
  }
}

module.exports = seedAnimalDocs;
