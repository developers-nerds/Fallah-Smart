import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  I18nManager,
  Dimensions,
  Modal,
  FlatList,
  TextInput as RNTextInput,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../../components/TextInput';
import { Button } from '../../../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TOOL_TYPES, TOOL_STATUS, TOOL_CONDITION, TOOL_ICONS, ToolType, ToolStatus, ToolCondition } from './constants';
import { storage } from '../../../utils/storage';
import axios from 'axios';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { useTool } from '../../../context/ToolContext';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

type AddToolScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddTool'>;
  route: RouteProp<StockStackParamList, 'AddTool'>;
};

// Enhance the TOOL_NAMES_BY_TYPE with a much more extensive list of tools
const TOOL_NAMES_BY_TYPE: Record<ToolType, Array<{ icon: string; name: string; description?: string }>> = {
  hand_tools: [
    { icon: '🔨', name: 'مطرقة', description: 'أداة للطرق والتثبيت' },
    { icon: '🪛', name: 'مفك براغي', description: 'لتثبيت وفك البراغي' },
    { icon: '🗜️', name: 'كماشة', description: 'للإمساك والثني' },
    { icon: '🔧', name: 'مفتاح ربط', description: 'لربط الصواميل' },
    { icon: '⛏️', name: 'مجرفة يدوية', description: 'للحفر والتنقيب' },
    { icon: '🪚', name: 'منشار يدوي', description: 'لقطع الخشب والمواد' },
    { icon: '🔧', name: 'مفتاح إنجليزي', description: 'لربط أحجام مختلفة من الصواميل' },
    { icon: '🗜️', name: 'كلابة', description: 'لقطع وثني الأسلاك' },
    { icon: '🪠', name: 'مفك فيليبس', description: 'مفك براغي للبراغي المتصالبة' },
    { icon: '🪛', name: 'مفك مسطح', description: 'مفك براغي للبراغي المسطحة' },
    { icon: '🔧', name: 'مفتاح ألن', description: 'لربط البراغي السداسية' },
    { icon: '🪄', name: 'مسدس سيليكون', description: 'لتطبيق السيليكون ومواد اللصق' },
    { icon: '🪓', name: 'فأس صغير', description: 'للقطع والنحت' },
    { icon: '🔪', name: 'سكين متعدد الأغراض', description: 'للقطع والتشذيب' },
    { icon: '📏', name: 'مسطرة فولاذية', description: 'للقياس الدقيق' },
    { icon: '🗜️', name: 'ملزمة', description: 'لتثبيت القطع أثناء العمل' },
    { icon: '🔨', name: 'مطرقة مخلب', description: 'لإدخال وإزالة المسامير' },
    { icon: '⚒️', name: 'مطرقة نجار', description: 'لأعمال النجارة الدقيقة' },
    { icon: '🧰', name: 'ميزان ماء', description: 'للتأكد من استواء الأسطح' }
  ],
  power_tools: [
    { icon: '🔌', name: 'مثقاب كهربائي', description: 'لعمل ثقوب دقيقة' },
    { icon: '⚡', name: 'منشار كهربائي', description: 'لقطع المواد بسرعة' },
    { icon: '🔋', name: 'فارة خشب', description: 'لتنعيم الأسطح الخشبية' },
    { icon: '⚙️', name: 'مجلخة زاوية', description: 'للقطع والتجليخ' },
    { icon: '🔌', name: 'مفك كهربائي', description: 'لربط البراغي بسرعة' },
    { icon: '⚡', name: 'منشار دائري', description: 'لقطع الخشب والألواح بدقة' },
    { icon: '🔌', name: 'روتر كهربائي', description: 'لنحت وتشكيل الخشب' },
    { icon: '⚡', name: 'مكبس مسامير', description: 'لتثبيت المسامير بسرعة' },
    { icon: '🔌', name: 'مسدس حراري', description: 'لإزالة الدهان وتليين المواد' },
    { icon: '⚙️', name: 'ماكينة لحام', description: 'للحام المعادن' },
    { icon: '🔌', name: 'ملمع كهربائي', description: 'لتلميع الأسطح المعدنية والخشبية' },
    { icon: '⚡', name: 'منشار ترددي', description: 'لقطع الأخشاب والمعادن' },
    { icon: '🔌', name: 'مثقاب تأثيري', description: 'للثقب في الخرسانة والمواد الصلبة' },
    { icon: '⚙️', name: 'مطرقة هدم', description: 'لهدم وتكسير المواد الصلبة' },
    { icon: '🔌', name: 'مكبس هواء', description: 'لتشغيل الأدوات الهوائية' },
    { icon: '⚡', name: 'مسدس رش طلاء', description: 'لرش الدهانات' },
    { icon: '🔌', name: 'ماكينة تفريز', description: 'لعمل الشقوق والحزوز في الخشب' },
    { icon: '⚙️', name: 'مقص صاج كهربائي', description: 'لقص الصاج والمعادن الرقيقة' }
  ],
  pruning_tools: [
    { icon: '✂️', name: 'مقص تقليم', description: 'لتقليم الفروع الصغيرة' },
    { icon: '🪓', name: 'منشار تقليم', description: 'لقطع الفروع الكبيرة' },
    { icon: '✂️', name: 'مقص أغصان', description: 'لقطع الأغصان المرتفعة' },
    { icon: '🌿', name: 'مقص عشب', description: 'لتقليم العشب والنباتات' },
    { icon: '✂️', name: 'مقص تقليم بمقبض طويل', description: 'للوصول إلى الفروع العالية' },
    { icon: '🪓', name: 'ساطور أغصان', description: 'لقطع الأغصان السميكة' },
    { icon: '✂️', name: 'مقص تقليم دقيق', description: 'للتقليم الدقيق للنباتات' },
    { icon: '🪓', name: 'فأس تقليم صغير', description: 'لتقليم الأشجار الصغيرة' },
    { icon: '✂️', name: 'مقص تقليم كهربائي', description: 'للتقليم السريع' },
    { icon: '🌿', name: 'منشار قوسي', description: 'لقطع الأغصان الكبيرة' },
    { icon: '✂️', name: 'مقص بستنة', description: 'للعناية بالنباتات المنزلية' },
    { icon: '🪓', name: 'مقص تقليم هيدروليكي', description: 'للتقليم بأقل جهد' },
    { icon: '✂️', name: 'سكين تطعيم', description: 'لتطعيم الأشجار' },
    { icon: '🌿', name: 'أداة تقشير اللحاء', description: 'لإزالة اللحاء المتضرر' },
    { icon: '✂️', name: 'مزيل الفروع الميتة', description: 'لإزالة الفروع المريضة والميتة' }
  ],
  irrigation_tools: [
    { icon: '💦', name: 'رشاش ماء', description: 'لري المساحات الكبيرة' },
    { icon: '🚰', name: 'مضخة يدوية', description: 'لضخ المياه يدويًا' },
    { icon: '🌊', name: 'خرطوم ري', description: 'لتوصيل المياه للنباتات' },
    { icon: '🚿', name: 'صنبور', description: 'للتحكم بتدفق المياه' },
    { icon: '🔌', name: 'موصلات ري', description: 'لربط أنظمة الري' },
    { icon: '💦', name: 'رشاش دوار', description: 'لري المساحات الواسعة بشكل دائري' },
    { icon: '🚰', name: 'مضخة غاطسة', description: 'لضخ المياه من الآبار والخزانات' },
    { icon: '🌊', name: 'نظام ري بالتنقيط', description: 'لري النباتات بكفاءة' },
    { icon: '🚿', name: 'مؤقت ري', description: 'للتحكم الآلي بوقت الري' },
    { icon: '💦', name: 'مرشح مياه', description: 'لتنقية مياه الري' },
    { icon: '🚰', name: 'محبس مياه', description: 'للتحكم بتدفق المياه' },
    { icon: '🌊', name: 'موزع مياه', description: 'لتوزيع المياه على عدة خطوط' },
    { icon: '🚿', name: 'جهاز قياس رطوبة التربة', description: 'لتحديد وقت الري المناسب' },
    { icon: '💦', name: 'رشاش ضباب', description: 'لري النباتات الحساسة والشتلات' },
    { icon: '🚰', name: 'خزان مياه', description: 'لتخزين مياه الري' },
    { icon: '🌊', name: 'مسدس رش', description: 'للري اليدوي المركز' },
    { icon: '🚿', name: 'مستشعر مطر', description: 'لإيقاف الري عند هطول المطر' },
    { icon: '💦', name: 'أنابيب ري بالتنقيط', description: 'لتوزيع المياه بدقة' }
  ],
  harvesting_tools: [
    { icon: '🔪', name: 'سكين حصاد', description: 'لحصاد المحاصيل' },
    { icon: '✂️', name: 'مقص قطف', description: 'لقطف الثمار' },
    { icon: '🧺', name: 'سلة قطف', description: 'لجمع المحصول' },
    { icon: '🌾', name: 'منجل', description: 'لحصاد الحبوب' },
    { icon: '🧹', name: 'مذراة', description: 'لفصل الحبوب عن القش' },
    { icon: '🔪', name: 'سكين حصاد منحنية', description: 'لحصاد الحبوب والأعشاب' },
    { icon: '✂️', name: 'مقص قطف بمقبض طويل', description: 'لقطف الثمار العالية' },
    { icon: '🧺', name: 'حقيبة قطف', description: 'لحمل المحصول أثناء القطف' },
    { icon: '🌾', name: 'مشط زيتون', description: 'لجمع ثمار الزيتون' },
    { icon: '🧹', name: 'غربال', description: 'لتنظيف وفرز البذور' },
    { icon: '🔪', name: 'أداة قلع الجذور', description: 'لقلع المحاصيل الجذرية' },
    { icon: '✂️', name: 'مقص عنب', description: 'لقطف العنب' },
    { icon: '🧺', name: 'صندوق تخزين المحصول', description: 'لتخزين ونقل المحصول' },
    { icon: '🌾', name: 'محش آلي', description: 'لحصاد مساحات كبيرة' },
    { icon: '🧹', name: 'جهاز فرز', description: 'لفرز المحاصيل حسب الحجم' },
    { icon: '🔪', name: 'مقشرة', description: 'لإزالة قشور بعض المحاصيل' },
    { icon: '✂️', name: 'أداة قطف تفاح', description: 'مصممة خصيصًا لقطف التفاح' }
  ],
  measuring_tools: [
    { icon: '📏', name: 'شريط قياس', description: 'لقياس الأطوال' },
    { icon: '📐', name: 'ميزان مياه', description: 'لضبط الاستواء' },
    { icon: '💧', name: 'مقياس رطوبة', description: 'لقياس رطوبة التربة' },
    { icon: '🌡️', name: 'ميزان حرارة', description: 'لقياس درجة الحرارة' },
    { icon: '🧪', name: 'مقياس pH', description: 'لقياس حموضة التربة' },
    { icon: '📏', name: 'مقياس ليزر', description: 'لقياس المسافات بدقة عالية' },
    { icon: '📐', name: 'مقياس زوايا', description: 'لقياس الزوايا وضبطها' },
    { icon: '💧', name: 'مقياس هطول الأمطار', description: 'لقياس كمية الأمطار' },
    { icon: '🌡️', name: 'مقياس حرارة التربة', description: 'لقياس درجة حرارة التربة' },
    { icon: '🧪', name: 'جهاز تحليل التربة', description: 'لفحص خصائص التربة المختلفة' },
    { icon: '📏', name: 'أداة تخطيط الصفوف', description: 'للمساعدة في تخطيط صفوف الزراعة' },
    { icon: '📐', name: 'بوصلة', description: 'لتحديد الاتجاهات' },
    { icon: '💧', name: 'مقياس تدفق المياه', description: 'لقياس معدل تدفق المياه' },
    { icon: '🌡️', name: 'مقياس الرياح', description: 'لقياس سرعة الرياح' },
    { icon: '🧪', name: 'مقياس الإشعاع الشمسي', description: 'لقياس كمية الإشعاع الشمسي' },
    { icon: '📏', name: 'مقياس عمق البذور', description: 'للتحكم في عمق زراعة البذور' },
    { icon: '📐', name: 'جهاز GPS زراعي', description: 'للتحديد الدقيق للمواقع' },
    { icon: '💧', name: 'مقياس التبخر', description: 'لقياس معدل تبخر المياه' }
  ],
  safety_equipment: [
    { icon: '🧤', name: 'قفازات', description: 'لحماية اليدين' },
    { icon: '👓', name: 'نظارات واقية', description: 'لحماية العينين' },
    { icon: '⛑️', name: 'خوذة', description: 'لحماية الرأس' },
    { icon: '😷', name: 'قناع', description: 'لحماية الجهاز التنفسي' },
    { icon: '🔊', name: 'سدادات أذن', description: 'لحماية السمع' },
    { icon: '👢', name: 'حذاء أمان', description: 'لحماية القدمين' },
    { icon: '🧤', name: 'قفازات مقاومة للكيماويات', description: 'للتعامل مع المواد الكيميائية' },
    { icon: '👓', name: 'درع وجه', description: 'لحماية كامل الوجه' },
    { icon: '⛑️', name: 'غطاء رأس واقي', description: 'للحماية من الشمس والأتربة' },
    { icon: '😷', name: 'قناع مرشح للمبيدات', description: 'مخصص للحماية من المبيدات' },
    { icon: '🔊', name: 'سماعات حماية', description: 'للحماية من الضوضاء العالية' },
    { icon: '👢', name: 'واقي الساق', description: 'لحماية الساقين أثناء العمل' },
    { icon: '🧤', name: 'أكمام واقية', description: 'لحماية الذراعين' },
    { icon: '👓', name: 'نظارات واقية من الغبار', description: 'للحماية من الغبار والرذاذ' },
    { icon: '⛑️', name: 'خوذة مع درع وجه', description: 'لحماية الرأس والوجه معًا' },
    { icon: '😷', name: 'قناع غاز', description: 'للحماية من الغازات السامة' },
    { icon: '🔊', name: 'غطاء أذن', description: 'للحماية من البرد مع السمع' },
    { icon: '👢', name: 'حذاء مقاوم للماء', description: 'للعمل في البيئات الرطبة' },
    { icon: '🧤', name: 'قفازات عازلة للحرارة', description: 'للتعامل مع الأدوات الساخنة' }
  ],
  other: [
    { icon: '🔧', name: 'أداة أخرى', description: 'أدوات متنوعة أخرى' },
    { icon: '🔋', name: 'بطارية معدات', description: 'بطاريات للأدوات الكهربائية' },
    { icon: '🧵', name: 'أدوات ربط', description: 'أسلاك وحبال وروابط متنوعة' },
    { icon: '🧹', name: 'أدوات تنظيف', description: 'للتنظيف والصيانة' },
    { icon: '📦', name: 'صناديق تخزين', description: 'لتخزين المعدات' },
    { icon: '📋', name: 'معدات فحص', description: 'لفحص المحاصيل والتربة' },
    { icon: '🔦', name: 'معدات إضاءة', description: 'للعمل في الظلام' },
    { icon: '🧰', name: 'حقيبة أدوات', description: 'لحمل وتنظيم الأدوات' },
    { icon: '🧪', name: 'أدوات تطعيم', description: 'لتطعيم النباتات' },
    { icon: '🧬', name: 'معدات بيولوجية', description: 'للتحكم البيولوجي' },
    { icon: '🧲', name: 'أدوات مغناطيسية', description: 'للالتقاط والتثبيت' },
    { icon: '🔌', name: 'محولات كهربائية', description: 'لتشغيل المعدات الكهربائية' }
  ]
};

