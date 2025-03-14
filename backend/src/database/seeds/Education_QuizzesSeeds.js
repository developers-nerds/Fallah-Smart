const { Education_Quiz } = require("../assossiation");

async function seedEducationQuizzes() {
  const educationQuizzes = [
    // Animal quizzes
    {
      id: 1,
      title: "اختبار تربية الأبقار",
      description: "اختبر معرفتك حول تربية وإدارة الأبقار",
      type: "animal"
    },
    {
      id: 2,
      title: "اختبار تربية الأغنام",
      description: "اختبر معرفتك حول تربية وإدارة الأغنام",
      type: "animal"
    },
    {
      id: 3,
      title: "اختبار تربية الماعز",
      description: "اختبر معرفتك حول تربية وإدارة الماعز",
      type: "animal"
    },
    {
      id: 4,
      title: "اختبار تربية الدجاج",
      description: "اختبر معرفتك حول تربية وإدارة الدجاج",
      type: "animal"
    },
    {
      id: 5,
      title: "اختبار تربية الديك الرومي",
      description: "اختبر معرفتك حول تربية وإدارة الديك الرومي",
      type: "animal"
    },
    {
      id: 6,
      title: "اختبار تربية الأرانب",
      description: "اختبر معرفتك حول تربية وإدارة الأرانب",
      type: "animal"
    },
    {
      id: 7,
      title: "اختبار تربية الحمام",
      description: "اختبر معرفتك حول تربية وإدارة الحمام",
      type: "animal"
    },
    
    // Crop quizzes
    {
      id: 8,
      title: "اختبار زراعة القمح",
      description: "اختبر معرفتك حول زراعة وإدارة القمح",
      type: "crop"
    },
    {
      id: 9,
      title: "اختبار زراعة الأرز",
      description: "اختبر معرفتك حول زراعة وإدارة الأرز",
      type: "crop"
    },
    {
      id: 10,
      title: "اختبار زراعة الذرة",
      description: "اختبر معرفتك حول زراعة وإدارة الذرة",
      type: "crop"
    },
    {
      id: 11,
      title: "اختبار زراعة الشعير",
      description: "اختبر معرفتك حول زراعة وإدارة الشعير",
      type: "crop"
    },
    {
      id: 12,
      title: "اختبار زراعة الطماطم",
      description: "اختبر معرفتك حول زراعة وإدارة الطماطم",
      type: "crop"
    },
    {
      id: 13,
      title: "اختبار زراعة البطاطس",
      description: "اختبر معرفتك حول زراعة وإدارة البطاطس",
      type: "crop"
    },
    {
      id: 14,
      title: "اختبار زراعة الباذنجان",
      description: "اختبر معرفتك حول زراعة وإدارة الباذنجان",
      type: "crop"
    },
    {
      id: 15,
      title: "اختبار زراعة الخيار",
      description: "اختبر معرفتك حول زراعة وإدارة الخيار",
      type: "crop"
    },
    {
      id: 16,
      title: "اختبار زراعة الجزر",
      description: "اختبر معرفتك حول زراعة وإدارة الجزر",
      type: "crop"
    },
    {
      id: 17,
      title: "اختبار زراعة البصل",
      description: "اختبر معرفتك حول زراعة وإدارة البصل",
      type: "crop"
    },
    {
      id: 18,
      title: "اختبار زراعة الثوم",
      description: "اختبر معرفتك حول زراعة وإدارة الثوم",
      type: "crop"
    },
    {
      id: 19,
      title: "اختبار زراعة الفلفل",
      description: "اختبر معرفتك حول زراعة وإدارة الفلفل",
      type: "crop"
    },
    {
      id: 20,
      title: "اختبار زراعة البامية",
      description: "اختبر معرفتك حول زراعة وإدارة البامية",
      type: "crop"
    },
    {
      id: 21,
      title: "اختبار زراعة الكوسة",
      description: "اختبر معرفتك حول زراعة وإدارة الكوسة",
      type: "crop"
    },
    {
      id: 22,
      title: "اختبار زراعة الملفوف",
      description: "اختبر معرفتك حول زراعة وإدارة الملفوف",
      type: "crop"
    },
    {
      id: 23,
      title: "اختبار زراعة الفول",
      description: "اختبر معرفتك حول زراعة وإدارة الفول",
      type: "crop"
    },
    {
      id: 24,
      title: "اختبار زراعة العدس",
      description: "اختبر معرفتك حول زراعة وإدارة العدس",
      type: "crop"
    },
    {
      id: 25,
      title: "اختبار زراعة الحمص",
      description: "اختبر معرفتك حول زراعة وإدارة الحمص",
      type: "crop"
    },
    {
      id: 26,
      title: "اختبار زراعة الفاصوليا",
      description: "اختبر معرفتك حول زراعة وإدارة الفاصوليا",
      type: "crop"
    },
    {
      id: 27,
      title: "اختبار زراعة البرتقال",
      description: "اختبر معرفتك حول زراعة وإدارة البرتقال",
      type: "crop"
    },
    {
      id: 28,
      title: "اختبار زراعة الليمون",
      description: "اختبر معرفتك حول زراعة وإدارة الليمون",
      type: "crop"
    },
    {
      id: 29,
      title: "اختبار زراعة العنب",
      description: "اختبر معرفتك حول زراعة وإدارة العنب",
      type: "crop"
    },
    {
      id: 30,
      title: "اختبار زراعة التفاح",
      description: "اختبر معرفتك حول زراعة وإدارة التفاح",
      type: "crop"
    },
    {
      id: 31,
      title: "اختبار زراعة المانجو",
      description: "اختبر معرفتك حول زراعة وإدارة المانجو",
      type: "crop"
    },
    {
      id: 32,
      title: "اختبار زراعة الموز",
      description: "اختبر معرفتك حول زراعة وإدارة الموز",
      type: "crop"
    },
    {
      id: 33,
      title: "اختبار زراعة التين",
      description: "اختبر معرفتك حول زراعة وإدارة التين",
      type: "crop"
    },
    {
      id: 34,
      title: "اختبار زراعة الرمان",
      description: "اختبر معرفتك حول زراعة وإدارة الرمان",
      type: "crop"
    },
    {
      id: 35,
      title: "اختبار زراعة المشمش",
      description: "اختبر معرفتك حول زراعة وإدارة المشمش",
      type: "crop"
    },
    {
      id: 36,
      title: "اختبار زراعة الخوخ",
      description: "اختبر معرفتك حول زراعة وإدارة الخوخ",
      type: "crop"
    },
    {
      id: 37,
      title: "اختبار زراعة عباد الشمس",
      description: "اختبر معرفتك حول زراعة وإدارة عباد الشمس",
      type: "crop"
    },
    {
      id: 38,
      title: "اختبار زراعة الزيتون",
      description: "اختبر معرفتك حول زراعة وإدارة الزيتون",
      type: "crop"
    }
  ];

  await Education_Quiz.bulkCreate(educationQuizzes);
}

module.exports = seedEducationQuizzes;
