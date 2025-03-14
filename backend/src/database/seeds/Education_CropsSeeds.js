const { Education_Crop } = require("../assossiation");

async function seedEducationCrops() {
  const educationCrops = [
    {
      id: 1,
      name: 'القمح',
      icon: '🌾',
      category: 'الحبوب والأرز',
      videoUrl: 'crop_1',
      quizId: 1,
    },
    {
      id: 2,
      name: 'الأرز',
      icon: '🌾',
      category: 'الحبوب والأرز',
      videoUrl: 'crop_2',
      quizId: 2,
    },
    {
      id: 3,
      name: 'الذرة',
      icon: '🌽',
      category: 'الحبوب والأرز',
      videoUrl: 'crop_3',
      quizId: 3,
    },
    {
      id: 4,
      name: 'الشعير',
      icon: '🌾',
      category: 'الحبوب والأرز',
      videoUrl: 'crop_4',
      quizId: 4,
    },
    {
      id: 5,
      name: 'الطماطم',
      icon: '🍅',
      category: 'الخضروات',
      videoUrl: 'crop_5',
      quizId: 5,
    },
    {
      id: 6,
      name: 'البطاطس',
      icon: '🥔',
      category: 'الخضروات',
      videoUrl: 'crop_6',
      quizId: 6,
    },
    {
      id: 7,
      name: 'الباذنجان',
      icon: '🍆',
      category: 'الخضروات',
      videoUrl: 'crop_7',
      quizId: 7,
    },
    {
      id: 8,
      name: 'الخيار',
      icon: '🥒',
      category: 'الخضروات',
      videoUrl: 'crop_8',
      quizId: 8,
    },
    {
      id: 9,
      name: 'الجزر',
      icon: '🥕',
      category: 'الخضروات',
      videoUrl: 'crop_9',
      quizId: 9,
    },
    {
      id: 10,
      name: 'البصل',
      icon: '🧅',
      category: 'الخضروات',
      videoUrl: 'crop_10',
      quizId: 10,
    },
    {
      id: 11,
      name: 'الثوم',
      icon: '🧄',
      category: 'الخضروات',
      videoUrl: 'crop_11',
      quizId: 11,
    },
    {
      id: 12,
      name: 'الفلفل',
      icon: '🫑',
      category: 'الخضروات',
      videoUrl: 'crop_12',
      quizId: 12,
    },
    {
      id: 13,
      name: 'البامية',
      icon: '🥬',
      category: 'الخضروات',
      videoUrl: 'crop_13',
      quizId: 13,
    },
    {
      id: 14,
      name: 'الكوسة',
      icon: '🥬',
      category: 'الخضروات',
      videoUrl: 'crop_14',
      quizId: 14,
    },
    {
      id: 15,
      name: 'الملفوف',
      icon: '🥬',
      category: 'الخضروات',
      videoUrl: 'crop_15',
      quizId: 15,
    },
    {
      id: 16,
      name: 'الفول',
      icon: '🫘',
      category: 'البقوليات',
      videoUrl: 'crop_16',
      quizId: 16,
    },
    {
      id: 17,
      name: 'العدس',
      icon: '🫘',
      category: 'البقوليات',
      videoUrl: 'crop_17',
      quizId: 17,
    },
    {
      id: 18,
      name: 'الحمص',
      icon: '🫘',
      category: 'البقوليات',
      videoUrl: 'crop_18',
      quizId: 18,
    },
    {
      id: 19,
      name: 'الفاصوليا',
      icon: '🫘',
      category: 'البقوليات',
      videoUrl: 'crop_19',
      quizId: 19,
    },
    {
      id: 20,
      name: 'البرتقال',
      icon: '🍊',
      category: 'الفواكه',
      videoUrl: 'crop_20',
      quizId: 20,
    },
    {
      id: 21,
      name: 'الليمون',
      icon: '🍋',
      category: 'الفواكه',
      videoUrl: 'crop_21',
      quizId: 21,
    },
    {
      id: 22,
      name: 'العنب',
      icon: '🍇',
      category: 'الفواكه',
      videoUrl: 'crop_22',
      quizId: 22,
    },
    {
      id: 23,
      name: 'التفاح',
      icon: '🍎',
      category: 'الفواكه',
      videoUrl: 'crop_23',
      quizId: 23,
    },
    {
      id: 24,
      name: 'المانجو',
      icon: '🥭',
      category: 'الفواكه',
      videoUrl: 'crop_24',
      quizId: 24,
    },
    {
      id: 25,
      name: 'الموز',
      icon: '🍌',
      category: 'الفواكه',
      videoUrl: 'crop_25',
      quizId: 25,
    },
    {
      id: 26,
      name: 'التين',
      icon: '🫐',
      category: 'الفواكه',
      videoUrl: 'crop_26',
      quizId: 26,
    },
    {
      id: 27,
      name: 'الرمان',
      icon: '🍎',
      category: 'الفواكه',
      videoUrl: 'crop_27',
      quizId: 27,
    },
    {
      id: 28,
      name: 'المشمش',
      icon: '🍑',
      category: 'الفواكه',
      videoUrl: 'crop_28',
      quizId: 28,
    },
    {
      id: 29,
      name: 'الخوخ',
      icon: '🍑',
      category: 'الفواكه',
      videoUrl: 'crop_29',
      quizId: 29,
    },
    {
      id: 30,
      name: 'عباد الشمس',
      icon: '🌻',
      category: 'المحاصيل الزيتية',
      videoUrl: 'crop_30',
      quizId: 30,
    },
    {
      id: 31,
      name: 'الزيتون',
      icon: '🫒',
      category: 'المحاصيل الزيتية',
      videoUrl: 'crop_31',
      quizId: 31,
    }
  ];

  await Education_Crop.bulkCreate(educationCrops);
}

module.exports = seedEducationCrops;
