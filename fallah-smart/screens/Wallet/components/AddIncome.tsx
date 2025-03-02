"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import DateTimePicker from "@react-native-community/datetimepicker"
import { theme } from "../../../theme/theme"

export default function AddIncome() {
  const [amount, setAmount] = useState("1000")
  const [note, setNote] = useState("Add moneys")
  const [currentDate, setCurrentDate] = useState(() => {
    const date = new Date()
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    return date.toLocaleDateString("en-US", options)
  })
  const [date, setDate] = useState(new Date()) // State for the DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isManualDateInput, setIsManualDateInput] = useState(false)
  const [manualDate, setManualDate] = useState("")

  const navigation = useNavigation()

  const handleNumberPress = (num:Number) => {
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

  // Handle date selection from the picker
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date
    setShowDatePicker(false) // Hide picker after selection
    setDate(currentDate)
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    setCurrentDate(currentDate.toLocaleDateString("en-US", options))
    setManualDate(currentDate.toLocaleDateString("en-US", options)) // Sync manual input if needed
  }

  // Handle manual date input
  const handleManualDateChange = (text) => {
    setManualDate(text)
    // Basic date parsing (you can enhance this with a library like date-fns or moment.js)
    setCurrentDate(text) // Update displayed date
  }

  // Toggle manual date input
  const toggleManualDateInput = () => {
    setIsManualDateInput(!isManualDateInput)
    if (!isManualDateInput) {
      setManualDate(currentDate) // Pre-fill with current date
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-back" color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New income</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Icon name="refresh" color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* Date Display with Calendar and Pen Icon */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateContainer}>
        <Icon name="calendar-today" size={20} color={theme.colors.success} style={styles.calendarIcon} />
        <Text style={styles.dateText}>{currentDate}</Text>
        <TouchableOpacity onPress={toggleManualDateInput} style={styles.penButton}>
          <Icon name="edit" size={20} color="#7BC29A" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Manual Date Input (Shown when pen is clicked) */}
      {isManualDateInput && (
        <View style={styles.manualDateContainer}>
          <TextInput
            style={styles.manualDateInput}
            value={manualDate}
            onChangeText={handleManualDateChange}
            placeholder="Enter date (e.g., March 2, 2025)"
            keyboardType="default"
          />
          <TouchableOpacity onPress={toggleManualDateInput} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Amount Input */}
      <View style={styles.amountContainer}>
        <View style={styles.currencyContainer}>
          <FontAwesome5 name="money-bill" size={24} color="#555" style={styles.moneyIcon} />
          <Text style={styles.currencyText}>USD</Text>
        </View>
        <Text style={styles.amountText}>{amount}</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Icon name="clear" size={24} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Note Input */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteLabel}>Note</Text>
        <View style={styles.noteInputContainer}>
          <Icon name="edit" size={20} color="#7BC29A" style={styles.editIcon} />
          <TextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="Add note" />
        </View>
      </View>

      {/* Calculator Keypad */}
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

      {/* Category Button */}
      <TouchableOpacity style={styles.categoryButton}>
        <Text style={styles.categoryButtonText}>CHOOSE CATEGORY</Text>
      </TouchableOpacity>

      {/* Date Picker (Native) */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar" // Use 'calendar' for a grid calendar view
          onChange={onDateChange}
          maximumDate={new Date(2030, 12, 31)} // Optional: Limit future dates
          minimumDate={new Date(2020, 1, 1)} // Optional: Limit past dates
        />
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
})