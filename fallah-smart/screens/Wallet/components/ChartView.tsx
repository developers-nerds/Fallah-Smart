"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, useWindowDimensions } from "react-native"
import { Svg, Circle, Path, Text as SvgText } from "react-native-svg"
import { theme } from "../../../theme/theme"
import { RenderIcon } from "./RenderIcon" // Import the new RenderIcon component

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
  onCategoryIconPress?: (category: any) => void
}

export const ChartView: React.FC<ChartViewProps> = ({ categories, onCategoryIconPress }) => {
  // Get window dimensions for responsive sizing
  const { width, height } = useWindowDimensions()

  // Calculate chart size based on screen dimensions
  const chartSize = Math.min(width, height) * 0.85
  const centerPoint = chartSize / 2

  // Calculate other dimensions based on chart size
  const outerRadius = chartSize * 0.35
  const innerRadius = chartSize * 0.2
  const iconRadius = chartSize * 0.28

  // Font sizes based on chart size
  const centerTextSize = chartSize * 0.05
  const percentageTextSize = chartSize * 0.03

  // Ensure categories is an array
  const safeCategories = Array.isArray(categories) ? categories : []

  const totalIncome = safeCategories.filter((cat) => cat?.isIncome).reduce((sum, cat) => sum + (cat?.amount || 0), 0)
  const totalExpenses = safeCategories.filter((cat) => !cat?.isIncome).reduce((sum, cat) => sum + (cat?.amount || 0), 0)

  const expenseCategories = safeCategories.filter((cat) => !cat?.isIncome)
  const totalExpenseAmount = expenseCategories.reduce((sum, cat) => sum + (cat?.amount || 0), 0)

  let startAngle = 0
  const segments = expenseCategories.map((category, index) => {
    const percentage = totalExpenseAmount ? (category.amount / totalExpenseAmount) * 100 : 0
    const angle = (percentage / 100) * 360
    const midAngle = startAngle + angle / 2
    const segment = {
      color: category.color || "#CCCCCC",
      startAngle,
      endAngle: startAngle + angle,
      percentage: Math.round(percentage),
      midAngle,
      category,
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

  // Animation for chart fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  // Animation for icon scaling
  const animatedValues = useRef(segments.map(() => new Animated.Value(1))).current

  const handlePressIn = (index: number) => {
    Animated.spring(animatedValues[index], {
      toValue: 1.2,
      friction: 3,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = (index: number) => {
    Animated.spring(animatedValues[index], {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start()
  }

  // Function to render category icons with percentages
  const renderIcons = (segments: any[]) => {
    return segments.map((segment, index) => {
      const { midAngle, category, percentage } = segment

      if (percentage < 3) return null

      const angleInRadians = (midAngle - 90) * (Math.PI / 180)
      const x = centerPoint + iconRadius * Math.cos(angleInRadians)
      const y = centerPoint + iconRadius * Math.sin(angleInRadians)

      const iconSize = chartSize * 0.06
      const iconOffset = iconSize / 2

      return (
        <View
          key={index}
          style={[
            styles.iconContainer,
            {
              position: "absolute",
              left: x - iconOffset, // RTL adjustment not needed here as it's radial
              top: y - iconOffset,
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
            },
          ]}
        >
          <RenderIcon
            icon={category.icon || "help"}
            type={category.type}
            size={iconSize}
            color={category.color || "#000"}
          />
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageText, { fontSize: percentageTextSize }]}>{`${percentage}%`}</Text>
          </View>
        </View>
      )
    })
  }

  return (
    <View style={styles.container}>
      <View style={[styles.chartWrapper, { width: chartSize, height: chartSize }]}>
        <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
          {/* Render chart segments */}
          {segments.map((segment, index) => (
            <Path
              key={index}
              d={createArc(centerPoint, centerPoint, outerRadius, segment.startAngle, segment.endAngle)}
              fill={segment.color}
            />
          ))}
          {/* Inner circle for total income/expense */}
          <Circle cx={centerPoint} cy={centerPoint} r={innerRadius} fill={theme.colors.neutral.surface} />
          <SvgText
            x={centerPoint}
            y={centerPoint - centerTextSize / 2}
            fontSize={centerTextSize}
            fontFamily={theme.fonts.bold} // Added Arabic font
            fill={theme.colors.success}
            textAnchor="middle" // Kept as middle for center alignment
          >
            {`${totalIncome.toFixed(2)} د.ت`} {/* Changed to Arabic currency */}
          </SvgText>
          <SvgText
            x={centerPoint}
            y={centerPoint + centerTextSize}
            fontSize={centerTextSize}
            fontFamily={theme.fonts.bold} // Added Arabic font
            fill={theme.colors.error}
            textAnchor="middle" // Kept as middle for center alignment
          >
            {`${totalExpenses.toFixed(2)} د.ت`} {/* Changed to Arabic currency */}
          </SvgText>
        </Svg>
        {/* Render icons outside of SVG */}
        {renderIcons(segments)}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.neutral.background,
    flexDirection: 'row-reverse', // Added for RTL
  },
  chartWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    zIndex: 10,
  },
  percentageContainer: {
    position: "absolute",
    top: -20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  percentageText: {
    fontWeight: "bold",
    color: theme.colors.neutral.textPrimary,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: theme.fonts.regular, // Added Arabic font
    textAlign: 'right', // Added for RTL
  },
})