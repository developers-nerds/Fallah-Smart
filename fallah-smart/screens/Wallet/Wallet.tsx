"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, NavigationProp as NavProp, useFocusEffect } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { FontAwesome5 } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { ChartView } from "./components/ChartView"
import { CategoryList } from "./components/CategoryList"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { theme } from "../../theme/theme"
import { RootStackParamList } from '../../../App' // Adjust path based on your project structure

// Define interfaces
interface Transaction {
  id: number
  accountId: number
  amount: number
  note: string
  date: string
  type: string
  category: Category
}

interface Category {
  id: number
  name: string
  icon: string
  type: string
  color: string
  amount: number
  count: number
  isIncome: boolean
}

interface Account {
  id: number
  balance: number
}

const HomeScreen: React.FC = () => {
  const [showList, setShowList] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(1))
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width)
  const [filter, setFilter] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly" | "All" | "Interval">("Monthly")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [dateDisplay, setDateDisplay] = useState("")
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date())
  const [selectedYearDate, setSelectedYearDate] = useState(new Date())

  const navigation = useNavigation<NavProp<RootStackParamList>>()

  // Listen for dimension changes
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width)
    })
    return () => dimensionsHandler.remove()
  }, [])

  const API_BASE_URL = Platform.select({
    web: process.env.EXPO_PUBLIC_API,
    default: process.env.EXPO_PUBLIC_API_URL,
  })

  const getUserIdFromToken = async (): Promise<number | null> => {
    try {
      const userStr = await AsyncStorage.getItem("@user")
      if (!userStr) {
        setError("No user data found. Please log in.")
        setLoading(false)
        return null
      }
      const userData = JSON.parse(userStr)
      return userData.id
    } catch (error) {
      setError("Invalid user data. Please log in again.")
      setLoading(false)
      return null
    }
  }

  const fetchAccounts = async () => {
    const userStr = await AsyncStorage.getItem("@access_token")
    const userId = await getUserIdFromToken()
    if (!userId || !userStr) return

    try {
      const response = await axios.get(`${API_BASE_URL}/accounts`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStr}`,
        },
      })
      setAccounts(response.data)
      if (response.data.length > 0) {
        setSelectedAccountId(response.data[0].id)
        await fetchAllTransactions(response.data[0].id)
      }
    } catch (error) {
      setError("Error fetching accounts: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTransactions = async (accountId: number) => {
    const userStr = await AsyncStorage.getItem("@access_token")
    try {
      const response = await axios.get(`${API_BASE_URL}/transactions/${accountId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStr}`,
        },
        params: { interval: 'all' },
      })
      if (response.data.success) {
        setAllTransactions(response.data.data)
        setTransactions(response.data.data)
        await calculateAndUpdateBalance(response.data.data)
      } else {
        setError("Error fetching all transactions: " + response.data.message)
      }
    } catch (error) {
      setError("Network error: " + (error.response?.data?.message || error.message))
    }
  }

  const fetchTransactions = async (accountId: number, filterType: string = 'month', startDate?: string, endDate?: string) => {
    const userStr = await AsyncStorage.getItem("@access_token")
    try {
      const response = await axios.get(`${API_BASE_URL}/transactions/${accountId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStr}`,
        },
        params: { interval: filterType, startDate, endDate },
      })
      if (response.data.success) {
        setTransactions(response.data.data)
      } else {
        setError("Error fetching transactions: " + response.data.message)
      }
    } catch (error) {
      setError("Network error: " + (error.response?.data?.message || error.message))
    }
  }

  const calculateAndUpdateBalance = async (transactions: Transaction[]) => {
    try {
      const totalIncome = transactions
        .filter((transaction) => transaction.category.type === "Income")
        .reduce((sum, transaction) => sum + transaction.amount, 0)
      const totalExpense = transactions
        .filter((transaction) => transaction.category.type === "Expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0)
      const newBalance = totalIncome - totalExpense

      const userStr = await AsyncStorage.getItem("@access_token")
      if (selectedAccountId && userStr) {
        const response = await axios.put(
          `${API_BASE_URL}/accounts/${selectedAccountId}`,
          {
            type: transactions[0]?.category?.type || "Income",
            amount: transactions[0]?.amount || 0,
            balance: newBalance,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userStr}`,
            },
          }
        )
        if (response.data.success) {
          setAccounts((prevAccounts) =>
            prevAccounts.map((account) =>
              account.id === selectedAccountId ? { ...account, balance: response.data.balance } : account
            )
          )
        }
      }
      return newBalance
    } catch (error) {
      setError("Error updating balance: " + (error.response?.data?.message || error.message))
    }
  }

  const setDateRange = (filterType: "Daily" | "Weekly" | "Monthly" | "Yearly" | "All" | "Interval") => {
    const today = new Date()
    let newStartDate: Date | null = null
    let newEndDate: Date | null = null
    let displayText = ""

    if (filterType === "Daily") {
      newStartDate = new Date(today)
      newEndDate = new Date(today)
      displayText = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        // year: "numeric",
      })
    } else if (filterType === "Weekly") {
      newStartDate = new Date(today)
      newStartDate.setDate(today.getDate() - 7)
      newEndDate = today
      displayText = `${newStartDate.toLocaleDateString("en-US", {
        // weekday: "short",
        day: "numeric",
        month: "long",
        // year: "numeric",
      })} - ${newEndDate.toLocaleDateString("en-US", {
        // weekday: "long",
        month: "long",
        day: "numeric",
        // year: "numeric",
      })}`
    } else if (filterType === "Monthly") {
      newStartDate = new Date(today.getFullYear(), today.getMonth(), 1)
      newEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      setSelectedMonthDate(newStartDate)
      displayText = newStartDate.toLocaleDateString("en-US", {
        month: "long",
        // year: "numeric",
      })
    } else if (filterType === "Yearly") {
      newStartDate = new Date(today.getFullYear(), 0, 1)
      newEndDate = new Date(today.getFullYear(), 11, 31)
      setSelectedYearDate(newStartDate)
      displayText = newStartDate.getFullYear().toString()
    } else if (filterType === "All") {
      newStartDate = null
      newEndDate = null
      displayText = "All"
    } else if (filterType === "Interval") {
      // Custom interval handled separately
      return
    }

    setStartDate(newStartDate)
    setEndDate(newEndDate)
    setDateDisplay(displayText)
    if (selectedAccountId) {
      fetchTransactions(
        selectedAccountId,
        filterType.toLowerCase(),
        newStartDate?.toISOString(),
        newEndDate?.toISOString()
      )
    }
  }

  const handleFilterSelect = (filterType: "Daily" | "Weekly" | "Monthly" | "Yearly" | "All" | "Interval") => {
    setFilter(filterType)
    if (filterType !== "Interval") {
      setDateRange(filterType)
    }
    setSidebarVisible(false)
  }

  const onMonthChange = (event: any, selectedDate?: Date) => {
    setShowMonthPicker(false)
    if (selectedDate) {
      setSelectedMonthDate(selectedDate)
      const newStartDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      const newEndDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      setStartDate(newStartDate)
      setEndDate(newEndDate)
      setDateDisplay(newStartDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }))
      if (selectedAccountId) {
        fetchTransactions(
          selectedAccountId,
          "monthly",
          newStartDate.toISOString(),
          newEndDate.toISOString()
        )
      }
    }
  }

  const onYearChange = (event: any, selectedDate?: Date) => {
    setShowYearPicker(false)
    if (selectedDate) {
      setSelectedYearDate(selectedDate)
      const newStartDate = new Date(selectedDate.getFullYear(), 0, 1)
      const newEndDate = new Date(selectedDate.getFullYear(), 11, 31)
      setStartDate(newStartDate)
      setEndDate(newEndDate)
      setDateDisplay(newStartDate.getFullYear().toString())
      if (selectedAccountId) {
        fetchTransactions(
          selectedAccountId,
          "yearly",
          newStartDate.toISOString(),
          newEndDate.toISOString()
        )
      }
    }
  }

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAccounts()
      setDateRange("Monthly") // Set default filter to Monthly
    }, [])
  )

  const toggleView = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start()
    setShowList(!showList)
  }

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const navigateToAddIncome = () => navigation.navigate("AddIncome")
  const navigateToAddExpense = () => navigation.navigate("AddExpense")

  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })
  }

  const processTransactionsIntoCategories = (): Category[] => {
    const categoryMap = new Map<number, Category>()
    transactions.forEach((transaction) => {
      if (transaction.category && transaction.category.id) {
        const category = transaction.category
        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, {
            id: category.id,
            name: category.name || "Unknown",
            icon: category.icon || "question-mark",
            type: category.type || "font-awesome-5",
            color: category.color || "#7BC29A",
            amount: 0,
            count: 0,
            isIncome: category.type === "Income",
          })
        }
        const categoryData = categoryMap.get(category.id)!
        categoryData.amount += transaction.amount
        categoryData.count += 1
      } else {
        console.warn("Transaction missing category or category.id:", transaction)
      }
    })
    return Array.from(categoryMap.values()).sort((a, b) => {
      if (a.isIncome === b.isIncome) return b.amount - a.amount
      return a.isIncome ? -1 : 1
    })
  }

  const currentAccount = accounts.find((acc) => acc.id === selectedAccountId)
  const displayedBalance = currentAccount?.balance?.toFixed(2) || "0.00"
  const filteredBalance = allTransactions
    .filter((t) => transactions.some((ft) => ft.id === t.id))
    .reduce((sum, t) => t.category.type === "Income" ? sum + t.amount : sum - t.amount, 0)
    .toFixed(2) || "0.00"

  const buttonSize = screenWidth * 0.2
  const balanceWidth = screenWidth * 0.45
  const fontSize = screenWidth * 0.09
  const sidebarWidth = screenWidth * 0.4

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary.base} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <Icon name="menu" color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>your wallet</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="search" color="white" size={28} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="more-vert" color="white" size={28} />
          </TouchableOpacity>
        </View>
      </View>

      {sidebarVisible && (
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => handleFilterSelect("Daily")}>
            <Text style={styles.sidebarText}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => handleFilterSelect("Weekly")}>
            <Text style={styles.sidebarText}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => handleFilterSelect("Monthly")}>
            <Text style={styles.sidebarText}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => handleFilterSelect("Yearly")}>
            <Text style={styles.sidebarText}>Yearly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => handleFilterSelect("All")}>
            <Text style={styles.sidebarText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => handleFilterSelect("Interval")}>
            <Text style={styles.sidebarText}>Custom Interval</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        <View style={styles.monthContainer}>
          <TouchableOpacity
            onPress={() => {
              if (filter === "Monthly") setShowMonthPicker(true)
              if (filter === "Yearly") setShowYearPicker(true)
            }}
            disabled={filter !== "Monthly" && filter !== "Yearly"}
          >
            <Text style={styles.monthText}>{dateDisplay || getCurrentDate()}</Text>
          </TouchableOpacity>
        </View>

        {showMonthPicker && (
          <DateTimePicker
            value={selectedMonthDate}
            mode="date"
            display="default"
            onChange={onMonthChange}
          />
        )}

        {showYearPicker && (
          <DateTimePicker
            value={selectedYearDate}
            mode="date"
            display="default"
            onChange={onYearChange}
          />
        )}

        {showList && (
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity onPress={toggleView}>
              <View style={[styles.balanceBox, styles.balanceBoxList, { width: balanceWidth }]}>
                <Text style={styles.balanceText}>Balance {filteredBalance} DT </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
          ) : showList ? (
            <CategoryList categories={processTransactionsIntoCategories()} transactions={transactions} />
          ) : (
            <ChartView categories={processTransactionsIntoCategories()} />
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </Animated.View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.expenseButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, marginRight: screenWidth * 0.04 }]}
            onPress={navigateToAddExpense}
          >
            <Text style={[styles.actionButtonText, { fontSize }]}>−</Text>
          </TouchableOpacity>

          {!showList && (
            <TouchableOpacity onPress={toggleView}>
              <View style={[styles.balanceBox, { marginHorizontal: screenWidth * 0.01, width: balanceWidth }]}>
                <Text style={styles.balanceText}>Balance {filteredBalance} DT</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.incomeButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, marginLeft: screenWidth * 0.04 }]}
            onPress={navigateToAddIncome}
          >
            <Text style={[styles.actionButtonText, { fontSize }]}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.neutral.background },
  header: { height: 60, backgroundColor: theme.colors.primary.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.md },
  menuButton: { padding: theme.spacing.xs },
  headerTitle: { color: theme.colors.neutral.surface, fontSize: theme.fontSizes.h1, fontWeight: "bold", fontStyle: "italic" },
  headerRight: { flexDirection: "row" },
  iconButton: { padding: theme.spacing.xs, marginLeft: theme.spacing.sm },
  scrollView: { flex: 1 },
  monthContainer: { alignItems: "center", paddingVertical: theme.spacing.md },
  monthText: { fontSize: theme.fontSizes.h2, color: theme.colors.primary.base, textDecorationLine: "underline" },
  contentContainer: { flex: 1, marginVertical: theme.spacing.lg },
  balanceBox: { backgroundColor: theme.colors.primary.base, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.small, alignItems: "center", justifyContent: "center", marginHorizontal: theme.spacing.sm },
  balanceText: { color: theme.colors.neutral.surface, fontSize: theme.fontSizes.button, fontWeight: "bold" },
  actionButtons: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.lg },
  actionButton: { alignItems: "center", justifyContent: "center" },
  expenseButton: { backgroundColor: theme.colors.error, borderWidth: 5, borderColor: theme.colors.neutral.surface },
  incomeButton: { backgroundColor: theme.colors.success, borderWidth: 5, borderColor: theme.colors.neutral.surface },
  actionButtonText: { fontWeight: "bold", color: theme.colors.neutral.surface },
  balanceBoxList: { marginLeft: "auto", marginRight: "auto", marginBottom: theme.spacing.md, alignSelf: "center" },
  sidebar: {
    position: "absolute",
    top: 60,
    left: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    zIndex: 10,
  },
  sidebarItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.surface,
  },
  sidebarText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.body,
    textAlign: "center",
  },
  errorText: {
    color: theme.colors.error,
    textAlign: "center",
    marginTop: theme.spacing.md,
  },
})

export default HomeScreen