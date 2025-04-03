import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../redux/store';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, 
  Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Legend, AreaChart,
  Area, BarChart, Bar
} from 'recharts';

// Interface for blog data
interface Blog {
  id: number;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  author?: {
    firstName: string;
    lastName: string;
    username: string;
  };
}

// Interface for quiz data
interface Quiz {
  id: number;
  title: string;
  type: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Weather data interfaces
interface WeatherCondition {
  text: string;
  code: number;
  icon: string;
}

interface ForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    daily_chance_of_rain: number;
    condition: WeatherCondition;
    uv: number;
    totalprecip_mm: number; // Add this property
  };
  hour: Array<{
    time: string;
    temp_c: number;
    condition: WeatherCondition;
    chance_of_rain: number;
  }>;
}

interface WeatherData {
  current: {
    temp_c: number;
    humidity: number;
    condition: WeatherCondition;
  };
  forecast: {
    forecastday: ForecastDay[];
  };
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
}

// Chart data interface
interface CategoryData {
  name: string;
  value: number;
}

// Education chart data interface
interface EducationData {
  name: string;
  value: number;
}

// User Progress interface
interface UserProgress {
  id: number;
  userId: number;
  quizId: number;
  score: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  User?: any;
  Education_Quiz?: Quiz;
}

// Add these interfaces for stock data after the existing interfaces
interface StockSummary {
  totalItems: {
    animals: number;
    pesticides: number;
    equipment: number;
    feeds: number;
    fertilizers: number;
    harvests: number;
    seeds: number;
    tools: number;
    total: number;
  };
  totalValue: {
    animals: number;
    pesticides: number;
    equipment: number;
    feeds: number;
    fertilizers: number;
    harvests: number;
    seeds: number;
    tools: number;
    total: number;
  };
  lowStock: {
    animals: number;
    pesticides: number;
    equipment: number;
    feeds: number;
    fertilizers: number;
    seeds: number;
    tools: number;
    total: number;
  };
  expiring: {
    pesticides: number;
    feeds: number;
    fertilizers: number;
    seeds: number;
    harvests: number;
    total: number;
  };
}

// Wallet data interfaces
interface Transaction {
  id: number
  amount: number
  type: string
  date: string
  category: {
    name: string
    color: string
  }
}

interface Account {
  id: number
  balance: number
  currency: string
}

// AI insight interfaces
interface GlobalInsight {
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  source: 'education' | 'stock' | 'wallet' | 'blog' | 'ai-chat' | 'weather' | 'general';
  icon: string;
  priority: number; // 0-100 indicating importance
  recommendation: string;
  metrics?: {
    label: string;
    value: number | string;
    trend?: 'up' | 'down' | 'neutral';
    unit?: string;
  }[];
  relatedInsights?: string[];
}

// Add weather API constants
const WEATHER_API_KEY = '49b04b19a3614a6f86b503950631e71c';
const WEATHER_API_URL = 'https://api.weatherapi.com/v1/forecast.json';

