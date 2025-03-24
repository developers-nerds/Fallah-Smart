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

// Interface for quiz data
interface Quiz {
  id: number;
  title: string;
  type: string;
  description: string;
  createdAt: string;
  updatedAt: string;
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

function Dashboard() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEducation, setLoadingEducation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [educationError, setEducationError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [educationData, setEducationData] = useState<EducationData[]>([]);
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

  // Colors for charts
  const COLORS = ['#4F7942', '#8FBC8F', '#2E8B57', '#3CB371', '#90EE90', '#006400'];
  const EDUCATION_COLORS = ['#FFC107', '#16A3A9', '#DC3545', '#FD7E14'];

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
    fetchEducationData();
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
                        <Cell fill="#16A3A9" /> {/* Teal for Animal Lessons */}
                        <Cell fill="#FFC107" /> {/* Yellow/Gold for Crop Lessons */}
                        <Cell fill="#FD7E14" /> {/* Orange for Total Quizzes */}
                        <Cell fill="#DC3545" /> {/* Red for Total Users */}
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
                    <span className="text-lg font-semibold text-[#FD7E14]">{educationStats.totalQuizzes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Animal Lessons</span>
                    <span className="text-lg font-semibold text-[#16A3A9]">{educationStats.animalLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Crop Lessons</span>
                    <span className="text-lg font-semibold text-[#FFC107]">{educationStats.cropLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="text-lg font-semibold text-[#DC3545]">{educationStats.activeUsers}</span>
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
    </>
  );
}

export default Dashboard;