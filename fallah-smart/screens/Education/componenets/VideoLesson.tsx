import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ScrollView, Animated, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../../theme/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import Chat from './Chat';
import QuestionAndAnswer from './QuestionAndAnswer';

interface VideoData {
  id: string;
  title: string;
  category: string;
  youtubeId?: string;
  additionalVideos?: Array<{
    id: string;
    title: string;
    youtubeId: string;
  }>;
}

const videoDatabase: { [key: string]: VideoData } = {
  // Animal videos (1-7)
  'animal_1': {
    id: '1',
    title: 'تربية الأبقار الحديثة',
    category: 'ماشية',
    youtubeId: 'QKRoup18Fgw',
    additionalVideos: [
      {
        id: '1_2',
        title: 'تغذية الأبقار',
        youtubeId: 'xZYjCZF5EdU'
      },
      {
        id: '1_3',
        title: 'الرعاية الصحية للأبقار',
        youtubeId: 'f1yhB1_hjIA'
      }
    ]
  },
  'animal_2': {
    id: '2',
    title: 'كيف أبدأ مشروع تربية الأغنام',
    category: 'ماشية',
    youtubeId: 'fwnd8G6QzrA',
    additionalVideos: [
      {
        id: '2_2',
        title: 'الطريقة الصحيحة لمشروع تسمين وتربية الاغنام',
        youtubeId: 'tFog0M9F7uU'
      },
      {
        id: '2_3',
        title: 'كمية العلف اللي تأكلها الاغنام في اليوم',
        youtubeId: '2qLN2hs50Js'
      }
    ]
  },
  'animal_3': {
    id: '3',
    title: 'مشروع تربية الماعز',
    category: 'ماشية',
    youtubeId: 'sNaX0vW49eM',
    additionalVideos: [
      {
        id: '3_2',
        title: 'أحسن طريقة لتغدية الماعز الحامل',
        youtubeId: '2lGIqw7UwOs'
      },
      {
        id: '3_3',
        title: 'تربية و تسمين الماعز',
        youtubeId: 'qYUO5hmFNPw'
      }
    ]
  },
  'animal_4': {
    id: '4',
    title: 'تربية الدجاج',
    category: 'دواجن',
    youtubeId: 'zxyCIe_aHtA',
    additionalVideos: [
      {
        id: '4_2',
        title: 'العناية صحية دجاج',
        youtubeId: 'ZU71Ph7x3nw'
      }
    ]
  },
  'animal_5': {
    id: '5',
    title: 'تربية الديك الرومي',
    category: 'دواجن',
    youtubeId: 'v7--lm62-6k',
    additionalVideos: [
      {
        id: '5_2',
        title: 'رعاية صحية لتربية الديك الرومي',
        youtubeId: 'rSiM4aR4J2Y'
      },
      {
        id: '5_3',
        title: 'تغذية الديك الرومي',
        youtubeId: 'gJkTROAjeIk'
      }
    ]
  },
  'animal_6': {
    id: '6',
    title: 'تربية الأرانب',
    category: 'حيوانات صغيرة',
    youtubeId: '4LXPTxD8RfU',
    additionalVideos: [
      {
        id: '6_2',
        title: 'أهم الأطعمة التي تتناولها الأرانب',
        youtubeId: 'WcGQ_F8vkUI'
      },
      {
        id: '6_3',
        title: 'كيفية تربية الأرانب للمبتدئين',
        youtubeId: '0C3RxquOh4U'
      }
    ]
  },
  'animal_7': {
    id: '7',
    title: 'تربية الحمام',
    category: 'طيور',
    youtubeId: '_gKrB826spA',
    additionalVideos: [
      {
        id: '7_2',
        title: 'تغذية الحمام',
        youtubeId: 'bUzhzkB-afA'
      },
      {
        id: '7_3',
        title: 'رعاية صحية',
        youtubeId: 'V6oBk19uLfA'
      }
    ]
  },

  // Crop videos (1-31)
  'crop_1': {
    id: '1',
    title: 'برنامج تسميد القمح',
    category: 'الحبوب والأرز',
    youtubeId: 's_fIQIdJUAc',
    additionalVideos: [
      {
        id: '1_2',
        title: 'أسرار نجاح محصول القمح',
        youtubeId: 'RtDqKK1ENCU'
      },
      {
        id: '1_3',
        title: 'زراعة القمح',
        youtubeId: 'lHgzdBq9eoY'
      }
    ]
  },
  'crop_2': {
    id: '2',
    title: 'الإبتكاراالعلمي والإبداع في زراعة الأرز',
    category: 'الحبوب والأرز',
    youtubeId: '6bzTBBiCa1g',
    additionalVideos: [
      {
        id: '2_2',
        title: 'كيفية زراعة الأرز',
        youtubeId: '-ajruOGRPL4'
      },
      {
        id: '2_3',
        title: 'برنامج تسميد الأرز',
        youtubeId: 'DR_rG6t-spo'
      }
    ]
  },
  'crop_3': {
    id: '3',
    title: 'افضل طريقة لزراعة الذرة',
    category: 'الحبوب والأرز',
    youtubeId: 'S3OyZZM7akk',
    additionalVideos: [
      {
        id: '3_2',
        title: 'تعرف على اسرار تسميد الذره',
        youtubeId: 'Gv1qh38yVe0'
      },
      {
        id: '3_3',
        title: 'معلومات عن الذره',
        youtubeId: '_TGLl0AwKTI'
      }
    ]
  },
  'crop_4': {
    id: '4',
    title: 'زراعة الشعير',
    category: 'الحبوب والأرز',
    youtubeId: 'BbtrmUdkd28',
    additionalVideos: [
      {
        id: '4_2',
        title: 'كلام مهم في تسميد الشعير لزيادة الإنتاجية',
        youtubeId: 'xO8COx1WkrQ'
      },
      {
        id: '4_3',
        title: 'مواعيد زراعة الشعير',
        youtubeId: '9dU00IQGLGk'
      }
    ]
  },
  'crop_5': {
    id: '5',
    title: 'مواعيد زراعة الطماطم',
    category: 'الخضروات',
    youtubeId: 'HOOVGXZcqVg',
    additionalVideos: [
      {
        id: '5_2',
        title: 'برنامج تسميد الطماطم',
        youtubeId: 'LX3FoFMzQv8'
      },
      {
        id: '5_3',
        title: 'فوائد الطماطم للجسم',
        youtubeId: 'V1dSVwfFeaA'
      }
    ]
  },
  'crop_6': {
    id: '6',
    title: 'معلومات عن زراعة البطاطس',
    category: 'الخضروات',
    youtubeId: '1Y00p8gMQRg',
    additionalVideos: [
      {
        id: '6_2',
        title: 'برنامج تسميد البطاطس',
        youtubeId: 'N7jbAV71zpg'
      },
      {
        id: '6_3',
        title: 'أحسن توقيت لزراعة البطاطا',
        youtubeId: 'QWhZIBu7kDE'
      },
      {
        id: '6_4',
        title: 'كيفية زراعة البطاطا',
        youtubeId: 'pSI9Am-fMHY'
      },
      {
        id: '6_5',
        title: 'مدة وأفضل أوقات ري محصول البطاطس',
        youtubeId: '7Hsuhd3fRDI'
      }
    ]
  },
  'crop_7': {
    id: '7',
    title: 'زراعة الباذنجان',
    category: 'الخضروات',
    youtubeId: 'C2w0hX74grM',
    additionalVideos: [
      {
        id: '7_2',
        title: 'مواعيد زراعة الباذنجان',
        youtubeId: 'IeNX3RRwowU'
      },
      {
        id: '7_3',
        title: 'برنامج تسميد للباذنجان ',
        youtubeId: 'D-QSOhgtF_4'
      }
    ]
  },
  'crop_8': {
    id: '8',
    title: 'اسهل طريقة لزراعة الخيار البلدي',
    category: 'الخضروات',
    youtubeId: '7kMX3emSnQA',
    additionalVideos: [
      {
        id: '8_2',
        title: 'برنامج تسميد الخيار',
        youtubeId: 'aAS2fty3LX8'
      }
    ]
  },
  'crop_9': {
    id: '9',
    title: 'برنامج تسميد الجزر',
    category: 'الخضروات',
    youtubeId: '-ocpBmkhBQY',
    additionalVideos: [
      {
        id: '9_2',
        title: 'زراعة الجزر',
        youtubeId: '6g1zqA8u_o0'
      },
      {
        id: '9_3',
        title: 'فوائد الجزر على جسم الإنسان',
        youtubeId: 'VF5z7Isks7s'
      }
    ]
  },
  'crop_10': {
    id: '10',
    title: 'افضل طريقة لزراعة بصل',
    category: 'الخضروات',
    youtubeId: '2mCO1vooaa4',
    additionalVideos: [
      {
        id: '10_2',
        title: 'برنامج تسميد بصل',
        youtubeId: 'wD9ExySPuxA'
      },
      {
        id: '10_3',
        title: 'معلومات صحية مفيدة حول فوائد البصل الاخضر',
        youtubeId: 'Y09n_aj9EiE'
      }
    ]
  },
  'crop_11': {
    id: '11',
    title: 'افضل طريقة لزراعة الثوم',
    category: 'الخضروات',
    youtubeId: 'cbK9eu6Baj8',
    additionalVideos: [
      {
        id: '11_2',
        title: 'معلومات صحية مفيدة حول فوائد الثوم',
        youtubeId: 'mNCK2X5goZc'
      },
      {
        id: '11_3',
        title: 'برنامج تسميد الثوم',
        youtubeId: 'ohhkGvMq9Gw'
      }
    ]
  },
  'crop_12': {
    id: '12',
    title: 'افضل طريقة لزراعة الفلفل',
    category: 'الخضروات',
    youtubeId: 'IC-QQ-k1IIg',
    additionalVideos: [
      {
        id: '12_2',
        title: 'برنامج تسميد الفلفل',
        youtubeId: 'OV5Wam56Rys'
      }
    ]
  },
  'crop_13': {
    id: '13',
    title: 'برنامج تسميد البامية',
    category: 'الخضروات',
    youtubeId: 'SBhDGdOWQrI',
    additionalVideos: [
      {
        id: '13_2',
        title: 'افضل طريقة لزراعة البامية',
        youtubeId: '3mEXySbeC_Q'
      }
    ]
  },
  'crop_14': {
    id: '14',
    title: 'أفضل طريقة لزراعة الكوسة',
    category: 'الخضروات',
    youtubeId: 'pEikXYnslEg',
    additionalVideos: [
      {
        id: '14_2',
        title: 'برنامج تسميد الكوسة',
        youtubeId: 'KUSwzxGtzAA'
      }
    ]
  },
  'crop_15': {
    id: '15',
    title: 'زراعة الملفوف',
    category: 'الخضروات'
  },
  'crop_16': {
    id: '16',
    title: 'زراعة الفول',
    category: 'البقوليات',
    youtubeId: 'K1mqX7e9ChI',
    additionalVideos: [
      {
        id: '16_2',
        title: 'برنامج تسميد الفول',
        youtubeId: 'd4rqJOD2aHU'
      }
    ]
  },
  'crop_17': {
    id: '17',
    title: 'كيفية زراعة العدس',
    category: 'البقوليات',
    youtubeId: 'zQdAch0EpBg',
    additionalVideos: [
      {
        id: '17_2',
        title: 'مواعيد زراعة العدس',
        youtubeId: 'ewGZiMnf_nY'
      }
    ]
  },
  'crop_18': {
    id: '18',
    title: 'كيف تزرع الحمص',
    category: 'البقوليات',
    youtubeId: 'GPsyDSfb-Ug',
    additionalVideos: [
      {
        id: '18_2',
        title: 'مواعيد زراعة الحمص',
        youtubeId: 'OLGd3jT4KXE'
      }
    ]
  },
  'crop_19': {
    id: '19',
    title: 'زراعة الفاصوليا',
    category: 'البقوليات'
  },
  'crop_20': {
    id: '20',
    title: 'زراعة شجرة البرتقال من البذور',
    category: 'الفواكه',
    youtubeId: 'CWnz8zrJ1Bk',
    additionalVideos: [
      {
        id: '20_2',
        title: 'كيفية زراعة شجرة البرتقال',
        youtubeId: 'AOrcj2a4cpY'
      },
      {
        id: '20_3',
        title: 'تسميد شجيرات البرتقال',
        youtubeId: '6s8kUJ3ODa4'
      }
    ]
  },
  'crop_21': {
    id: '21',
    title: 'برنامج تسميد الليمون',
    category: 'الفواكه',
    youtubeId: 'D-flKpnUTSc',
    additionalVideos: [
      {
        id: '21_2',
        title: 'كيفية زراعة الليمون',
        youtubeId: 'ygW3Vt6GRpo'
      }
    ]
  },
  'crop_22': {
    id: '22',
    title: 'كيفية زراعة العنب',
    category: 'الفواكه',
    youtubeId: 'u3vQmsZoRm4',
    additionalVideos: [
      {
        id: '22_2',
        title: 'برنامج تسميد العنب',
        youtubeId: 'XT4IlANxt-w'
      }
    ]
  },
  'crop_23': {
    id: '23',
    title: 'زراعة افضل شجرة تفاح من خلال العقل بكل سهولة',
    category: 'الفواكه',
    youtubeId: 'jQ6m9XxcYIo',
    additionalVideos: [
      {
        id: '23_2',
        title: 'برنامج تسميد التفاح',
        youtubeId: 'a7ZoTqwYO8c'
      }
    ]
  },
  'crop_24': {
    id: '24',
    title: 'كيفية زراعة المانجو',
    category: 'الفواكه',
    youtubeId: 'oaDeWdBuoe0'
  },
  'crop_25': {
    id: '25',
    title: 'كيفية زراعة الموز',
    category: 'الفواكه',
    youtubeId: 'n6lUQeWNJn4',
    additionalVideos: [
      {
        id: '25_2',
        title: 'نصائح مهمه بالعناية ب اشجار الموز وثمارها',
        youtubeId: 'OZSK3FDHRMI'
      }
    ]
  },
  'crop_26': {
    id: '26',
    title: 'برنامج ري التين',
    category: 'الفواكه',
    youtubeId: 'JKdBEiBxLWw',
    additionalVideos: [
      {
        id: '26_2',
        title: 'تعلم طريقة زراعة التين',
        youtubeId: 'i8svQ4dSD5Q'
      }
    ]
  },
  'crop_27': {
    id: '27',
    title: 'أفضل طريقة لزراعة الرمان',
    category: 'الفواكه',
    youtubeId: 'SclKgxC3XZg',
    additionalVideos: [
      {
        id: '27_2',
        title: 'نصائح مهمه بالعناية ب اشجار الرمان وثمارها',
        youtubeId: 'g809YSDNfl4'
      }
    ]
  },
  'crop_28': {
    id: '28',
    title: 'كيفية زراعة المشمش',
    category: 'الفواكه',
    youtubeId: 'XLCdPP56tag',
    additionalVideos: [
      {
        id: '28_2',
        title: 'نصائح مهمه بالعناية ب اشجار المشمش وثمارها',
        youtubeId: 'H3oWQYEp35E'
      }
    ]
  },
  'crop_29': {
    id: '29',
    title: 'كيفية زراعة الخوخ',
    category: 'الفواكه',
    youtubeId: 'GCo0xKaOeK8',
    additionalVideos: [
      {
        id: '29_2',
        title: 'كيفية العناية الخوخ',
        youtubeId: 'YGva0_x4P0o'
      }
    ]
  },
  'crop_30': {
    id: '30',
    title: 'كيفية زراعة عباد الشمس',
    category: 'المحاصيل الزيتية',
    youtubeId: 'QNjqFlmbHvQ',
    additionalVideos: [
      {
        id: '30_2',
        title: 'نصائح زراعية',
        youtubeId: 'WWFqzjcq4I0'
      }
    ]
  },
  'crop_31': {
    id: '31',
    title: 'كيفية زراعة زيتون',
    category: 'المحاصيل الزيتية',
    youtubeId: 'Dd5pFBqx1uM',
    additionalVideos: [
      {
        id: '31_2',
        title: 'كيفية العناية بشجرة زيتون',
        youtubeId: 'b4h_jyWjKNQ'
      },
      {
        id: '31_3',
        title: 'كم من مرة نسقي زيتون',
        youtubeId: '89YGYBjYsr4'
      },
      {
        id: '31_4',
        title: 'نوعية الأسمدة لي شجرة زيتون',
        youtubeId: 'gu_d8tJtmlg'
      }
    ]
  }
};

