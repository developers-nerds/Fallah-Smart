import React from "react"
import { View, StyleSheet } from "react-native"
import { Svg, Circle, Path, Text } from "react-native-svg" // Import Text instead of SvgText
import { theme } from "../../../theme/theme"

interface ChartViewProps {
  categories: {
    id?: number
    name?: string
    icon?: string
    type?: string
    color?: string
    amount?: number
    count?: number
    isIncome?: boolean
  }[]
}

export const ChartView: React.FC<ChartViewProps> = ({ categories }) => {
  // Ensure categories is an array
  const safeCategories = Array.isArray(categories) ? categories : []

  const totalIncome = safeCategories
    .filter((cat) => cat?.isIncome)
    .reduce((sum, cat) => sum + (cat?.amount || 0), 0)

  const totalExpenses = safeCategories
    .filter((cat) => !cat?.isIncome)
    .reduce((sum, cat) => sum + (cat?.amount || 0), 0)

  const expenseCategories = safeCategories.filter((cat) => !cat?.isIncome)
  const totalExpenseAmount = expenseCategories.reduce((sum, cat) => sum + (cat?.amount || 0), 0)

  let startAngle = 0
  const segments = expenseCategories.map((category) => {
    const percentage = totalExpenseAmount ? (category.amount / totalExpenseAmount) * 100 : 0
    const angle = (percentage / 100) * 360
    const segment = {
      color: category.color || '#000000', // Fallback color
      startAngle,
      endAngle: startAngle + angle,
      percentage: Math.round(percentage),
    }
    startAngle += angle
    return segment
  })

  const createArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "L", x, y, "Z"].join(" ")
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  return (
    <View style={styles.container}>
      <Svg height="350" width="350" viewBox="0 0 100 100">
        {segments.map((segment, index) => (
          <Path
            key={index}
            d={createArc(50, 50, 40, segment.startAngle, segment.endAngle)}
            fill={segment.color}
          />
        ))}
        <Circle cx="50" cy="50" r="25" fill={theme.colors.neutral.surface} />
        <Text
          x="50"
          y="45"
          fontSize="5"
          fontWeight="bold"
          fill={theme.colors.success}
          textAnchor="middle"
        >
          {totalIncome.toFixed(2)}
        </Text>
        <Text
          x="50"
          y="55"
          fontSize="5"
          fontWeight="bold"
          fill={theme.colors.error}
          textAnchor="middle"
        >
          {totalExpenses.toFixed(2)}
        </Text>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.neutral.background,
  },
})