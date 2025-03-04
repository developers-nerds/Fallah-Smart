"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Animated } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from "react-native-vector-icons/MaterialIcons"
import { ChartView } from "./components/ChartView"
import { CategoryList } from "./components/CategoryList"

import { theme } from "../../theme/theme"


// Category data with amounts
const categories = [
  {
    id: 1,
    name: "Salary",
    icon: "money-bill-wave",
    type: "font-awesome-5",
    color: "#7BC29A",
    amount: 101000.0,
    count: 2,
    isIncome: true,
  },
  {
    id: 2,
    name: "Food",
    icon: "shopping-basket",
    type: "font-awesome-5",
    color: "#FF9999",
    amount: 8000.0,
    count: 1,
    isIncome: false,
  },
  {
    id: 3,
    name: "Car",
    icon: "car",
    type: "font-awesome-5",
    color: "#5B9BD5",
    amount: 8000.0,
    count: 1,
    isIncome: false,
  },
  {
    id: 4,
    name: "Entertainment",
    icon: "glass-martini-alt",
    type: "font-awesome-5",
    color: "#E9B97A",
    amount: 6000.0,
    count: 1,
    isIncome: false,
  },
  {
    id: 5,
    name: "Eating out",
    icon: "utensils",
    type: "font-awesome-5",
    color: "#A5D6A7",
    amount: 5000.0,
    count: 1,
    isIncome: false,
  },
  {
    id: 6,
    name: "Taxi",
    icon: "taxi",
    type: "font-awesome-5",
    color: "#D6A01D",
    amount: 4500.0,
    count: 1,
    isIncome: false,
  },
  {
    id: 7,
    name: "Pets",
    icon: "cat",
    type: "material-community",
    color: "#A5D6A7",
    amount: 3900.0,
    count: 1,
    isIncome: false,
  },
]

const HomeScreen = () => {
  const [showList, setShowList] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(1))
  const navigation = useNavigation()

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem('@access_token');
        console.log('Access Token:', token);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
  
    getToken();
  }, []);

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

  // Navigate to AddIncome screen
  const navigateToAddIncome = () => {
    navigation.navigate("AddIncome")
  }

  // Inside the HomeScreen component, add:
  const navigateToAddExpense = () => {
    navigation.navigate("AddExpense")
  }
  // Update the expense button in the actionButtons View:
  <TouchableOpacity 
    style={[styles.actionButton, styles.expenseButton]} 
    onPress={navigateToAddExpense}
  >
    <Text style={styles.actionButtonText}>−</Text>
  </TouchableOpacity>
  // Calculate total balance
  const totalBalance = categories.reduce((sum, category) => {
    return sum + (category.isIncome ? category.amount : -category.amount)
  }, 0)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary.base} barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        {/* Left Menu Button - Static */}
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="menu" color="white" size={28} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>wallet</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="search" color="white" size={28} />
          </TouchableOpacity>
          {/* Right More Button - Static */}
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="more-vert" color="white" size={28} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Month Display */}
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>February</Text>
        </View>

        {/* Balance Box - Clickable */}
        {showList && (
          <TouchableOpacity onPress={toggleView}>
            <View style={[styles.balanceBox, styles.balanceBoxList]}>
              <Text style={styles.balanceText}>Balance ${totalBalance.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Animated Container */}
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {showList ? <CategoryList categories={categories} /> : <ChartView categories={categories} />}
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.expenseButton]} 
            onPress={navigateToAddExpense}
          >
            <Text style={styles.actionButtonText}>−</Text>
          </TouchableOpacity>

          {/* Balance Box - Clickable (only show when not in list view) */}
          {!showList && (
            <TouchableOpacity onPress={toggleView}>
              <View style={styles.balanceBox}>
                <Text style={styles.balanceText}>Balance ${totalBalance.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.incomeButton]} 
            onPress={navigateToAddIncome}
          >
            <Text style={styles.actionButtonText}>+</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 36,
    fontWeight: "bold",
    color: theme.colors.neutral.surface,
  },
  balanceBoxList: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
})

export default HomeScreen