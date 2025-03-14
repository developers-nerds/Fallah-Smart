const { Education_AdditionalVideo } = require("../assossiation");

async function seedEducationAdditionalVideos() {
  const educationAdditionalVideos = [
    // Animal 1 (Cows) additional videos
    {
      id: 1,
      title: 'تغذية الأبقار',
      youtubeId: 'xZYjCZF5EdU',
      videoId: 1,
    },
    {
      id: 2,
      title: 'الرعاية الصحية للأبقار',
      youtubeId: 'f1yhB1_hjIA',
      videoId: 1,
    },

    // Animal 2 (Sheep) additional videos
    {
      id: 3,
      title: 'الطريقة الصحيحة لمشروع تسمين وتربية الاغنام',
      youtubeId: 'tFog0M9F7uU',
      videoId: 2,
    },
    {
      id: 4,
      title: 'كمية العلف اللي تأكلها الاغنام في اليوم',
      youtubeId: '2qLN2hs50Js',
      videoId: 2,
    },

    // Animal 3 (Goats) additional videos
    {
      id: 5,
      title: 'أحسن طريقة لتغدية الماعز الحامل',
      youtubeId: '2lGIqw7UwOs',
      videoId: 3,
    },
    {
      id: 6,
      title: 'تربية و تسمين الماعز',
      youtubeId: 'qYUO5hmFNPw',
      videoId: 3,
    },

    // Animal 4 (Chickens) additional videos
    {
      id: 7,
      title: 'العناية صحية دجاج',
      youtubeId: 'ZU71Ph7x3nw',
      videoId: 4,
    },

    // Animal 5 (Turkeys) additional videos
    {
      id: 8,
      title: 'رعاية صحية لتربية الديك الرومي',
      youtubeId: 'rSiM4aR4J2Y',
      videoId: 5,
    },
    {
      id: 9,
      title: 'تغذية الديك الرومي',
      youtubeId: 'gJkTROAjeIk',
      videoId: 5,
    },

    // Animal 6 (Rabbits) additional videos
    {
      id: 10,
      title: 'أهم الأطعمة التي تتناولها الأرانب',
      youtubeId: 'WcGQ_F8vkUI',
      videoId: 6,
    },
    {
      id: 11,
      title: 'كيفية تربية الأرانب للمبتدئين',
      youtubeId: '0C3RxquOh4U',
      videoId: 6,
    },

    // Animal 7 (Pigeons) additional videos
    {
      id: 12,
      title: 'تغذية الحمام',
      youtubeId: 'bUzhzkB-afA',
      videoId: 7,
    },
    {
      id: 13,
      title: 'رعاية صحية',
      youtubeId: 'V6oBk19uLfA',
      videoId: 7,
    },

    // Crop 1 (Wheat) additional videos
    {
      id: 14,
      title: 'أسرار نجاح محصول القمح',
      youtubeId: 'RtDqKK1ENCU',
      videoId: 8,
    },
    {
      id: 15,
      title: 'زراعة القمح',
      youtubeId: 'lHgzdBq9eoY',
      videoId: 8,
    },

    // Crop 2 (Rice) additional videos
    {
      id: 16,
      title: 'كيفية زراعة الأرز',
      youtubeId: '-ajruOGRPL4',
      videoId: 9,
    },
    {
      id: 17,
      title: 'برنامج تسميد الأرز',
      youtubeId: 'DR_rG6t-spo',
      videoId: 9,
    },

    // Crop 3 (Corn) additional videos
    {
      id: 18,
      title: 'تعرف على اسرار تسميد الذره',
      youtubeId: 'Gv1qh38yVe0',
      videoId: 10,
    },
    {
      id: 19,
      title: 'معلومات عن الذره',
      youtubeId: '_TGLl0AwKTI',
      videoId: 10,
    },

    // Crop 4 (Barley) additional videos
    {
      id: 20,
      title: 'كلام مهم في تسميد الشعير لزيادة الإنتاجية',
      youtubeId: 'xO8COx1WkrQ',
      videoId: 11,
    },
    {
      id: 21,
      title: 'مواعيد زراعة الشعير',
      youtubeId: '9dU00IQGLGk',
      videoId: 11,
    },

    // Crop 5 (Tomatoes) additional videos
    {
      id: 22,
      title: 'برنامج تسميد الطماطم',
      youtubeId: 'LX3FoFMzQv8',
      videoId: 12,
    },
    {
      id: 23,
      title: 'فوائد الطماطم للجسم',
      youtubeId: 'V1dSVwfFeaA',
      videoId: 12,
    },

    // Crop 6 (Potatoes) additional videos
    {
      id: 24,
      title: 'برنامج تسميد البطاطس',
      youtubeId: 'N7jbAV71zpg',
      videoId: 13,
    },
    {
      id: 25,
      title: 'أحسن توقيت لزراعة البطاطا',
      youtubeId: 'QWhZIBu7kDE',
      videoId: 13,
    },
    {
      id: 26,
      title: 'كيفية زراعة البطاطا',
      youtubeId: 'pSI9Am-fMHY',
      videoId: 13,
    },
    {
      id: 27,
      title: 'مدة وأفضل أوقات ري محصول البطاطس',
      youtubeId: '7Hsuhd3fRDI',
      videoId: 13,
    },

    // Continue with similar pattern for other crops...
    // Crop 7 (Eggplant) additional videos
    {
      id: 28,
      title: 'مواعيد زراعة الباذنجان',
      youtubeId: 'IeNX3RRwowU',
      videoId: 14,
    },
    {
      id: 29,
      title: 'برنامج تسميد للباذنجان ',
      youtubeId: 'D-QSOhgtF_4',
      videoId: 14,
    },

    // Crop 8 (Cucumber) additional videos
    {
      id: 30,
      title: 'برنامج تسميد الخيار',
      youtubeId: 'aAS2fty3LX8',
      videoId: 15,
    },

    // Crop 9 (Carrot) additional videos
    {
      id: 31,
      title: 'زراعة الجزر',
      youtubeId: '6g1zqA8u_o0',
      videoId: 16,
    },
    {
      id: 32,
      title: 'فوائد الجزر على جسم الإنسان',
      youtubeId: 'VF5z7Isks7s',
      videoId: 16,
    },

    // Crop 10 (Onion) additional videos
    {
      id: 33,
      title: 'برنامج تسميد بصل',
      youtubeId: 'wD9ExySPuxA',
      videoId: 17,
    },
    {
      id: 34,
      title: 'معلومات صحية مفيدة حول فوائد البصل الاخضر',
      youtubeId: 'Y09n_aj9EiE',
      videoId: 17,
    },

    // Crop 11 (Garlic) additional videos
    {
      id: 35,
      title: 'معلومات صحية مفيدة حول فوائد الثوم',
      youtubeId: 'mNCK2X5goZc',
      videoId: 18,
    },
    {
      id: 36,
      title: 'برنامج تسميد الثوم',
      youtubeId: 'ohhkGvMq9Gw',
      videoId: 18,
    },

    // Crop 12 (Pepper) additional videos
    {
      id: 37,
      title: 'برنامج تسميد الفلفل',
      youtubeId: 'OV5Wam56Rys',
      videoId: 19,
    },

    // Crop 13 (Okra) additional videos
    {
      id: 38,
      title: 'افضل طريقة لزراعة البامية',
      youtubeId: '3mEXySbeC_Q',
      videoId: 20,
    },

    // Crop 14 (Zucchini) additional videos
    {
      id: 39,
      title: 'برنامج تسميد الكوسة',
      youtubeId: 'KUSwzxGtzAA',
      videoId: 21,
    },

    // Crop 16 (Fava Beans) additional videos
    {
      id: 40,
      title: 'برنامج تسميد الفول',
      youtubeId: 'd4rqJOD2aHU',
      videoId: 23,
    },

    // Crop 17 (Lentils) additional videos
    {
      id: 41,
      title: 'مواعيد زراعة العدس',
      youtubeId: 'ewGZiMnf_nY',
      videoId: 24,
    },

    // Crop 18 (Chickpeas) additional videos
    {
      id: 42,
      title: 'مواعيد زراعة الحمص',
      youtubeId: 'OLGd3jT4KXE',
      videoId: 25,
    },

    // Crop 20 (Orange) additional videos
    {
      id: 43,
      title: 'كيفية زراعة شجرة البرتقال',
      youtubeId: 'AOrcj2a4cpY',
      videoId: 27,
    },
    {
      id: 44,
      title: 'تسميد شجيرات البرتقال',
      youtubeId: '6s8kUJ3ODa4',
      videoId: 27,
    },

    // Crop 21 (Lemon) additional videos
    {
      id: 45,
      title: 'كيفية زراعة الليمون',
      youtubeId: 'ygW3Vt6GRpo',
      videoId: 28,
    },

    // Crop 22 (Grapes) additional videos
    {
      id: 46,
      title: 'برنامج تسميد العنب',
      youtubeId: 'XT4IlANxt-w',
      videoId: 29,
    },

    // Crop 23 (Apple) additional videos
    {
      id: 47,
      title: 'برنامج تسميد التفاح',
      youtubeId: 'a7ZoTqwYO8c',
      videoId: 30,
    },

    // Crop 25 (Banana) additional videos
    {
      id: 48,
      title: 'نصائح مهمه بالعناية ب اشجار الموز وثمارها',
      youtubeId: 'OZSK3FDHRMI',
      videoId: 32,
    },

    // Crop 26 (Fig) additional videos
    {
      id: 49,
      title: 'تعلم طريقة زراعة التين',
      youtubeId: 'i8svQ4dSD5Q',
      videoId: 33,
    },

    // Crop 27 (Pomegranate) additional videos
    {
      id: 50,
      title: 'نصائح مهمه بالعناية ب اشجار الرمان وثمارها',
      youtubeId: 'g809YSDNfl4',
      videoId: 34,
    },

    // Crop 28 (Apricot) additional videos
    {
      id: 51,
      title: 'نصائح مهمه بالعناية ب اشجار المشمش وثمارها',
      youtubeId: 'H3oWQYEp35E',
      videoId: 35,
    },

    // Crop 29 (Peach) additional videos
    {
      id: 52,
      title: 'كيفية العناية الخوخ',
      youtubeId: 'YGva0_x4P0o',
      videoId: 36,
    },

    // Crop 30 (Sunflower) additional videos
    {
      id: 53,
      title: 'نصائح زراعية',
      youtubeId: 'WWFqzjcq4I0',
      videoId: 37,
    },

    // Crop 31 (Olive) additional videos
    {
      id: 54,
      title: 'كيفية العناية بشجرة زيتون',
      youtubeId: 'b4h_jyWjKNQ',
      videoId: 38,
    },
    {
      id: 55,
      title: 'كم من مرة نسقي زيتون',
      youtubeId: '89YGYBjYsr4',
      videoId: 38,
    },
    {
      id: 56,
      title: 'نوعية الأسمدة لي شجرة زيتون',
      youtubeId: 'gu_d8tJtmlg',
      videoId: 38,
    }
  ];

  await Education_AdditionalVideo.bulkCreate(educationAdditionalVideos);
}

module.exports = seedEducationAdditionalVideos;
