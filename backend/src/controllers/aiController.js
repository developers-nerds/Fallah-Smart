const { analyzeStockData } = require('../services/aiService');

const analyzeStock = async (req, res) => {
  try {
    const { stockData, timestamp } = req.body;

    // Validate input
    if (!stockData || typeof stockData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock data provided'
      });
    }

    // Analyze the stock data
    const analysis = await analyzeStockData(stockData);

    // Return the analysis results
    return res.status(200).json({
      success: true,
      data: analysis,
      timestamp: timestamp || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in analyzeStock controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze stock data',
      error: error.message
    });
  }
};

module.exports = {
  analyzeStock
}; 