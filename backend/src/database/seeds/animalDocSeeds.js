const { Animal_doc } = require("../assossiation");

async function seedAnimalDocs() {
  const animalsData = [
    {
      name: "الأبقار",
      icon: "🐄",
      category: "ماشية",
    },
    {
      name: "الأغنام",
      icon: "🐑",
      category: "ماشية",
    },
    {
      name: "الماعز",
      icon: "🐐",
      category: "ماشية",
    },
    {
      name: "الديك الرومي",
      icon: "🦃",
      category: "دواجن",
    },
    {
      name: "الدجاج",
      icon: "🐔",
      category: "دواجن",
    },
    {
      name: "الأرانب",
      icon: "🐰",
      category: "حيوانات صغيرة",
    },
    {
      name: "الحمام",
      icon: "🕊️",
      category: "طيور",
    },
    
  ];
  try {
    await Animal_doc.bulkCreate(animalsData);  // Added 'await' here
    console.log("✅ Animal docs seeded successfully");  // Added success message
  } catch (error) {
    console.error("❌ Error seeding animal documents:", error);
    throw error;
  }
}

module.exports = seedAnimalDocs;