interface FormData {
  name: string;
  quantity: string;
  minQuantityAlert: string;
  category: ToolType;
  status: ToolStatus;
  condition: ToolCondition;
  purchaseDate: Date | null;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  maintenanceInterval: string;
  brand: string;
  model: string;
  purchasePrice: string;
  replacementCost: string;
  storageLocation: string;
  assignedTo: string;
  maintenanceNotes: string;
  usageInstructions: string;
  safetyGuidelines: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم الأداة مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'الكمية يجب أن تكون أكبر من 0'),
  minQuantityAlert: Yup.number()
    .required('حد التنبيه مطلوب')
    .min(0, 'حد التنبيه يجب أن يكون أكبر من 0'),
  category: Yup.string().required('نوع الأداة مطلوب'),
  status: Yup.string().required('حالة الأداة مطلوبة'),
  condition: Yup.string().required('حالة الأداة مطلوبة'),
  purchasePrice: Yup.number()
    .min(0, 'السعر يجب أن يكون أكبر من 0'),
});

const initialFormData: FormData = {
  name: '',
  quantity: '',
  minQuantityAlert: '2',
  category: 'hand_tools',
  status: 'available',
  condition: 'new',
  purchaseDate: null,
  lastMaintenanceDate: null,
  nextMaintenanceDate: null,
  maintenanceInterval: '',
  brand: '',
  model: '',
  purchasePrice: '',
  replacementCost: '',
  storageLocation: '',
  assignedTo: '',
  maintenanceNotes: '',
  usageInstructions: '',
  safetyGuidelines: '',
};

