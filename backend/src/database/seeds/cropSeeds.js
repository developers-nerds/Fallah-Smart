const { Crop } = require("../assossiation");

async function seedCrops() {
  const popularCropsEnglish = [
    {
      name: 'القمح',
      icon: '🌾',
      category: 'الحبوب والأرز',
    },
    {
      name: 'الأرز',
      icon: '🌾',
      category: 'الحبوب والأرز',
    },
    {
      name: 'الذرة',
      icon: '🌽',
      category: 'الحبوب والأرز',
    },
    {
      name: 'الشعير',
      icon: '🌾',
      category: 'الحبوب والأرز',
    },
    {
      name: 'الطماطم',
      icon: '🍅',
      category: 'الخضروات',
    },
    {
      name: 'البطاطس',
      icon: '🥔',
      category: 'الخضروات',
    },
    {
      name: 'الباذنجان',
      icon: '🍆',
      category: 'الخضروات',
    },
    {
      name: 'الخيار',
      icon: '🥒',
      category: 'الخضروات',
    },
    {
      name: 'الجزر',
      icon: '🥕',
      category: 'الخضروات',
    },
    {
      name: 'البصل',
      icon: '🧅',
      category: 'الخضروات',
    },
    {
      name: 'الثوم',
      icon: '🧄',
      category: 'الخضروات',
    },
    {
      name: 'الفلفل',
      icon: '🫑',
      category: 'الخضروات',
    },
    {
      name: 'البامية',
      icon: '🥬',
      category: 'الخضروات',
    },
    {
      name: 'الكوسة',
      icon: '🥬',
      category: 'الخضروات',
    },
    {
      name: 'الملفوف',
      icon: '🥬',
      category: 'الخضروات',
    },
    {
      name: 'الفول',
      icon: '🫘',
      category: 'البقوليات',
    },
    {
      name: 'العدس',
      icon: '🫘',
      category: 'البقوليات',
    },
    {
      name: 'الحمص',
      icon: '🫘',
      category: 'البقوليات',
    },
    {
      name: 'الفاصوليا',
      icon: '🫘',
      category: 'البقوليات',
    },
    {
      name: 'البرتقال',
      icon: '🍊',
      category: 'الفواكه ',
    },
    {
      name: 'الليمون',
      icon: '🍋',
      category: 'الفواكه',
    },
    {
      name: 'العنب',
      icon: '🍇',
      category: 'الفواكه',
    },
    {
      name: 'التفاح',
      icon: '🍎',
      category: 'الفواكه',
    },
    {
      name: 'المانجو',
      icon: '🥭',
      category: 'الفواكه',
    },
    {
      name: 'الموز',
      icon: '🍌',
      category: 'الفواكه',
    },
    {
      name: 'التين',
      icon: '🫐',
      category: 'الفواكه',
    },
    {
      name: 'الرمان',
      icon: '🍎',
      category: 'الفواكه',
    },
    {
      name: 'المشمش',
      icon: '🍑',
      category: 'الفواكه',
    },
    {
      name: 'الخوخ',
      icon: '🍑',
      category: 'الفواكه',
    },
    {
      name: 'عباد الشمس',
      icon: '🌻',
      category: 'المحاصيل الزيتية',
    },
    {
      name: 'الزيتون',
      icon: '🫒',
      category: 'المحاصيل الزيتية',
    },
    {
      name: 'السمسم',
      icon: '🌱',
      category: 'المحاصيل الزيتية',
    },
    {
      name: 'البنجر',
      icon: '🥬',
      category: ' محاصيل أخرى',
    },
    {
      name: 'قصب السكر',
      icon: '🎋',
      category: ' محاصيل أخرى',
    },
    {
      name: 'البطاطا الحلوة',
      icon: '🥔',
      category: ' محاصيل أخرى',
    },
    {
      name: 'النعناع',
      icon: '🌿',
      category: ' الأعشاب والتوابل ',
    },
    {
      name: 'الريحان',
      icon: '🌿',
      category: ' الأعشاب والتوابل',
    },
    {
      name: 'الكزبرة',
      icon: '🌿',
      category: 'الأعشاب والتوابل ',
    },
    {
      name: 'الشبت',
      icon: '🌿',
      category: ' الأعشاب والتوابل',
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
