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
  StatusBar,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TOOL_TYPES, TOOL_STATUS, TOOL_CONDITION, TOOL_ICONS, ToolType, ToolStatus, ToolCondition } from './constants';
import { storage } from '../../../utils/storage';
import axios from 'axios';
import { Animated } from 'react-native';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type ToolDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'ToolDetail'>;
  route: RouteProp<StockStackParamList, 'ToolDetail'>;
};

interface Tool {
  id: string;
  name: string;
  quantity: number;
  minQuantityAlert: number;
  category: ToolType;
  status: ToolStatus;
  condition: ToolCondition;
  purchaseDate: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  maintenanceInterval: number | null;
  brand: string;
  model: string;
  purchasePrice: number | null;
  replacementCost: number | null;
  storageLocation: string;
  assignedTo: string;
  maintenanceNotes: string;
  usageInstructions: string;
  safetyGuidelines: string;
}

const ToolDetailScreen: React.FC<ToolDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTool, setEditedTool] = useState<Tool | null>(null);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showLastMaintenanceDatePicker, setShowLastMaintenanceDatePicker] = useState(false);
  const [showNextMaintenanceDatePicker, setShowNextMaintenanceDatePicker] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    fetchToolDetails();
  }, [route.params.id]);

  const fetchToolDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/tools/${route.params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens?.access}`
          }
        }
      );

      if (response.data) {
        setTool(response.data);
        setEditedTool(response.data);
      }
    } catch (error) {
      console.error('Error fetching tool details:', error);
      setError('فشل في تحميل تفاصيل الأداة');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editedTool) return;

    try {
      setLoading(true);
      const tokens = await storage.getTokens();
      
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/tools/${route.params.id}`,
        editedTool,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens?.access}`
          }
        }
      );

      if (response.data) {
        setTool(response.data);
        setEditedTool(response.data);
        setIsEditing(false);
        Alert.alert('نجاح', 'تم تحديث الأداة بنجاح');
      }
    } catch (error) {
      console.error('Error updating tool:', error);
      Alert.alert('خطأ', 'فشل في تحديث الأداة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه الأداة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const tokens = await storage.getTokens();
              
              await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/stock/tools/${route.params.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokens?.access}`
                  }
                }
              );

              navigation.goBack();
            } catch (error) {
              console.error('Error deleting tool:', error);
              Alert.alert('خطأ', 'فشل في حذف الأداة');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleEdit = () => {
    if (isEditing) {
      setEditedTool(tool);
    }
    setIsEditing(!isEditing);
  };

  const renderStatusIcon = (status: ToolStatus) => {
    return TOOL_STATUS[status].icon;
  };

  const renderInfoRow = (label: string, value: string | number | null, icon?: string) => {
    if (!value) return null;
    return (
      <View style={[
        styles.infoRow,
        {
          borderBottomColor: theme.colors.neutral.border,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.neutral.surface,
          borderRadius: theme.borderRadius.small,
          ...theme.shadows.small
        }
      ]}>
        <Text style={[
          styles.label,
          theme.typography.arabic.caption,
          { color: theme.colors.neutral.textSecondary }
        ]}>
          {icon} {label}
        </Text>
        <Text style={[
          styles.value,
          theme.typography.arabic.caption,
          { color: theme.colors.neutral.textPrimary }
        ]}>
          {value}
        </Text>
      </View>
    );
  };

  const renderSection = (title: string, icon: string, content: React.ReactNode) => {
    return (
      <Animated.View style={[
        styles.section,
        {
          backgroundColor: theme.colors.neutral.surface,
          borderRadius: theme.borderRadius.medium,
          ...theme.shadows.small,
          margin: theme.spacing.sm
        }
      ]}>
        <View style={[
          styles.sectionHeader,
          {
            backgroundColor: theme.colors.primary.surface,
            borderTopLeftRadius: theme.borderRadius.medium,
            borderTopRightRadius: theme.borderRadius.medium,
            padding: theme.spacing.sm
          }
        ]}>
          <Text style={[
            styles.sectionTitle,
            theme.typography.arabic.h3,
            { color: theme.colors.primary.base }
          ]}>
            {icon} {title}
          </Text>
        </View>
        <View style={{ padding: theme.spacing.sm, gap: theme.spacing.xs }}>
          {content}
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <Text style={{ color: theme.colors.neutral.textSecondary }}>جاري التحميل...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
        <Button title="إعادة المحاولة" onPress={fetchToolDetails} />
      </View>
    );
  }

  if (!tool || !editedTool) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <Text style={{ color: theme.colors.neutral.textSecondary }}>لم يتم العثور على الأداة</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        {isEditing ? (
          <View style={[styles.form, { padding: theme.spacing.md, gap: theme.spacing.md }]}>
            <TextInput
              label={`${TOOL_ICONS.basic.name} اسم الأداة`}
              value={editedTool.name}
              onChangeText={(text) => setEditedTool({ ...editedTool, name: text })}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label={`${TOOL_ICONS.basic.quantity} الكمية`}
                  value={String(editedTool.quantity)}
                  onChangeText={(text) => setEditedTool({ ...editedTool, quantity: Number(text) })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  label={`${TOOL_ICONS.basic.minQuantity} حد التنبيه`}
                  value={String(editedTool.minQuantityAlert)}
                  onChangeText={(text) => setEditedTool({ ...editedTool, minQuantityAlert: Number(text) })}
                  keyboardType="numeric"
                />
        </View>
      </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  {TOOL_ICONS.basic.category} النوع
            </Text>
                <TouchableOpacity
                  style={[styles.select, { borderColor: theme.colors.neutral.border }]}
                  onPress={() => {
                    Alert.alert(
                      'اختر النوع',
                      '',
                      Object.entries(TOOL_TYPES).map(([key, value]) => ({
                        text: `${value.icon} ${value.name}`,
                        onPress: () => setEditedTool({ ...editedTool, category: key as ToolType })
                      }))
                    );
                  }}
                >
                  <Text style={{ color: theme.colors.neutral.textPrimary }}>
                    {TOOL_TYPES[editedTool.category].icon} {TOOL_TYPES[editedTool.category].name}
            </Text>
                </TouchableOpacity>
          </View>
              <View style={styles.halfInput}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  {TOOL_ICONS.basic.condition} الحالة
            </Text>
                <TouchableOpacity
                  style={[styles.select, { borderColor: theme.colors.neutral.border }]}
                  onPress={() => {
                    Alert.alert(
                      'اختر الحالة',
                      '',
                      Object.entries(TOOL_CONDITION).map(([key, value]) => ({
                        text: `${value.icon} ${value.name}`,
                        onPress: () => setEditedTool({ ...editedTool, condition: key as ToolCondition })
                      }))
                    );
                  }}
                >
                  <Text style={{ color: theme.colors.neutral.textPrimary }}>
                    {TOOL_CONDITION[editedTool.condition].icon} {TOOL_CONDITION[editedTool.condition].name}
            </Text>
                </TouchableOpacity>
          </View>
        </View>

            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPurchaseDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  {TOOL_ICONS.purchase.date} {editedTool.purchaseDate
                    ? new Date(editedTool.purchaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'تاريخ الشراء'}
          </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowLastMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  {TOOL_ICONS.maintenance.last} {editedTool.lastMaintenanceDate
                    ? new Date(editedTool.lastMaintenanceDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'تاريخ آخر صيانة'}
              </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowNextMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  {TOOL_ICONS.maintenance.next} {editedTool.nextMaintenanceDate
                    ? new Date(editedTool.nextMaintenanceDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'تاريخ الصيانة القادمة'}
              </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label={`${TOOL_ICONS.purchase.brand} الشركة المصنعة`}
              value={editedTool.brand}
              onChangeText={(text) => setEditedTool({ ...editedTool, brand: text })}
            />

            <TextInput
              label={`${TOOL_ICONS.purchase.model} الموديل`}
              value={editedTool.model}
              onChangeText={(text) => setEditedTool({ ...editedTool, model: text })}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label={`${TOOL_ICONS.purchase.price} سعر الشراء`}
                  value={editedTool.purchasePrice ? String(editedTool.purchasePrice) : ''}
                  onChangeText={(text) => setEditedTool({ ...editedTool, purchasePrice: Number(text) })}
                  keyboardType="numeric"
                />
            </View>
              <View style={styles.halfInput}>
                <TextInput
                  label={`${TOOL_ICONS.purchase.price} تكلفة الاستبدال`}
                  value={editedTool.replacementCost ? String(editedTool.replacementCost) : ''}
                  onChangeText={(text) => setEditedTool({ ...editedTool, replacementCost: Number(text) })}
                  keyboardType="numeric"
                />
            </View>
            </View>

            <TextInput
              label={`${TOOL_ICONS.location.storage} موقع التخزين`}
              value={editedTool.storageLocation}
              onChangeText={(text) => setEditedTool({ ...editedTool, storageLocation: text })}
            />

            <TextInput
              label={`${TOOL_ICONS.location.assigned} المستخدم الحالي`}
              value={editedTool.assignedTo}
              onChangeText={(text) => setEditedTool({ ...editedTool, assignedTo: text })}
            />

            <TextInput
              label={`${TOOL_ICONS.maintenance.notes} ملاحظات الصيانة`}
              value={editedTool.maintenanceNotes}
              onChangeText={(text) => setEditedTool({ ...editedTool, maintenanceNotes: text })}
              multiline
              numberOfLines={4}
            />

            <TextInput
              label={`${TOOL_ICONS.instructions.usage} تعليمات الاستخدام`}
              value={editedTool.usageInstructions}
              onChangeText={(text) => setEditedTool({ ...editedTool, usageInstructions: text })}
              multiline
              numberOfLines={4}
            />

            <TextInput
              label={`${TOOL_ICONS.instructions.safety} إرشادات السلامة`}
              value={editedTool.safetyGuidelines}
              onChangeText={(text) => setEditedTool({ ...editedTool, safetyGuidelines: text })}
              multiline
              numberOfLines={4}
            />

            <View style={[styles.buttonContainer, { gap: theme.spacing.md }]}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.primary.base,
                    ...theme.shadows.small
                  }
                ]}
                onPress={toggleEdit}
              >
                <Text style={[
                  theme.typography.arabic.body,
                  { color: theme.colors.primary.base }
                ]}>
                  إلغاء
              </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.colors.primary.base,
                    ...theme.shadows.small
                  }
                ]}
                onPress={handleUpdate}
                disabled={loading}
              >
                <Text style={[
                  theme.typography.arabic.body,
                  { color: theme.colors.neutral.surface }
                ]}>
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
              </Text>
              </TouchableOpacity>
            </View>
        </View>
        ) : (
          <>
            {renderSection('معلومات أساسية', TOOL_ICONS.sections.basic, (
              <>
                {renderInfoRow('اسم الأداة', tool.name, TOOL_ICONS.basic.name)}
                {renderInfoRow('الكمية', tool.quantity, TOOL_ICONS.basic.quantity)}
                {renderInfoRow('حد التنبيه', tool.minQuantityAlert, TOOL_ICONS.basic.minQuantity)}
                {renderInfoRow('النوع', `${TOOL_TYPES[tool.category].icon} ${TOOL_TYPES[tool.category].name}`, TOOL_ICONS.basic.category)}
                {renderInfoRow('الحالة', `${TOOL_STATUS[tool.status].icon} ${TOOL_STATUS[tool.status].name}`, TOOL_ICONS.basic.status)}
                {renderInfoRow('الحالة', `${TOOL_CONDITION[tool.condition].icon} ${TOOL_CONDITION[tool.condition].name}`, TOOL_ICONS.basic.condition)}
              </>
            ))}

            {renderSection('معلومات الشراء', TOOL_ICONS.sections.purchase, (
              <>
                {tool.purchaseDate && renderInfoRow('تاريخ الشراء', new Date(tool.purchaseDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }), TOOL_ICONS.purchase.date)}
                {renderInfoRow('الشركة المصنعة', tool.brand, TOOL_ICONS.purchase.brand)}
                {renderInfoRow('الموديل', tool.model, TOOL_ICONS.purchase.model)}
                {renderInfoRow('سعر الشراء', tool.purchasePrice, TOOL_ICONS.purchase.price)}
                {renderInfoRow('تكلفة الاستبدال', tool.replacementCost, TOOL_ICONS.purchase.price)}
              </>
            ))}

            {renderSection('معلومات الموقع', TOOL_ICONS.sections.location, (
              <>
                {renderInfoRow('موقع التخزين', tool.storageLocation, TOOL_ICONS.location.storage)}
                {renderInfoRow('المستخدم الحالي', tool.assignedTo, TOOL_ICONS.location.assigned)}
              </>
            ))}

            {renderSection('معلومات الصيانة', TOOL_ICONS.sections.maintenance, (
              <>
                {tool.lastMaintenanceDate && renderInfoRow('تاريخ آخر صيانة', new Date(tool.lastMaintenanceDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }), TOOL_ICONS.maintenance.last)}
                {tool.nextMaintenanceDate && renderInfoRow('تاريخ الصيانة القادمة', new Date(tool.nextMaintenanceDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }), TOOL_ICONS.maintenance.next)}
                {renderInfoRow('فترة الصيانة (بالأيام)', tool.maintenanceInterval, TOOL_ICONS.maintenance.interval)}
                {renderInfoRow('ملاحظات الصيانة', tool.maintenanceNotes, TOOL_ICONS.maintenance.notes)}
              </>
            ))}

            {renderSection('التعليمات', TOOL_ICONS.sections.instructions, (
              <>
                {renderInfoRow('تعليمات الاستخدام', tool.usageInstructions, TOOL_ICONS.instructions.usage)}
                {renderInfoRow('إرشادات السلامة', tool.safetyGuidelines, TOOL_ICONS.instructions.safety)}
              </>
            ))}

            <View style={[
              styles.buttonContainer,
              {
                padding: theme.spacing.md,
                gap: theme.spacing.md,
                backgroundColor: theme.colors.neutral.surface,
                borderTopWidth: 1,
                borderTopColor: theme.colors.neutral.border
              }
            ]}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.primary.base,
                    ...theme.shadows.small
                  }
                ]}
                onPress={toggleEdit}
              >
                <Text style={[
                  theme.typography.arabic.body,
                  { color: theme.colors.primary.base }
                ]}>
                  تعديل
          </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.colors.error,
                    ...theme.shadows.small
                  }
                ]}
                onPress={handleDelete}
                disabled={loading}
              >
                <Text style={[
                  theme.typography.arabic.body,
                  { color: theme.colors.neutral.surface }
                ]}>
                  {loading ? 'جاري الحذف...' : 'حذف'}
              </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showPurchaseDatePicker && (
          <DateTimePicker
            value={editedTool.purchaseDate ? new Date(editedTool.purchaseDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowPurchaseDatePicker(false);
              if (date) {
                setEditedTool({ ...editedTool, purchaseDate: date.toISOString() });
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {showLastMaintenanceDatePicker && (
          <DateTimePicker
            value={editedTool.lastMaintenanceDate ? new Date(editedTool.lastMaintenanceDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowLastMaintenanceDatePicker(false);
              if (date) {
                setEditedTool({ ...editedTool, lastMaintenanceDate: date.toISOString() });
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {showNextMaintenanceDatePicker && (
          <DateTimePicker
            value={editedTool.nextMaintenanceDate ? new Date(editedTool.nextMaintenanceDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowNextMaintenanceDatePicker(false);
              if (date) {
                setEditedTool({ ...editedTool, nextMaintenanceDate: date.toISOString() });
              }
            }}
            minimumDate={new Date()}
          />
        )}
      </ScrollView>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  section: {
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    textAlign: 'center',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  select: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  dateContainer: {
    gap: 6,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
  },
  dateButtonText: {
    fontSize: 14,
  },
});

export default ToolDetailScreen; 