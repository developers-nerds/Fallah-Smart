import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"
import { theme } from "../../../theme/theme"
import { useState } from 'react';
// Add these to your interfaces
interface Transaction {
  id: number
  amount: number
  note: string
  date: string
  category: Category
}

interface Category {
  id: number
  name: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap  // Update this line
  type: string
  color: string
  amount: number
  count: number
  isIncome: boolean
  transactions?: Transaction[]
}

interface CategoryListProps {
  categories: Category[]
  transactions: Transaction[] // Add this
}

// Add state for expanded categories
export const CategoryList = ({ categories, transactions }: CategoryListProps) => {

const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <View key={category.id}>
          <TouchableOpacity 
            style={styles.categoryItem}
            onPress={() => toggleCategory(category.id)} // Move onPress here
          >
            <View style={styles.leftContent}>
              <MaterialCommunityIcons 
                name={expandedCategories.includes(category.id) ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#BBBBBB" 
              />
              <View style={[styles.iconContainer, { backgroundColor: category.color + "20" }]}>
                {category.type === "material-community" ? (
                  <MaterialCommunityIcons name={category.icon} size={24} color={category.color} />
                ) : (
                  <FontAwesome5 name={category.icon} size={20} color={category.color} />
                )}
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{category.count}</Text>
              </View>
            </View>
            <Text style={[styles.amount, { color: category.isIncome ? theme.colors.success : theme.colors.error }]}>
              ${category.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
          {/* Transactions list */}
          {expandedCategories.includes(category.id) && (
            <View style={styles.transactionsList}>
              {transactions
                .filter(t => t.category.id === category.id)
                .map(transaction => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <Text style={styles.transactionNote}>{transaction.note}</Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: category.isIncome ? theme.colors.success : theme.colors.error }
                    ]}>
                      ${transaction.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

// Add these new styles
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandButton: {
    padding: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: "#333333",
  },
  countBadge: {
    backgroundColor: "#7BC29A",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transactionsList: {
    paddingLeft: 45,
    backgroundColor: theme.colors.neutral.background, // Updated this line to use theme background color
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionNote: {
    fontSize: 14,
    color: '#333333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

