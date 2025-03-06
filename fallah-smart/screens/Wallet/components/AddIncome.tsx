"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons"
import { theme } from "../../../theme/theme"
import DateTimePicker from "@react-native-community/datetimepicker"
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

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

export default function AddIncome() {
  const [showCategories, setShowCategories] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("Add income")
  const [currentDate, setCurrentDate] = useState(() => {
    const date = new Date()
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    return date.toLocaleDateString("en-US", options)
  })
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isManualDateInput, setIsManualDateInput] = useState(false)
  const [manualDate, setManualDate] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  
  const navigation = useNavigation()

  const API_BASE_URL = Platform.select({
    web: process.env.WEB_PUBLIC_API,
    default: process.env.EXPO_PUBLIC_API_URL 
  })

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
      console.log('Fetched accounts:', response.data)
      setAccounts(response.data)
      if (response.data.length > 0) {
        setSelectedAccountId(response.data[0].id)
      }
    } catch (error) {
      setError('Error fetching accounts: ' + (error.response?.data?.message || error.message))
    }
  }

  useEffect(() => {
    fetchAccounts()

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
        setCategories(response.data)
      } catch (err) {
        setError("Failed to fetch categories: " + err.message)
        console.error("Error fetching categories:", err)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    if (showCategories) {
      fetchCategories()
    }
  }, [showCategories])

  const handleCreateTransaction = async (category: Category) => {
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

      console.log('Sending transaction data:', transactionData)

      const response = await axios.post(
        `${API_BASE_URL}/transactions`,
        transactionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      console.log('Transaction response:', response.data)

      if (response.data.success) {
        setAmount("")
        setNote("Add income")
        setSelectedCategory(null)
        setShowCategories(false)
        navigation.goBack()
      } else {
        setSubmitError(response.data.message || 'Failed to create transaction')
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      setSubmitError(error.response?.data?.message || 'Failed to create transaction: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNumberPress = (num) => {
    setAmount((prev) => prev + num.toString())
  }

  const handleOperatorPress = (operator) => {
    console.log("Operator pressed:", operator)
  }

  const handleClear = () => {
    setAmount("")
  }

  const goBack = () => {
    navigation.goBack()
  }

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date
    setShowDatePicker(false)
    setDate(currentDate)
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    setCurrentDate(currentDate.toLocaleDateString("en-US", options))
    setManualDate(currentDate.toLocaleDateString("en-US", options))
  }

  const handleManualDateChange = (text) => {
    setManualDate(text)
    setCurrentDate(text)
  }

  const toggleManualDateInput = () => {
    setIsManualDateInput(!isManualDateInput)
    if (!isManualDateInput) {
      setManualDate(currentDate)
    }
  }

  const renderCategoryItem = ({ item }) => {
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
          handleCreateTransaction(item)
        }}
        disabled={isSubmitting}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          {isCustomIcon ? (
            <FontAwesome5 
              name={item.icon.replace('-alt', '')}
              size={24} 
              color={item.color} 
              style={styles.categoryIcon}
            />
          ) : (
            <MaterialCommunityIcons 
              name={item.icon} 
              size={24} 
              color={item.color} 
              style={styles.categoryIcon}
            />
          )}
        </View>
        <Text style={styles.categoryCardText}>{item.name}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-back" color={theme.colors.neutral.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New income</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Icon name="refresh" color={theme.colors.neutral.surface} size={24} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateContainer}>
        <Icon name="calendar-today" size={20} color={theme.colors.neutral.textSecondary} style={styles.calendarIcon} />
        <Text style={styles.dateText}>{currentDate}</Text>
        <TouchableOpacity onPress={toggleManualDateInput} style={styles.penButton}>
          <Icon name="edit" size={20} color={theme.colors.success} />
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
        <View style={styles.currencyContainer}>
          <FontAwesome5 name="money-bill" size={24} color={theme.colors.neutral.textSecondary} style={styles.moneyIcon} />
          <Text style={styles.currencyText}>USD</Text>
        </View>
        <Text style={styles.amountText}>{amount || "0"}</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Icon name="clear" size={24} color={theme.colors.neutral.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.noteContainer}>
        <Text style={styles.noteLabel}>Note</Text>
        <View style={styles.noteInputContainer}>
          <Icon name="edit" size={20} color={theme.colors.success} style={styles.editIcon} />
          <TextInput 
            style={styles.noteInput} 
            value={note} 
            onChangeText={setNote} 
            placeholder="Add note" 
          />
        </View>
      </View>

      <View style={styles.keypadContainer}>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(1)}>
            <Text style={styles.keypadText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(2)}>
            <Text style={styles.keypadText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(3)}>
            <Text style={styles.keypadText}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleOperatorPress("+")}>
            <Text style={styles.keypadText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(4)}>
            <Text style={styles.keypadText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(5)}>
            <Text style={styles.keypadText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(6)}>
            <Text style={styles.keypadText}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleOperatorPress("-")}>
            <Text style={styles.keypadText}>-</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(7)}>
            <Text style={styles.keypadText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(8)}>
            <Text style={styles.keypadText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(9)}>
            <Text style={styles.keypadText}>9</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleOperatorPress("×")}>
            <Text style={styles.keypadText}>×</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleOperatorPress(".")}>
            <Text style={styles.keypadText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleNumberPress(0)}>
            <Text style={styles.keypadText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleOperatorPress("=")}>
            <Text style={styles.keypadText}>=</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleOperatorPress("÷")}>
            <Text style={styles.keypadText}>÷</Text>
          </TouchableOpacity>
        </View>
      </View>

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
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              contentContainerStyle={styles.categoryGrid}
              showsVerticalScrollIndicator={true}
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
    height: 60,
    backgroundColor: theme.colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.h2,
    fontWeight: "500",
  },
  refreshButton: {
    padding: theme.spacing.xs,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  calendarIcon: {
    marginRight: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.fontSizes.h2,
    color: theme.colors.neutral.textPrimary,
  },
  penButton: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  manualDateContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  manualDateInput: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.success,
    fontSize: theme.fontSizes.button,
    color: theme.colors.neutral.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  doneButton: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.small,
    alignItems: "center",
  },
  doneButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontWeight: "500",
  },
  amountContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.success,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  currencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
  },
  moneyIcon: {
    marginRight: theme.spacing.xs,
  },
  currencyText: {
    fontSize: theme.fontSizes.h2,
    color: theme.colors.neutral.textPrimary,
  },
  amountText: {
    flex: 1,
    fontSize: 40,
    color: theme.colors.neutral.surface,
    textAlign: "center",
  },
  clearButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noteContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  noteLabel: {
    fontSize: theme.fontSizes.button,
    color: theme.colors.neutral.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  noteInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.success,
    paddingBottom: theme.spacing.xs,
  },
  editIcon: {
    marginRight: theme.spacing.sm,
  },
  noteInput: {
    flex: 1,
    fontSize: theme.fontSizes.button,
    color: theme.colors.neutral.textPrimary,
  },
  keypadContainer: {
    flex: 1,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  keypadButton: {
    flex: 1,
    height: 60,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.small,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  keypadText: {
    fontSize: theme.fontSizes.h1,
    color: theme.colors.neutral.textPrimary,
  },
  categoryButton: {
    backgroundColor: theme.colors.neutral.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  categoryButtonText: {
    fontSize: theme.fontSizes.button,
    color: theme.colors.neutral.textSecondary,
    fontWeight: "500",
  },
  categoriesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
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
    padding: theme.spacing.md,
    color: theme.colors.neutral.textSecondary,
  },
  errorText: {
    textAlign: 'center',
    padding: theme.spacing.md,
    color: theme.colors.error,
  },
  categoryGrid: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  categoryCard: {
    width: '31%',
    height: 90,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.small,
    margin: '1%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: theme.spacing.sm,
  },
  selectedCategoryCard: {
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
  iconContainer: {
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.xs,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryCardText: {
    fontSize: 14,
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