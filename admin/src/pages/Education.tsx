import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { FaUser, FaGraduationCap, FaPaw, FaSeedling } from 'react-icons/fa';

// Helper functions for user data (based on userProgress.ts)
const API_URL = 'http://localhost:5000/api';

// Function to get all users (admin only)
const getAllUsers = async (accessToken: string | null): Promise<User[]> => {
  try {
    console.log('Fetching all users data...');
    const response = await axios.get(`${API_URL}/users`, {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {}
    });
    
    console.log(`All users data fetched: ${response.data.length} users`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

// Function to get user data by ID
const getUserById = async (userId: number, accessToken: string | null): Promise<any | null> => {
  try {
    if (!accessToken) {
      console.error('No access token available');
      return null;
    }
    
    console.log(`Fetching data for user ID: ${userId}`);
    const response = await axios.get(`${API_URL}/education/userProgress/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    // If the response contains at least one progress entry with user data
    const progressEntries = response.data || [];
    for (const entry of progressEntries) {
      if (entry.User) {
        console.log(`Found user data for ID ${userId} in progress entries: ${entry.User.username}`);
        return entry.User;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching user data for ID ${userId}:`, error);
    return null;
  }
};

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

interface Quiz {
  id: number;
  title: string;
  type: string; // 'animal' or 'crop'
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProgress {
  id: number;
  userId: number;
  quizId: number;
  score: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  Education_Quiz?: Quiz;
  User?: User;
}

interface UserWithProgress {
  user: User;
  progress: {
    animal: {
      completed: number;
      total: number;
      totalScore: number;
    };
    crop: {
      completed: number;
      total: number;
      totalScore: number;
    };
    total: {
      completed: number;
      total: number;
      totalScore: number;
    };
  };
}

function Education() {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [userProgress, setUserProgress] = useState<Record<number, UserProgress[]>>({});
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgressData, setUserProgressData] = useState<UserWithProgress[]>([]);

  // Fetch all quizzes
  const fetchQuizzes = async () => {
    try {
      console.log('Fetching all quizzes...');
      const response = await axios.get(`${API_URL}/education/quizzes`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      // Count animal and crop quizzes
      const animalQuizzes = response.data.filter((q: Quiz) => q.type === 'animal');
      const cropQuizzes = response.data.filter((q: Quiz) => q.type === 'crop');
      
      console.log(`Quizzes fetched: ${response.data.length} total, ${animalQuizzes.length} animal, ${cropQuizzes.length} crop`);
      
      setQuizzes(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to fetch quizzes');
      throw err;
    }
  };

  // Fetch user progress data
  const fetchUserProgressData = async () => {
    try {
      console.log('Fetching user progress data...');
      
      // Now fetch progress data
      const response = await axios.get(`${API_URL}/education/userProgress`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      console.log(`User progress data fetched: ${response.data.length} entries`);
      
      // Get user data for each unique user ID in progress data
      const userIds = [...new Set(response.data.map((progress: UserProgress) => progress.userId))] as number[];
      console.log(`Found ${userIds.length} unique user IDs in progress data`);
      
      // Extract user information from the progress data
      const usersData: User[] = [];
      const progressByUser: Record<number, UserProgress[]> = {};
      
      // Create array of promises to fetch user data for each ID
      const userDataPromises = userIds.map(async (userId) => {
        // Get all progress entries for this user
        const userProgressEntries = response.data.filter(
          (progress: UserProgress) => progress.userId === userId
        );
        
        // Store the progress data for this user
        progressByUser[userId] = userProgressEntries;
        
        // First check if any progress entry has the User object
        const entryWithUser = userProgressEntries.find((entry: UserProgress) => entry.User);
        if (entryWithUser && entryWithUser.User) {
          // Use the attached User data if available
          return entryWithUser.User;
        }
        
        // If not, try to fetch the user data from the API
        try {
          const userData = await getUserById(userId, accessToken);
          if (userData) {
            return userData;
          }
        } catch (err) {
          console.error(`Error fetching user ${userId} data:`, err);
        }
        
        // If all else fails, create a placeholder
        return {
          id: userId,
          username: `User ${userId}`,
          firstName: 'User',
          lastName: String(userId),
          email: `user${userId}@example.com`
        };
      });
      
      // Wait for all user data to be fetched
      const userDataResults = await Promise.all(userDataPromises);
      
      // Add all user data to our array
      usersData.push(...userDataResults);
      
      console.log(`Processed ${usersData.length} users with progress data`);
      
      setUsers(usersData);
      setUserProgress(progressByUser);
      
      return {
        progressData: response.data,
        progressByUser
      };
    } catch (err) {
      console.error('Error fetching user progress:', err);
      setError('Failed to fetch user progress');
      throw err;
    }
  };

  // Process the data to create combined user progress stats
  const processUserProgressData = () => {
    if (!users.length || !quizzes.length) {
      console.log('Missing users or quizzes data for processing');
      return;
    }
    
    // Count quizzes by type
    const animalQuizzes = quizzes.filter(quiz => quiz.type === 'animal');
    const cropQuizzes = quizzes.filter(quiz => quiz.type === 'crop');
    
    const animalQuizCount = animalQuizzes.length;
    const cropQuizCount = cropQuizzes.length;
    const totalQuizCount = animalQuizCount + cropQuizCount;
    
    console.log(`Processing with quiz counts - Animals: ${animalQuizCount}, Crops: ${cropQuizCount}, Total: ${totalQuizCount}`);
    
    const processedData: UserWithProgress[] = users.map(user => {
      const userProgressEntries = userProgress[user.id] || [];
      console.log(`Processing user ${user.id} (${user.username}) with ${userProgressEntries.length} progress entries`);
      
      // Create a map to track the best score for each quiz
      const quizScores = new Map<number, number>();
      
      // Get quiz data for each progress entry
      for (const progress of userProgressEntries) {
        const quizId = progress.quizId;
        const score = progress.score;
        
        // Keep only the highest score for each quiz
        if (!quizScores.has(quizId) || score > quizScores.get(quizId)!) {
          quizScores.set(quizId, score);
        }
      }
      
      // Match each quiz with its type
      const animalScores: number[] = [];
      const cropScores: number[] = [];
      
      // For each quiz score, check the quiz type
      quizScores.forEach((score, quizId) => {
        const quiz = quizzes.find(q => q.id === quizId);
        if (quiz) {
          if (quiz.type === 'animal') {
            animalScores.push(score);
          } else if (quiz.type === 'crop') {
            cropScores.push(score);
          }
        }
      });
      
      // Calculate the number of completed quizzes (only count as completed if score is 100)
      const animalCompleted = animalScores.filter(score => score === 100).length;
      const cropCompleted = cropScores.filter(score => score === 100).length;
      const totalCompleted = animalCompleted + cropCompleted;
      
      // Calculate total scores as percentages (out of 100%)
      // Sum of all scores divided by maximum possible score (100 × number of quizzes)
      const animalScoreSum = animalScores.reduce((sum, score) => sum + score, 0);
      const cropScoreSum = cropScores.reduce((sum, score) => sum + score, 0);
      
      // Calculate scores as percentages
      const animalMaxScore = animalQuizCount * 100; // Maximum possible animal score
      const cropMaxScore = cropQuizCount * 100; // Maximum possible crop score
      const totalMaxScore = totalQuizCount * 100; // Maximum possible total score
      
      // Calculate percentage scores (0-100%)
      const animalTotalScore = animalQuizCount > 0 ? Math.round((animalScoreSum / animalMaxScore) * 100) : 0;
      const cropTotalScore = cropQuizCount > 0 ? Math.round((cropScoreSum / cropMaxScore) * 100) : 0;
      
      // Overall score is weighted average of animal and crop scores
      const combinedScoreSum = animalScoreSum + cropScoreSum;
      const totalScore = totalQuizCount > 0 ? Math.round((combinedScoreSum / totalMaxScore) * 100) : 0;
      
      console.log(`User ${user.id} stats:
        - Animal: ${animalCompleted}/${animalQuizCount} completed, Score: ${animalTotalScore}% (${animalScoreSum}/${animalMaxScore})
        - Crop: ${cropCompleted}/${cropQuizCount} completed, Score: ${cropTotalScore}% (${cropScoreSum}/${cropMaxScore})
        - Overall: ${totalCompleted}/${totalQuizCount} completed, Total Score: ${totalScore}% (${combinedScoreSum}/${totalMaxScore})`);
      
      return {
        user,
        progress: {
          animal: {
            completed: animalCompleted,
            total: animalQuizCount,
            totalScore: animalTotalScore
          },
          crop: {
            completed: cropCompleted,
            total: cropQuizCount,
            totalScore: cropTotalScore
          },
          total: {
            completed: totalCompleted,
            total: totalQuizCount,
            totalScore: totalScore
          }
        }
      };
    });
    
    console.log(`Processed data for ${processedData.length} users`);
    setUserProgressData(processedData);
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      console.log('Starting to load education dashboard data...');
      
      try {
        // Load data in parallel
        const [quizzesData] = await Promise.all([
          fetchQuizzes(),
          fetchUserProgressData()
        ]);
        
        // Now process the user progress data
        processUserProgressData();
      } catch (err) {
        console.error('Error loading education dashboard data:', err);
        setError('Failed to load education data');
      } finally {
        setLoading(false);
      }
    };
    
    if (accessToken) {
      loadData();
    } else {
      console.log('No access token available, cannot load data');
      setError('No authentication token available');
    }
  }, [accessToken]);

  // Process data whenever users, quizzes, or progress changes
  useEffect(() => {
    if (users.length > 0 && quizzes.length > 0) {
      processUserProgressData();
    }
  }, [users, quizzes, userProgress]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-t-[#4CAF50] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading education data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-[#1A2F2B]">Education Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-md">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full flex items-center justify-center w-12 h-12">
              <FaUser className="text-blue-500 text-xl" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-semibold mt-1">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-md">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full flex items-center justify-center w-12 h-12">
              <FaGraduationCap className="text-green-500 text-xl" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Total Quizzes</p>
              <p className="text-2xl font-semibold mt-1">{quizzes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-md">
          <div className="flex items-center">
            <div className="bg-amber-100 p-3 rounded-full flex items-center justify-center w-12 h-12">
              <FaPaw className="text-amber-500 text-xl" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Animal Lessons</p>
              <p className="text-2xl font-semibold mt-1">{quizzes.filter(q => q.type === 'animal').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-md">
          <div className="flex items-center">
            <div className="bg-emerald-100 p-3 rounded-full flex items-center justify-center w-12 h-12">
              <FaSeedling className="text-emerald-500 text-xl" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Crop Lessons</p>
              <p className="text-2xl font-semibold mt-1">{quizzes.filter(q => q.type === 'crop').length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Progress Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold text-[#1A2F2B] p-5">User Progress</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 px-6 text-left text-sm font-medium text-gray-500 uppercase">
                  USER
                </th>
                <th className="pb-3 px-6 text-center text-sm font-medium text-gray-500 uppercase">
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🐾</span>
                    ANIMALS PROGRESS
                  </div>
                </th>
                <th className="pb-3 px-6 text-center text-sm font-medium text-gray-500 uppercase">
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🌱</span>
                    CROPS PROGRESS
                  </div>
                </th>
                <th className="pb-3 px-6 text-center text-sm font-medium text-gray-500 uppercase">
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🎓</span>
                    OVERALL PROGRESS
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {userProgressData.map((item) => (
                <tr key={item.user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full overflow-hidden">
                        <img 
                          className="h-12 w-12 object-cover" 
                          src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" 
                          alt={item.user.username} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-base font-medium text-gray-900">{item.user.username}</div>
                        <div className="text-sm text-gray-500">{item.user.username}</div> {/* Display username instead of email */}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {item.progress.animal.completed}/{item.progress.animal.total} Completed
                      </div>
                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                          className="bg-amber-500 h-2.5 rounded-full" 
                          style={{ width: `${item.progress.animal.totalScore}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Total Score: {item.progress.animal.totalScore}%
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {item.progress.crop.completed}/{item.progress.crop.total} Completed
                      </div>
                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                          className="bg-emerald-500 h-2.5 rounded-full" 
                          style={{ width: `${item.progress.crop.totalScore}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Total Score: {item.progress.crop.totalScore}%
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {item.progress.total.completed}/{item.progress.total.total} Completed
                      </div>
                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full" 
                          style={{ width: `${item.progress.total.totalScore}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Total Score: {item.progress.total.totalScore}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              
              {userProgressData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No user progress data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Education;