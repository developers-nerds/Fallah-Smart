import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../redux/store';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, 
  Tooltip, ResponsiveContainer 
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
          <div className="mt-2 h-40 rounded-lg bg-[#F5F6E8]"></div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A2F2B]">Market Prices</h2>
          <div className="mt-2 h-40 rounded-lg bg-[#F5F6E8]"></div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-md">
        <h2 className="text-xl font-semibold text-[#1A2F2B]">Crop Performance</h2>
        <div className="mt-4 h-64 rounded-lg bg-[#E8F5F3]"></div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Weather Forecast</h2>
          <div className="mt-4 h-48 rounded-lg bg-[#F5F6E8]"></div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Upcoming Tasks</h2>
          <div className="mt-4 h-48 rounded-lg bg-[#FDF0F3]"></div>
        </div>
      </div>
    </>
  )
}

export default Dashboard

