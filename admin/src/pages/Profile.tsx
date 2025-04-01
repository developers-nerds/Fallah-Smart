import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { User, setUser } from '../redux/auth';
import { AlertCircle, Check, User as UserIcon, Upload, Camera, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API;
const BASE_URL = import.meta.env.VITE_API_blog;

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  gender: string;
}

const Profile = () => {
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    phoneNumber: '',
    gender: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageTimestamp, setImageTimestamp] = useState<number>(Date.now());
  const [isEditing, setIsEditing] = useState(false);

  const getImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    const cacheBuster = `?t=${imageTimestamp}`;
    return imageUrl.startsWith('http') 
      ? imageUrl.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/, BASE_URL) + cacheBuster
      : `${BASE_URL}${imageUrl}${cacheBuster}`;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const config = { headers: { 'Authorization': `Bearer ${accessToken}` } };
      const response = await axios.get(`${API_URL}/users/profile`, config);
      const userData = response.data;
      
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        username: userData.username || '',
        phoneNumber: userData.phoneNumber || '',
        gender: userData.gender || ''
      });
      
      if (userData.profilePicture) {
        const imageUrl = getImageUrl(userData.profilePicture);
        if (imageUrl) setProfileImage(imageUrl);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setProfileError('Image too large. Maximum size is 5MB.');
        return;
      }
      if (!file.type.match('image.*')) {
        setProfileError('Only image files are allowed.');
        return;
      }
      
      setUploadedImage(file);
      setImageTimestamp(Date.now());
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    
    try {
      setLoading(true);
      const config = {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (value && key !== 'email') formData.append(key, value);
      });
      
      if (uploadedImage) formData.append('profilePicture', uploadedImage);
      
      const response = await axios.put(`${API_URL}/users/profile`, formData, config);
      const updatedUserData = response.data.user || response.data;
      const updatedProfilePicture = updatedUserData.profilePicture 
        ? getImageUrl(updatedUserData.profilePicture) 
        : user?.profilePicture;

      dispatch(setUser({
        ...user!,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        username: profileData.username,
        profilePicture: updatedProfilePicture || user?.profilePicture
      } as User));
      
      setProfileImage(updatedProfilePicture || null);
      setProfileSuccess('Profile updated successfully');
      setImageTimestamp(Date.now());
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setProfileError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-3xl font-bold text-gray-800 mb-8 flex items-center"
        >
          <UserIcon className="mr-3 h-8 w-8 text-indigo-600" />
          Profile Dashboard
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div 
            className="md:col-span-1 bg-white rounded-xl shadow-lg p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col items-center">
              <div 
                className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer border-4 border-indigo-100 mb-4 group"
                onClick={handleImageClick}
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-gray-200 flex items-center justify-center">
                    <UserIcon className="h-16 w-16 text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-indigo-900 bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                  <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-gray-500">@{profileData.username}</p>
            </div>
          </motion.div>

          {/* Profile Form */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Edit2 className="h-5 w-5 text-indigo-600" />
              </button>
            </div>

            {profileSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg bg-green-50 p-4"
              >
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <p className="text-sm text-green-700">{profileSuccess}</p>
                </div>
              </motion.div>
            )}
            
            {profileError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg bg-red-50 p-4"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{profileError}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'First Name', name: 'firstName', type: 'text' },
                  { label: 'Last Name', name: 'lastName', type: 'text' },
                  { label: 'Username', name: 'username', type: 'text' },
                  { label: 'Phone Number', name: 'phoneNumber', type: 'tel' },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={profileData[field.name as keyof ProfileFormData]}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                      }`}
                      required={field.name !== 'phoneNumber'}
                    />
                  </div>
                ))}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={profileData.gender}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              )}
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;