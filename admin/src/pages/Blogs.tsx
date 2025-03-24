import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppSelector } from '../redux/store';
import { AlertCircle, Trash2, Edit, ChevronLeft, ChevronRight, Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { jwtDecode } from "jwt-decode";

const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

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
  
  const { accessToken } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    fetchBlogs();
    fetchUsers();
    checkUserRole();
  }, [currentPage, userCurrentPage, accessToken]);
  
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
      
      // Check if pagination info is in the response
      if (response.data && Array.isArray(response.data)) {
        setBlogs(response.data);
        setTotalBlogs(response.data.length > 0 && response.data[0].totalCount ? response.data[0].totalCount : response.data.length);
        // If API includes total count or pagination info, use it
        if (response.data.length > 0 && response.data[0].totalCount) {
          setTotalPages(Math.ceil(response.data[0].totalCount / blogsPerPage));
        } else {
          // Otherwise estimate based on current data
          // If we got less than blogsPerPage, we're on the last page
          setTotalPages(response.data.length < blogsPerPage ? currentPage : currentPage + 1);
        }
        console.log(`Loaded ${response.data.length} blogs. Estimated total pages: ${totalPages}`);
      } else if (response.data && response.data.pagination) {
        // Handle structured response with pagination object
        setBlogs(response.data.posts || response.data);
        setTotalBlogs(response.data.pagination.totalItems);
        setTotalPages(response.data.pagination.totalPages);
        console.log(`Loaded ${response.data.posts?.length || 0} blogs. Total: ${response.data.pagination.totalItems}, Pages: ${response.data.pagination.totalPages}`);
      } else {
        // Fallback handling
        setBlogs(response.data);
        setTotalBlogs(response.data.length);
        setTotalPages(Math.ceil(response.data.length / blogsPerPage));
        console.log(`Fallback: Loaded ${response.data.length} blogs.`);
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
        setUsers(response.data.users);
        setTotalUsers(response.data.totalCount || response.data.users.length);
        setUserTotalPages(Math.ceil((response.data.totalCount || response.data.users.length) / usersPerPage));
        console.log(`Loaded ${response.data.users.length} users. Total: ${response.data.totalCount}, Pages: ${Math.ceil((response.data.totalCount || response.data.users.length) / usersPerPage)}`);
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
      
    } catch (err: any) {
      console.error("Error deleting blog:", err);
      
      // Provide more detailed error information
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
        
        // Handle common errors
        if (err.response.status === 404) {
          alert("Blog post not found. It may have been already deleted.");
        } else if (err.response.status === 403) {
          alert("Access denied. You don't have permission to delete this blog post.");
        } else {
          // Generic message with available details
          alert(err.response.data?.message || "Failed to delete blog post. Please try again.");
        }
      } else {
        // Network error or other client-side issue
        alert("Could not connect to the server. Please check your network connection.");
      }
    } finally {
      setDeleteLoading(null);
    }
  };
  
  const handleBanUser = async (userId: number, isCurrentlyActive: boolean) => {
    try {
      setBanLoading(userId);
      
      console.log(`Attempting to ${isCurrentlyActive ? 'ban' : 'unban'} user with ID:`, userId);
      
      // isActive:false means banned, isActive:true means not banned
      // The controller will handle the conversion to isBanned field
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
      
      // Also fetch users again to ensure UI is in sync with backend
      // But delay it slightly to avoid race conditions
      setTimeout(() => {
        fetchUsers();
      }, 500);
      
    } catch (err: any) {
      console.error("Error updating user status:", err);
      
      // Provide more detailed error information
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
        
        // Handle common errors
        if (err.response.status === 404) {
          alert("User not found. This user may have been deleted.");
        } else if (err.response.status === 403) {
          alert("Access denied. You don't have permission to update user status.");
        } else {
          // Generic message with available details
          alert(err.response.data?.message || "Failed to update user status. Please try again.");
        }
      } else {
        // Network error or other client-side issue
        alert("Could not connect to the server. Please check your network connection.");
      }
    } finally {
      setBanLoading(null);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

