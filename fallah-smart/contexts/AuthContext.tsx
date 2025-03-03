import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import axios from 'axios';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  login: (tokens: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const tokens = await storage.getTokens();
      if (tokens?.access) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (tokens: any) => {
    await storage.setTokens(tokens);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await storage.clearTokens();
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, checkAuth }}>
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