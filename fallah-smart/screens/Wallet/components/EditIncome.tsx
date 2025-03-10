"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Platform, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons"
import { theme } from "../../../theme/theme"
import DateTimePicker from "@react-native-community/datetimepicker"
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

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

export default function EditIncome() {
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
      setNote(transaction.note || "Add income")
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
      setCurrentDate(transDate.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }))
    }
    fetchAccounts()
    fetchCategories()
  }, [transaction])

  const getUserIdFromToken = async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user')
      if (!userStr) {
        setError('No user data found. Please log in.')
        setLoading(false)
        return null
      }
      const userData = JSON.parse(userStr)
      return userData.id
    } catch (error) {
      setError('Invalid user data. Please log in again.')
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
      setError('Error fetching accounts: ' + (error.response?.data?.message || error.message))
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('@access_token')
      if (!token) {
        setError("No authentication token found")
        return
      }
      const response = await axios.get(`${API_BASE_URL}/categories/type/Income`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log("Fetched categories response (EditIncome):", response.data)
      if (Array.isArray(response.data)) {
        const validCategories = response.data.filter(
          (category: any) => category && typeof category === 'object' && category.id && category.name
        )
        setCategories(validCategories)
        if (validCategories.length === 0) {
          setError("No valid categories found")
        }
      } else {
        setError("Invalid response format: Categories data is not an array")
        setCategories([])
      }
    } catch (err) {
      setError("Failed to fetch categories: " + err.message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTransaction = async (category: Category) => {
    try {
      setIsSubmitting(true)
      setSubmitError("")

      const token = await AsyncStorage.getItem('@access_token')
      const userStr = await AsyncStorage.getItem('@user')
      
      if (!token || !userStr) {
        setSubmitError('Please login first')
        return
      }

      if (!selectedAccountId) {
        setSubmitError('No account selected. Please try again.')
        return
      }

      if (!category || !category.id) {
        setSubmitError('Please select a category')
        return
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setSubmitError('Please enter a valid amount')
        return
      }

      const transactionData = {
        accountId: selectedAccountId,
        categoryId: category.id,
        amount: parseFloat(amount),
        type: 'income',
        note: note || "",
        date: date.toISOString()
      }

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

      if (response.data.success) {
        navigation.goBack()
      } else {
        setSubmitError(response.data.message || 'Failed to update transaction')
      }
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to update transaction: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTransaction = async () => {
    try {
      setIsSubmitting(true)
      const token = await AsyncStorage.getItem('@access_token')
      
      await axios.delete(`${API_BASE_URL}/transactions/${transaction.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      navigation.goBack()
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to delete transaction')
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
    setCurrentDate(currentDate.toLocaleDateString("en-US", options))
    setManualDate(currentDate.toLocaleDateString("en-US", options))
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
    const isCustomIcon = item.icon.includes('-alt') || 
                        item.icon === 'shopping-basket' ||
                        item.icon === 'glass-martini-alt'

    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          selectedCategory?.id === item.id && styles.selectedCategoryCard
        ]}
        onPress={() => {
          setSelectedCategory(item)
          setShowCategories(false)
          handleUpdateTransaction(item)
        }}
        disabled={isSubmitting}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          {isCustomIcon ? (
            <FontAwesome5 
              name={item.icon.replace('-alt', '')}
              size={width * 0.06}
              color={item.color} 
              style={styles.categoryIcon}
            />
          ) : (
            <MaterialCommunityIcons 
              name={item.icon} 
              size={width * 0.06}
              color={item.color} 
              style={styles.categoryIcon}
            />
          )}
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
        <Text style={styles.headerTitle}>Edit Income</Text>
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
            placeholder="Enter date (e.g., March 5, 2025)"
            keyboardType="default"
          />
          <TouchableOpacity onPress={toggleManualDateInput} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
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
        <Text style={styles.noteLabel}>Note</Text>
        <View style={styles.noteInputContainer}>
          <Icon name="edit" size={width * 0.05} color={theme.colors.success} style={styles.editIcon} />
          <TextInput 
            style={styles.noteInput} 
            value={note} 
            onChangeText={setNote} 
            placeholder="Add note" 
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
          {selectedCategory ? selectedCategory.name : 'CHOOSE CATEGORY'}
        </Text>
      </TouchableOpacity>

      {showCategories && (
        <View style={styles.categoriesContainer}>
          {loading ? (
            <Text style={styles.messageText}>Loading categories...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : categories.length === 0 ? (
            <Text style={styles.messageText}>No categories found</Text>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              numColumns={Math.floor(width / 120)}
              contentContainerStyle={styles.categoryGrid}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={<Text style={styles.messageText}>No valid categories to display</Text>}
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
    textAlign: 'center',
    padding: width * 0.04,
    color: theme.colors.neutral.textSecondary,
    fontSize: width * 0.04,
  },
  errorText: {
    textAlign: 'center',
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