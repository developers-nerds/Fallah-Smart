"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Platform, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { theme } from "../../../theme/theme"
import DateTimePicker from "@react-native-community/datetimepicker"
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { RenderIcon } from "./RenderIcon" // Adjust path as needed

// Get screen dimensions
const { width, height } = Dimensions.get('window')

interface Category {
  id: number
  name: string
  icon: string
  type: string
  color: string
  amount?: number
  count?: number
  isIncome?: boolean
}

interface Transaction {
  id: number
  accountId: number
  amount: number
  note: string
  date: string
  type: string
  category: Category
}

export default function EditTransaction() {
  const [showCategories, setShowCategories] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isManualDateInput, setIsManualDateInput] = useState(false)
  const [manualDate, setManualDate] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  
  // Calculator-specific states
  const [firstOperand, setFirstOperand] = useState<string | null>(null)
  const [currentOperation, setCurrentOperation] = useState<string | null>(null)
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false)

  const navigation = useNavigation()
  const route = useRoute()
  const { transaction } = route.params as { transaction: Transaction }

  const API_BASE_URL = Platform.select({
    web: process.env.WEB_PUBLIC_API,
    default: process.env.EXPO_PUBLIC_API_URL 
  })

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString())
      setNote(transaction.note || "أضف ملاحظة")
      setSelectedCategory({
        id: transaction.category.id,
        name: transaction.category.name,
        icon: transaction.category.icon,
        type: transaction.category.type,
        color: transaction.category.color
      })
      setSelectedAccountId(transaction.accountId)
      const transDate = new Date(transaction.date)
      setDate(transDate)
      const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      setCurrentDate(transDate.toLocaleDateString("ar", options))
      // Verify transaction type matches component
      if (transaction.type.toLowerCase() !== 'expense' && transaction.type.toLowerCase() !== 'income') {
        console.warn(`Mismatch: Editing an ${transaction.type} transaction in EditTransaction`)
      }
    }
    fetchAccounts()
    fetchCategories()
  }, [transaction])

  const getUserIdFromToken = async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user')
      if (!userStr) {
        setError('لم يتم العثور على بيانات المستخدم. الرجاء تسجيل الدخول.')
        setLoading(false)
        return null
      }
      const userData = JSON.parse(userStr)
      return userData.id
    } catch (error) {
      setError('بيانات المستخدم غير صالحة. الرجاء تسجيل الدخول مرة أخرى.')
      setLoading(false)
      return null
    }
  }

  const fetchAccounts = async () => {
    const token = await AsyncStorage.getItem('@access_token')
    const userId = await getUserIdFromToken()
    if (!userId || !token) return

    try {
      const response = await axios.get(`${API_BASE_URL}/accounts`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      setAccounts(response.data)
    } catch (error) {
      setError('خطأ في جلب الحسابات: ' + (error.response?.data?.message || error.message))
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('@access_token')
      if (!token) {
        setError("لم يتم العثور على رمز التوثيق")
        return
      }
      // Dynamically fetch based on transaction.type
      const categoryType = transaction.type.toLowerCase() === 'income' ? 'Income' : 'Expense'
      const response = await axios.get(`${API_BASE_URL}/categories/type/${categoryType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log(`Fetched ${categoryType} categories response (EditTransaction):`, response.data)
      if (Array.isArray(response.data)) {
        const validCategories = response.data.filter(
          (category: any) => category && typeof category === 'object' && category.id && category.name
        )
        setCategories(validCategories)
        if (validCategories.length === 0) {
          setError(`لم يتم العثور على فئات صالحة لـ ${categoryType === 'Income' ? 'الدخل' : 'المصروف'}`)
        }
      } else {
        setError("تنسيق الاستجابة غير صالح: بيانات الفئات ليست مصفوفة")
        setCategories([])
      }
    } catch (err) {
      setError("فشل في جلب الفئات: " + err.message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTransaction = useCallback(async (category: Category) => {
    try {
      setIsSubmitting(true)
      setSubmitError("")

      const token = await AsyncStorage.getItem('@access_token')
      const userStr = await AsyncStorage.getItem('@user')
      
      if (!token || !userStr) {
        setSubmitError('الرجاء تسجيل الدخول أولاً')
        console.log("Missing token or user data")
        return
      }

      if (!selectedAccountId) {
        setSubmitError('لم يتم اختيار حساب. الرجاء المحاولة مرة أخرى.')
        console.log("No selectedAccountId")
        return
      }

      if (!category || !category.id) {
        setSubmitError('الرجاء اختيار فئة')
        console.log("Invalid category:", category)
        return
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setSubmitError('الرجاء إدخال مبلغ صالح')
        console.log("Invalid amount:", amount)
        return
      }

      const transactionData = {
        accountId: selectedAccountId,
        categoryId: category.id,
        amount: parseFloat(amount),
        type: transaction.type.toLowerCase(), // Use transaction.type dynamically
        note: note || "",
        date: date.toISOString()
      }

      console.log("Sending update request with data:", transactionData)

      const response = await axios.put(
        `${API_BASE_URL}/transactions/${transaction.id}`,
        transactionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      console.log("API Response:", response.data, "Status:", response.status)

      if (response.data.success) {
        console.log("Transaction updated successfully")
        navigation.goBack()
      } else {
        setSubmitError(response.data.message || 'فشل في تحديث المعاملة')
        console.log("Update failed with message:", response.data.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'خطأ غير معروف'
      setSubmitError(`فشل في تحديث المعاملة: ${errorMessage}`)
      console.error("Update error:", error.response?.data || error)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedAccountId, amount, note, date, transaction.id, transaction.type, navigation])

  const handleCategorySelect = useCallback((category: Category) => {
    console.log("Category selected:", category)
    setSelectedCategory(category)
    setShowCategories(false)
    setTimeout(() => handleUpdateTransaction(category), 100) // Slight delay to ensure state settles
  }, [handleUpdateTransaction])

  const handleDeleteTransaction = async () => {
    try {
      setIsSubmitting(true)
      const token = await AsyncStorage.getItem('@access_token')
      
      console.log("Deleting transaction:", transaction.id)
      await axios.delete(`${API_BASE_URL}/transactions/${transaction.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log("Transaction deleted successfully")
      navigation.goBack()
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'فشل في حذف المعاملة'
      setSubmitError(errorMessage)
      console.error("Delete error:", error.response?.data || error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNumberPress = (num: string) => {
    if (waitingForSecondOperand) {
      setAmount(num)
      setWaitingForSecondOperand(false)
    } else {
      setAmount((prev) => (prev === "0" || prev === "" ? num : prev + num))
    }
  }

  const handleOperatorPress = (operator: string) => {
    if (operator === "=") {
      if (firstOperand !== null && currentOperation !== null && amount !== "") {
        const result = calculateResult(
          parseFloat(firstOperand),
          parseFloat(amount),
          currentOperation
        )
        setAmount(result.toString())
        setFirstOperand(null)
        setCurrentOperation(null)
        setWaitingForSecondOperand(false)
      }
    } else if (operator === "C") {
      handleClear()
    } else {
      if (amount !== "") {
        if (firstOperand === null) {
          setFirstOperand(amount)
        } else if (currentOperation !== null) {
          const result = calculateResult(
            parseFloat(firstOperand),
            parseFloat(amount),
            currentOperation
          )
          setFirstOperand(result.toString())
        }
        setCurrentOperation(operator)
        setWaitingForSecondOperand(true)
      }
    }
  }

  const calculateResult = (
    first: number,
    second: number,
    operation: string
  ): number => {
    switch (operation) {
      case "+":
        return first + second
      case "-":
        return first - second
      case "×":
        return first * second
      case "÷":
        return second !== 0 ? first / second : NaN
      default:
        return second
    }
  }

  const handleClear = () => {
    setAmount("")
    setFirstOperand(null)
    setCurrentOperation(null)
    setWaitingForSecondOperand(false)
  }

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1))
  }

  const goBack = () => {
    navigation.goBack()
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date
    setShowDatePicker(false)
    setDate(currentDate)
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    setCurrentDate(currentDate.toLocaleDateString("ar", options))
    setManualDate(currentDate.toLocaleDateString("ar", options))
  }

  const handleManualDateChange = (text: string) => {
    setManualDate(text)
    setCurrentDate(text)
  }

  const toggleManualDateInput = () => {
    setIsManualDateInput(!isManualDateInput)
    if (!isManualDateInput) {
      setManualDate(currentDate)
    }
  }

  const renderCategoryItem = ({ item }: { item: Category }) => {
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          selectedCategory?.id === item.id && styles.selectedCategoryCard
        ]}
        onPress={() => handleCategorySelect(item)}
        disabled={isSubmitting}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <RenderIcon 
            icon={item.icon} 
            type={item.type} 
            size={width * 0.06} 
            color={item.color} 
            style={styles.categoryIcon}
          />
        </View>
        <Text style={styles.categoryCardText}>{item.name}</Text>
      </TouchableOpacity>
    )
  }

  const keypadButtons = [
    ["1", "2", "3", "+"],
    ["4", "5", "6", "-"],
    ["7", "8", "9", "×"],
    [".", "0", "C", "÷"],
    ["="],
  ]

  const renderKeypad = () => (
    <View style={styles.keypadContainer}>
      {keypadButtons.map((row, rowIndex) => (
        <View style={styles.keypadRow} key={rowIndex}>
          {row.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.keypadButton,
                item === "=" && styles.equalsButton,
              ]}
              onPress={() =>
                item.match(/[0-9.]/)
                  ? handleNumberPress(item)
                  : handleOperatorPress(item)
              }
            >
              <Text
                style={[
                  styles.keypadText,
                  item === "=" && styles.equalsText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-back" color={theme.colors.neutral.surface} size={width * 0.06} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل {transaction.type.toLowerCase() === 'income' ? 'الدخل' : 'المصروف'}</Text>
        <TouchableOpacity onPress={handleDeleteTransaction} style={styles.deleteButton}>
          <Icon name="delete" color={theme.colors.neutral.surface} size={width * 0.06} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateContainer}>
        <Icon name="calendar-today" size={width * 0.05} color={theme.colors.neutral.textSecondary} style={styles.calendarIcon} />
        <Text style={styles.dateText}>{currentDate}</Text>
        <TouchableOpacity onPress={toggleManualDateInput} style={styles.penButton}>
          <Icon name="edit" size={width * 0.05} color={theme.colors.success} />
        </TouchableOpacity>
      </TouchableOpacity>

      {isManualDateInput && (
        <View style={styles.manualDateContainer}>
          <TextInput
            style={styles.manualDateInput}
            value={manualDate}
            onChangeText={handleManualDateChange}
            placeholder="أدخل التاريخ (مثال: ٥ مارس ٢٠٢٥)"
            keyboardType="default"
          />
          <TouchableOpacity onPress={toggleManualDateInput} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>تم</Text>
          </TouchableOpacity>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>{amount || "0"}</Text>
        <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
          <Icon name="backspace" size={width * 0.06} color={theme.colors.neutral.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.noteContainer}>
        <Text style={styles.noteLabel}>ملاحظة</Text>
        <View style={styles.noteInputContainer}>
          <Icon name="edit" size={width * 0.05} color={theme.colors.success} style={styles.editIcon} />
          <TextInput 
            style={styles.noteInput} 
            value={note} 
            onChangeText={setNote} 
            placeholder="أضف ملاحظة"
          />
        </View>
      </View>

      {renderKeypad()}

      {submitError ? (
        <Text style={styles.errorText}>{submitError}</Text>
      ) : null}

      <TouchableOpacity 
        style={styles.categoryButton}
        onPress={() => setShowCategories(!showCategories)}
      >
        <Text style={styles.categoryButtonText}>
          {selectedCategory ? selectedCategory.name : 'اختر فئة'}
        </Text>
      </TouchableOpacity>

      {showCategories && (
        <View style={styles.categoriesContainer}>
          {loading ? (
            <Text style={styles.messageText}>جارٍ تحميل الفئات...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : categories.length === 0 ? (
            <Text style={styles.messageText}>لم يتم العثور على فئات</Text>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              numColumns={Math.floor(width / 120)}
              contentContainerStyle={styles.categoryGrid}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={<Text style={styles.messageText}>لا توجد فئات صالحة للعرض</Text>}
            />
          )}
        </View>
      )}

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.success} />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    height: height * 0.08,
    backgroundColor: theme.colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.04,
  },
  backButton: {
    padding: width * 0.02,
  },
  headerTitle: {
    color: theme.colors.neutral.surface,
    fontSize: width * 0.05,
    fontWeight: "500",
    textAlign: "right",
  },
  deleteButton: {
    padding: width * 0.02,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: height * 0.02,
  },
  calendarIcon: {
    marginRight: width * 0.02,
  },
  dateText: {
    fontSize: width * 0.045,
    color: theme.colors.neutral.textPrimary,
    textAlign: "right",
  },
  penButton: {
    marginLeft: width * 0.03,
    padding: width * 0.02,
  },
  manualDateContainer: {
    paddingHorizontal: width * 0.05,
    marginTop: height * 0.01,
  },
  manualDateInput: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.success,
    fontSize: width * 0.04,
    color: theme.colors.neutral.textPrimary,
    paddingVertical: height * 0.01,
    textAlign: "right",
  },
  doneButton: {
    marginTop: height * 0.01,
    padding: width * 0.04,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.small,
    alignItems: "center",
  },
  doneButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: width * 0.04,
    fontWeight: "500",
    textAlign: "right",
  },
  amountContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.success,
    margin: width * 0.04,
    borderRadius: theme.borderRadius.medium,
    padding: width * 0.04,
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountText: {
    flex: 1,
    fontSize: width * 0.1,
    color: theme.colors.neutral.surface,
    textAlign: "center",
  },
  backspaceButton: {
    padding: width * 0.02,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: width * 0.05,
    width: width * 0.1,
    height: width * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  noteContainer: {
    paddingHorizontal: width * 0.05,
    marginTop: height * 0.01,
  },
  noteLabel: {
    fontSize: width * 0.04,
    color: theme.colors.neutral.textSecondary,
    marginBottom: height * 0.005,
    textAlign: "right",
  },
  noteInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.success,
    paddingBottom: height * 0.01,
  },
  editIcon: {
    marginRight: width * 0.03,
  },
  noteInput: {
    flex: 1,
    fontSize: width * 0.04,
    color: theme.colors.neutral.textPrimary,
    textAlign: "right",
  },
  keypadContainer: {
    flex: 1,
    marginTop: height * 0.02,
    paddingHorizontal: width * 0.02,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: height * 0.015,
  },
  keypadButton: {
    flex: 1,
    height: height * 0.08,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.small,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: width * 0.01,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  keypadText: {
    fontSize: width * 0.06,
    color: theme.colors.neutral.textPrimary,
  },
  equalsButton: {
    backgroundColor: theme.colors.success,
    flex: 4,
    marginHorizontal: width * 0.01,
  },
  equalsText: {
    color: theme.colors.neutral.surface,
    fontSize: width * 0.08,
    fontWeight: "bold",
  },
  categoryButton: {
    backgroundColor: theme.colors.neutral.surface,
    margin: width * 0.04,
    padding: width * 0.04,
    borderRadius: theme.borderRadius.small,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  categoryButtonText: {
    fontSize: width * 0.04,
    color: theme.colors.neutral.textSecondary,
    fontWeight: "500",
    textAlign: "right",
  },
  categoriesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: theme.colors.neutral.surface,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  messageText: {
    textAlign: 'right',
    padding: width * 0.04,
    color: theme.colors.neutral.textSecondary,
    fontSize: width * 0.04,
  },
  errorText: {
    textAlign: 'right',
    padding: width * 0.04,
    color: theme.colors.error,
    fontSize: width * 0.04,
  },
  categoryGrid: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.03,
  },
  categoryCard: {
    width: width * 0.28,
    height: height * 0.12,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.small,
    margin: width * 0.01,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: width * 0.02,
  },
  selectedCategoryCard: {
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
  iconContainer: {
    borderRadius: theme.borderRadius.small,
    padding: width * 0.02,
  },
  categoryIcon: {
    marginBottom: height * 0.01,
  },
  categoryCardText: {
    fontSize: width * 0.035,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})