"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { ChartView } from "./components/ChartView"
import { CategoryList } from "./components/CategoryList"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { Platform } from "react-native"
import { theme } from "../../theme/theme"

const HomeScreen = () => {
  const [showList, setShowList] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(1))
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width)

  const navigation = useNavigation()

  // Listen for dimension changes
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width)
    })

    return () => {
      dimensionsHandler.remove()
    }
  }, [])

  const API_BASE_URL = Platform.select({
    web: process.env.EXPO_PUBLIC_API_URL,
    default: process.env.EXPO_PUBLIC_API_URL,
  })

  const getUserIdFromToken = async () => {
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
      console.log("Fetched accounts:", response.data)
      setAccounts(response.data)
      if (response.data.length > 0) {
        setSelectedAccountId(response.data[0].id)
        fetchTransactions(response.data[0].id)
      }
    } catch (error) {
      setError("Error fetching accounts: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (accountId) => {
    const userStr = await AsyncStorage.getItem("@access_token")
    try {
      const response = await axios.get(`${API_BASE_URL}/transactions/${accountId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStr}`,
        },
      })
      console.log("Fetched transactions for account", accountId, ":", response.data.data)
      if (response.data.success) {
        setTransactions(response.data.data)
        await calculateAndUpdateBalance(response.data.data)
      } else {
        setError("Error fetching transactions: " + response.data.message)
      }
    } catch (error) {
      setError("Network error: " + (error.response?.data?.message || error.message))
    }
  }

  const calculateAndUpdateBalance = async (transactions) => {
    try {
      const totalIncome = transactions
        .filter((transaction) => transaction.category.type === "Income")
        .reduce((sum, transaction) => sum + transaction.amount, 0)
      const totalExpense = transactions
        .filter((transaction) => transaction.category.type === "Expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0)
      const newBalance = totalIncome - totalExpense

      console.log("Total Income:", totalIncome, "Total Expense:", totalExpense, "Calculated Balance:", newBalance)

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
          },
        )
        console.log("Backend update response:", response.data)

        if (response.data.success) {
          setAccounts((prevAccounts) =>
            prevAccounts.map((account) =>
              account.id === selectedAccountId ? { ...account, balance: response.data.balance } : account,
            ),
          )
        }
      }
      return newBalance
    } catch (error) {
      console.error("Error updating balance:", error)
      setError("Error updating balance: " + (error.response?.data?.message || error.message))
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [selectedAccountId])

  const toggleView = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
    setShowList(!showList)
  }

  const navigateToAddIncome = () => navigation.navigate("AddIncome")
  const navigateToAddExpense = () => navigation.navigate("AddExpense")

  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  const processTransactionsIntoCategories = () => {
    const categoryMap = new Map()
    transactions.forEach((transaction) => {
      const category = transaction.category
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          icon: category.icon || "question-mark",
          type: category.type || "font-awesome-5",
          color: category.color || "#7BC29A",
          amount: 0,
          count: 0,
          isIncome: category.type === "Income",
        })
      }
      const categoryData = categoryMap.get(category.id)
      categoryData.amount += transaction.amount
      categoryData.count += 1
    })
    return Array.from(categoryMap.values()).sort((a, b) => {
      if (a.isIncome === b.isIncome) return b.amount - a.amount
      return a.isIncome ? -1 : 1
    })
  }

  const currentAccount = accounts.find((acc) => acc.id === selectedAccountId)
  const displayedBalance = currentAccount?.balance?.toFixed(2) || "0.00"

  // Calculate responsive sizes based on screen width
  const buttonSize = screenWidth * 0.2 // 20% of screen width
  const balanceWidth = screenWidth * 0.45 // 45% of screen width
  const fontSize = screenWidth * 0.09 // Responsive font size for buttons

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary.base} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="menu" color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>wallet</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="search" color="white" size={28} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="more-vert" color="white" size={28} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>{getCurrentDate()}</Text>
        </View>

        {showList && (
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity onPress={toggleView}>
              <View style={[styles.balanceBox, styles.balanceBoxList, { width: balanceWidth }]}>
                <Text style={styles.balanceText}>Balance {displayedBalance} DT</Text>
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
        </Animated.View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.expenseButton,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                marginRight: screenWidth * 0.04,
              },
            ]}
            onPress={navigateToAddExpense}
          >
            <Text style={[styles.actionButtonText, { fontSize: fontSize }]}>−</Text>
          </TouchableOpacity>

          {!showList && (
            <TouchableOpacity onPress={toggleView}>
              <View
                style={[
                  styles.balanceBox,
                  {
                    marginHorizontal: screenWidth * 0.01,
                    width: balanceWidth,
                  },
                ]}
              >
                <Text style={styles.balanceText}>Balance {displayedBalance} DT</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.incomeButton,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                marginLeft: screenWidth * 0.04,
              },
            ]}
            onPress={navigateToAddIncome}
          >
            <Text style={[styles.actionButtonText, { fontSize: fontSize }]}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: theme.colors.primary.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  menuButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.h1,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  headerRight: {
    flexDirection: "row",
  },
  iconButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  monthContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  monthText: {
    fontSize: theme.fontSizes.h2,
    color: theme.colors.primary.base,
  },
  contentContainer: {
    flex: 1,
    marginVertical: theme.spacing.lg,
  },
  balanceBox: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: theme.spacing.sm,
  },
  balanceText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  expenseButton: {
    backgroundColor: theme.colors.error,
    borderWidth: 5,
    borderColor: theme.colors.neutral.surface,
  },
  incomeButton: {
    backgroundColor: theme.colors.success,
    borderWidth: 5,
    borderColor: theme.colors.neutral.surface,
  },
  actionButtonText: {
    fontWeight: "bold",
    color: theme.colors.neutral.surface,
  },
  balanceBoxList: {
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: theme.spacing.md,
    alignSelf: "center",
  },
})

export default HomeScreen

