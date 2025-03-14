export type FertilizerType = 'npk' | 'urea' | 'phosphate' | 'potassium' | 'sulfur' | 'calcium' | 'magnesium' | 'compost' | 'mycorrhiza';
export type FertilizerCategory = 'chemical' | 'organic' | 'bio';

export const FERTILIZER_CATEGORIES: Record<FertilizerCategory, { icon: string; label: string }> = {
  chemical: { icon: '⚗️', label: 'كيميائي' },
  organic: { icon: '🌱', label: 'عضوي' },
  bio: { icon: '🦠', label: 'حيوي' },
};

export const FERTILIZER_TYPES: Record<FertilizerType, { icon: string; name: string; category: FertilizerCategory }> = {
  npk: { icon: '🧪', name: 'NPK', category: 'chemical' },
  urea: { icon: '💎', name: 'يوريا', category: 'chemical' },
  phosphate: { icon: '🔸', name: 'فوسفات', category: 'chemical' },
  potassium: { icon: '🔶', name: 'بوتاسيوم', category: 'chemical' },
  sulfur: { icon: '🌕', name: 'كبريت', category: 'chemical' },
  calcium: { icon: '⬜', name: 'كالسيوم', category: 'chemical' },
  magnesium: { icon: '⬛', name: 'مغنيسيوم', category: 'chemical' },
  compost: { icon: '🍂', name: 'سماد عضوي', category: 'organic' },
  mycorrhiza: { icon: '🍄', name: 'فطريات جذرية', category: 'bio' },
};

export const UNIT_ICONS = {
  'kg': { icon: '⚖️', label: 'كيلوغرام' },
  'g': { icon: '⚖️', label: 'غرام' },
  'l': { icon: '💧', label: 'لتر' },
  'ml': { icon: '💧', label: 'مليلتر' },
  'bags': { icon: '👜', label: 'أكياس' },
  'boxes': { icon: '📦', label: 'صناديق' },
}; 