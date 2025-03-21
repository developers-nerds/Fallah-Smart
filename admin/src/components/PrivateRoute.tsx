import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/store';

/**
 * PrivateRoute component that protects routes for authenticated admin users
 * Immediately redirects to home if user is not authenticated
 */
const PrivateRoute: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Simple check - no async operations or waiting
  const hasLocalToken = !!localStorage.getItem('accessToken');
  
  // If no token or not authenticated, redirect immediately
  if (!hasLocalToken || !isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // If user exists but is not an admin, redirect immediately
  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the protected route
  return <Outlet />;
};

export default PrivateRoute; 