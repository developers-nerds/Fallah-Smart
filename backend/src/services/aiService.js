const OpenAI = require('openai');
const config = require('../config/config');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Helper function to analyze trends
const analyzeTrends = (trends) => {
  if (!trends || trends.length < 2) return 'stable';
  
  const lastValue = trends[trends.length - 1];
  const previousValue = trends[trends.length - 2];
  const change = ((lastValue - previousValue) / previousValue) * 100;
  
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
};

// Helper function to calculate efficiency
const calculateEfficiency = (data) => {
  const { count, value, items } = data;
  if (!count || !value) return 0;
  
  // Calculate efficiency based on various factors
  const stockUtilization = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const minQuantity = Number(item.minQuantity) || 0;
    return sum + (quantity > minQuantity ? 1 : 0);
  }, 0) / count;
  
  const valueEfficiency = value > 0 ? 1 : 0;
  
  return Math.round((stockUtilization + valueEfficiency) * 50);
};

// Helper function to identify risks
const identifyRisks = (data, category) => {
  const risks = [];
  
  // Check for low stock
  const lowStockItems = data.items.filter(item => 
    (Number(item.quantity) || 0) <= (Number(item.minQuantity) || 0)
  );
  
  if (lowStockItems.length > 0) {
    risks.push({
      category,
      riskLevel: 'High',
      description: `${lowStockItems.length} items are running low on stock`,
      impact: 'Potential stockouts and operational disruption',
      mitigation: [
        'Review and adjust minimum stock levels',
        'Create purchase orders for low stock items',
        'Consider alternative suppliers'
      ]
    });
  }
  
  // Check for expiring items (for pesticides)
  if (category === 'pesticides' && data.expiryStatus) {
    if (data.expiryStatus.expiringSoon > 0) {
      risks.push({
        category,
        riskLevel: 'Medium',
        description: `${data.expiryStatus.expiringSoon} pesticides are expiring soon`,
        impact: 'Potential waste and replacement costs',
        mitigation: [
          'Review usage patterns',
          'Plan for replacement',
          'Consider donating or selling expiring items'
        ]
      });
    }
  }
  
  return risks;
};

// Main function to analyze stock data
const analyzeStockData = async (stockData) => {
  try {
    const insights = [];
    const predictions = [];
    const optimization = [];
    const risks = [];
    
    // Analyze each category
    for (const [category, data] of Object.entries(stockData)) {
      if (category === 'other') continue;
      
      // Generate insights
      const trend = analyzeTrends(data.trends);
      const efficiency = calculateEfficiency(data);
      
      // Create insights based on data
      if (data.count === 0) {
        insights.push({
          type: 'Warning',
          message: `No ${category} in stock`,
          icon: 'alert-circle',
          confidence: 1,
          explanation: `The ${category} category is empty, which may impact operations.`,
          recommendations: [
            'Review inventory needs',
            'Create purchase orders',
            'Check supplier availability'
          ]
        });
      } else {
        insights.push({
          type: 'Info',
          message: `${category} stock analysis`,
          icon: 'chart-line',
          confidence: 0.9,
          explanation: `Current ${category} stock shows ${trend} trend with ${efficiency}% efficiency.`,
          recommendations: [
            'Monitor stock levels',
            'Review reorder points',
            'Optimize inventory turnover'
          ]
        });
      }
      
      // Generate predictions
      predictions.push({
        category,
        trend,
        confidence: 0.8,
        explanation: `Based on historical data and current trends, ${category} stock is expected to ${trend} in the coming months.`,
        timeframe: 'Next 3 months'
      });
      
      // Generate optimization suggestions
      optimization.push({
        category,
        currentEfficiency: efficiency,
        potentialEfficiency: Math.min(100, efficiency + 20),
        suggestions: [
          'Review and optimize stock levels',
          'Implement just-in-time inventory management',
          'Consider bulk purchasing for frequently used items'
        ]
      });
      
      // Identify risks
      const categoryRisks = identifyRisks(data, category);
      risks.push(...categoryRisks);
    }
    
    // Try to enhance insights with OpenAI, but continue without it if unavailable
    try {
      const prompt = `Analyze the following stock data and provide additional insights:\n${JSON.stringify(stockData, null, 2)}`;
      
      const completion = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: "system",
            content: "You are an expert stock analyst providing insights on inventory data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature,
      });
      
      const aiResponse = completion.choices[0].message.content.trim();
      if (aiResponse) {
        insights.push({
          type: 'Opportunity',
          message: 'AI-Generated Insight',
          icon: 'lightbulb',
          confidence: 0.9,
          explanation: aiResponse,
          recommendations: [
            'Review AI suggestions',
            'Consider implementing recommended changes',
            'Monitor results'
          ]
        });
      }
    } catch (error) {
      console.warn('OpenAI enhancement failed, continuing with basic analysis:', error.message);
    }
    
    return {
      insights,
      predictions,
      optimization,
      risks
    };
  } catch (error) {
    console.error('Error in analyzeStockData:', error);
    throw error;
  }
};

module.exports = {
  analyzeStockData
}; 