// Pesticide type icons and labels
export const PESTICIDE_TYPE_ICONS = {
  insecticide: {
    icon: '🐛',
    label: 'مبيد حشري',
    materialIcon: 'bug-outline',
    color: '#DB2763'
  },
  herbicide: {
    icon: '🌿',
    label: 'مبيد أعشاب',
    materialIcon: 'flower-outline',
    color: '#093731'
  },
  fungicide: {
    icon: '🍄',
    label: 'مبيد فطري',
    materialIcon: 'mushroom-outline',
    color: '#6F732F'
  },
  other: {
    icon: '⚗️',
    label: 'أخرى',
    materialIcon: 'flask-outline',
    color: '#846A6A'
  }
};

// Safety and application icons
export const SAFETY_ICONS = {
  safetyInstructions: {
    icon: '⚠️',
    label: 'تعليمات السلامة',
    materialIcon: 'alert-outline',
    color: '#6F732F'
  },
  applicationInstructions: {
    icon: '💉',
    label: 'تعليمات التطبيق',
    materialIcon: 'spray',
    color: '#1A4F47'
  },
  storageConditions: {
    icon: '🏪',
    label: 'ظروف التخزين',
    materialIcon: 'warehouse',
    color: '#8B8F4A'
  },
  emergencyProcedures: {
    icon: '🚨',
    label: 'إجراءات الطوارئ',
    materialIcon: 'ambulance',
    color: '#DB2763'
  }
};

// Status icons
export const STATUS_ICONS = {
  lowStock: {
    icon: '⚡',
    label: 'مخزون منخفض',
    materialIcon: 'alert-circle',
    color: '#DB2763'
  },
  natural: {
    icon: '🌱',
    label: 'طبيعي',
    materialIcon: 'leaf',
    color: '#093731'
  },
  expiring: {
    icon: '⏳',
    label: 'قريب من انتهاء الصلاحية',
    materialIcon: 'clock-alert',
    color: '#6F732F'
  }
};

// Action icons
export const ACTION_ICONS = {
  add: {
    icon: '➕',
    label: 'إضافة',
    materialIcon: 'plus-circle',
    color: '#093731'
  },
  remove: {
    icon: '➖',
    label: 'سحب',
    materialIcon: 'minus-circle',
    color: '#DB2763'
  },
  edit: {
    icon: '✏️',
    label: 'تعديل',
    materialIcon: 'pencil',
    color: '#1A4F47'
  },
  delete: {
    icon: '🗑️',
    label: 'حذف',
    materialIcon: 'delete',
    color: '#DB2763'
  }
};

// Unit icons
export const UNIT_ICONS = {
  l: {
    icon: '💧',
    label: 'لتر',
    materialIcon: 'water',
    color: '#1A4F47'
  },
  ml: {
    icon: '💧',
    label: 'مل',
    materialIcon: 'water-outline',
    color: '#A5C4C0'
  },
  kg: {
    icon: '⚖️',
    label: 'كجم',
    materialIcon: 'weight',
    color: '#8B8F4A'
  },
  g: {
    icon: '⚖️',
    label: 'جم',
    materialIcon: 'weight',
    color: '#C4C6A3'
  }
};

// Form sections
export const FORM_SECTIONS = {
  basic: {
    title: 'المعلومات الأساسية',
    subtitle: 'أدخل المعلومات الأساسية للمبيد',
    icon: '🧪',
    color: '#1A4F47',
    fields: ['name', 'type', 'quantity', 'unit', 'minQuantityAlert', 'price']
  },
  technical: {
    title: 'التفاصيل الفنية',
    subtitle: 'أدخل التفاصيل الفنية للمبيد',
    icon: '⚗️',
    color: '#8B8F4A',
    fields: ['activeIngredients', 'targetPests', 'applicationRate', 'safetyInterval']
  },
  safety: {
    title: 'معلومات السلامة',
    subtitle: 'أدخل معلومات السلامة والتخزين',
    icon: '⚠️',
    color: '#6F732F',
    fields: ['manufacturer', 'registrationNumber', 'storageConditions', 'safetyPrecautions', 'emergencyProcedures']
  },
  additional: {
    title: 'معلومات إضافية',
    subtitle: 'أدخل أي معلومات إضافية',
    icon: '📝',
    color: '#093731',
    fields: ['isNatural', 'supplier', 'expiryDate']
  }
}; 