const VideoLesson = () => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  
  const route = useRoute();
  const navigation = useNavigation();
  
  const { videoId, type } = route.params as { videoId: string; type: 'animal' | 'crop' };
  const videoKey = `${type}_${videoId}`;
  const videoData = videoDatabase[videoKey];

  useEffect(() => {
    if (videoData?.youtubeId) {
      setSelectedVideoId(videoData.youtubeId);
    }
  }, [videoData]);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? 0 : 1;
    Animated.spring(sidebarAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 50
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!videoData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>عذراً، هذا الفيديو غير متوفر حالياً</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>العودة للدروس</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{videoData.title}</Text>
          <Text style={styles.category}>{videoData.category}</Text>
        </View>
        {videoData.additionalVideos && (
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        <ScrollView style={styles.mainContent}>
          <View style={styles.videoWrapper}>
            <WebView
              source={{
                uri: `https://www.youtube.com/embed/${selectedVideoId}?playsinline=1&rel=0&showinfo=0&modestbranding=1`
              }}
              style={styles.video}
              allowsFullscreenVideo={true}
              javaScriptEnabled={true}
            />
          </View>

          <View style={styles.questionSection}>
            <QuestionAndAnswer videoId={videoId} />
          </View>
        </ScrollView>

        <Animated.View 
          style={[
            styles.sidebar,
            {
              transform: [{
                translateX: sidebarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Related Videos</Text>
            <TouchableOpacity onPress={toggleSidebar}>
              <Ionicons name="close" size={24} color={theme.colors.neutral.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity
              style={[
                styles.videoItem,
                selectedVideoId === videoData.youtubeId && styles.selectedVideoItem
              ]}
              onPress={() => setSelectedVideoId(videoData.youtubeId!)}
            >
              <Text style={styles.videoItemText}>{videoData.title}</Text>
            </TouchableOpacity>
            {videoData.additionalVideos?.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={[
                  styles.videoItem,
                  selectedVideoId === video.youtubeId && styles.selectedVideoItem
                ]}
                onPress={() => setSelectedVideoId(video.youtubeId)}
              >
                <Text style={styles.videoItemText}>{video.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Help Button */}
      <TouchableOpacity 
        onPress={() => setIsChatVisible(!isChatVisible)} 
        style={[
          styles.helpButton,
          isChatVisible && styles.helpButtonActive
        ]}
      >
        <Text style={styles.helpButtonText}>مساعدة</Text>
      </TouchableOpacity>

      {/* Chat Overlay */}
      {isChatVisible && (
        <>
          <TouchableWithoutFeedback onPress={() => setIsChatVisible(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={styles.chatOverlayContainer}>
            <View style={styles.chatOverlay}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>المساعد الذكي</Text>
                <TouchableOpacity 
                  onPress={() => setIsChatVisible(false)}
                  style={styles.closeChatButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.neutral.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.chatWrapper}>
                <Chat visible={true} />
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary.base,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  category: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 300,
    backgroundColor: theme.colors.neutral.surface,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.neutral.gray.light,
    ...theme.shadows.large,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.light,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
  },
  videoItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.light,
  },
  selectedVideoItem: {
    backgroundColor: `${theme.colors.primary.base}15`,
  },
  videoItemText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  helpButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    ...theme.shadows.medium,
    zIndex: 2,
  },
  helpButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  helpButtonActive: {
    backgroundColor: theme.colors.primary.light,
  },
  chatOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  chatOverlay: {
    width: '100%',
    height: '80%',
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    ...theme.shadows.large,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary.base,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  chatTitle: {
    flex: 1,
    color: theme.colors.neutral.surface,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  closeChatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  chatWrapper: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  questionSection: {
    flex: 1,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.neutral.background,
  },
});

export default VideoLesson; 

/*
Example usage from another component:

import { useNavigation } from '@react-navigation/native';

const SomeComponent = () => {
  const navigation = useNavigation();
  
  const openVideoLesson = () => {
    navigation.navigate('VideoLesson', {
      videoId: 'Uoen6G_Eu8I',
      type: 'animal'
    });
  };
  
  return (
    <Button title="Watch Video Lesson" onPress={openVideoLesson} />
  );
};
*/ 