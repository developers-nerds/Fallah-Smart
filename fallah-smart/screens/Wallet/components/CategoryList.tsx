import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"

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

interface CategoryListProps {
  categories: Category[]
}

export const CategoryList = ({ categories }: CategoryListProps) => {
  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <TouchableOpacity key={category.id} style={styles.categoryItem}>
          <View style={styles.leftContent}>
            <TouchableOpacity style={styles.expandButton}>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#BBBBBB" />
            </TouchableOpacity>

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

          <Text style={[styles.amount, { color: category.isIncome ? "#7BC29A" : "#FF9999" }]}>
            ${category.amount.toFixed(2)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

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
})

