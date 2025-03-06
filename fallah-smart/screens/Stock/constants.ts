import { AnimalType, CropType, PesticideCategory } from './types';

// Animal Types from animalDocSeeds.js
export const ANIMAL_TYPES: AnimalType[] = [
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

// Crop Types from cropSeeds.js
export const CROP_TYPES: CropType[] = [
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
    category: 'الفواكه',
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
    category: 'محاصيل أخرى',
  },
  {
    name: 'قصب السكر',
    icon: '🎋',
    category: 'محاصيل أخرى',
  },
  {
    name: 'البطاطا الحلوة',
    icon: '🥔',
    category: 'محاصيل أخرى',
  },
  {
    name: 'النعناع',
    icon: '🌿',
    category: 'الأعشاب والتوابل',
  },
  {
    name: 'الريحان',
    icon: '🌿',
    category: 'الأعشاب والتوابل',
  },
  {
    name: 'الكزبرة',
    icon: '🌿',
    category: 'الأعشاب والتوابل',
  },
  {
    name: 'الشبت',
    icon: '🌿',
    category: 'الأعشاب والتوابل',
  },
];

// Pesticide Categories
export const PESTICIDE_CATEGORIES: PesticideCategory[] = [
  'مبيدات حشرية',
  'مبيدات أعشاب',
  'مبيدات فطرية',
  'أخرى'
];

// Stock Categories
export const STOCK_CATEGORIES = {
  animals: 'الحيوانات',
  crops: 'المحاصيل',
  pesticides: 'المبيدات',
  fertilizer: 'الأسمدة',
  equipment: 'المعدات',
  other: 'أخرى'
};

// Stock Item Types
export const STOCK_ITEM_TYPES = {
  animal: 'حيوان',
  crop: 'محصول',
  pesticide: 'مبيد',
  fertilizer: 'سماد',
  equipment: 'معدة',
  other: 'أخرى'
};

// Health Status Options
export const HEALTH_STATUS_OPTIONS = {
  healthy: 'صحي',
  sick: 'مريض',
  quarantine: 'في الحجر الصحي'
};

// Growth Stage Options
export const GROWTH_STAGE_OPTIONS = {
  seeds: 'بذور',
  seedlings: 'شتلات',
  growing: 'نمو',
  mature: 'نضج',
  harvest: 'حصاد'
};

// Equipment Condition Options
export const EQUIPMENT_CONDITION_OPTIONS = {
  new: 'جديد',
  good: 'جيد',
  fair: 'متوسط',
  poor: 'سيء'
};

// Safety Level Options
export const SAFETY_LEVEL_OPTIONS = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي'
}; 