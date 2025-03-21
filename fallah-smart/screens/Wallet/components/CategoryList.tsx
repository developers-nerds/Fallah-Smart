import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { theme } from "../../../theme/theme";
import { RenderIcon } from "./RenderIcon"; // Adjust path as needed
import { RootStackParamList } from "../../../App"; // Adjust path based on your project structure

interface Transaction {
  id?: number;
  accountId?: number;
  amount?: number;
  note?: string;
  date?: string;
  type?: string; // "income" or "expense"
  category: {
    id?: number;
    name?: string;
    icon?: string;
    type?: string;
    color?: string;
    isIncome?: boolean;
  };
}

interface Category {
  id?: number;
  name?: string;
  icon?: string;
  type?: string;
  color?: string;
  amount?: number;
  count?: number;
  isIncome?: boolean;
}

interface CategoryListProps {
  categories: Category[];
  transactions: Transaction[];
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, transactions }) => {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const months = [
    "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "التاريخ غير متاح";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "تاريخ غير صالح";
  
    const day = date.getDate();
    const monthIndex = date.getMonth(); // Get the index (0-11)
    const year = date.getFullYear().toString().slice(-2);
  
    return `${day} ${months[monthIndex]} ${year}`;
  };
  

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate("EditTransaction", { transaction });
  };

  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <View style={styles.container}>
      {safeCategories.length === 0 ? (
        <Text style={styles.emptyText}>لا توجد فئات للعرض</Text>
      ) : (
        safeCategories.map((category) => (
          <View key={category?.id?.toString() || Math.random().toString()}>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => toggleCategory(category.id || 0)}
            >
              {/* Amounts on the left */}
              <View style={styles.amountContainer}>
                <Text
                  style={[
                    styles.amount,
                    { color: category.isIncome ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {category.amount?.toFixed(2) || "0.00"}  د.ت 
                </Text>
              </View>

              {/* Category details on the right */}
              <View style={styles.rightContent}>
                <View style={styles.categoryDetails}>
                  <RenderIcon
                    icon={expandedCategories.includes(category.id || 0) ? "chevron-up" : "chevron-down"}
                    type="material-community"
                    size={24}
                    color="#BBBBBB"
                  />
                  <View style={[styles.iconContainer, { backgroundColor: (category.color || "#000000") + "20" }]}>
                    <RenderIcon
                      icon={category.icon || "help"}
                      type={category.type || "material-community"}
                      size={24}
                      color={category.color || "#000"}
                    />
                  </View>
                  <Text style={styles.categoryName}>{category.name || "غير معروف"}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{category.count || 0}</Text>
                  </View>
                </View>
              </View>
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
                      {/* Transaction amount on the left */}
                      <View style={styles.amountContainer}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color: transaction.type === "income" ? theme.colors.success : theme.colors.error,
                            },
                          ]}
                        >
                          {transaction.amount?.toFixed(2) || "0.00"} د.ت 
                        </Text>
                      </View>

                      {/* Transaction details on the right */}
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionNote}>{transaction.note || "لا توجد ملاحظة"}</Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.date || "")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 15 },
  categoryItem: {
    flexDirection: "row", // Changed back to "row" for explicit control
    justifyContent: "space-between", // Ensure space is distributed correctly
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  amountContainer: {
    // Explicitly position amounts on the left
    alignItems: "flex-start", // Align amounts to the left
    marginRight: 10, // Add spacing between amounts and details
    minWidth: 100, // Ensure amounts have enough space
  },
  rightContent: {
    flex: 1, // Take up remaining space on the right
    flexDirection: "row", // Ensure category details are laid out correctly
    justifyContent: "flex-end", // Align category details to the right
    alignItems: "center",
  },
  categoryDetails: {
    flexDirection: "row-reverse", // Use row-reverse for RTL category details
    alignItems: "center",
    gap: 8, // Added gap to create space between icon, name, and count
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12, // Kept for spacing between icon and category name
  },
  categoryName: { fontSize: 16, color: "#333333", textAlign: "right" },
  countBadge: {
    backgroundColor: "#7BC29A",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: { color: "white", fontSize: 12, fontWeight: "bold", textAlign: "right" },
  amount: { fontSize: 16, fontWeight: "bold", textAlign: "left" }, // Explicitly align amounts to the left
  transactionsList: {
    paddingLeft: 0,
    paddingRight : 20,
    backgroundColor: theme.colors.neutral.background,
  },
  transactionItem: {
    flexDirection: "row", // Changed back to "row" for explicit control
    justifyContent: "space-between", // Ensure space is distributed correctly
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  transactionDetails: {
    flex: 1, // Take up remaining space on the right
    flexDirection: "column", // Stack note and date vertically
    alignItems: "flex-end", // Align transaction details to the right
  },
  transactionNote: { fontSize: 14, color: "#333333", textAlign: "right" },
  transactionDate: { fontSize: 12, color: "#888888", marginTop: 2, textAlign: "right" },
  transactionAmount: { fontSize: 14, fontWeight: "bold", textAlign: "left" }, // Explicitly align amounts to the left
  emptyText: { textAlign: "right", padding: 20, color: theme.colors.neutral.textSecondary },
});