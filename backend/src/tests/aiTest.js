const axios = require('axios');
const jwt = require('jsonwebtoken');

// Create a test token
const token = jwt.sign({ id: 1, role: 'user' }, process.env.JWT_SECRET || '1234');

const testData = {
  stockData: {
    seeds: {
      count: 10,
      value: 5000,
      items: [
        { quantity: 100, minQuantity: 50 },
        { quantity: 200, minQuantity: 100 }
      ],
      trends: [100, 105, 110]
    },
    pesticides: {
      count: 5,
      value: 3000,
      items: [
        { quantity: 30, minQuantity: 20 },
        { quantity: 15, minQuantity: 25 }
      ],
      trends: [50, 48, 45],
      expiryStatus: {
        expiringSoon: 2
      }
    }
  },
  timestamp: "2024-03-21T12:00:00Z"
};

async function testAIAnalysis() {
  console.log('Starting AI analysis test...');
  console.log('Test data:', JSON.stringify(testData, null, 2));
  
  try {
    console.log('Making request to server...');
    const response = await axios.post('http://localhost:5000/api/ai/analyze-stock', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response received successfully!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Test failed with error:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

console.log('Running AI analysis test...');
testAIAnalysis().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
}); 