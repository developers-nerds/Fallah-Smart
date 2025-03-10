import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

const quizzes: { [key: string]: Quiz } = {
  // Animal Quizzes (1-7)
  'animal_1': {
    id: 1,
    title: "اختبار تربية الأبقار",
    description: "اختبر معرفتك حول تربية وإدارة الأبقار",
    questions: [
      {
        id: 1,
        question: "كم مرة يجب حلب البقرة يومياً؟",
        options: ["مرة واحدة", "مرتين", "ثلاث مرات", "أربع مرات"],
        correctAnswer: 1,
        explanation: "يجب حلب البقرة مرتين يومياً للحصول على أفضل إنتاج للحليب"
      },
      {
        id: 2,
        question: "ما هي كمية الماء التي تحتاجها البقرة يومياً؟",
        options: ["20-30 لتر", "40-50 لتر", "60-70 لتر", "80-100 لتر"],
        correctAnswer: 3,
        explanation: "تحتاج البقرة إلى 80-100 لتر من الماء يومياً"
      },
      {
        id: 3,
        question: "ما هي درجة الحرارة المثالية لحظيرة الأبقار؟",
        options: ["5-10 درجات", "10-15 درجة", "15-20 درجة", "20-25 درجة"],
        correctAnswer: 2,
        explanation: "درجة الحرارة المثالية لحظيرة الأبقار هي 15-20 درجة مئوية"
      }
    ]
  },
  'animal_2': {
    id: 2,
    title: "اختبار تربية الأغنام",
    description: "اختبر معرفتك حول تربية وإدارة الأغنام",
    questions: [
      {
        id: 1,
        question: "ما هي أفضل فترة لتغذية الأغنام؟",
        options: ["الصباح الباكر والمساء", "منتصف النهار", "ليلاً فقط", "في أي وقت"],
        correctAnswer: 0,
        explanation: "الصباح الباكر والمساء هما أفضل وقتين لتغذية الأغنام لتجنب درجات الحرارة المرتفعة"
      },
      {
        id: 2,
        question: "كم مرة يجب جز صوف الأغنام سنوياً؟",
        options: ["مرة واحدة", "مرتين", "ثلاث مرات", "أربع مرات"],
        correctAnswer: 0,
        explanation: "يتم جز صوف الأغنام مرة واحدة في السنة عادة في فصل الربيع"
      },
      {
        id: 3,
        question: "ما هي مدة حمل النعجة؟",
        options: ["3 أشهر", "4 أشهر", "5 أشهر", "6 أشهر"],
        correctAnswer: 2,
        explanation: "مدة حمل النعجة حوالي 5 أشهر"
      }
    ]
  },
  'animal_3': {
    id: 3,
    title: "اختبار تربية الماعز",
    description: "اختبر معرفتك حول تربية وإدارة الماعز",
    questions: [
      {
        id: 1,
        question: "ما هي مدة الحمل عند الماعز؟",
        options: ["3 أشهر", "4 أشهر", "5 أشهر", "6 أشهر"],
        correctAnswer: 2,
        explanation: "مدة الحمل عند الماعز حوالي 5 أشهر"
      },
      {
        id: 2,
        question: "كم لتر من الحليب تنتج الماعزة يومياً؟",
        options: ["1-2 لتر", "2-3 لتر", "3-4 لتر", "4-5 لتر"],
        correctAnswer: 1,
        explanation: "تنتج الماعزة في المتوسط 2-3 لتر من الحليب يومياً"
      }
    ]
  },
  'animal_4': {
    id: 4,
    title: "اختبار تربية الدجاج",
    description: "اختبر معرفتك حول تربية وإدارة الدجاج",
    questions: [
      {
        id: 1,
        question: "ما هي درجة الحرارة المثالية لحضانة الكتاكيت؟",
        options: ["25-30 درجة", "30-35 درجة", "35-38 درجة", "40-45 درجة"],
        correctAnswer: 2,
        explanation: "تحتاج الكتاكيت إلى درجة حرارة 35-38 درجة في الأسبوع الأول"
      },
      {
        id: 2,
        question: "كم مرة يجب تغيير الماء للدجاج يومياً؟",
        options: ["مرة واحدة", "مرتين", "ثلاث مرات", "أربع مرات"],
        correctAnswer: 2,
        explanation: "يجب تغيير الماء للدجاج ثلاث مرات يومياً للحفاظ على نظافته"
      },
      {
        id: 3,
        question: "كم بيضة تضع الدجاجة في السنة؟",
        options: ["100-150", "150-200", "200-250", "250-300"],
        correctAnswer: 3,
        explanation: "تضع الدجاجة في المتوسط 250-300 بيضة في السنة"
      }
    ]
  },
  'animal_5': {
    id: 5,
    title: "اختبار تربية الديك الرومي",
    description: "اختبر معرفتك حول تربية وإدارة الديك الرومي",
    questions: [
      {
        id: 1,
        question: "ما هي درجة الحرارة المناسبة لتربية الديك الرومي؟",
        options: ["15-20 درجة", "20-25 درجة", "25-30 درجة", "30-35 درجة"],
        correctAnswer: 2,
        explanation: "يحتاج الديك الرومي إلى درجة حرارة 25-30 درجة للنمو المثالي"
      },
      {
        id: 2,
        question: "كم أسبوع يحتاج الديك الرومي للوصول لوزن التسويق؟",
        options: ["8-10 أسابيع", "12-14 أسبوع", "16-20 أسبوع", "22-24 أسبوع"],
        correctAnswer: 2,
        explanation: "يحتاج الديك الرومي إلى 16-20 أسبوع للوصول لوزن التسويق"
      }
    ]
  },
  'animal_6': {
    id: 6,
    title: "اختبار تربية الأرانب",
    description: "اختبر معرفتك حول تربية وإدارة الأرانب",
    questions: [
      {
        id: 1,
        question: "ما هو العمر المناسب لفطام الأرانب الصغيرة؟",
        options: ["2-3 أسابيع", "4-5 أسابيع", "6-7 أسابيع", "8-9 أسابيع"],
        correctAnswer: 1,
        explanation: "يتم فطام الأرانب الصغيرة عادة في عمر 4-5 أسابيع"
      },
      {
        id: 2,
        question: "كم مرة تلد الأرنبة في السنة؟",
        options: ["2-3 مرات", "4-5 مرات", "6-7 مرات", "8-9 مرات"],
        correctAnswer: 1,
        explanation: "تلد الأرنبة في المتوسط 4-5 مرات في السنة"
      }
    ]
  },
  'animal_7': {
    id: 7,
    title: "اختبار تربية الحمام",
    description: "اختبر معرفتك حول تربية وإدارة الحمام",
    questions: [
      {
        id: 1,
        question: "كم بيضة تضع أنثى الحمام في المرة الواحدة؟",
        options: ["بيضة واحدة", "بيضتان", "ثلاث بيضات", "أربع بيضات"],
        correctAnswer: 1,
        explanation: "تضع أنثى الحمام عادة بيضتين في المرة الواحدة"
      },
      {
        id: 2,
        question: "كم يوم تستغرق فترة حضانة بيض الحمام؟",
        options: ["14-16 يوم", "17-19 يوم", "20-22 يوم", "23-25 يوم"],
        correctAnswer: 1,
        explanation: "تستغرق فترة حضانة بيض الحمام 17-19 يوم"
      }
    ]
  },

  // Crop Quizzes (1-31)
  'crop_1': {
    id: 1,
    title: "اختبار زراعة القمح",
    description: "اختبر معرفتك حول زراعة وإدارة محصول القمح",
    questions: [
      {
        id: 1,
        question: "ما هو أفضل موسم لزراعة القمح؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 0,
        explanation: "يزرع القمح في الخريف للاستفادة من الأمطار الموسمية"
      },
      {
        id: 2,
        question: "كم يوم يحتاج القمح للنضج؟",
        options: ["60-90 يوم", "90-120 يوم", "120-150 يوم", "150-180 يوم"],
        correctAnswer: 2,
        explanation: "يحتاج القمح إلى 120-150 يوم للنضج"
      },
      {
        id: 3,
        question: "ما هي المسافة المثالية بين خطوط زراعة القمح؟",
        options: ["10-15 سم", "15-20 سم", "20-25 سم", "25-30 سم"],
        correctAnswer: 1,
        explanation: "المسافة المثالية بين خطوط زراعة القمح هي 15-20 سم"
      }
    ]
  },
  'crop_2': {
    id: 2,
    title: "اختبار زراعة الأرز",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الأرز",
    questions: [
      {
        id: 1,
        question: "ما هي درجة الحرارة المثالية لنمو الأرز؟",
        options: ["15-20 درجة", "20-25 درجة", "25-30 درجة", "30-35 درجة"],
        correctAnswer: 2,
        explanation: "يحتاج الأرز إلى درجة حرارة 25-30 درجة للنمو المثالي"
      },
      {
        id: 2,
        question: "كم يوم يحتاج الأرز للنضج؟",
        options: ["90-100 يوم", "100-120 يوم", "120-140 يوم", "140-160 يوم"],
        correctAnswer: 2,
        explanation: "يحتاج الأرز إلى 120-140 يوم للنضج"
      }
    ]
  },
  'crop_3': {
    id: 3,
    title: "اختبار زراعة الذرة",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الذرة",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين نباتات الذرة؟",
        options: ["20 سم", "30 سم", "40 سم", "50 سم"],
        correctAnswer: 1,
        explanation: "المسافة المثالية بين نباتات الذرة هي 30 سم"
      },
      {
        id: 2,
        question: "كم مرة يجب ري الذرة أسبوعياً؟",
        options: ["مرة واحدة", "مرتين", "ثلاث مرات", "أربع مرات"],
        correctAnswer: 1,
        explanation: "يجب ري الذرة مرتين أسبوعياً في الظروف العادية"
      }
    ]
  },
  'crop_4': {
    id: 4,
    title: "اختبار زراعة الشعير",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الشعير",
    questions: [
      {
        id: 1,
        question: "ما هو أفضل موسم لزراعة الشعير؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 0,
        explanation: "يزرع الشعير في الخريف مثل القمح"
      }
    ]
  },
  'crop_5': {
    id: 5,
    title: "اختبار زراعة الطماطم",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الطماطم",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين نباتات الطماطم؟",
        options: ["30 سم", "45 سم", "60 سم", "75 سم"],
        correctAnswer: 2,
        explanation: "المسافة المثالية بين نباتات الطماطم هي 60 سم"
      },
      {
        id: 2,
        question: "كم مرة يجب ري الطماطم أسبوعياً؟",
        options: ["2-3 مرات", "3-4 مرات", "4-5 مرات", "5-6 مرات"],
        correctAnswer: 1,
        explanation: "يجب ري الطماطم 3-4 مرات أسبوعياً حسب الظروف المناخية"
      }
    ]
  },
  'crop_6': {
    id: 6,
    title: "اختبار زراعة البطاطس",
    description: "اختبر معرفتك حول زراعة وإدارة محصول البطاطس",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين درنات البطاطس؟",
        options: ["20 سم", "30 سم", "40 سم", "50 سم"],
        correctAnswer: 1,
        explanation: "المسافة المثالية بين درنات البطاطس هي 30 سم"
      },
      {
        id: 2,
        question: "ما هو العمق المناسب لزراعة درنات البطاطس؟",
        options: ["5-8 سم", "8-12 سم", "12-15 سم", "15-20 سم"],
        correctAnswer: 2,
        explanation: "يجب زراعة درنات البطاطس على عمق 12-15 سم"
      },
      {
        id: 3,
        question: "متى يجب حصاد البطاطس؟",
        options: ["عند اصفرار الأوراق", "عند ذبول الأوراق", "عند جفاف الأوراق", "عند سقوط الأوراق"],
        correctAnswer: 2,
        explanation: "يتم حصاد البطاطس عند جفاف الأوراق تماماً"
      }
    ]
  },
  'crop_7': {
    id: 7,
    title: "اختبار زراعة الباذنجان",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الباذنجان",
    questions: [
      {
        id: 1,
        question: "ما هي درجة الحرارة المثالية لنمو الباذنجان؟",
        options: ["15-20 درجة", "20-25 درجة", "25-30 درجة", "30-35 درجة"],
        correctAnswer: 2,
        explanation: "يحتاج الباذنجان إلى درجة حرارة 25-30 درجة للنمو المثالي"
      },
      {
        id: 2,
        question: "كم مرة يجب ري الباذنجان أسبوعياً؟",
        options: ["1-2 مرات", "2-3 مرات", "3-4 مرات", "4-5 مرات"],
        correctAnswer: 1,
        explanation: "يحتاج الباذنجان إلى الري 2-3 مرات أسبوعياً"
      }
    ]
  },
  'crop_8': {
    id: 8,
    title: "اختبار زراعة الخيار",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الخيار",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين نباتات الخيار؟",
        options: ["30 سم", "40 سم", "50 سم", "60 سم"],
        correctAnswer: 2,
        explanation: "المسافة المثالية بين نباتات الخيار هي 50 سم"
      },
      {
        id: 2,
        question: "متى يتم قطف ثمار الخيار؟",
        options: ["عند اكتمال النمو", "عند اصفرار الثمار", "قبل اكتمال النمو", "عند نضج البذور"],
        correctAnswer: 2,
        explanation: "يتم قطف ثمار الخيار قبل اكتمال النمو للحصول على أفضل جودة"
      }
    ]
  },
  'crop_9': {
    id: 9,
    title: "اختبار زراعة الجزر",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الجزر",
    questions: [
      {
        id: 1,
        question: "ما هو العمق المناسب لزراعة بذور الجزر؟",
        options: ["0.5-1 سم", "1-2 سم", "2-3 سم", "3-4 سم"],
        correctAnswer: 1,
        explanation: "يجب زراعة بذور الجزر على عمق 1-2 سم"
      },
      {
        id: 2,
        question: "كم يوم يحتاج الجزر للنضج؟",
        options: ["45-60 يوم", "60-75 يوم", "75-90 يوم", "90-120 يوم"],
        correctAnswer: 2,
        explanation: "يحتاج الجزر إلى 75-90 يوم للنضج"
      }
    ]
  },
  'crop_10': {
    id: 10,
    title: "اختبار زراعة البصل",
    description: "اختبر معرفتك حول زراعة وإدارة محصول البصل",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين نباتات البصل؟",
        options: ["5-8 سم", "8-10 سم", "10-15 سم", "15-20 سم"],
        correctAnswer: 2,
        explanation: "المسافة المثالية بين نباتات البصل هي 10-15 سم"
      },
      {
        id: 2,
        question: "متى يتم حصاد البصل؟",
        options: ["عند اصفرار الأوراق", "عند سقوط الأوراق", "عند جفاف الأوراق", "عند اكتمال حجم البصلة"],
        correctAnswer: 0,
        explanation: "يتم حصاد البصل عند اصفرار الأوراق وبدء سقوطها"
      }
    ]
  },
  'crop_11': {
    id: 11,
    title: "اختبار زراعة الثوم",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الثوم",
    questions: [
      {
        id: 1,
        question: "ما هو أفضل موسم لزراعة الثوم؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 0,
        explanation: "يزرع الثوم في الخريف للحصول على أفضل إنتاج"
      },
      {
        id: 2,
        question: "كم شهر يحتاج الثوم حتى النضج؟",
        options: ["4-5 أشهر", "6-7 أشهر", "8-9 أشهر", "10-12 شهر"],
        correctAnswer: 1,
        explanation: "يحتاج الثوم إلى 6-7 أشهر للنضج"
      }
    ]
  },
  'crop_12': {
    id: 12,
    title: "اختبار زراعة الفلفل",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الفلفل",
    questions: [
      {
        id: 1,
        question: "ما هي درجة الحرارة المثالية لنمو الفلفل؟",
        options: ["15-20 درجة", "20-25 درجة", "25-30 درجة", "30-35 درجة"],
        correctAnswer: 2,
        explanation: "يحتاج الفلفل إلى درجة حرارة 25-30 درجة للنمو المثالي"
      }
    ]
  },
  'crop_13': {
    id: 13,
    title: "اختبار زراعة البامية",
    description: "اختبر معرفتك حول زراعة وإدارة محصول البامية",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين نباتات البامية؟",
        options: ["20 سم", "30 سم", "40 سم", "50 سم"],
        correctAnswer: 2,
        explanation: "المسافة المثالية بين نباتات البامية هي 40 سم"
      }
    ]
  },
  'crop_14': {
    id: 14,
    title: "اختبار زراعة الكوسة",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الكوسة",
    questions: [
      {
        id: 1,
        question: "كم مرة يجب ري الكوسة أسبوعياً؟",
        options: ["1-2 مرات", "2-3 مرات", "3-4 مرات", "4-5 مرات"],
        correctAnswer: 2,
        explanation: "تحتاج الكوسة إلى الري 3-4 مرات أسبوعياً"
      }
    ]
  },
  'crop_15': {
    id: 15,
    title: "اختبار زراعة الملفوف",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الملفوف",
    questions: [
      {
        id: 1,
        question: "ما هو أفضل موسم لزراعة الملفوف؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 0,
        explanation: "يزرع الملفوف في الخريف للحصول على أفضل إنتاج"
      }
    ]
  },
  'crop_16': {
    id: 16,
    title: "اختبار زراعة الفول",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الفول",
    questions: [
      {
        id: 1,
        question: "ما هو أفضل موسم لزراعة الفول؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 0,
        explanation: "يزرع الفول في الخريف للاستفادة من الأمطار الشتوية"
      },
      {
        id: 2,
        question: "كم يوم يحتاج الفول للنضج؟",
        options: ["60-90 يوم", "90-120 يوم", "120-150 يوم", "150-180 يوم"],
        correctAnswer: 1,
        explanation: "يحتاج الفول إلى 90-120 يوم للنضج"
      }
    ]
  },
  'crop_17': {
    id: 17,
    title: "اختبار زراعة العدس",
    description: "اختبر معرفتك حول زراعة وإدارة محصول العدس",
    questions: [
      {
        id: 1,
        question: "ما هو العمق المناسب لزراعة بذور العدس؟",
        options: ["2-3 سم", "3-4 سم", "4-5 سم", "5-6 سم"],
        correctAnswer: 1,
        explanation: "يجب زراعة بذور العدس على عمق 3-4 سم"
      }
    ]
  },
  'crop_18': {
    id: 18,
    title: "اختبار زراعة الحمص",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الحمص",
    questions: [
      {
        id: 1,
        question: "ما هو أفضل موسم لزراعة الحمص؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 1,
        explanation: "يزرع الحمص في الشتاء للحصول على أفضل إنتاج"
      }
    ]
  },
  'crop_19': {
    id: 19,
    title: "اختبار زراعة الفاصوليا",
    description: "اختبر معرفتك حول زراعة وإدارة محصول الفاصوليا",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين نباتات الفاصوليا؟",
        options: ["15 سم", "20 سم", "25 سم", "30 سم"],
        correctAnswer: 2,
        explanation: "المسافة المثالية بين نباتات الفاصوليا هي 25 سم"
      }
    ]
  },
  'crop_20': {
    id: 20,
    title: "اختبار زراعة البرتقال",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار البرتقال",
    questions: [
      {
        id: 1,
        question: "كم مرة يجب تسميد أشجار البرتقال سنوياً؟",
        options: ["مرة واحدة", "مرتين", "ثلاث مرات", "أربع مرات"],
        correctAnswer: 2,
        explanation: "تحتاج أشجار البرتقال إلى التسميد ثلاث مرات سنوياً"
      },
      {
        id: 2,
        question: "ما هي المسافة المثالية بين أشجار البرتقال؟",
        options: ["3-4 متر", "4-5 متر", "5-6 متر", "6-7 متر"],
        correctAnswer: 2,
        explanation: "المسافة المثالية بين أشجار البرتقال هي 5-6 متر"
      }
    ]
  },
  'crop_21': {
    id: 21,
    title: "اختبار زراعة الليمون",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار الليمون",
    questions: [
      {
        id: 1,
        question: "كم مرة يجب ري أشجار الليمون أسبوعياً في الصيف؟",
        options: ["مرة واحدة", "مرتين", "ثلاث مرات", "أربع مرات"],
        correctAnswer: 1,
        explanation: "تحتاج أشجار الليمون إلى الري مرتين أسبوعياً في الصيف"
      }
    ]
  },
  'crop_22': {
    id: 22,
    title: "اختبار زراعة العنب",
    description: "اختبر معرفتك حول زراعة وإدارة كروم العنب",
    questions: [
      {
        id: 1,
        question: "متى يتم تقليم كروم العنب؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 1,
        explanation: "يتم تقليم كروم العنب في فصل الشتاء"
      }
    ]
  },
  'crop_23': {
    id: 23,
    title: "اختبار زراعة التفاح",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار التفاح",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين أشجار التفاح؟",
        options: ["3-4 متر", "4-5 متر", "5-6 متر", "6-7 متر"],
        correctAnswer: 1,
        explanation: "المسافة المثالية بين أشجار التفاح هي 4-5 متر"
      }
    ]
  },
  'crop_24': {
    id: 24,
    title: "اختبار زراعة المانجو",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار المانجو",
    questions: [
      {
        id: 1,
        question: "ما هي درجة الحرارة المثالية لنمو المانجو؟",
        options: ["15-20 درجة", "20-25 درجة", "25-30 درجة", "30-35 درجة"],
        correctAnswer: 2,
        explanation: "تحتاج أشجار المانجو إلى درجة حرارة 25-30 درجة للنمو المثالي"
      }
    ]
  },
  'crop_25': {
    id: 25,
    title: "اختبار زراعة الموز",
    description: "اختبر معرفتك حول زراعة وإدارة نباتات الموز",
    questions: [
      {
        id: 1,
        question: "كم مرة يجب ري نباتات الموز أسبوعياً؟",
        options: ["1-2 مرات", "2-3 مرات", "3-4 مرات", "4-5 مرات"],
        correctAnswer: 2,
        explanation: "تحتاج نباتات الموز إلى الري 3-4 مرات أسبوعياً"
      }
    ]
  },
  'crop_26': {
    id: 26,
    title: "اختبار زراعة التين",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار التين",
    questions: [
      {
        id: 1,
        question: "متى يتم تقليم أشجار التين؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 1,
        explanation: "يتم تقليم أشجار التين في فصل الشتاء"
      }
    ]
  },
  'crop_27': {
    id: 27,
    title: "اختبار زراعة الرمان",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار الرمان",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين أشجار الرمان؟",
        options: ["3-4 متر", "4-5 متر", "5-6 متر", "6-7 متر"],
        correctAnswer: 1,
        explanation: "المسافة المثالية بين أشجار الرمان هي 4-5 متر"
      }
    ]
  },
  'crop_28': {
    id: 28,
    title: "اختبار زراعة المشمش",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار المشمش",
    questions: [
      {
        id: 1,
        question: "متى يتم تقليم أشجار المشمش؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 1,
        explanation: "يتم تقليم أشجار المشمش في فصل الشتاء"
      }
    ]
  },
  'crop_29': {
    id: 29,
    title: "اختبار زراعة الخوخ",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار الخوخ",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين أشجار الخوخ؟",
        options: ["3-4 متر", "4-5 متر", "5-6 متر", "6-7 متر"],
        correctAnswer: 1,
        explanation: "المسافة المثالية بين أشجار الخوخ هي 4-5 متر"
      }
    ]
  },
  'crop_30': {
    id: 30,
    title: "اختبار زراعة عباد الشمس",
    description: "اختبر معرفتك حول زراعة وإدارة محصول عباد الشمس",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين نباتات عباد الشمس؟",
        options: ["20 سم", "30 سم", "40 سم", "50 سم"],
        correctAnswer: 1,
        explanation: "المسافة المثالية بين نباتات عباد الشمس هي 30 سم"
      },
      {
        id: 2,
        question: "متى يتم حصاد عباد الشمس؟",
        options: ["عند اصفرار الأوراق", "عند جفاف الأوراق", "عند اصفرار القرص", "عند جفاف القرص"],
        correctAnswer: 3,
        explanation: "يتم حصاد عباد الشمس عند جفاف القرص تماماً"
      }
    ]
  },
  'crop_31': {
    id: 31,
    title: "اختبار زراعة الزيتون",
    description: "اختبر معرفتك حول زراعة وإدارة أشجار الزيتون",
    questions: [
      {
        id: 1,
        question: "ما هي المسافة المثالية بين أشجار الزيتون؟",
        options: ["5-6 متر", "6-7 متر", "7-8 متر", "8-9 متر"],
        correctAnswer: 2,
        explanation: "المسافة المثالية بين أشجار الزيتون هي 7-8 متر"
      },
      {
        id: 2,
        question: "متى يتم تقليم أشجار الزيتون؟",
        options: ["الخريف", "الشتاء", "الربيع", "الصيف"],
        correctAnswer: 1,
        explanation: "يتم تقليم أشجار الزيتون في فصل الشتاء"
      }
    ]
  }
};

