"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"

export default function AddExpense() {
  const [amount, setAmount] = useState("1000")
  const [note, setNote] = useState("Add expense")
  const [currentDate, setCurrentDate] = useState(() => {
    const date = new Date()
    const options = { weekday: "long", day: "numeric", month: "long" }
    return date.toLocaleDateString("en-US", options)
  })

  const navigation = useNavigation()

  const handleNumberPress = (num) => {
    if (amount === "0") {
      setAmount(num.toString())
    } else {
      setAmount((prev) => prev + num.toString())
    }
  }

  const handleOperatorPress = (operator) => {
    console.log("Operator pressed:", operator)
  }

  const handleClear = () => {
    setAmount("0")
  }

  const goBack = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-back" color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New expense</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Icon name="refresh" color="white" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateContainer}>
        <Icon name="calendar-today" size={20} color="#555" style={styles.calendarIcon} />
        <Text style={styles.dateText}>{currentDate}</Text>
      </View>

      <View style={[styles.amountContainer, { backgroundColor: '#F48FB1' }]}>
        <View style={styles.currencyContainer}>
          <FontAwesome5 name="money-bill" size={24} color="#555" style={styles.moneyIcon} />
          <Text style={styles.currencyText}>USD</Text>
        </View>
        <Text style={styles.amountText}>{amount}</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Icon name="clear" size={24} color="#555" />
        </TouchableOpacity>
      </View>

      <View style={styles.noteContainer}>
        <Text style={styles.noteLabel}>Note</Text>
        <View style={[styles.noteInputContainer, { borderBottomColor: '#F48FB1' }]}>
          <Icon name="edit" size={20} color="#F48FB1" style={styles.editIcon} />
          <TextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="Add note" />
        </View>
      </View>

      <View style={styles.keypadContainer}>
        {/* Same keypad layout as AddIncome */}
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

      <TouchableOpacity style={styles.categoryButton}>
        <Text style={styles.categoryButtonText}>CHOOSE CATEGORY</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    height: 60,
    backgroundColor: "#F48FB1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "500",
  },
  refreshButton: {
    padding: 5,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 18,
    color: "#333",
  },
  amountContainer: {
    flexDirection: "row",
    backgroundColor: "#F48FB1",
    margin: 15,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  currencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
  },
  moneyIcon: {
    marginRight: 5,
  },
  currencyText: {
    fontSize: 18,
    color: "#333",
  },
  amountText: {
    flex: 1,
    fontSize: 40,
    color: "white",
    textAlign: "center",
  },
  clearButton: {
    padding: 5,
    backgroundColor: "white",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noteContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  noteLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  noteInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F48FB1",
    paddingBottom: 5,
  },
  editIcon: {
    marginRight: 10,
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  keypadContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  keypadButton: {
    flex: 1,
    height: 60,
    backgroundColor: "white",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  keypadText: {
    fontSize: 24,
    color: "#333",
  },
  categoryButton: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
})