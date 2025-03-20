import React, { createContext, useContext, useState, useEffect } from 'react';
import StockNotificationService from '../services/StockNotificationService';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Réinitialiser le service de notification après la connexion
      const initNotificationsAfterLogin = async () => {
        try {
          const stockNotificationService = StockNotificationService.getInstance();
          await stockNotificationService.reinitializeAfterLogin();
          console.log('Stock notification service reinitialized after login');
        } catch (error) {
          console.error('Error reinitializing stock notifications after login:', error);
        }
      };

      initNotificationsAfterLogin();
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
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