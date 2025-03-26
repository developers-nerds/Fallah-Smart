import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

// Translation resources
const resources = {
  ar: {
    translation: {
      // Common
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.add': 'إضافة',
      'common.confirm': 'تأكيد',
      'common.back': 'رجوع',
      'common.next': 'التالي',
      'common.search': 'بحث',
      'common.filter': 'تصفية',
      'common.sort': 'ترتيب',
      'common.loading': 'جاري التحميل...',
      'common.error': 'حدث خطأ',
      'common.success': 'تم بنجاح',
      'common.noData': 'لا توجد بيانات',
      
      // Stock related
      'stock.list': 'قائمة المخزون',
      'stock.add': 'إضافة مخزون',
      'stock.edit': 'تعديل المخزون',
      'stock.detail': 'تفاصيل المخزون',
      'stock.quantity': 'الكمية',
      'stock.unit': 'الوحدة',
      'stock.name': 'الاسم',
      'stock.category': 'الفئة',
      'stock.expiry': 'تاريخ الانتهاء',
      'stock.addedDate': 'تاريخ الإضافة',
      'stock.lowStock': 'مخزون منخفض',
      'stock.outOfStock': 'نفد من المخزون',
      
      // Equipment related
      'equipment.list': 'قائمة المعدات',
      'equipment.add': 'إضافة معدات',
      'equipment.edit': 'تعديل المعدات',
      'equipment.detail': 'تفاصيل المعدات',
      'equipment.name': 'الاسم',
      'equipment.model': 'الموديل',
      'equipment.maintenanceDate': 'تاريخ الصيانة',
      'equipment.nextMaintenance': 'الصيانة التالية',
      'equipment.status': 'الحالة',
      
      // Animals related
      'animals.list': 'قائمة الحيوانات',
      'animals.add': 'إضافة حيوان',
      'animals.edit': 'تعديل حيوان',
      'animals.detail': 'تفاصيل الحيوان',
      'animals.type': 'النوع',
      'animals.breed': 'السلالة',
      'animals.age': 'العمر',
      'animals.weight': 'الوزن',
      'animals.birthDate': 'تاريخ الميلاد',
      'animals.vaccination': 'التطعيم',
      'animals.breeding': 'التربية',
    }
  },
  en: {
    translation: {
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.confirm': 'Confirm',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.sort': 'Sort',
      'common.loading': 'Loading...',
      'common.error': 'Error occurred',
      'common.success': 'Success',
      'common.noData': 'No data available',
      
      // Stock related
      'stock.list': 'Stock List',
      'stock.add': 'Add Stock',
      'stock.edit': 'Edit Stock',
      'stock.detail': 'Stock Details',
      'stock.quantity': 'Quantity',
      'stock.unit': 'Unit',
      'stock.name': 'Name',
      'stock.category': 'Category',
      'stock.expiry': 'Expiry Date',
      'stock.addedDate': 'Added Date',
      'stock.lowStock': 'Low Stock',
      'stock.outOfStock': 'Out of Stock',
      
      // Equipment related
      'equipment.list': 'Equipment List',
      'equipment.add': 'Add Equipment',
      'equipment.edit': 'Edit Equipment',
      'equipment.detail': 'Equipment Details',
      'equipment.name': 'Name',
      'equipment.model': 'Model',
      'equipment.maintenanceDate': 'Maintenance Date',
      'equipment.nextMaintenance': 'Next Maintenance',
      'equipment.status': 'Status',
      
      // Animals related
      'animals.list': 'Animal List',
      'animals.add': 'Add Animal',
      'animals.edit': 'Edit Animal',
      'animals.detail': 'Animal Details',
      'animals.type': 'Type',
      'animals.breed': 'Breed',
      'animals.age': 'Age',
      'animals.weight': 'Weight',
      'animals.birthDate': 'Birth Date',
      'animals.vaccination': 'Vaccination',
      'animals.breeding': 'Breeding',
    }
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: I18nManager.isRTL ? 'ar' : 'en', // Default to Arabic for RTL
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // This prevents errors with React Suspense
    }
  });

export default i18n; 