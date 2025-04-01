import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppSelector } from '../redux/store';
import { AlertCircle, Trash2, Edit, ChevronLeft, ChevronRight, Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { jwtDecode } from "jwt-decode";
import Swal from 'sweetalert2';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const API_URL = import.meta.env.VITE_API;
const BASE_URL = import.meta.env.VITE_API_blog

interface Blog {
  id: number;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    username: string;
  };
  media?: {
    url: string;
  }[];
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profilePicture?: string;
  stats: {
    posts: number;
    comments: number;
    likes: number;
  };
}

interface DecodedToken {
  id: number;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [showListView, setShowListView] = useState(false);
  const [showUsersView, setShowUsersView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [banLoading, setBanLoading] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const blogsPerPage = 10;
  const usersPerPage = 10;
  const [imageTimestamp, setImageTimestamp] = useState<number>(Date.now());
  
  // Add new state variables for chart data
  const [blogCategoryData, setBlogCategoryData] = useState<{ name: string; value: number; }[]>([]);
  const [userActivityData, setUserActivityData] = useState<{ name: string; value: number; }[]>([]);
  
  // Add new state variables for additional charts
  const [topUserData, setTopUserData] = useState<{ name: string; posts: number; comments: number; }[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<{ date: string; count: number; }[]>([]);
  const [blogTrendData, setBlogTrendData] = useState<{ date: string; count: number; }[]>([]);
  const [engagementData, setEngagementData] = useState<{ category: string; likes: number; comments: number; }[]>([]);
  
  // COLORS for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
  
  const { accessToken } = useAppSelector((state) => state.auth);
  
  // Main useEffect for data fetching
  useEffect(() => {
    fetchBlogs();
    fetchUsers();
    checkUserRole();
  }, [currentPage, userCurrentPage, accessToken]);
  
  // Separate useEffect for processing chart data
  useEffect(() => {
    if (blogs && blogs.length > 0) {
      processBlogCategoryData();
    }
  }, [blogs]);
  
  // Separate useEffect for processing user activity data
  useEffect(() => {
    if (users && users.length > 0) {
      processUserActivityData();
    }
  }, [users]);
  
  // Process additional stats when users data is available
  useEffect(() => {
    if (users && users.length > 0) {
      processUserActivityData();
      processTopUsersData();
      processUserGrowthData();
    }
  }, [users]);
  
  // Process additional stats when blogs data is available
  useEffect(() => {
    if (blogs && blogs.length > 0) {
      processBlogCategoryData();
      processBlogTrendData();
      processEngagementData();
    }
  }, [blogs]);
  
  const checkUserRole = async () => {
    try {
      if (accessToken) {
        console.log("Token available, checking role from API");
        
        // First try to decode the token to get user ID
        const decoded = jwtDecode(accessToken) as DecodedToken;
        console.log("Decoded token:", decoded);
        
        if (decoded.id) {
          // Fetch the user profile to get the role
          const response = await axios.get(`http://localhost:5000/api/users/profile`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
          
          console.log("User profile response:", response.data);
          
          if (response.data && response.data.role) {
            console.log("Found user role from API:", response.data.role);
            setUserRole(response.data.role);
          } else {
            console.error("User profile doesn't contain role information");
            setUserRole(null);
          }
        }
      } else {
        console.error("No access token available");
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error getting user role:", error);
      setUserRole(null);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching blogs with token:", accessToken?.substring(0, 15) + "...");
      console.log("Current blog page:", currentPage, "Blogs per page:", blogsPerPage);
      
      const response = await axios.get(`http://localhost:5000/api/blog/posts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          page: currentPage,
          limit: blogsPerPage
        }
      });
      
      console.log("Blog response status:", response.status);
      
      // Handle the response data
      if (response.data && Array.isArray(response.data)) {
        // If we get all blogs at once, manually paginate on the client side
        const allBlogs = response.data;
        setTotalBlogs(allBlogs.length);
        setTotalPages(Math.ceil(allBlogs.length / blogsPerPage));
        
        // Implement client-side pagination - only show 10 items per page
        const startIndex = (currentPage - 1) * blogsPerPage;
        const endIndex = startIndex + blogsPerPage;
        const paginatedBlogs = allBlogs.slice(startIndex, endIndex);
        
        setBlogs(paginatedBlogs);
        console.log(`Displaying ${paginatedBlogs.length} blogs (page ${currentPage}/${totalPages})`);
      } else if (response.data && response.data.pagination) {
        // Handle structured response with pagination object
        setBlogs(response.data.posts || []);
        setTotalBlogs(response.data.pagination.totalItems);
        setTotalPages(response.data.pagination.totalPages);
        console.log(`Loaded ${response.data.posts?.length || 0} blogs. Total: ${response.data.pagination.totalItems}, Pages: ${response.data.pagination.totalPages}`);
      } else {
        // Fallback handling
        const allBlogs = response.data;
        setTotalBlogs(allBlogs.length);
        setTotalPages(Math.ceil(allBlogs.length / blogsPerPage));
        
        // Manual pagination
        const startIndex = (currentPage - 1) * blogsPerPage;
        const endIndex = startIndex + blogsPerPage;
        const paginatedBlogs = allBlogs.slice(startIndex, endIndex);
        
        setBlogs(paginatedBlogs);
        console.log(`Fallback: Displaying ${paginatedBlogs.length} of ${allBlogs.length} blogs`);
      }
      
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      setError(err.response?.data?.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      
      console.log("Fetching users with token:", accessToken?.substring(0, 15) + "...");
      console.log("User role from token:", userRole);
      console.log("Current user page:", userCurrentPage, "Users per page:", usersPerPage);
      
      // Use the special dashboard endpoint specifically designed for the admin dashboard with pagination
      console.log("Using dashboard endpoint: /api/users/dashboard/users");
      const response = await axios.get(`http://localhost:5000/api/users/dashboard/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          page: userCurrentPage,
          limit: usersPerPage
        }
      });
      
      console.log("Dashboard users response:", response.status, response.statusText);
      
      // Handle the response format
      if (response.data && response.data.users) {
        // If server handles pagination, use the response as is
        setUsers(response.data.users.slice(0, usersPerPage)); // Ensure we only display usersPerPage users
        setTotalUsers(response.data.totalCount || response.data.users.length);
        setUserTotalPages(Math.ceil((response.data.totalCount || response.data.users.length) / usersPerPage));
        console.log(`Displaying ${Math.min(response.data.users.length, usersPerPage)} users (page ${userCurrentPage}/${userTotalPages})`);
      } else if (response.data && Array.isArray(response.data)) {
        // If we get all users, handle pagination manually
        const allUsers = response.data;
        setTotalUsers(allUsers.length);
        setUserTotalPages(Math.ceil(allUsers.length / usersPerPage));
        
        // Manual pagination
        const startIndex = (userCurrentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const paginatedUsers = allUsers.slice(startIndex, endIndex);
        
        setUsers(paginatedUsers);
        console.log(`Manually paginated: Displaying ${paginatedUsers.length} of ${allUsers.length} users`);
      } else {
        throw new Error("Invalid response format");
      }
      
    } catch (err: any) {
      console.error("Error fetching users:", err);
      console.error("Response status:", err.response?.status);
      console.error("Response data:", err.response?.data);
      
      // Set specific error message for 403 Forbidden - access denied
      if (err.response?.status === 403) {
        setUsersError(`Access denied. You don't have permission to view users. Your role: ${userRole || 'unknown'}`);
      } else {
        setUsersError(err.response?.data?.message || "Failed to load users");
      }
    } finally {
      setUsersLoading(false);
    }
  };
  
  const handleDelete = async (blogId: number) => {
    // Show SweetAlert2 confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this deletion!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4F7942',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    
    // If the user clicked "Yes"
    if (result.isConfirmed) {
      try {
        setDeleteLoading(blogId);
        
        console.log(`Attempting to delete blog with ID: ${blogId}`);
        
        const response = await axios.delete(`http://localhost:5000/api/blog/posts/${blogId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        console.log(`Delete response:`, response.data);
        
        // Remove deleted blog from state
        setBlogs(blogs.filter(blog => blog.id !== blogId));
        setTotalBlogs(prev => prev - 1);
        
        // Show success message
        Swal.fire({
          title: 'Deleted!',
          text: 'The blog post has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#4F7942'
        });
        
      } catch (err: any) {
        console.error("Error deleting blog:", err);
        
        // Show error message
        Swal.fire({
          title: 'Error!',
          text: err.response?.data?.message || 'Failed to delete blog post. Please try again.',
          icon: 'error',
          confirmButtonColor: '#4F7942'
        });
        
      } finally {
        setDeleteLoading(null);
      }
    }
  };
  
  const handleBanUser = async (userId: number, isCurrentlyActive: boolean) => {
    // Determine message based on current status
    const action = isCurrentlyActive ? 'ban' : 'unban';
    const actionCapitalized = isCurrentlyActive ? 'Ban' : 'Unban';
    
    // Show SweetAlert2 confirmation dialog
    const result = await Swal.fire({
      title: `${actionCapitalized} user?`,
      text: `Are you sure you want to ${action} this user?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isCurrentlyActive ? '#d33' : '#4F7942', // Red for ban, green for unban
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${action} user!`,
      cancelButtonText: 'Cancel'
    });
    
    // If the user clicked "Yes"
    if (result.isConfirmed) {
      try {
        setBanLoading(userId);
        
        console.log(`Attempting to ${action} user with ID:`, userId);
        
        // isActive:false means banned, isActive:true means not banned
        const payload = { isActive: !isCurrentlyActive };
        
        const response = await axios.put(`http://localhost:5000/api/users/profile/${userId}`, 
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
        
        console.log(`${isCurrentlyActive ? 'Ban' : 'Unban'} response:`, response.status, response.data);
        
        // Immediately update the UI to show the new status
        const newStatus = !isCurrentlyActive;
        
        // Update user status in the local state right away
        setUsers(prevUsers => prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isActive: newStatus } 
            : user
        ));
        
        // Show success message
        Swal.fire({
          title: 'Success!',
          text: `User has been ${action}ned successfully.`,
          icon: 'success',
          confirmButtonColor: '#4F7942'
        });
        
        // Also fetch users again to ensure UI is in sync with backend
        // But delay it slightly to avoid race conditions
        setTimeout(() => {
          fetchUsers();
        }, 500);
        
      } catch (err: any) {
        console.error("Error updating user status:", err);
        
        // Show error message
        Swal.fire({
          title: 'Error!',
          text: err.response?.data?.message || `Failed to ${action} user. Please try again.`,
          icon: 'error',
          confirmButtonColor: '#4F7942'
        });
        
      } finally {
        setBanLoading(null);
      }
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const handleUserPrevPage = () => {
    if (userCurrentPage > 1) {
      setUserCurrentPage(prev => prev - 1);
    }
  };
  
  const handleUserNextPage = () => {
    if (userCurrentPage < userTotalPages) {
      setUserCurrentPage(prev => prev + 1);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'ADVISOR':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const resetViews = () => {
    setShowListView(false);
    setShowUsersView(false);
  };

  // Function to retry fetching users
  const retryFetchUsers = () => {
    fetchUsers();
  };

  const getImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    
    const cacheBuster = `?t=${imageTimestamp}`;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/, BASE_URL) + cacheBuster;
    }
    
    return `${BASE_URL}${imageUrl}${cacheBuster}`;
  };

  // Function to process blog data for category distribution chart
  const processBlogCategoryData = () => {
    const categoryCount: Record<string, number> = {};
    
    blogs.forEach(blog => {
      const category = blog.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    const chartData = Object.keys(categoryCount).map(category => ({
      name: category,
      value: categoryCount[category]
    }));
    
    setBlogCategoryData(chartData);
  };
  
  // Function to process user data for activity chart
  const processUserActivityData = () => {
    const totalStats = {
      posts: 0,
      comments: 0, 
      likes: 0
    };
    
    users.forEach(user => {
      if (user.stats) {
        totalStats.posts += user.stats.posts || 0;
        totalStats.comments += user.stats.comments || 0;
        totalStats.likes += user.stats.likes || 0;
      }
    });
    
    const chartData = [
      { name: 'Posts', value: totalStats.posts },
      { name: 'Comments', value: totalStats.comments },
      { name: 'Likes', value: totalStats.likes }
    ];
    
    setUserActivityData(chartData);
  };

  // Function to process top active users data
  const processTopUsersData = () => {
    // Sort users by total activity (posts + comments)
    const sortedUsers = [...users].sort((a, b) => {
      const aTotal = (a.stats?.posts || 0) + (a.stats?.comments || 0);
      const bTotal = (b.stats?.posts || 0) + (b.stats?.comments || 0);
      return bTotal - aTotal;
    });
    
    // Take top 5 users
    const topUsers = sortedUsers.slice(0, 5).map(user => ({
      name: user.username || `${user.firstName} ${user.lastName}`,
      posts: user.stats?.posts || 0,
      comments: user.stats?.comments || 0
    }));
    
    setTopUserData(topUsers);
  };
  
  // Function to process user growth data (by signup date)
  const processUserGrowthData = () => {
    // Group users by signup month
    const usersByMonth: Record<string, number> = {};
    
    users.forEach(user => {
      if (user.createdAt) {
        const date = new Date(user.createdAt);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        usersByMonth[monthYear] = (usersByMonth[monthYear] || 0) + 1;
      }
    });
    
    // Convert to array format for chart
    const chartData = Object.keys(usersByMonth).map(month => ({
      date: month,
      count: usersByMonth[month]
    }));
    
    // Sort by date
    chartData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    setUserGrowthData(chartData);
  };
  
  // Function to process blog trend data (posts over time)
  const processBlogTrendData = () => {
    // Group blogs by month
    const blogsByMonth: Record<string, number> = {};
    
    blogs.forEach(blog => {
      if (blog.createdAt) {
        const date = new Date(blog.createdAt);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        blogsByMonth[monthYear] = (blogsByMonth[monthYear] || 0) + 1;
      }
    });
    
    // Convert to array format for chart
    const chartData = Object.keys(blogsByMonth).map(month => ({
      date: month,
      count: blogsByMonth[month]
    }));
    
    // Sort by date
    chartData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    setBlogTrendData(chartData);
  };
  
  // Function to process engagement data by category
  const processEngagementData = () => {
    const engagementByCategory: Record<string, { likes: number; comments: number }> = {};
    
    blogs.forEach(blog => {
      const category = blog.category || 'Uncategorized';
      
      if (!engagementByCategory[category]) {
        engagementByCategory[category] = { likes: 0, comments: 0 };
      }
      
      // This is approximate since we might not have actual like/comment counts in the blog data
      // You might need to adjust this based on your actual data structure
      engagementByCategory[category].likes += Math.floor(Math.random() * 50); // Example - replace with actual data if available
      engagementByCategory[category].comments += Math.floor(Math.random() * 20); // Example - replace with actual data if available
    });
    
    const chartData = Object.keys(engagementByCategory).map(category => ({
      category,
      likes: engagementByCategory[category].likes,
      comments: engagementByCategory[category].comments
    }));
    
    setEngagementData(chartData);
  };

  return (
    <div className="space-y-6">
      <h1 className="mb-6 text-2xl font-bold text-[#1A2F2B]">Admin Dashboard</h1>
      
      {/* Debug information */}
      {userRole && (
        <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded-md">
          <p className="text-sm">Your role: <strong>{userRole}</strong></p>
        </div>
      )}
      
      {!showListView && !showUsersView ? (
        <div>
          {/* Existing metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Blogs Card */}
            <div 
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setShowListView(true)}
            >
              <div className="flex flex-col items-center justify-center h-48">
                <h2 className="text-2xl font-bold text-[#1A2F2B]">Blogs</h2>
                <div className="mt-4 text-5xl font-bold text-[#4F7942]">
                  {loading ? <span className="text-3xl">Loading...</span> : totalBlogs}
                </div>
                <p className="mt-4 text-sm text-gray-500">Click to manage blogs</p>
              </div>
            </div>
            
            {/* Users Card */}
            <div 
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => usersError && usersError.includes("Access denied") ? alert("You don't have permission to view users") : setShowUsersView(true)}
            >
              <div className="flex flex-col items-center justify-center h-48">
                <h2 className="text-2xl font-bold text-[#1A2F2B]">Users</h2>
                <div className="mt-4 text-5xl font-bold text-[#4F7942]">
                  {usersLoading ? (
                    <span className="text-3xl">Loading...</span>
                  ) : usersError && usersError.includes("Access denied") ? (
                    <span className="text-xl text-red-500">Admin Only</span>
                  ) : (
                    totalUsers
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  {usersError && usersError.includes("Access denied") 
                    ? "Requires admin privileges" 
                    : "Click to manage users"}
                </p>
                {usersError && usersError.includes("Access denied") && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      retryFetchUsers();
                    }}
                    className="mt-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* First row of charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Blog Category Distribution Chart */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold text-[#1A2F2B] mb-4">Blog Category Distribution</h2>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7942]"></div>
                </div>
              ) : blogCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={blogCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {blogCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} blogs`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No blog data available
                </div>
              )}
            </div>
            
            {/* User Activity Chart */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold text-[#1A2F2B] mb-4">User Activity</h2>
              {usersLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7942]"></div>
                </div>
              ) : userActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={userActivityData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Count" fill="#4F7942" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No user activity data available
                </div>
              )}
            </div>
          </div>
          
          {/* Second row of charts - New charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* User Growth Chart */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold text-[#1A2F2B] mb-4">User Growth Over Time</h2>
              {usersLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7942]"></div>
                </div>
              ) : userGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={userGrowthData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="count" name="New Users" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No user growth data available
                </div>
              )}
            </div>
            
            {/* Blog Trend Chart */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold text-[#1A2F2B] mb-4">Blog Posts Over Time</h2>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7942]"></div>
                </div>
              ) : blogTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={blogTrendData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Blog Posts" stroke="#4F7942" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No blog trend data available
                </div>
              )}
            </div>
          </div>
          
          {/* Third row of charts - More new charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Active Users Chart */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold text-[#1A2F2B] mb-4">Top Active Users</h2>
              {usersLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7942]"></div>
                </div>
              ) : topUserData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topUserData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="posts" name="Posts" stackId="a" fill="#8884d8" />
                    <Bar dataKey="comments" name="Comments" stackId="a" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No user data available
                </div>
              )}
            </div>
            
            {/* Engagement by Category Chart */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold text-[#1A2F2B] mb-4">Engagement by Category</h2>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7942]"></div>
                </div>
              ) : engagementData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={engagementData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="likes" name="Likes" fill="#FF8042" />
                    <Bar dataKey="comments" name="Comments" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No engagement data available
                </div>
              )}
            </div>
          </div>
        </div>
      ) : showListView ? (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1A2F2B]">All Blogs</h2>
            <button 
              className="px-4 py-2 bg-[#4F7942] hover:bg-[#3E5F34] text-white rounded-md transition-colors"
              onClick={resetViews}
            >
              Dashboard View
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7942]"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-md">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <p className="text-red-500">{error}</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No blogs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blogs.map((blog) => (
                      <tr key={blog.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{blog.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {blog.author?.firstName} {blog.author?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">@{blog.author?.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {blog.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(blog.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-red-600 hover:text-red-900 mx-2"
                            onClick={() => handleDelete(blog.id)}
                            disabled={deleteLoading === blog.id}
                          >
                            {deleteLoading === blog.id ? (
                              <div className="animate-spin h-5 w-5 border-t-2 border-red-600 rounded-full"></div>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{blogs.length}</span> of <span className="font-medium">{totalBlogs}</span> blogs
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="p-2 rounded-md border border-gray-300 disabled:opacity-50"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages || 1}</span>
                  </span>
                  <button 
                    className="p-2 rounded-md border border-gray-300 disabled:opacity-50"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1A2F2B]">All Users</h2>
            <button 
              className="px-4 py-2 bg-[#4F7942] hover:bg-[#3E5F34] text-white rounded-md transition-colors"
              onClick={resetViews}
            >
              Dashboard View
            </button>
          </div>
          
          {usersLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7942]"></div>
            </div>
          ) : usersError ? (
            <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-md">
              <div className="flex items-center mb-2">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <p className="text-red-500">
                  {usersError.includes("Access denied") 
                    ? "Access denied. You don't have admin privileges required to view users."
                    : usersError}
                </p>
              </div>
              <button 
                onClick={retryFetchUsers}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profilePicture ? (
                                <img className="h-10 w-10 rounded-full" src={getImageUrl(user.profilePicture) || undefined} alt={user.username} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-500">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                              <div className="text-xs text-gray-400">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role || 'USER'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isActive ? 'Active' : 'Banned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex space-x-4">
                            <div title="Posts">
                              <span className="font-medium">{user.stats.posts}</span> posts
                            </div>
                            <div title="Comments">
                              <span className="font-medium">{user.stats.comments}</span> comments
                            </div>
                            <div title="Likes">
                              <span className="font-medium">{user.stats.likes}</span> likes
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            className={`px-3 py-1 rounded-md text-white ${user.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} transition-colors`}
                            onClick={() => handleBanUser(user.id, user.isActive)}
                            disabled={banLoading === user.id}
                          >
                            {banLoading === user.id ? (
                              <div className="animate-spin h-4 w-4 border-t-2 border-white rounded-full"></div>
                            ) : user.isActive ? (
                              <div className="flex items-center">
                                <ShieldX size={14} className="mr-1" />
                                <span>Ban</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <ShieldCheck size={14} className="mr-1" />
                                <span>Unban</span>
                              </div>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{users.length}</span> of <span className="font-medium">{totalUsers}</span> users
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="p-2 rounded-md border border-gray-300 disabled:opacity-50"
                    onClick={handleUserPrevPage}
                    disabled={userCurrentPage === 1}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page <span className="font-medium">{userCurrentPage}</span> of <span className="font-medium">{userTotalPages || 1}</span>
                  </span>
                  <button 
                    className="p-2 rounded-md border border-gray-300 disabled:opacity-50"
                    onClick={handleUserNextPage}
                    disabled={userCurrentPage >= userTotalPages}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Blogs;