const SECTIONS = [
  {
    id: 'basic',
    title: `المعلومات الأساسية`,
    description: 'اسم الأداة، الكمية، والنوع',
    icon: '🛠️'
  },
  {
    id: 'purchase',
    title: `${TOOL_ICONS.sections.purchase} معلومات الشراء`,
    description: 'السعر وتاريخ الشراء',
    icon: '💰'
  },
  {
    id: 'location',
    title: `${TOOL_ICONS.sections.location} المكان والمسؤول`,
    description: 'مكان التخزين والشخص المسؤول',
    icon: '📍'
  },
  {
    id: 'maintenance',
    title: `${TOOL_ICONS.sections.maintenance} الصيانة`,
    description: 'مواعيد وملاحظات الصيانة',
    icon: '🔧'
  },
  {
    id: 'instructions',
    title: `${TOOL_ICONS.sections.instructions} التعليمات`,
    description: 'كيفية الاستخدام وإرشادات السلامة',
    icon: '📝'
  }
];

// First, create a function to get all tool names across all types for the dropdown
const getAllToolsForDropdown = () => {
  const allTools: Array<{ icon: string; name: string; type: ToolType; description?: string }> = [];
  
  // Combine all tools from different types
  Object.entries(TOOL_NAMES_BY_TYPE).forEach(([type, tools]) => {
    tools.forEach(tool => {
      // For the "other" type, only add the generic "أداة أخرى" option
      if (type === 'other' && tool.name === 'أداة أخرى') {
        allTools.push({...tool, type: type as ToolType});
      } 
      // For regular types, add all tools
      else if (type !== 'other') {
        allTools.push({...tool, type: type as ToolType});
      }
    });
  });
  
  // Sort alphabetically by name
  allTools.sort((a, b) => a.name.localeCompare(b.name));
  
  return allTools;
};

