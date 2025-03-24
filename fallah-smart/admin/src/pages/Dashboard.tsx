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

// Chart data interface
interface CategoryData {
  name: string;
  value: number;
}

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

// Weather forecast data
const weatherData = [
  { day: 'Today', temp: 28, humidity: 65, condition: 'Sunny', icon: '☀️' },
  { day: 'Tomorrow', temp: 26, humidity: 70, condition: 'Partly Cloudy', icon: '⛅' },
  { day: 'Wed', temp: 25, humidity: 75, condition: 'Cloudy', icon: '☁️' },
  { day: 'Thu', temp: 30, humidity: 60, condition: 'Sunny', icon: '☀️' },
  { day: 'Fri', temp: 27, humidity: 80, condition: 'Rain', icon: '🌧️' },
];

// Upcoming tasks data
const tasksData = [
  { id: 1, task: 'Fertilize tomato field', due: 'Today', priority: 'High', completed: false },
  { id: 2, task: 'Irrigation system maintenance', due: 'Tomorrow', priority: 'Medium', completed: false },
  { id: 3, task: 'Harvest cucumbers', due: 'Wed', priority: 'High', completed: false },
  { id: 4, task: 'Apply pesticides', due: 'Thu', priority: 'Medium', completed: false },
  { id: 5, task: 'Equipment inspection', due: 'Fri', priority: 'Low', completed: false },
];

function Dashboard() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [blogStats, setBlogStats] = useState({
    total: 0,
    categories: 0,
    authors: 0,
    newest: '',
    mostPopular: ''
  });

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
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

  // Colors for charts
  const COLORS = ['#4F7942', '#8FBC8F', '#2E8B57', '#3CB371', '#90EE90', '#006400'];

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <div className="mt-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500">Latest post:</span>
                <a href="/blogs" className="text-[10px] text-blue-500 hover:underline">View all</a>
              </div>
              <div className="text-xs font-medium text-gray-800 truncate" title={blogStats.newest}>
                {blogStats.newest}
              </div>
            </div>
          )}
        </div>
        
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A2F2B]">Stock Overview</h2>
          <div className="mt-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Animals', value: 245 },
                    { name: 'Pesticides', value: 130 },
                    { name: 'Equipment', value: 87 },
                    { name: 'Feeds', value: 210 },
                    { name: 'Fertilizers', value: 155 },
                    { name: 'Seeds', value: 95 },
                    { name: 'Tools', value: 72 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {[
                    '#4F7942', // Green
                    '#0088FE', // Blue
                    '#FF8042', // Orange
                    '#FFBB28', // Yellow
                    '#8884d8', // Purple
                    '#00C49F', // Teal
                    '#093731'  // Dark Green (primary)
                  ].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} items`, 'Count']}
                  contentStyle={{ fontSize: '10px', padding: '2px 4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A2F2B]">Market Prices</h2>
          <div className="mt-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={marketPriceData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '10px', 
                    padding: '2px 4px',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: '4px',
                    border: 'none'
                  }}
                  formatter={(value) => [`$${value}`, 'Price']}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="tomatoes" stroke="#ff6b6b" dot={{ r: 1 }} strokeWidth={2} />
                <Line type="monotone" dataKey="potatoes" stroke="#4F7942" dot={{ r: 1 }} strokeWidth={2} />
                <Line type="monotone" dataKey="cucumbers" stroke="#4ecdc4" dot={{ r: 1 }} strokeWidth={2} />
                <Line type="monotone" dataKey="onions" stroke="#a78bfa" dot={{ r: 1 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
            <p className="mt-2 text-2xl font-bold text-[#093731]">1,345</p>
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
            <p className="mt-2 text-2xl font-bold text-[#093731]">$24,789.50</p>
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
            <p className="mt-2 text-2xl font-bold text-amber-600">42</p>
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
            <p className="mt-2 text-2xl font-bold text-red-600">18</p>
            <p className="text-xs text-gray-500">Items expiring within 30 days</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Weather Forecast</h2>
          <div className="mt-4 h-48">
            <div className="flex h-full items-center justify-around">
              {weatherData.map((day, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center p-1" 
                  style={{ 
                    minWidth: '45px', 
                    maxWidth: '60px' 
                  }}
                >
                  <div className="text-sm font-medium text-gray-600">{day.day}</div>
                  <div className="my-1 text-2xl">{day.icon}</div>
                  <div className="font-bold text-[#1A2F2B]">{day.temp}°C</div>
                  <div className="mt-1">
                    <div 
                      className="h-1 w-full rounded-full bg-blue-100"
                      style={{ width: '40px' }}
                    >
                      <div 
                        className="h-1 rounded-full bg-blue-500" 
                        style={{ width: `${day.humidity}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{day.humidity}%</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart
                  data={weatherData}
                  margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB86C" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FFB86C" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="#f9a03f" 
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
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Upcoming Tasks</h2>
          <div className="mt-4 h-48 overflow-y-auto">
            <div className="space-y-3">
              {tasksData.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center rounded-lg border-l-4 bg-white px-3 py-2 shadow-sm"
                  style={{ 
                    borderLeftColor: 
                      task.priority === 'High' ? '#e53e3e' : 
                      task.priority === 'Medium' ? '#dd6b20' : 
                      '#4F7942' 
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800">{task.task}</div>
                    <div className="flex items-center space-x-1">
                      <span className="truncate text-xs text-gray-500">Due: {task.due}</span>
                      <span className="text-xs">•</span>
                      <span 
                        className="text-xs font-medium"
                        style={{ 
                          color: 
                            task.priority === 'High' ? '#e53e3e' : 
                            task.priority === 'Medium' ? '#dd6b20' : 
                            '#4F7942' 
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div>
                    <svg 
                      className="h-5 w-5 text-gray-400 hover:text-gray-500" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <button className="flex items-center gap-1 rounded-full bg-[#F5F6E8] px-3 py-1 text-xs font-medium text-[#4F7942] hover:bg-[#E8EFD4]">
                <svg 
                  className="h-3 w-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
                Add New Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard; 