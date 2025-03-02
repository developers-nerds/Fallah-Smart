"use client"

import { useState } from "react"
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Animated } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { ChartView } from "./components/ChartView"
import { CategoryList } from "./components/CategoryList"

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

  // Calculate total balance
  const totalBalance = categories.reduce((sum, category) => {
    return sum + (category.isIncome ? category.amount : -category.amount)
  }, 0)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#7BC29A" barStyle="light-content" />
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
          <TouchableOpacity style={[styles.actionButton, styles.expenseButton]}>
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

          <TouchableOpacity style={[styles.actionButton, styles.incomeButton]} onPress={navigateToAddIncome}>
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
    backgroundColor: "#F8F8F8",
  },
  header: {
    height: 60,
    backgroundColor: "#7BC29A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  headerRight: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  monthContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },
  monthText: {
    fontSize: 20,
    color: "#7BC29A",
  },
  contentContainer: {
    flex: 1,
    marginVertical: 20,
  },
  balanceBox: {
    backgroundColor: "#7BC29A",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  balanceText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseButton: {
    backgroundColor: "#F48FB1",
    borderWidth: 5,
    borderColor: "#FFCDD2",
  },
  incomeButton: {
    backgroundColor: "#7BC29A",
    borderWidth: 5,
    borderColor: "#C8E6C9",
  },
  actionButtonText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  balanceBoxList: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
})

export default HomeScreen