const AddToolScreen: React.FC<AddToolScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showLastMaintenanceDatePicker, setShowLastMaintenanceDatePicker] = useState(false);
  const [showNextMaintenanceDatePicker, setShowNextMaintenanceDatePicker] = useState(false);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { fetchTools } = useTool();
  
  const translateX = useSharedValue(0);

  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      translateX.value = withSpring(-(currentSection + 1) * width);
      setCurrentSection(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      translateX.value = withSpring(-(currentSection - 1) * width);
      setCurrentSection(prev => prev - 1);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      const tokens = await storage.getTokens();
      
      const toolData = {
        ...values,
        quantity: Number(values.quantity),
        minQuantityAlert: Number(values.minQuantityAlert),
        purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : undefined,
        replacementCost: values.replacementCost ? Number(values.replacementCost) : undefined,
        maintenanceInterval: values.maintenanceInterval ? Number(values.maintenanceInterval) : undefined,
      };

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/tools`,
        toolData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens?.access}`
          }
        }
      );

      if (response.data) {
        // Don't call fetchTools here as it may trigger the refresh loop
        // Instead, show success and navigate back immediately
        
        Alert.alert(
          'نجاح',
          'تمت إضافة الأداة بنجاح',
          [
            {
              text: 'حسناً',
              onPress: () => {
                // Navigate back to the tool list screen
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error adding tool:', error);
      Alert.alert('خطأ', 'فشل في إضافة الأداة');
    } finally {
      setLoading(false);
    }
  };

  const renderSectionHeader = () => (
    <View style={[styles.header, { borderBottomColor: theme.colors.neutral.border }]}>
      <Text style={[styles.sectionTitle, theme.typography.arabic.h3, { color: theme.colors.neutral.textPrimary }]}>
        {SECTIONS[currentSection].title}
      </Text>
      <Text style={[styles.sectionDescription, theme.typography.arabic.body, { color: theme.colors.neutral.textSecondary }]}>
        {SECTIONS[currentSection].description}
      </Text>
    </View>
  );

  const renderProgressBar = () => (
    <View style={[styles.progressContainer, { padding: theme.spacing.md }]}>
      <View style={styles.progressBar}>
        {SECTIONS.map((section, index) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => {
              translateX.value = withSpring(-index * width);
              setCurrentSection(index);
            }}
            style={[
              styles.progressStep,
              {
                backgroundColor: index <= currentSection 
                  ? theme.colors.primary.base
                  : theme.colors.neutral.border,
                ...theme.shadows.small
              }
            ]}
          >
            <Text style={[styles.progressStepText, { color: theme.colors.neutral.surface }]}>
              {index + 1}
            </Text>
            <Text style={styles.progressStepLabel}>{section.icon}</Text>
          </TouchableOpacity>
        ))}
        <View 
          style={[
            styles.progressLine,
            { backgroundColor: theme.colors.neutral.border }
          ]} 
        />
      </View>
    </View>
  );

  const renderBasicSection = (values: FormData, setFieldValue: any, errors: any, touched: any) => {
    // Group all tools for dropdown
    const allToolOptions = Object.entries(TOOL_NAMES_BY_TYPE).flatMap(([type, tools]) => 
      tools.map(tool => ({
        ...tool,
        typeKey: type as ToolType,
        typeLabel: TOOL_TYPES[type as ToolType].name,
        typeIcon: TOOL_TYPES[type as ToolType].icon,
      }))
    ).sort((a, b) => a.name.localeCompare(b.name));

    // Filter tools based on search query
    const filteredTools = searchQuery 
      ? allToolOptions.filter(tool => 
          tool.name.includes(searchQuery) || 
          tool.typeLabel.includes(searchQuery)
        )
      : allToolOptions;

    return (
      <View style={[styles.section, { width }]}>
        <View style={[styles.sectionTitle, { marginBottom: 15 }]}>
          <Text style={[styles.label, { color: theme.colors.neutral.textSecondary, fontSize: 16 }]}>
            اسم الأداة، الكمية، والنوع
          </Text>
        </View>
        
        {/* Tool name selection - styled like AddPesticide */}
        <TouchableOpacity
          style={[
            styles.toolSelector,
            {
              backgroundColor: theme.colors.neutral.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.primary.base,
              ...theme.shadows.small
            }
          ]}
          onPress={() => setShowToolSelector(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ 
              backgroundColor: theme.colors.primary.surface, 
              height: 50, 
              width: 50, 
              borderRadius: 25,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}>
              <Text style={{ fontSize: 24 }}>
                {(() => {
                  // Find the tool's icon
                  for (const [type, tools] of Object.entries(TOOL_NAMES_BY_TYPE)) {
                    const found = tools.find(tool => tool.name === values.name);
                    if (found) return found.icon;
                  }
                  return '🔧';
                })()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: theme.colors.neutral.textPrimary, 
                fontSize: 18, 
                fontWeight: '600',
                marginBottom: 4
              }}>
                {values.name || 'اختر اسم الأداة'}
              </Text>
              <Text style={{ color: theme.colors.neutral.textSecondary, fontSize: 14 }}>
                {values.name 
                  ? `النوع: ${TOOL_TYPES[values.category].icon} ${TOOL_TYPES[values.category].name}` 
                  : 'سيتم تحديد النوع تلقائياً'
                }
              </Text>
            </View>
            <Text style={{ color: theme.colors.primary.base, fontSize: 16 }}>تغيير ↓</Text>
          </View>
        </TouchableOpacity>
        
        {/* Tool Selection Modal */}
        <Modal
          visible={showToolSelector}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowToolSelector(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.neutral.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
                  اختر الأداة
                </Text>
                <TouchableOpacity onPress={() => setShowToolSelector(false)}>
                  <Text style={{ color: theme.colors.primary.base, fontSize: 16 }}>إغلاق</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <RNTextInput
                  style={styles.searchInput}
                  placeholder="ابحث عن أداة..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
              </View>

              <FlatList
                data={filteredTools}
                keyExtractor={(item, index) => `${item.typeKey}-${item.name}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.toolItem}
                    onPress={() => {
                      setFieldValue('name', item.name);
                      setFieldValue('category', item.typeKey);
                      setShowToolSelector(false);
                      setSearchQuery('');
                    }}
                  >
                    <View style={styles.toolItemContent}>
                      <Text style={styles.toolIcon}>{item.icon}</Text>
                      <View style={styles.toolInfo}>
                        <Text style={styles.toolName}>{item.name}</Text>
                        <Text style={styles.toolCategory}>
                          {item.typeIcon} {item.typeLabel}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListFooterComponent={
                  <TouchableOpacity
                    style={[styles.customToolButton, { backgroundColor: theme.colors.primary.surface }]}
                    onPress={() => {
                      // Handle custom name input
                      if (Platform.OS === 'ios') {
                        Alert.prompt(
                          'أدخل اسم الأداة',
                          'سيتم إضافة الأداة تحت تصنيف "أخرى"',
                          [
                            { text: 'إلغاء', style: 'cancel' },
                            {
                              text: 'موافق',
                              onPress: customName => {
                                if (customName && customName.trim()) {
                                  setFieldValue('name', customName.trim());
                                  setFieldValue('category', 'other');
                                  setShowToolSelector(false);
                                  setSearchQuery('');
                                }
                              }
                            }
                          ],
                          'plain-text'
                        );
                      } else {
                        // Android workaround
                        Alert.alert(
                          'إدخال اسم مخصص',
                          'أدخل اسم الأداة المخصصة',
                          [
                            { text: 'إلغاء', style: 'cancel' },
                            {
                              text: 'متابعة',
                              onPress: () => {
                                setFieldValue('name', 'أداة مخصصة');
                                setFieldValue('category', 'other');
                                setShowToolSelector(false);
                                setSearchQuery('');
                              }
                            }
                          ]
                        );
                      }
                    }}
                  >
                    <Text style={styles.customToolButtonText}>✏️ إدخال اسم مخصص</Text>
                  </TouchableOpacity>
                }
              />
            </View>
          </View>
        </Modal>
        
        {touched.name && errors.name && (
          <Text style={{ color: theme.colors.error, marginTop: 5 }}>{errors.name}</Text>
        )}

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              label={`${TOOL_ICONS.basic.quantity} الكمية`}
              value={values.quantity}
              onChangeText={(text) => setFieldValue('quantity', text)}
              keyboardType="numeric"
              error={touched.quantity && errors.quantity}
            />
          </View>
          <View style={styles.halfInput}>
            <TextInput
              label={`${TOOL_ICONS.basic.minQuantity} حد التنبيه`}
              value={values.minQuantityAlert}
              onChangeText={(text) => setFieldValue('minQuantityAlert', text)}
              keyboardType="numeric"
              error={touched.minQuantityAlert && errors.minQuantityAlert}
            />
          </View>
        </View>

        {/* Tool condition selector */}
        <View style={styles.conditionSection}>
          <Text style={[styles.label, { color: theme.colors.neutral.textSecondary, fontSize: 18, marginBottom: 10 }]}>
            {TOOL_ICONS.basic.condition} حالة الأداة
          </Text>
          
          <View style={styles.conditionRow}>
            {Object.entries(TOOL_CONDITION).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.conditionButton,
                  {
                    backgroundColor: values.condition === key
                      ? value.color + '30' // Add transparency to the color
                      : theme.colors.neutral.surface,
                    borderColor: values.condition === key
                      ? value.color
                      : theme.colors.neutral.border,
                    borderWidth: 2,
                    borderRadius: 12,
                    padding: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    margin: 4,
                    ...theme.shadows.small
                  }
                ]}
                onPress={() => setFieldValue('condition', key)}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{value.icon}</Text>
                <Text style={{
                  color: values.condition === key
                    ? value.color
                    : theme.colors.neutral.textPrimary,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {value.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderPurchaseSection = (values: FormData, setFieldValue: any, errors: any, touched: any) => (
    <View style={[styles.section, { width }]}>
      <TouchableOpacity
        style={[styles.dateButton, { 
          borderColor: theme.colors.neutral.border,
          shadowColor: theme.colors.neutral.textSecondary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }]}
        onPress={() => setShowPurchaseDatePicker(true)}
      >
        <Text style={[styles.dateButtonText, { 
          color: values.purchaseDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary 
        }]}>
          {TOOL_ICONS.purchase.date} {values.purchaseDate
            ? values.purchaseDate.toLocaleDateString('en-GB')
            : 'تاريخ الشراء'}
        </Text>
      </TouchableOpacity>

            <TextInput
        label={`${TOOL_ICONS.purchase.brand} الشركة المصنعة`}
        value={values.brand}
        onChangeText={(text) => setFieldValue('brand', text)}
            />

            <TextInput
        label={`${TOOL_ICONS.purchase.model} الموديل`}
              value={values.model}
              onChangeText={(text) => setFieldValue('model', text)}
            />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <TextInput
            label={`${TOOL_ICONS.purchase.price} سعر الشراء`}
            value={values.purchasePrice}
            onChangeText={(text) => setFieldValue('purchasePrice', text)}
            keyboardType="numeric"
            error={touched.purchasePrice && errors.purchasePrice}
          />
        </View>
        <View style={styles.halfInput}>
          <TextInput
            label={`${TOOL_ICONS.purchase.price} تكلفة الاستبدال`}
            value={values.replacementCost}
            onChangeText={(text) => setFieldValue('replacementCost', text)}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  const renderLocationSection = (values: FormData, setFieldValue: any) => (
    <View style={[styles.section, { width }]}>
      <TextInput
        label={`${TOOL_ICONS.location.storage} موقع التخزين`}
        value={values.storageLocation}
        onChangeText={(text) => setFieldValue('storageLocation', text)}
      />

      <TextInput
        label={`${TOOL_ICONS.location.assigned} المستخدم الحالي`}
        value={values.assignedTo}
        onChangeText={(text) => setFieldValue('assignedTo', text)}
      />
    </View>
  );

  const renderMaintenanceSection = (values: FormData, setFieldValue: any) => (
    <View style={[styles.section, { width }]}>
              <TouchableOpacity
                style={[styles.dateButton, { 
                  borderColor: theme.colors.neutral.border,
                  shadowColor: theme.colors.neutral.textSecondary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }]}
                onPress={() => setShowLastMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { 
                  color: values.lastMaintenanceDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary 
                }]}>
                  {TOOL_ICONS.maintenance.last} {values.lastMaintenanceDate
                    ? values.lastMaintenanceDate.toLocaleDateString('en-GB')
                    : 'تاريخ آخر صيانة'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateButton, { 
                  borderColor: theme.colors.neutral.border,
                  shadowColor: theme.colors.neutral.textSecondary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }]}
                onPress={() => setShowNextMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { 
                  color: values.nextMaintenanceDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary 
                }]}>
                  {TOOL_ICONS.maintenance.next} {values.nextMaintenanceDate
                    ? values.nextMaintenanceDate.toLocaleDateString('en-GB')
                    : 'تاريخ الصيانة القادمة'}
                </Text>
              </TouchableOpacity>

            <TextInput
        label={`${TOOL_ICONS.maintenance.notes} ملاحظات الصيانة`}
        value={values.maintenanceNotes}
        onChangeText={(text) => setFieldValue('maintenanceNotes', text)}
        multiline
        numberOfLines={4}
      />
    </View>
  );

  const renderInstructionsSection = (values: FormData, setFieldValue: any) => (
    <View style={[styles.section, { width }]}>
            <TextInput
        label={`${TOOL_ICONS.instructions.usage} تعليمات الاستخدام`}
        value={values.usageInstructions}
        onChangeText={(text) => setFieldValue('usageInstructions', text)}
        multiline
        numberOfLines={4}
            />

            <TextInput
        label={`${TOOL_ICONS.instructions.safety} إرشادات السلامة`}
        value={values.safetyGuidelines}
        onChangeText={(text) => setFieldValue('safetyGuidelines', text)}
              multiline
              numberOfLines={4}
            />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      {renderSectionHeader()}
      {renderProgressBar()}

      <Formik
        initialValues={initialFormData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, handleSubmit, errors, touched }) => (
          <>
            <ScrollView 
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={[styles.sectionsContainer, animatedStyle]}>
                {renderBasicSection(values, setFieldValue, errors, touched)}
                {renderPurchaseSection(values, setFieldValue, errors, touched)}
                {renderLocationSection(values, setFieldValue)}
                {renderMaintenanceSection(values, setFieldValue)}
                {renderInstructionsSection(values, setFieldValue)}
              </Animated.View>
            </ScrollView>

            <View style={[styles.footer, { 
              borderTopColor: theme.colors.neutral.border,
              padding: theme.spacing.md
            }]}>
              <View style={styles.navigationButtons}>
                {currentSection > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor: theme.colors.neutral.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.primary.base,
                        ...theme.shadows.small
                      }
                    ]}
                    onPress={handlePrevious}
                  >
                    <Text style={[
                      styles.navButtonText,
                      theme.typography.arabic.body,
                      { color: theme.colors.primary.base }
                    ]}>السابق ←</Text>
                  </TouchableOpacity>
                )}
                {currentSection < SECTIONS.length - 1 ? (
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor: theme.colors.primary.base,
                        ...theme.shadows.small
                      }
                    ]}
                    onPress={handleNext}
                  >
                    <Text style={[
                      styles.navButtonText,
                      theme.typography.arabic.body,
                      { color: theme.colors.neutral.surface }
                    ]}>→ التالي</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor: loading ? theme.colors.primary.disabled : theme.colors.primary.base,
                        ...theme.shadows.small
                      }
                    ]}
                onPress={() => handleSubmit()}
                disabled={loading}
                  >
                    <Text style={[
                      styles.navButtonText,
                      theme.typography.arabic.body,
                      { color: theme.colors.neutral.surface }
                    ]}>
                      {loading ? 'جاري الحفظ...' : 'حفظ ✅'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showPurchaseDatePicker && (
              <DateTimePicker
                value={values.purchaseDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowPurchaseDatePicker(false);
                  if (date) {
                    setFieldValue('purchaseDate', date);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            {showLastMaintenanceDatePicker && (
              <DateTimePicker
                value={values.lastMaintenanceDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowLastMaintenanceDatePicker(false);
                  if (date) {
                    setFieldValue('lastMaintenanceDate', date);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            {showNextMaintenanceDatePicker && (
              <DateTimePicker
                value={values.nextMaintenanceDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowNextMaintenanceDatePicker(false);
                  if (date) {
                    setFieldValue('nextMaintenanceDate', date);
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  sectionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 32,
  },
  sectionTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    padding: 20,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    height: 60,
  },
  progressLine: {
    position: 'absolute',
    height: 3,
    top: '50%',
    left: '10%',
    zIndex: 0,
    width: '80%',
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressStepText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressStepLabel: {
    position: 'absolute',
    bottom: -25,
    fontSize: 20,
  },
  formContainer: {
    flex: 1,
  },
  sectionsContainer: {
    flexDirection: 'row',
  },
  section: {
    padding: 20,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontWeight: 'bold',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  dateButtonText: {
    fontSize: 18,
    textAlign: 'center',
  },
  select: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  nameSelectionContainer: {
    marginBottom: 20,
  },
  nameSelectionButton: {
    width: '100%',
  },
  categorySection: {
    marginTop: 20,
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCard: {
    minHeight: 100,
  },
  conditionSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conditionButton: {
    minHeight: 80,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  categoryDisplay: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolSelector: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
  },
  toolItem: {
    paddingVertical: 12,
  },
  toolItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 28,
    marginRight: 10,
    width: 40,
    textAlign: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '500',
  },
  toolCategory: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 2,
  },
  customToolButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  customToolButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddToolScreen; 