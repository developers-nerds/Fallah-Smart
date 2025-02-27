import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import axios from 'axios';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [user, tokens] = await Promise.all([
        storage.getUser(),
        storage.getTokens(),
      ]);

      if (user && tokens.accessToken) {
        setUser(user);
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await storage.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    logout,
    checkAuth,
  };
}; 