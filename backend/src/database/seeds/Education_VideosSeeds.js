const { Education_Video } = require("../assossiation");

async function seedEducationVideos() {
  const educationVideos = [
    // Animal videos
    {
      id: 1,
      title: 'تربية الأبقار الحديثة',
      category: 'ماشية',
      youtubeId: 'QKRoup18Fgw',
      type: 'animal',
    },
    {
      id: 2,
      title: 'كيف أبدأ مشروع تربية الأغنام',
      category: 'ماشية',
      youtubeId: 'fwnd8G6QzrA',
      type: 'animal',
    },
    {
      id: 3,
      title: 'مشروع تربية الماعز',
      category: 'ماشية',
      youtubeId: 'sNaX0vW49eM',
      type: 'animal',
    },
    {
      id: 4,
      title: 'تربية الدجاج',
      category: 'دواجن',
      youtubeId: 'zxyCIe_aHtA',
      type: 'animal',
    },
    {
      id: 5,
      title: 'تربية الديك الرومي',
      category: 'دواجن',
      youtubeId: 'v7--lm62-6k',
      type: 'animal',
    },
    {
      id: 6,
      title: 'تربية الأرانب',
      category: 'حيوانات صغيرة',
      youtubeId: '4LXPTxD8RfU',
      type: 'animal',
    },
    {
      id: 7,
      title: 'تربية الحمام',
      category: 'طيور',
      youtubeId: '_gKrB826spA',
      type: 'animal',
    },

    // Crop videos
    {
      id: 8,
      title: 'برنامج تسميد القمح',
      category: 'الحبوب والأرز',
      youtubeId: 's_fIQIdJUAc',
      type: 'crop',
    },
    {
      id: 9,
      title: 'الإبتكاراالعلمي والإبداع في زراعة الأرز',
      category: 'الحبوب والأرز',
      youtubeId: '6bzTBBiCa1g',
      type: 'crop',
    },
    {
      id: 10,
      title: 'افضل طريقة لزراعة الذرة',
      category: 'الحبوب والأرز',
      youtubeId: 'S3OyZZM7akk',
      type: 'crop',
    },
    {
      id: 11,
      title: 'زراعة الشعير',
      category: 'الحبوب والأرز',
      youtubeId: 'BbtrmUdkd28',
      type: 'crop',
    },
    {
      id: 12,
      title: 'مواعيد زراعة الطماطم',
      category: 'الخضروات',
      youtubeId: 'HOOVGXZcqVg',
      type: 'crop',
    },
    {
      id: 13,
      title: 'معلومات عن زراعة البطاطس',
      category: 'الخضروات',
      youtubeId: '1Y00p8gMQRg',
      type: 'crop',
    },
    {
      id: 14,
      title: 'زراعة الباذنجان',
      category: 'الخضروات',
      youtubeId: 'C2w0hX74grM',
      type: 'crop',
    },
    {
      id: 15,
      title: 'اسهل طريقة لزراعة الخيار البلدي',
      category: 'الخضروات',
      youtubeId: '7kMX3emSnQA',
      type: 'crop',
    },
    {
      id: 16,
      title: 'برنامج تسميد الجزر',
      category: 'الخضروات',
      youtubeId: '-ocpBmkhBQY',
      type: 'crop',
    },
    {
      id: 17,
      title: 'افضل طريقة لزراعة بصل',
      category: 'الخضروات',
      youtubeId: '2mCO1vooaa4',
      type: 'crop',
    },
    {
      id: 18,
      title: 'افضل طريقة لزراعة الثوم',
      category: 'الخضروات',
      youtubeId: 'cbK9eu6Baj8',
      type: 'crop',
    },
    {
      id: 19,
      title: 'افضل طريقة لزراعة الفلفل',
      category: 'الخضروات',
      youtubeId: 'IC-QQ-k1IIg',
      type: 'crop',
    },
    {
      id: 20,
      title: 'برنامج تسميد البامية',
      category: 'الخضروات',
      youtubeId: 'SBhDGdOWQrI',
      type: 'crop',
    },
    {
      id: 21,
      title: 'أفضل طريقة لزراعة الكوسة',
      category: 'الخضروات',
      youtubeId: 'pEikXYnslEg',
      type: 'crop',
    },
    {
      id: 22,
      title: 'زراعة الملفوف',
      category: 'الخضروات',
      type: 'crop',
    },
    {
      id: 23,
      title: 'زراعة الفول',
      category: 'البقوليات',
      youtubeId: 'K1mqX7e9ChI',
      type: 'crop',
    },
    {
      id: 24,
      title: 'كيفية زراعة العدس',
      category: 'البقوليات',
      youtubeId: 'zQdAch0EpBg',
      type: 'crop',
    },
    {
      id: 25,
      title: 'كيف تزرع الحمص',
      category: 'البقوليات',
      youtubeId: 'GPsyDSfb-Ug',
      type: 'crop',
    },
    {
      id: 26,
      title: 'زراعة الفاصوليا',
      category: 'البقوليات',
      type: 'crop',
    },
    {
      id: 27,
      title: 'زراعة شجرة البرتقال من البذور',
      category: 'الفواكه',
      youtubeId: 'CWnz8zrJ1Bk',
      type: 'crop',
    },
    {
      id: 28,
      title: 'برنامج تسميد الليمون',
      category: 'الفواكه',
      youtubeId: 'D-flKpnUTSc',
      type: 'crop',
    },
    {
      id: 29,
      title: 'كيفية زراعة العنب',
      category: 'الفواكه',
      youtubeId: 'u3vQmsZoRm4',
      type: 'crop',
    },
    {
      id: 30,
      title: 'زراعة افضل شجرة تفاح من خلال العقل بكل سهولة',
      category: 'الفواكه',
      youtubeId: 'jQ6m9XxcYIo',
      type: 'crop',
    },
    {
      id: 31,
      title: 'كيفية زراعة المانجو',
      category: 'الفواكه',
      youtubeId: 'oaDeWdBuoe0',
      type: 'crop',
    },
    {
      id: 32,
      title: 'كيفية زراعة الموز',
      category: 'الفواكه',
      youtubeId: 'n6lUQeWNJn4',
      type: 'crop',
    },
    {
      id: 33,
      title: 'برنامج ري التين',
      category: 'الفواكه',
      youtubeId: 'JKdBEiBxLWw',
      type: 'crop',
    },
    {
      id: 34,
      title: 'أفضل طريقة لزراعة الرمان',
      category: 'الفواكه',
      youtubeId: 'SclKgxC3XZg',
      type: 'crop',
    },
    {
      id: 35,
      title: 'كيفية زراعة المشمش',
      category: 'الفواكه',
      youtubeId: 'XLCdPP56tag',
      type: 'crop',
    },
    {
      id: 36,
      title: 'كيفية زراعة الخوخ',
      category: 'الفواكه',
      youtubeId: 'GCo0xKaOeK8',
      type: 'crop',
    },
    {
      id: 37,
      title: 'كيفية زراعة عباد الشمس',
      category: 'المحاصيل الزيتية',
      youtubeId: 'QNjqFlmbHvQ',
      type: 'crop',
    },
    {
      id: 38,
      title: 'كيفية زراعة زيتون',
      category: 'المحاصيل الزيتية',
      youtubeId: 'Dd5pFBqx1uM',
      type: 'crop',
    }
  ];

  await Education_Video.bulkCreate(educationVideos);
}

module.exports = seedEducationVideos;
