// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { User } from '../../types'
import { authApi } from '../api/authApi'
import { baseApi } from '../api/baseApi'
import { logoutAction } from '../actions/authActions'
import { clearAllStorage } from '../../utils/logoutUtils'

// Interfaces
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Helper function to get stored user data
const getStoredUser = (): User | null => {
  const storedUser = localStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('🚀 AuthSlice: Starting login process', credentials)
      console.log('🔗 AuthSlice: Calling authApi login mutation...')
      
      // Use the correct RTK Query mutation endpoint
      const result = await authApi.endpoints.login.initiate(credentials)
      const response = await result.unwrap()
      
      console.log('✅ AuthSlice: API response received', response)
      if (response.success) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        console.log('💾 AuthSlice: Token and user saved to localStorage')
        return response.data
      }
      console.log('❌ AuthSlice: Login failed - server returned success: false')
      return rejectWithValue(response.message || 'Login failed')
    } catch (error: any) {
      console.log('💥 AuthSlice: Login error', {
        message: error.message,
        data: error.data,
        response: error.response,
        status: error.status,
        originalStatus: error.originalStatus
      })
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData)
      if (response.data.success) {
        return response.data.data
      }
      return rejectWithValue(response.data.message || 'Registration failed')
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getProfile()
      if (response.data.success) {
        return response.data.data
      }
      return rejectWithValue(response.data.message || 'Failed to get profile')
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile')
    }
  }
)

export const logout = createAsyncThunk(
  logoutAction,
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Call logout API
      await authApi.logout()
      
      // Clear all local storage data
      clearAllStorage()
      
      // Cancel all pending network requests
      dispatch(baseApi.util.resetApiState())
      
      return true
    } catch (error: any) {
      // Even if logout API fails, clear local data and cancel requests
      clearAllStorage()
      dispatch(baseApi.util.resetApiState())
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)


// Initialize auth from stored data and verify token
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      
      if (!token || !userData) {
        console.log('ℹ️ initializeAuth: No stored auth data found')
        return null
      }

      console.log('🔄 initializeAuth: Verifying token with backend...')
      
      // For now, just return the stored user data without backend verification
      // This prevents logout if backend is down
      try {
        const response = await authApi.getProfile()
        if (response.data.success) {
          console.log('✅ initializeAuth: Backend verification successful')
          return response.data.data
        } else {
          console.log('❌ initializeAuth: Backend returned invalid response')
          throw new Error('Invalid backend response')
        }
      } catch (apiError: any) {
        console.log('⚠️ initializeAuth: Backend verification failed, using stored data:', apiError.message)
        
        // If backend is down/error, use the stored user data
        // This prevents automatic logout due to backend issues
        try {
          const storedUser = JSON.parse(userData)
          console.log('📦 initializeAuth: Using stored user data as fallback')
          return storedUser
        } catch (parseError) {
          console.log('❌ initializeAuth: Stored user data is corrupted')
          throw new Error('Corrupted user data')
        }
      }
    } catch (error: any) {
      console.log('❌ initializeAuth: Complete failure, clearing stored data')
      // Only clear data if it's corrupted or completely invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return rejectWithValue(error.message || 'Session expired')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        // Persist user data to localStorage
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        // Persist user data to localStorage
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(register.rejected, (state) => {
        state.isLoading = false
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        // Persist updated user data to localStorage
        localStorage.setItem('user', JSON.stringify(action.payload))
      })
      .addCase(getProfile.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        // Storage already cleared in the logout thunk
      })
      .addCase(logout.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        // Storage already cleared in the logout thunk
      })
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
          // Keep existing token, just update user
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
  },
})

export const { clearAuth, setCredentials } = authSlice.actions
export default authSlice.reducer
