import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppDispatch, RootState } from './store';

// Define the base URL from environment variables
const API_URL =  'http://localhost:5000/api';

// Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  username?: string;
  profilePicture?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  tokens: {
    access: {
      token: string;
    };
    refresh: {
      token: string;
    };
  };
}

interface RefreshTokenResponse {
  tokens: {
    access: {
      token: string;
    };
    refresh: {
      token: string;
    };
  };
}

// Set axios defaults
axios.defaults.withCredentials = true;

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
};

// Set token in axios defaults
export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Async actions
export const login = createAsyncThunk<
  { user: User; tokens: LoginResponse['tokens'] },
  LoginCredentials,
  {
    rejectValue: string;
  }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/users/login`,
        credentials
      );

      // Verify the user is an admin
      if (response.data.user.role !== 'ADMIN') {
        return rejectWithValue('Access denied. Admin privileges required.');
      }

      const { user, tokens } = response.data;
      
      // Store tokens in local storage
      localStorage.setItem('accessToken', tokens.access.token);
      localStorage.setItem('refreshToken', tokens.refresh.token);
      
      // Set the authorization header for future requests
      setAuthToken(tokens.access.token);
      
      return { user, tokens };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  }
);

export const logout = createAsyncThunk<
  boolean,
  void,
  {
    state: { auth: AuthState };
    rejectValue: string;
  }
>(
  'auth/logout',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      // Clear tokens from local storage immediately (synchronously)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear auth header immediately
      setAuthToken(null);
      
      // Optional: Try to notify the server, but don't wait for response
      try {
        const { auth } = getState();      
        if (auth.accessToken) {
          setAuthToken(auth.accessToken);
          await axios.post(`${API_URL}/users/logout`);
        }
      } catch (serverError) {
        console.log('Server logout notification failed, but user is still logged out locally');
      }
      
      return true;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Logout failed'
      );
    }
  }
);

export const refreshTokens = createAsyncThunk<
  RefreshTokenResponse['tokens'],
  void,
  {
    state: { auth: AuthState };
    rejectValue: string;
  }
>(
  'auth/refreshTokens',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const refreshToken = auth.refreshToken || localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }
      
      const response = await axios.post<RefreshTokenResponse>(
        `${API_URL}/users/refresh`,
        { refreshToken }
      );
      
      const { tokens } = response.data;
      
      // Update tokens in local storage
      localStorage.setItem('accessToken', tokens.access.token);
      localStorage.setItem('refreshToken', tokens.refresh.token);
      
      // Set the authorization header for future requests
      setAuthToken(tokens.access.token);
      
      return tokens;
    } catch (error: any) {
      // If refresh fails, log out the user
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAuthToken(null);
      
      return rejectWithValue(
        error.response?.data?.message || 'Session expired. Please login again.'
      );
    }
  }
);

export const checkAuthStatus = createAsyncThunk<
  User,
  void,
  {
    state: { auth: AuthState };
    dispatch: AppDispatch;
    rejectValue: string;
  }
>(
  'auth/checkStatus',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const accessToken = auth.accessToken || localStorage.getItem('accessToken');
      
      if (!accessToken) {
        console.log('No access token available');
        return rejectWithValue('No access token available');
      }
      
      // Set the token in headers
      setAuthToken(accessToken);
      
      // Add timeout to the API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        // Verify the token
        const response = await axios.get(`${API_URL}/users/verify`, {
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Check if user is admin
        if (response.data.user.role !== 'ADMIN') {
          console.log('User is not an admin');
          await dispatch(logout());
          return rejectWithValue('Access denied. Admin privileges required.');
        }
        
        return response.data.user;
      } catch (apiError: any) {
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (apiError.name === 'AbortError') {
          console.log('API request timed out');
          return rejectWithValue('Authentication request timed out. Please try again.');
        }
        
        // If verification fails, try to refresh the token
        if (apiError.response?.status === 401) {
          console.log('Token expired, attempting to refresh');
          try {
            await dispatch(refreshTokens());
            const { auth } = getState();
            
            if (auth.accessToken) {
              setAuthToken(auth.accessToken);
              
              // Add timeout to the retry API call
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => retryController.abort(), 3000);
              
              try {
                const response = await axios.get(`${API_URL}/users/verify`, {
                  signal: retryController.signal
                });
                
                // Clear the timeout
                clearTimeout(retryTimeoutId);
                
                // Check if user is admin after refresh
                if (response.data.user.role !== 'ADMIN') {
                  console.log('User is not an admin after token refresh');
                  await dispatch(logout());
                  return rejectWithValue('Access denied. Admin privileges required.');
                }
                
                return response.data.user;
              } catch (retryError: any) {
                // Clear the timeout
                clearTimeout(retryTimeoutId);
                
                if (retryError.name === 'AbortError') {
                  console.log('Retry API request timed out');
                  await dispatch(logout());
                  return rejectWithValue('Authentication retry timed out. Please try again.');
                }
                
                throw retryError;
              }
            }
          } catch (refreshError) {
            // If refresh also fails, logout
            console.log('Token refresh failed');
            await dispatch(logout());
            return rejectWithValue('Session expired. Please login again.');
          }
        }
        
        throw apiError;
      }
    } catch (error: any) {
      console.log('Authentication error:', error.message || 'Unknown error');
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Authentication failed'
      );
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logoutSync: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      state.isLoading = false;
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAuthToken(null);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; tokens: any }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.access.token;
        state.refreshToken = action.payload.tokens.refresh.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });

    // Refresh tokens
    builder
      .addCase(refreshTokens.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshTokens.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.access.token;
        state.refreshToken = action.payload.refresh.token;
      })
      .addCase(refreshTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      });

    // Check auth status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const { clearError, logoutSync, setUser } = authSlice.actions;
export default authSlice.reducer;
