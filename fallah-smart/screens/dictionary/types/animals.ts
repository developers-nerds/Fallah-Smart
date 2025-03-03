export interface AnimalInfo {
    id: string;
    name: string;
    icon: string;
    category: string;
  }
  
  export interface AnimalDetails {
    feeding: string;          // معلومات التغذية
    care: string;            // العناية اليومية
    health: string;          // الرعاية الصحية
    housing: string;         // السكن والبيئة المناسبة
    breeding: string;        // معلومات التربية
    diseases: string;        // الأمراض الشائعة
    medications: string;     // الأدوية والعلاجات
    behavior: string;        // السلوك والتدريب
    economics: string;       // الجدوى الاقتصادية
    vaccination: string;     // جدول التطعيمات
  } 