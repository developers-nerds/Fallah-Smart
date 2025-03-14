import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import axios from 'axios';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  user: any;
  login: (userData: any, tokens: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const checkAuth = async () => {
    try {
      const [storedUser, tokens] = await Promise.all([
        storage.getUser(),
        storage.getTokens()
      ]);

      if (storedUser && tokens?.access) {
        // Set the authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
        
        try {
          // Verify token with backend
          const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/users/verify`);
          if (response.data.valid) {
            setUser(storedUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          // Token expired, try to refresh
          if (tokens.refresh) {
            try {
              const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/users/refresh`, {
                refreshToken: tokens.refresh
              });
              
              if (response.data.tokens) {
                await storage.setTokens(
                  response.data.tokens.access.token,
                  response.data.tokens.refresh.token
                );
                
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.tokens.access.token}`;
                setUser(storedUser);
                setIsAuthenticated(true);
              }
            } catch (refreshError) {
              await storage.clearAuth();
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await storage.clearAuth();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (userData: any, tokens: any) => {
    try {
      await Promise.all([
        storage.setUser(userData),
        storage.setTokens(tokens.access.token, tokens.refresh.token)
      ]);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access.token}`;
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await storage.clearAuth();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 