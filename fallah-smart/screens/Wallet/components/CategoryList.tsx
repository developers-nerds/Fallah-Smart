import React, { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useNavigation, NavigationProp } from "@react-navigation/native"
import { theme } from "../../../theme/theme"
import { RenderIcon } from "./RenderIcon" // Adjust path as needed
import { RootStackParamList } from "../../../App" // Adjust path based on your project structure

interface Transaction {
  id?: number
  accountId?: number
  amount?: number
  note?: string
  date?: string
  type?: string
  category: {
    id?: number
    name?: string
    icon?: string
    type?: string
    color?: string
    isIncome?: boolean
  }
}

interface Category {
  id?: number
  name?: string
  icon?: string
  type?: string
  color?: string
  amount?: number
  count?: number
  isIncome?: boolean
}

interface CategoryListProps {
  categories: Category[]
  transactions: Transaction[]
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, transactions }) => {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" })
  }

  const handleTransactionPress = (transaction: Transaction) => {
    // Navigate to EditTransaction with the transaction object
    navigation.navigate("EditTransaction", { transaction })
  }

  // Ensure categories is an array
  const safeCategories = Array.isArray(categories) ? categories : []

  return (
    <View style={styles.container}>
      {safeCategories.length === 0 ? (
        <Text style={styles.emptyText}>No categories to display</Text>
      ) : (
        safeCategories.map((category) => (
          <View key={category?.id?.toString() || Math.random().toString()}>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => toggleCategory(category.id || 0)}
            >
              <View style={styles.leftContent}>
                <RenderIcon
                  icon={expandedCategories.includes(category.id || 0) ? "chevron-up" : "chevron-down"}
                  type="material-community"
                  size={24}
                  color="#BBBBBB"
                />
                <View style={[styles.iconContainer, { backgroundColor: (category.color || "#000000") + "20" }]}>
                  <RenderIcon
                    icon={category.icon || "help"}
                    type={category.type || "material-community"} // Default type if not provided
                    size={24}
                    color={category.color || "#000"}
                  />
                </View>
                <Text style={styles.categoryName}>{category.name || "Unknown"}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{category.count || 0}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.amount,
                  { color: category.isIncome ? theme.colors.success : theme.colors.error },
                ]}
              >
                ${category.amount?.toFixed(2) || "0.00"}
              </Text>
            </TouchableOpacity>
            {expandedCategories.includes(category.id || 0) && (
              <View style={styles.transactionsList}>
                {transactions
                  .filter((t) => t.category?.id === category.id)
                  .map((transaction) => (
                    <TouchableOpacity
                      key={transaction.id?.toString() || Math.random().toString()}
                      style={styles.transactionItem}
                      onPress={() => handleTransactionPress(transaction)}
                    >
                      <View style={styles.transactionLeft}>
                        <Text style={styles.transactionNote}>{transaction.note || "No note"}</Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.date || "")}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color: transaction.category?.isIncome
                              ? theme.colors.success
                              : theme.colors.error,
                          },
                        ]}
                      >
                        ${transaction.amount?.toFixed(2) || "0.00"}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 15 },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  leftContent: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryName: { fontSize: 16, color: "#333333" },
  countBadge: {
    backgroundColor: "#7BC29A",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: { color: "white", fontSize: 12, fontWeight: "bold" },
  amount: { fontSize: 16, fontWeight: "bold" },
  transactionsList: {
    paddingLeft: 45,
    backgroundColor: theme.colors.neutral.background,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  transactionLeft: { flex: 1 },
  transactionNote: { fontSize: 14, color: "#333333" },
  transactionDate: { fontSize: 12, color: "#888888", marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: "bold" },
  emptyText: { textAlign: "center", padding: 20, color: theme.colors.neutral.textSecondary },
})