import { View, StyleSheet } from "react-native"
import { Svg, Circle, Path, Text as SvgText } from "react-native-svg"

interface ChartViewProps {
  categories: Array<{
    name: string
    amount: number
    color: string
    isIncome: boolean
  }>
}

export const ChartView = ({ categories }: ChartViewProps) => {
  // Calculate total income and expenses
  const totalIncome = categories.filter((cat) => cat.isIncome).reduce((sum, cat) => sum + cat.amount, 0)

  const totalExpenses = categories.filter((cat) => !cat.isIncome).reduce((sum, cat) => sum + cat.amount, 0)

  // Calculate percentages and angles for expenses
  const expenseCategories = categories.filter((cat) => !cat.isIncome)
  const totalExpenseAmount = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0)

  let startAngle = 0
  const segments = expenseCategories.map((category) => {
    const percentage = (category.amount / totalExpenseAmount) * 100
    const angle = (percentage / 100) * 360
    const segment = {
      color: category.color,
      startAngle,
      endAngle: startAngle + angle,
      percentage: Math.round(percentage),
    }
    startAngle += angle
    return segment
  })

  // Function to create SVG arc path
  const createArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "L", x, y, "Z"].join(" ")
  }

  // Helper function to convert polar coordinates to cartesian
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
        {/* Chart segments */}
        {segments.map((segment, index) => (
          <Path key={index} d={createArc(50, 50, 40, segment.startAngle, segment.endAngle)} fill={segment.color} />
        ))}

        {/* Inner white circle */}
        <Circle cx="50" cy="50" r="25" fill="white" />

        {/* Text in center */}
        <SvgText x="50" y="45" fontSize="5" fontWeight="bold" fill="#4CAF50" textAnchor="middle">
          ${totalIncome.toFixed(2)}
        </SvgText>
        <SvgText x="50" y="55" fontSize="5" fontWeight="bold" fill="#E57373" textAnchor="middle">
          ${totalExpenses.toFixed(2)}
        </SvgText>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
})