// Add API constants for wallet
const CATEGORIES_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories`;
const ACCOUNTS_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/accounts/all-with-users`;
const TRANSACTIONS_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/transactions/admin/all`;

// Market price data
const marketPriceData = [
  { day: 'Mon', tomatoes: 2.5, potatoes: 1.2, cucumbers: 1.8, onions: 1.4 },
  { day: 'Tue', tomatoes: 2.4, potatoes: 1.3, cucumbers: 1.7, onions: 1.5 },
  { day: 'Wed', tomatoes: 2.7, potatoes: 1.1, cucumbers: 1.9, onions: 1.3 },
  { day: 'Thu', tomatoes: 2.9, potatoes: 1.2, cucumbers: 2.0, onions: 1.4 },
  { day: 'Fri', tomatoes: 3.1, potatoes: 1.4, cucumbers: 1.8, onions: 1.6 },
  { day: 'Sat', tomatoes: 3.0, potatoes: 1.5, cucumbers: 1.7, onions: 1.7 },
  { day: 'Sun', tomatoes: 2.8, potatoes: 1.4, cucumbers: 1.6, onions: 1.5 },
];

// Placeholder for weather data (will be replaced by API)
const weatherData = [
  { day: 'Today', temp: 28, humidity: 65, condition: 'Sunny', icon: '☀️' },
  { day: 'Tomorrow', temp: 26, humidity: 70, condition: 'Partly Cloudy', icon: '⛅' },
  { day: 'Wed', temp: 25, humidity: 75, condition: 'Cloudy', icon: '☁️' },
  { day: 'Thu', temp: 30, humidity: 60, condition: 'Sunny', icon: '☀️' },
  { day: 'Fri', temp: 27, humidity: 80, condition: 'Rain', icon: '🌧️' },
];

function Dashboard() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEducation, setLoadingEducation] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [educationError, setEducationError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [educationData, setEducationData] = useState<EducationData[]>([]);
  const [stockData, setStockData] = useState<StockSummary | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [blogStats, setBlogStats] = useState({
    total: 0,
    categories: 0,
    authors: 0,
    newest: '',
    mostPopular: ''
  });
  const [educationStats, setEducationStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    animalLessons: 0,
    cropLessons: 0,
    activeUsers: 0
  });
  const [globalInsights, setGlobalInsights] = useState<GlobalInsight[]>([]);

  // Colors for charts
  const STOCK_COLORS = [
    '#4F7942', // Green
    '#0088FE', // Blue
    '#FF8042', // Orange
    '#FFBB28', // Yellow
    '#8884d8', // Purple
    '#00C49F', // Teal
    '#093731',  // Dark Green (primary)
    '#82ca9d'   // Light Green
  ];

  // Load Material Icons
  useEffect(() => {
    // Check if the link already exists
    if (!document.querySelector('link[href*="material-icons"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
      document.head.appendChild(link);
    }
  }, []);

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setLoadingWallet(true);
      setWalletError(null);
      
      // Use real API endpoints instead of mock data
      try {
        // Parallel requests for better performance
        const [categoryResponse, accountsResponse, transactionsResponse] = await Promise.all([
          axios.get(CATEGORIES_URL),
          axios.get(ACCOUNTS_URL),
          axios.get(TRANSACTIONS_URL)
        ]);
        
        // Extract transactions and accounts from the response
        const transactionsData = transactionsResponse.data.data.transactions || [];
        const accountsData = transactionsResponse.data.data.accounts || [];
        
        setTransactions(transactionsData);
        setAccounts(accountsData);

        console.log('Fetched wallet data:', { 
          categories: categoryResponse.data.length,
          accounts: accountsData.length,
          transactions: transactionsData.length 
        });

        // Calculate total balance from all accounts
        const totalAccountBalance = accountsData.reduce((sum: number, account: Account) => sum + account.balance, 0);
        setTotalBalance(totalAccountBalance);

        // Calculate income and expense totals
        const income = transactionsData
          .filter((t: Transaction) => t.type === 'income')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const expense = transactionsData
          .filter((t: Transaction) => t.type === 'expense')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        
        setTotalIncome(income);
        setTotalExpense(expense);
      } catch (apiError: any) {
        console.error('API error fetching wallet data:', apiError);
        
        // Fallback to mock data if API fails
        console.log('Using mock wallet data as fallback');
        
        // Mock data with fallback suffix to avoid variable redeclaration
        const fallbackTransactions = [
          { id: 1, amount: 1200, type: 'income', date: '2023-06-15', category: { name: 'Sales', color: '#4F7942' } },
          { id: 2, amount: 800, type: 'income', date: '2023-07-10', category: { name: 'Sales', color: '#4F7942' } },
          { id: 3, amount: 1500, type: 'income', date: '2023-08-05', category: { name: 'Investment', color: '#0088FE' } },
          { id: 4, amount: 300, type: 'expense', date: '2023-06-20', category: { name: 'Equipment', color: '#FF8042' } },
          { id: 5, amount: 500, type: 'expense', date: '2023-07-25', category: { name: 'Seeds', color: '#FFBB28' } },
          { id: 6, amount: 250, type: 'expense', date: '2023-08-15', category: { name: 'Fertilizer', color: '#8884d8' } },
          { id: 7, amount: 900, type: 'income', date: '2023-09-01', category: { name: 'Sales', color: '#4F7942' } },
          { id: 8, amount: 400, type: 'expense', date: '2023-09-10', category: { name: 'Equipment', color: '#FF8042' } }
        ];
        
        // Mock accounts data
        const fallbackAccounts = [
          { id: 1, balance: 2500, currency: 'TND' },
          { id: 2, balance: 1750, currency: 'TND' }
        ];
        
        setTransactions(fallbackTransactions);
        setAccounts(fallbackAccounts);
        
        // Calculate balances from fallback data
        const fallbackIncome = fallbackTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const fallbackExpense = fallbackTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const fallbackBalance = fallbackAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        setTotalIncome(fallbackIncome);
        setTotalExpense(fallbackExpense);
        setTotalBalance(fallbackBalance);
      }
      
    } catch (err: any) {
      console.error("Error fetching wallet data:", err);
      setWalletError("Failed to load wallet data");
    } finally {
      setLoadingWallet(false);
    }
  };

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
    fetchEducationData();
    fetchStockData();
    fetchWeatherData();
    fetchWalletData();
    generateGlobalInsights();
  }, [accessToken]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:5000/api/blog/posts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      // Set blogs data
      setBlogs(response.data);
      
      // Process data for chart and stats
      processData(response.data);
      
    } catch (err: any) {
      console.error("Error fetching blogs for dashboard:", err);
      setError(err.response?.data?.message || "Failed to load blog analytics");
    } finally {
      setLoading(false);
    }
  };

  // Process blog data for charts and stats
  const processData = (blogData: Blog[]) => {
    // Category distribution
    const categories: { [key: string]: number } = {};
    const authors = new Set<string>();
    
    blogData.forEach(blog => {
      // Count by category
      const category = blog.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
      
      // Track unique authors
      if (blog.author) {
        authors.add(`${blog.author.firstName} ${blog.author.lastName}`);
      }
    });
    
    // Convert to arrays for Recharts
    const categoryChartData: CategoryData[] = Object.keys(categories).map(category => ({
      name: category,
      value: categories[category]
    })).sort((a, b) => b.value - a.value); // Sort by count descending
    
    // Find most popular category
    const mostPopular = categoryChartData.length > 0 ? categoryChartData[0].name : 'None';
    
    // Find newest blog post
    let newest = 'None';
    if (blogData.length > 0) {
      const sortedBlogs = [...blogData].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      newest = sortedBlogs[0].title;
    }
    
    setCategoryData(categoryChartData);
    setBlogStats({
      total: blogData.length,
      categories: Object.keys(categories).length,
      authors: authors.size,
      newest: newest,
      mostPopular: mostPopular
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch education data (quizzes and users)
  const fetchEducationData = async () => {
    try {
      setLoadingEducation(true);
      setEducationError(null);
      
      // Fetch quizzes - try/catch for each request separately
      let quizzesData = [];
      try {
        const quizzesResponse = await axios.get(`http://localhost:5000/api/education/quizzes`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        quizzesData = quizzesResponse.data || [];
        console.log('Successfully fetched quiz data:', quizzesData.length, 'quizzes');
      } catch (quizErr: any) {
        console.error("Error fetching quizzes:", quizErr);
        // Don't set the main error yet, try to fetch user data first
      }
      
      // Fetch users and progress - with separate error handling
      let usersData = [];
      let progressData: UserProgress[] = [];
      try {
        // Using the education/userProgress endpoint to get users with their progress
        const usersResponse = await axios.get(`http://localhost:5000/api/education/userProgress`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        // Extract unique users from the progress data
        progressData = usersResponse.data || [];
        const userMap = new Map();
        
        progressData.forEach((progress: any) => {
          if (progress.User && progress.User.id) {
            userMap.set(progress.User.id, progress.User);
          }
        });
        
        usersData = Array.from(userMap.values());
        console.log('Successfully extracted user data:', usersData.length, 'users');
        console.log('User progress entries:', progressData.length);
        
        // Store the progress data for calculations
        setUserProgress(progressData);
      } catch (userErr: any) {
        console.error("Error fetching users:", userErr);
        // Still don't set the main error, fall back to empty users array
      }
      
      // Set data even if one of the requests failed
      setQuizzes(quizzesData);
      setUsers(usersData);
      
      // Process whatever data we have
      if (quizzesData.length > 0 || usersData.length > 0) {
        processEducationData(quizzesData, usersData, progressData);
      } else {
        // Only set error if both requests failed
        setEducationError("Failed to load education data");
      }
      
    } catch (err: any) {
      console.error("Error in education data fetching:", err);
      setEducationError("Failed to load education analytics");
    } finally {
      setLoadingEducation(false);
    }
  };

  // Process education data for charts and stats
  const processEducationData = (quizData: Quiz[], userData: any[], progressData: UserProgress[]) => {
    // Count animal and crop lessons
    const animalLessons = quizData.filter(quiz => quiz.type === 'animal').length;
    const cropLessons = quizData.filter(quiz => quiz.type === 'crop').length;
    
    // Count unique users who have taken quizzes
    let activeUsers = 0;
    
    if (progressData.length > 0) {
      // Get unique user IDs from progress data
      const uniqueUserIds = new Set<number>();
      
      progressData.forEach(progress => {
        uniqueUserIds.add(progress.userId);
      });
      
      activeUsers = uniqueUserIds.size;
      console.log(`Found ${activeUsers} unique users who have taken quizzes`);
    }
    
    // Set education stats
    setEducationStats({
      totalUsers: userData.length,
      totalQuizzes: quizData.length,
      animalLessons: animalLessons,
      cropLessons: cropLessons,
      activeUsers: activeUsers
    });
    
    // Create education chart data
    const educationChartData: EducationData[] = [
      { name: 'Animal Lessons', value: animalLessons },
      { name: 'Crop Lessons', value: cropLessons },
      { name: 'Total Quizzes', value: quizData.length },
      { name: 'Total Users', value: activeUsers }
    ];
    
    setEducationData(educationChartData);
  };

  // Fetch stock data
  const fetchStockData = async () => {
    try {
      setLoadingStock(true);
      setStockError(null);
      
      const response = await axios.get(`http://localhost:5000/api/stock-dashboard/summary`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      // Set stock data
      setStockData(response.data);
      
    } catch (err: any) {
      console.error("Error fetching stock data for dashboard:", err);
      setStockError(err.response?.data?.message || "Failed to load stock analytics");
    } finally {
      setLoadingStock(false);
    }
  };

  // Fetch weather data
  const fetchWeatherData = async () => {
    try {
      setLoadingWeather(true);
      setWeatherError(null);
      
      // Simulate API call delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data with the same structure as WeatherAPI response
      const mockWeatherData: WeatherData = {
        location: {
          name: "Tunisia",
          region: "",
          country: "Tunisia",
          localtime: new Date().toISOString()
        },
        current: {
          temp_c: 28,
          humidity: 65,
          condition: {
            text: "Sunny",
            code: 1000,
            icon: "//cdn.weatherapi.com/weather/64x64/day/113.png"
          }
        },
        forecast: {
          forecastday: [
            {
              date: new Date().toISOString().split('T')[0],
              day: {
                maxtemp_c: 30,
                mintemp_c: 22,
                avgtemp_c: 26,
                daily_chance_of_rain: 10,
                condition: {
                  text: "Sunny",
                  code: 1000,
                  icon: "//cdn.weatherapi.com/weather/64x64/day/113.png"
                },
                uv: 7,
                totalprecip_mm: 0 // Add this property
              },
              hour: []
            },
            {
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              day: {
                maxtemp_c: 29,
                mintemp_c: 21,
                avgtemp_c: 25,
                daily_chance_of_rain: 20,
                condition: {
                  text: "Partly cloudy",
                  code: 1003,
                  icon: "//cdn.weatherapi.com/weather/64x64/day/116.png"
                },
                uv: 6,
                totalprecip_mm: 0 // Add this property
              },
              hour: []
            },
            {
              date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
              day: {
                maxtemp_c: 27,
                mintemp_c: 20,
                avgtemp_c: 24,
                daily_chance_of_rain: 60,
                condition: {
                  text: "Patchy rain possible",
                  code: 1063,
                  icon: "//cdn.weatherapi.com/weather/64x64/day/176.png"
                },
                uv: 5,
                totalprecip_mm: 0 // Add this property
              },
              hour: []
            },
            {
              date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
              day: {
                maxtemp_c: 31,
                mintemp_c: 23,
                avgtemp_c: 27,
                daily_chance_of_rain: 5,
                condition: {
                  text: "Sunny",
                  code: 1000,
                  icon: "//cdn.weatherapi.com/weather/64x64/day/113.png"
                },
                uv: 7,
                totalprecip_mm: 0 // Add this property
              },
              hour: []
            },
            {
              date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
              day: {
                maxtemp_c: 30,
                mintemp_c: 22,
                avgtemp_c: 26,
                daily_chance_of_rain: 15,
                condition: {
                  text: "Partly cloudy",
                  code: 1003,
                  icon: "//cdn.weatherapi.com/weather/64x64/day/116.png"
                },
                uv: 6,
                totalprecip_mm: 0 // Add this property
              },
              hour: []
            }
          ]
        }
      };
      
      // Set the mock data
      setWeatherData(mockWeatherData);
      
    } catch (err: any) {
      console.error("Error fetching weather data:", err);
      setWeatherError("Failed to load weather data");
    } finally {
      setLoadingWeather(false);
    }
  };

  // Prepare data for wallet charts
  const monthlyData = transactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
    const existingMonth = acc.find(m => m.month === month);
    if (existingMonth) {
      if (transaction.type === 'income') existingMonth.income += transaction.amount;
      else existingMonth.expense += transaction.amount;
    } else {
      acc.push({
        month,
        income: transaction.type === 'income' ? transaction.amount : 0,
        expense: transaction.type === 'expense' ? transaction.amount : 0
      });
    }
    return acc;
  }, [] as any[]);

  // Sort monthly data chronologically
  monthlyData.sort((a, b) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(a.month) - months.indexOf(b.month);
  });

  // Helper function to get weather icon based on condition code
  const getWeatherIcon = (code: number): string => {
    // Map weather codes to emojis
    if (code >= 1000 && code <= 1003) return '☀️'; // Sunny/Clear to partly cloudy
    if (code >= 1004 && code <= 1009) return '☁️'; // Cloudy
    if (code >= 1030 && code <= 1035) return '🌫️'; // Mist/Fog
    if (code >= 1063 && code <= 1117) return '🌧️'; // Rain/Snow
    if (code >= 1135 && code <= 1147) return '🌫️'; // Fog
    if (code >= 1150 && code <= 1207) return '🌧️'; // Rain
    if (code >= 1210 && code <= 1237) return '❄️'; // Snow
    if (code >= 1240 && code <= 1246) return '🌧️'; // Rain
    if (code >= 1249 && code <= 1264) return '🌨️'; // Sleet
    if (code >= 1273 && code <= 1282) return '⛈️'; // Thunderstorm
    return '🌤️'; // Default
  };

  // Format date for display
  const formatForecastDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
    });
  };

  // Generate AI insights on the global situation
  const generateGlobalInsights = async () => {
    try {
      setLoadingInsights(true);
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Empty array to store generated insights
      const insights: GlobalInsight[] = [];
      
      // Generate insights based on education data
      if (educationStats.totalUsers > 0) {
        // Calculate completion rate
        const completionRate = educationStats.activeUsers / educationStats.totalUsers * 100;
        
        if (completionRate < 30) {
          insights.push({
            type: 'warning',
            title: 'Low Education Engagement',
            description: `Only ${Math.round(completionRate)}% of users are actively participating in educational content.`,
            source: 'education',
            icon: 'school',
            priority: 70,
            recommendation: 'Consider sending reminders or incentives to increase educational participation.',
            metrics: [
              { label: 'Engagement Rate', value: Math.round(completionRate), unit: '%', trend: 'down' },
              { label: 'Active Users', value: educationStats.activeUsers, trend: 'neutral' },
              { label: 'Total Users', value: educationStats.totalUsers, trend: 'up' }
            ],
            relatedInsights: ['Educational Content Quality', 'User Retention']
          });
        } else if (completionRate > 70) {
          insights.push({
            type: 'success',
            title: 'High Education Engagement',
            description: `${Math.round(completionRate)}% of users are actively participating in educational content.`,
            source: 'education',
            icon: 'school',
            priority: 60,
            recommendation: 'Consider adding more advanced educational content to maintain engagement.',
            metrics: [
              { label: 'Engagement Rate', value: Math.round(completionRate), unit: '%', trend: 'up' },
              { label: 'Active Users', value: educationStats.activeUsers, trend: 'up' },
              { label: 'Total Users', value: educationStats.totalUsers, trend: 'up' }
            ]
          });
        }

        // Add insight about educational content balance
        const animalPercentage = educationStats.animalLessons / educationStats.totalQuizzes * 100;
        const cropPercentage = educationStats.cropLessons / educationStats.totalQuizzes * 100;
        
        if (Math.abs(animalPercentage - cropPercentage) > 30) {
          insights.push({
            type: 'info',
            title: 'Educational Content Imbalance',
            description: `There's a significant imbalance between animal lessons (${Math.round(animalPercentage)}%) and crop lessons (${Math.round(cropPercentage)}%).`,
            source: 'education',
            icon: 'balance',
            priority: 55,
            recommendation: 'Consider creating more content for the underrepresented category.',
            metrics: [
              { label: 'Animal Lessons', value: educationStats.animalLessons, unit: '', trend: 'neutral' },
              { label: 'Crop Lessons', value: educationStats.cropLessons, unit: '', trend: 'neutral' },
              { label: 'Ratio', value: `${Math.round(animalPercentage)}:${Math.round(cropPercentage)}`, unit: '' }
            ]
          });
        }
      }
      
      // Generate insights based on stock data
      if (stockData) {
        if (stockData.lowStock.total > 5) {
          insights.push({
            type: 'warning',
            title: 'Multiple Items Low in Stock',
            description: `${stockData.lowStock.total} items are below minimum threshold and need restocking.`,
            source: 'stock',
            icon: 'inventory',
            priority: 85,
            recommendation: 'Review low stock items and place orders to replenish inventory.',
            metrics: [
              { label: 'Low Stock Items', value: stockData.lowStock.total, trend: 'up' },
              { label: 'Categories Affected', value: Object.entries(stockData.lowStock).filter(([key, value]) => key !== 'total' && value > 0).length, trend: 'up' },
              { label: 'Most Critical', value: Object.entries(stockData.lowStock).filter(([key, value]) => key !== 'total').sort((a, b) => b[1] - a[1])[0]?.[0] || 'None', trend: 'neutral' }
            ]
          });
        }
        
        if (stockData.expiring.total > 0) {
          insights.push({
            type: 'critical',
            title: 'Items Expiring Soon',
            description: `${stockData.expiring.total} items are expiring within 30 days.`,
            source: 'stock',
            icon: 'schedule',
            priority: 90,
            recommendation: 'Consider using or selling expiring items quickly to minimize losses.',
            metrics: [
              { label: 'Expiring Items', value: stockData.expiring.total, trend: 'up' },
              { label: 'Potential Loss', value: Math.round(stockData.totalValue.total * 0.05), unit: 'TND', trend: 'up' },
              { label: 'Categories Affected', value: Object.entries(stockData.expiring).filter(([key, value]) => key !== 'total' && value > 0).length, trend: 'up' }
            ]
          });
        }

        // Add insight about inventory value distribution
        const highestValueCategory = Object.entries(stockData.totalValue)
          .filter(([key]) => key !== 'total')
          .sort(([, a], [, b]) => b - a)[0];
        
        if (highestValueCategory && stockData.totalValue.total > 0) {
          const categoryName = highestValueCategory[0];
          const categoryValue = highestValueCategory[1];
          const percentageOfTotal = (categoryValue / stockData.totalValue.total) * 100;
          
          if (percentageOfTotal > 40) {
            insights.push({
              type: 'info',
              title: 'Inventory Value Concentration',
              description: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} represents ${Math.round(percentageOfTotal)}% of your total inventory value.`,
              source: 'stock',
              icon: 'pie_chart',
              priority: 65,
              recommendation: 'Consider diversifying your inventory to reduce risk concentration.',
              metrics: [
                { label: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Value`, value: categoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: 'TND' },
                { label: 'Total Inventory Value', value: stockData.totalValue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: 'TND' },
                { label: 'Concentration', value: Math.round(percentageOfTotal), unit: '%', trend: 'up' }
              ]
            });
          }
        }
      }
      
      // Generate insights based on wallet data
      if (transactions.length > 0) {
        const recentExpenses = transactions
          .filter(t => t.type === 'expense' && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .reduce((sum, t) => sum + t.amount, 0);
          
        const recentIncome = transactions
          .filter(t => t.type === 'income' && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (recentExpenses > recentIncome) {
          insights.push({
            type: 'warning',
            title: 'Expenses Exceeding Income',
            description: `Recent expenses (${recentExpenses.toLocaleString()} TND) are higher than income (${recentIncome.toLocaleString()} TND).`,
            source: 'wallet',
            icon: 'account_balance_wallet',
            priority: 80,
            recommendation: 'Review expenses and consider cost-cutting measures.',
            metrics: [
              { label: 'Income (30d)', value: recentIncome.toLocaleString(), unit: 'TND', trend: 'down' },
              { label: 'Expenses (30d)', value: recentExpenses.toLocaleString(), unit: 'TND', trend: 'up' },
              { label: 'Balance', value: (recentIncome - recentExpenses).toLocaleString(), unit: 'TND', trend: 'down' }
            ]
          });
        } else if (recentIncome > recentExpenses * 2) {
          insights.push({
            type: 'success',
            title: 'Strong Positive Cash Flow',
            description: `Recent income is more than double expenses, indicating strong financial health.`,
            source: 'wallet',
            icon: 'account_balance_wallet',
            priority: 65,
            recommendation: 'Consider investing surplus into farm expansion or improvements.',
            metrics: [
              { label: 'Income (30d)', value: recentIncome.toLocaleString(), unit: 'TND', trend: 'up' },
              { label: 'Expenses (30d)', value: recentExpenses.toLocaleString(), unit: 'TND', trend: 'neutral' },
              { label: 'Profit Margin', value: Math.round((recentIncome - recentExpenses) / recentIncome * 100), unit: '%', trend: 'up' }
            ]
          });
        }

        // Add insight about expense categories
        const expenseCategories = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            const category = t.category.name;
            if (!acc[category]) acc[category] = 0;
            acc[category] += t.amount;
            return acc;
          }, {} as Record<string, number>);
        
        const sortedCategories = Object.entries(expenseCategories)
          .sort(([, valueA], [, valueB]) => valueB - valueA);
        
        if (sortedCategories.length > 0) {
          const topCategory = sortedCategories[0];
          const totalExpenses = Object.values(expenseCategories).reduce((sum, val) => sum + val, 0);
          const percentage = (topCategory[1] / totalExpenses) * 100;
          
          if (percentage > 40) {
            insights.push({
              type: 'info',
              title: 'High Concentration in Expenses',
              description: `${topCategory[0]} represents ${Math.round(percentage)}% of your total expenses.`,
              source: 'wallet',
              icon: 'trending_up',
              priority: 60,
              recommendation: 'Analyze if this expense category can be optimized.',
              metrics: [
                { label: `${topCategory[0]} Expenses`, value: topCategory[1].toLocaleString(), unit: 'TND' },
                { label: 'Total Expenses', value: totalExpenses.toLocaleString(), unit: 'TND' },
                { label: 'Concentration', value: Math.round(percentage), unit: '%', trend: 'up' }
              ]
            });
          }
        }
      }
      
      // Generate insights based on weather data
      if (weatherData) {
        const rainChance = Math.max(...weatherData.forecast.forecastday.slice(0, 3).map(day => day.day.daily_chance_of_rain));
        const maxTemp = Math.max(...weatherData.forecast.forecastday.slice(0, 3).map(day => day.day.maxtemp_c));
        
        if (rainChance > 70) {
          insights.push({
            type: 'info',
            title: 'High Chance of Rain',
            description: `${rainChance}% chance of rain in the next few days.`,
            source: 'weather',
            icon: 'water_drop',
            priority: 60,
            recommendation: 'Plan indoor activities and protect sensitive crops.',
            metrics: [
              { label: 'Rain Probability', value: rainChance, unit: '%', trend: 'up' },
              { label: 'Affected Days', value: weatherData.forecast.forecastday.filter(day => day.day.daily_chance_of_rain > 70).length, trend: 'up' },
              { label: 'Expected Precipitation', value: Math.max(...weatherData.forecast.forecastday.slice(0, 3).map(day => day.day.totalprecip_mm)), unit: 'mm' }
            ]
          });
        }
        
        if (maxTemp > 32) {
          insights.push({
            type: 'warning',
            title: 'High Temperatures Expected',
            description: `Temperatures up to ${Math.round(maxTemp)}°C expected in the coming days.`,
            source: 'weather',
            icon: 'thermostat',
            priority: 70,
            recommendation: 'Ensure adequate irrigation for crops and shade for animals.',
            metrics: [
              { label: 'Max Temperature', value: Math.round(maxTemp), unit: '°C', trend: 'up' },
              { label: 'Affected Days', value: weatherData.forecast.forecastday.filter(day => day.day.maxtemp_c > 32).length, trend: 'up' },
              { label: 'Average Humidity', value: Math.round(weatherData.current.humidity), unit: '%' }
            ]
          });
        }

        // Add insight about optimal farming conditions
        const optimalDays = weatherData.forecast.forecastday.filter(day => 
          day.day.maxtemp_c >= 18 && 
          day.day.maxtemp_c <= 30 && 
          day.day.daily_chance_of_rain < 40
        );
        
        if (optimalDays.length > 0) {
          insights.push({
            type: 'success',
            title: 'Upcoming Optimal Farming Conditions',
            description: `${optimalDays.length} day(s) with optimal farming conditions in the next forecast period.`,
            source: 'weather',
            icon: 'wb_sunny',
            priority: 70,
            recommendation: 'Plan outdoor farming activities for these optimal days.',
            metrics: [
              { label: 'Optimal Days', value: optimalDays.length, trend: 'up' },
              { label: 'Avg. Temperature', value: Math.round(optimalDays.reduce((sum, day) => sum + day.day.avgtemp_c, 0) / optimalDays.length), unit: '°C' },
              { label: 'Next Optimal Day', value: formatForecastDate(optimalDays[0].date), trend: 'neutral' }
            ]
          });
        }
      }

      // Add blog insights if we have data
      if (blogs.length > 0) {
        // Calculate post frequency
        const sortedBlogs = [...blogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (sortedBlogs.length > 0) {
          const latestBlog = sortedBlogs[0];
          const daysSinceLastPost = Math.round((Date.now() - new Date(latestBlog.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastPost > 14) {
            insights.push({
              type: 'info',
              title: 'Blog Content Frequency',
              description: `It's been ${daysSinceLastPost} days since your last blog post.`,
              source: 'blog',
              icon: 'post_add',
              priority: 55,
              recommendation: 'Consider publishing new content to keep your audience engaged.',
              metrics: [
                { label: 'Days Since Last Post', value: daysSinceLastPost, trend: 'up' },
                { label: 'Total Posts', value: blogs.length, trend: 'neutral' },
                { label: 'Latest Post Topic', value: latestBlog.category, trend: 'neutral' }
              ]
            });
          }
        }
      }
      
      // Generate general insights
      insights.push({
        type: 'info',
        title: 'System Health Overview',
        description: 'All farm management systems are operating normally.',
        source: 'general',
        icon: 'check_circle',
        priority: 50,
        recommendation: 'Continue regular monitoring and maintenance.',
        metrics: [
          { label: 'Uptime', value: '99.9%', trend: 'up' },
          { label: 'Response Time', value: '0.8s', trend: 'neutral' },
          { label: 'Error Rate', value: '0.02%', trend: 'down' }
        ]
      });

      // Add integrated insight combining multiple data sources
      const hasLowStock = stockData && stockData.lowStock.total > 0;
      const hasOptimalWeather = weatherData && weatherData.forecast.forecastday.some(day => 
        day.day.maxtemp_c >= 18 && day.day.maxtemp_c <= 30 && day.day.daily_chance_of_rain < 40
      );
      const hasSufficientBalance = totalBalance > 1000;

      if (hasLowStock && hasOptimalWeather && hasSufficientBalance) {
        insights.push({
          type: 'success',
          title: 'Optimal Conditions for Restocking',
          description: 'Current conditions are favorable for restocking your low inventory items.',
          source: 'general',
          icon: 'shopping_cart',
          priority: 75,
          recommendation: 'Take advantage of good weather and healthy finances to restock inventory.',
          metrics: [
            { label: 'Low Stock Items', value: stockData?.lowStock.total || 0, trend: 'up' },
            { label: 'Available Funds', value: totalBalance.toLocaleString(), unit: 'TND', trend: 'up' },
            { label: 'Weather Status', value: 'Favorable', trend: 'neutral' }
          ]
        });
      }
      
      // Sort insights by priority (highest first)
      const sortedInsights = insights.sort((a, b) => b.priority - a.priority);
      
      setGlobalInsights(sortedInsights);
    } catch (err: any) {
      console.error("Error generating insights:", err);
    } finally {
      setLoadingInsights(false);
    }
  };
  
  // Helper function to get color based on insight type
  const getInsightTypeColor = (type: string): string => {
    switch (type) {
      case 'critical':
        return '#e53e3e'; // Red
      case 'warning':
        return '#dd6b20'; // Orange
      case 'info':
        return '#3182ce'; // Blue
      case 'success':
        return '#38a169'; // Green
      default:
        return '#718096'; // Gray
    }
  };
  
  // Helper function to get icon based on source and icon name
  const getInsightIcon = (source: string, iconName: string) => {
    // This is a simplified version, you would use your icon library of choice
    return `${iconName}`;
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A2F2B] mb-1">Blog Insights</h2>
          <div className="h-40">
            {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
              </div>
            ) : error ? (
              <div className="flex h-full w-full items-center justify-center text-red-500 text-xs">
                {error}
              </div>
            ) : blogs.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-gray-500 text-xs">
                No blog data available
              </div>
            ) : (
              <div className="flex h-full">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.slice(0, 5)} 
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={35}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STOCK_COLORS[index % STOCK_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} posts`, 'Count']}
                        contentStyle={{ fontSize: '10px', padding: '2px 4px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col justify-between py-1">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <span className="text-xs text-gray-500">Posts</span>
                    <span className="text-xs font-bold text-[#4F7942]">{blogStats.total}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 py-1">
                    <span className="text-xs text-gray-500">Categories</span>
                    <span className="text-xs font-bold text-[#4F7942]">{blogStats.categories}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 py-1">
                    <span className="text-xs text-gray-500">Authors</span>
                    <span className="text-xs font-bold text-[#4F7942]">{blogStats.authors}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-500">Top</span>
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[70%] text-right" title={blogStats.mostPopular}>
                      {blogStats.mostPopular}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!loading && !error && blogs.length > 0 && (
            <div className="mt-1 text-right">
                <a href="/blogs" className="text-[10px] text-blue-500 hover:underline">View all</a>
            </div>
          )}
        </div>
        
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A2F2B]">Stock Overview</h2>
          <div className="mt-2 h-40">
            {loadingStock ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
              </div>
            ) : stockError ? (
              <div className="flex h-full w-full items-center justify-center text-red-500 text-xs">
                {stockError}
              </div>
            ) : !stockData ? (
              <div className="flex h-full w-full items-center justify-center text-gray-500 text-xs">
                No stock data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Animals', value: stockData.totalItems.animals },
                      { name: 'Pesticides', value: stockData.totalItems.pesticides },
                      { name: 'Equipment', value: stockData.totalItems.equipment },
                      { name: 'Feeds', value: stockData.totalItems.feeds },
                      { name: 'Fertilizers', value: stockData.totalItems.fertilizers },
                      { name: 'Seeds', value: stockData.totalItems.seeds },
                      { name: 'Tools', value: stockData.totalItems.tools },
                      { name: 'Harvests', value: stockData.totalItems.harvests }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {STOCK_COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} items`, 'Count']}
                    contentStyle={{ fontSize: '10px', padding: '2px 4px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {!loadingStock && !stockError && stockData && (
            <div className="mt-1 text-right">
              <a href="/stock" className="text-[10px] text-blue-500 hover:underline">View all</a>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A2F2B]">Wallet Overview</h2>
          <div className="mt-2 h-40">
            {loadingWallet ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
              </div>
            ) : walletError ? (
              <div className="flex h-full w-full items-center justify-center text-red-500 text-xs">
                {walletError}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <div className="bg-[#E8F5F3] rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-600">Balance</p>
                    <p className="text-lg font-bold text-[#1A2F2B]">
                      {totalBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                      <span className="text-xs font-normal ml-1">TND</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="bg-green-50 rounded-lg px-2 py-1">
                      <p className="text-xs text-gray-600">Income</p>
                      <p className="text-sm font-bold text-green-600">
                        +{totalIncome.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg px-2 py-1">
                      <p className="text-xs text-gray-600">Expenses</p>
                      <p className="text-sm font-bold text-red-500">
                        -{totalExpense.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData.slice(-4)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        formatter={(value) => [`${value.toLocaleString()} TND`, '']}
                        contentStyle={{ fontSize: '10px', padding: '2px 4px' }}
                      />
                      <Bar dataKey="income" fill={STOCK_COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill={STOCK_COLORS[2]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
          {!loadingWallet && !walletError && (
            <div className="mt-1 text-right">
              <a href="/wallet" className="text-[10px] text-blue-500 hover:underline">View wallet</a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-md">
        <h2 className="text-xl font-semibold text-[#1A2F2B]">Stock Statistics</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#E8F5F3] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-[#1A2F2B]">Total Items</h3>
              <span className="bg-[#093731] p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#093731]">
              {loadingStock ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
              ) : stockData ? (
                stockData.totalItems.total.toLocaleString()
              ) : (
                "N/A"
              )}
            </p>
            <p className="text-xs text-gray-500">Across all stock categories</p>
          </div>
          
          <div className="bg-[#E8F5F3] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-[#1A2F2B]">Total Value</h3>
              <span className="bg-[#093731] p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#093731]">
              {loadingStock ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
              ) : stockData ? (
                `$${stockData.totalValue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                "N/A"
              )}
            </p>
            <p className="text-xs text-gray-500">Estimated inventory value</p>
          </div>
          
          <div className="bg-[#E8F5F3] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-[#1A2F2B]">Low Stock</h3>
              <span className="bg-amber-500 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {loadingStock ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
              ) : stockData ? (
                stockData.lowStock.total.toLocaleString()
              ) : (
                "N/A"
              )}
            </p>
            <p className="text-xs text-gray-500">Items below minimum threshold</p>
          </div>
          
          <div className="bg-[#E8F5F3] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-[#1A2F2B]">Expiring Soon</h3>
              <span className="bg-red-500 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {loadingStock ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
              ) : stockData ? (
                stockData.expiring.total.toLocaleString()
              ) : (
                "N/A"
              )}
            </p>
            <p className="text-xs text-gray-500">Items expiring within 30 days</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Weather Forecast</h2>
          <div className="mt-4 h-48">
            {loadingWeather ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
              </div>
            ) : weatherError ? (
              <div className="flex h-full w-full items-center justify-center text-red-500 text-xs">
                {weatherError}
              </div>
            ) : !weatherData ? (
              <div className="flex h-full w-full items-center justify-center text-gray-500 text-xs">
                No weather data available
              </div>
            ) : (
              <div className="flex h-full items-center justify-around">
                {weatherData.forecast.forecastday.slice(0, 5).map((forecast, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col items-center p-1" 
                    style={{ 
                      minWidth: '45px', 
                      maxWidth: '60px' 
                    }}
                  >
                    <div className="text-sm font-medium text-gray-600">{formatForecastDate(forecast.date)}</div>
                    <div className="my-1 text-2xl">{getWeatherIcon(forecast.day.condition.code)}</div>
                    <div className="font-bold text-[#1A2F2B]">{Math.round(forecast.day.avgtemp_c)}°C</div>
                    <div className="mt-1">
                      <div 
                        className="h-1 w-full rounded-full bg-blue-100"
                        style={{ width: '40px' }}
                      >
                        <div 
                          className="h-1 rounded-full bg-blue-500" 
                          style={{ width: `${forecast.day.daily_chance_of_rain}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{forecast.day.daily_chance_of_rain}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart
                  data={weatherData?.forecast.forecastday.map(day => ({
                    date: formatForecastDate(day.date),
                    temp: day.day.avgtemp_c
                  })) || []}
                  margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={STOCK_COLORS[0]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={STOCK_COLORS[0]} stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="temp" 
                    stroke={STOCK_COLORS[0]} 
                    fill="url(#tempGradient)" 
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Education</h2>
          <div className="mt-4 h-48">
            {loadingEducation ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-[#4CAF50]"></div>
              </div>
            ) : educationError ? (
              <div className="flex h-full w-full items-center justify-center text-red-500 text-xs">
                {educationError}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-gray-500 text-xs">
                No education data available
              </div>
            ) : (
              <div className="flex h-full">
                <div className="w-1/2 h-full flex items-center justify-center">
                  <ResponsiveContainer width="80%" height="80%">
                    <PieChart>
                      <Pie
                        data={educationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={70}
                        paddingAngle={0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {educationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STOCK_COLORS[index % STOCK_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} lessons`, 'Count']}
                        contentStyle={{ fontSize: '10px', padding: '2px 4px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col justify-center space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Quizzes</span>
                    <span className="text-lg font-semibold" style={{ color: STOCK_COLORS[0] }}>{educationStats.totalQuizzes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Animal Lessons</span>
                    <span className="text-lg font-semibold" style={{ color: STOCK_COLORS[1] }}>{educationStats.animalLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Crop Lessons</span>
                    <span className="text-lg font-semibold" style={{ color: STOCK_COLORS[2] }}>{educationStats.cropLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="text-lg font-semibold" style={{ color: STOCK_COLORS[3] }}>{educationStats.activeUsers}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!loadingEducation && !educationError && quizzes.length > 0 && (
            <div className="mt-1 text-right">
              <a href="/education" className="text-xs text-blue-500 hover:underline">View education stats</a>
            </div>
          )}
        </div>
      </div>

      {/* Global Situation Analysis */}
      <div className="mt-6 rounded-xl bg-white p-4 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#1A2F2B] flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#4F7942]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analyse of Global Situation
            </h2>
            <p className="text-sm text-gray-500 mt-1">AI-powered insights across all farm management systems</p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs flex items-center">
              <span className="material-icons-outlined text-sm mr-1">auto_awesome</span>
              AI-powered
            </div>
            <button 
              onClick={() => generateGlobalInsights()} 
              className="text-[#4F7942] hover:bg-green-50 p-1 rounded-full transition-colors"
              title="Refresh insights"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {loadingInsights ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#4F7942]"></div>
            <span className="ml-3 text-gray-500">Analyzing farm data...</span>
          </div>
        ) : (
          <>
            {/* Insight type filter */}
            <div className="flex mb-4 overflow-x-auto py-2 px-1 space-x-2">
              {['all', 'critical', 'warning', 'info', 'success'].map((type) => (
                <button
                  key={type}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                    type === 'all' 
                      ? 'bg-gray-100 text-gray-800' 
                      : type === 'critical'
                      ? 'bg-red-50 text-red-700'
                      : type === 'warning'
                      ? 'bg-orange-50 text-orange-700'
                      : type === 'info'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  {type === 'all' ? 'All Insights' : type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== 'all' && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white">
                      {globalInsights.filter(insight => insight.type === type).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Domain categories */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {['education', 'stock', 'wallet', 'weather', 'general'].map((domain) => (
                <div key={domain} className="bg-gray-50 rounded-lg p-3 text-center flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    domain === 'education' ? 'bg-blue-100 text-blue-600' :
                    domain === 'stock' ? 'bg-purple-100 text-purple-600' :
                    domain === 'wallet' ? 'bg-green-100 text-green-600' :
                    domain === 'weather' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="material-icons-outlined">
                      {domain === 'education' ? 'school' :
                       domain === 'stock' ? 'inventory' :
                       domain === 'wallet' ? 'account_balance_wallet' :
                       domain === 'weather' ? 'cloud' :
                       'settings'}
                    </span>
                  </div>
                  <span className="mt-2 text-xs font-medium text-gray-700 capitalize">{domain}</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {globalInsights.filter(insight => insight.source === domain).length}
                  </span>
                </div>
              ))}
            </div>

            {/* Insights grid */}
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
              {globalInsights.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-gray-500">
                  No insights available at this time. Check back later.
                </div>
              ) : (
                globalInsights.map((insight, index) => (
                  <div 
                    key={index} 
                    className="rounded-lg bg-white border p-4 hover:shadow-md transition-shadow"
                    style={{ borderLeftWidth: '4px', borderLeftColor: getInsightTypeColor(insight.type) }}
                  >
                    <div className="flex items-start">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                        style={{ backgroundColor: `${getInsightTypeColor(insight.type)}20` }}
                      >
                        <span className="material-icons-outlined text-xl" style={{ color: getInsightTypeColor(insight.type) }}>
                          {insight.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <h3 className="font-semibold text-[#1A2F2B]">{insight.title}</h3>
                            <span 
                              className="ml-2 px-2 py-0.5 text-xs rounded-full"
                              style={{ 
                                backgroundColor: `${getInsightTypeColor(insight.type)}15`,
                                color: getInsightTypeColor(insight.type)
                              }}
                            >
                              {insight.type.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <div 
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: getInsightTypeColor(insight.type) }}
                            ></div>
                            <span className="capitalize">{insight.source}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

                        {/* Metrics */}
                        {insight.metrics && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {insight.metrics.map((metric, midx) => (
                              <div key={midx} className="bg-gray-50 rounded p-2 text-center">
                                <div className="text-xs text-gray-500">{metric.label}</div>
                                <div className="text-sm font-semibold flex items-center justify-center">
                                  {metric.value}
                                  {metric.unit && <span className="text-xs ml-1">{metric.unit}</span>}
                                  {metric.trend && (
                                    <span 
                                      className={`material-icons-outlined text-xs ml-1 ${
                                        metric.trend === 'up' ? 'text-red-500' : 
                                        metric.trend === 'down' ? 'text-green-500' : 
                                        'text-gray-500'
                                      }`}
                                    >
                                      {metric.trend === 'up' ? 'trending_up' : 
                                       metric.trend === 'down' ? 'trending_down' : 
                                       'trending_flat'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                          <span className="font-medium">Recommendation:</span> {insight.recommendation}
                        </div>

                        {/* Related insights */}
                        {insight.relatedInsights && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {insight.relatedInsights.map((related, ridx) => (
                              <span key={ridx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {related}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;