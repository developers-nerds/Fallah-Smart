import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer, { checkAuthStatus, setAuthToken } from './auth';

// Create the store
const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializableCheck middleware
        ignoredActions: ['auth/login/fulfilled', 'auth/refreshTokens/fulfilled'],
      },
    }),
});

// Export types and hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Initialize auth on app start
const initializeAuth = async () => {
  // Get token from localStorage and set in axios headers
  const token = localStorage.getItem('accessToken');
  if (token) {
    setAuthToken(token);
    // Check if the token is valid and the user is an admin
    store.dispatch(checkAuthStatus());
  }
};

// Call initialization function
initializeAuth();

export default store;
