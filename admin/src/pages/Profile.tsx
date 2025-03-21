import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { User, setUser } from '../redux/auth';
import { AlertCircle, Check, User as UserIcon, Upload, Camera } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

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

  const getImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    
    const cacheBuster = `?t=${imageTimestamp}`;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/, BASE_URL) + cacheBuster;
    }
    
    return `${BASE_URL}${imageUrl}${cacheBuster}`;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      };
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
        if (imageUrl !== null) {
          setProfileImage(imageUrl);
        }
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setProfileError('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setProfileError('Image too large. Maximum size is 5MB.');
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setProfileError('Only image files are allowed.');
        return;
      }
      
      setUploadedImage(file);
      setImageTimestamp(Date.now());
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
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
      
      // Create form data to handle file upload
      const formData = new FormData();
      
      // Add profile data fields
      Object.entries(profileData).forEach(([key, value]) => {
        if (value && key !== 'email') {  // Skip email field
          formData.append(key, value);
        }
      });
      
      // Add image if uploaded - make sure field name matches server expectation
      if (uploadedImage) {
        formData.append('profilePicture', uploadedImage);
        
        // Log file details for debugging
        console.log('Uploading file:', {
          name: uploadedImage.name,
          type: uploadedImage.type,
          size: `${(uploadedImage.size / 1024).toFixed(2)} KB`
        });
      }
      
      // Log the form data keys
      console.log('Form data keys:', Array.from(formData.keys()));
      
      try {
        const response = await axios.put(
          `${API_URL}/users/profile`, 
          formData,
          config
        );
        
        console.log('Profile update response:', response.data);
        
        // Update user data in Redux
        if (response.data) {
          // Handle different response formats - some APIs return the user object directly,
          // while others might nest it under a different property
          const updatedUserData = response.data.user || response.data;
          
          // Use the proper image URL for the Redux state
          const updatedProfilePicture = updatedUserData.profilePicture 
            ? getImageUrl(updatedUserData.profilePicture) 
            : user?.profilePicture;
          
          console.log('Setting new profile picture URL:', updatedProfilePicture);
          
          dispatch(setUser({
            ...user!,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            username: profileData.username,
            profilePicture: updatedProfilePicture || user?.profilePicture
          } as User));
          
          // Also update the local state for immediate UI update
          setProfileImage(updatedProfilePicture || null);
        }
        
        setProfileSuccess('Profile updated successfully');
        setImageTimestamp(Date.now());
      } catch (error: any) {
        console.error('Error updating profile:', error);
        console.error('Error details:', error.response?.data);
        
        // Try to update profile without the image if it fails
        if (uploadedImage && error.response?.status === 500) {
          setProfileError('Failed to upload image. Updating profile without image...');
          
          // Try text-only update with JSON content type
          try {
            const jsonConfig = {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            };
            
            // Use regular JSON for the update without the image
            const textOnlyData = {
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              username: profileData.username,
              phoneNumber: profileData.phoneNumber,
              gender: profileData.gender
            };
            
            const fallbackResponse = await axios.put(
              `${API_URL}/users/profile`,
              textOnlyData,
              jsonConfig
            );
            
            if (fallbackResponse.data) {
              dispatch(setUser({
                ...user!,
                ...textOnlyData,
                // Don't update profilePicture since it failed
              } as User));
            }
            
            setProfileSuccess('Profile updated successfully (without image)');
            setImageTimestamp(Date.now());
          } catch (fallbackError: any) {
            setProfileError(fallbackError.response?.data?.message || 'Failed to update profile');
          }
        } else {
          setProfileError(error.response?.data?.message || 'Failed to update profile');
        }
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error in profile update process:', error);
      setProfileError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Profile</h1>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <UserIcon className="mr-2 h-5 w-5" />
            Personal Information
          </h2>
          
          {/* Profile Image */}
          <div className="flex justify-center mb-6">
            <div 
              className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer border-2 border-gray-300"
              onClick={handleImageClick}
            >
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  key={Date.now()}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>
          
          {profileSuccess && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <Check className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">{profileSuccess}</p>
                </div>
              </div>
            </div>
          )}
          
          {profileError && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{profileError}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={profileData.gender}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile; 