const QuizLesson = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { lessonId, type } = route.params as { lessonId: number; type: 'animal' | 'crop' };
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Get quiz based on type and lessonId
  const quiz = quizzes[`${type}_${lessonId}`];

  // Handle case where quiz doesn't exist
  if (!quiz) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>عذراً، هذا الاختبار غير متوفر حالياً</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const questions = quiz.questions;
  const currentQ = questions[currentQuestion];

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <View style={styles.container}>
        <Text style={styles.header}>النتيجة النهائية</Text>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreText}>{score.toFixed(0)}%</Text>
          <Text style={styles.scoreMessage}>
            {score >= 70 ? 'أحسنت! نتيجة ممتازة' : 'حاول مرة أخرى للتحسين'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setCurrentQuestion(0);
            setSelectedAnswers([]);
            setShowResults(false);
          }}
        >
          <Text style={styles.buttonText}>إعادة الاختبار</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary.base }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>العودة للدروس</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${((currentQuestion + 1) / questions.length) * 100}%` }
          ]} 
        />
      </View>
      
      <Text style={styles.header}>
        {quiz.title} - سؤال {currentQuestion + 1} من {questions.length}
      </Text>

      <View style={styles.questionCard}>
        <Text style={styles.question}>{currentQ.question}</Text>
        
        {currentQ.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedAnswers[currentQuestion] === index && styles.selectedOption,
              showExplanation && index === currentQ.correctAnswer && styles.correctOption,
              showExplanation && selectedAnswers[currentQuestion] === index && 
              index !== currentQ.correctAnswer && styles.wrongOption
            ]}
            onPress={() => !showExplanation && handleAnswer(index)}
            disabled={showExplanation}
          >
            <Text style={[
              styles.optionText,
              selectedAnswers[currentQuestion] === index && styles.selectedOptionText,
              showExplanation && index === currentQ.correctAnswer && styles.correctOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}

        {showExplanation && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>
          </View>
        )}
      </View>

      {selectedAnswers[currentQuestion] !== undefined && (
        <TouchableOpacity 
          style={[styles.button, showExplanation ? styles.nextButton : styles.checkButton]} 
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentQuestion === questions.length - 1 ? 'إنهاء الاختبار' : 'السؤال التالي'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    padding: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 3,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.base,
    borderRadius: 3,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.primary.base,
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.medium,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 20,
    textAlign: 'right',
  },
  option: {
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: `${theme.colors.primary.base}15`,
    borderColor: theme.colors.primary.base,
  },
  correctOption: {
    backgroundColor: `${theme.colors.success}15`,
    borderColor: theme.colors.success,
  },
  wrongOption: {
    backgroundColor: `${theme.colors.error}15`,
    borderColor: theme.colors.error,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  selectedOptionText: {
    color: theme.colors.primary.base,
    fontWeight: '600',
  },
  correctOptionText: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  checkButton: {
    backgroundColor: theme.colors.primary.base,
  },
  nextButton: {
    backgroundColor: theme.colors.secondary.base,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  explanationCard: {
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  explanationText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'right',
  },
  scoreCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginVertical: 32,
    ...theme.shadows.medium,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary.base,
    marginBottom: 16,
  },
  scoreMessage: {
    fontSize: 18,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default QuizLesson; 