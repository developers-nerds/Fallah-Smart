const { Education_Animal } = require("../assossiation");

async function seedEducationAnimals() {
  const educationAnimals = [
    {
      id: 1,
      name: 'الأبقار',
      icon: '🐄',
      category: 'ماشية',
      videoUrl: 'animal_1',
      quizId: 1,
    },
    {
      id: 2,
      name: 'الأغنام',
      icon: '🐑',
      category: 'ماشية',
      videoUrl: 'animal_2',
      quizId: 2,
    },
    {
      id: 3,
      name: 'الماعز',
      icon: '🐐',
      category: 'ماشية',
      videoUrl: 'animal_3',
      quizId: 3,
    },
    {
      id: 4,
      name: 'الدجاج',
      icon: '🐔',
      category: 'دواجن',
      videoUrl: 'animal_4',
      quizId: 4,
    },
    {
      id: 5,
      name: 'الديك الرومي',
      icon: '🦃',
      category: 'دواجن',
      videoUrl: 'animal_5',
      quizId: 5,
    },
    {
      id: 6,
      name: 'الأرانب',
      icon: '🐰',
      category: 'حيوانات صغيرة',
      videoUrl: 'animal_6',
      quizId: 6,
    },
    {
      id: 7,
      name: 'الحمام',
      icon: '🕊️',
      category: 'طيور',
      videoUrl: 'animal_7',
      quizId: 7,
    }
  ];

  await Education_Animal.bulkCreate(educationAnimals);
}

module.exports = seedEducationAnimals;
