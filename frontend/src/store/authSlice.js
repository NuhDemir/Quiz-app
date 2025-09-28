import { createSlice } from '@reduxjs/toolkit'

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

const initialState = {
  user: getStoredUser(),
  isAuthenticated: !!getStoredUser(),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('user')
    },
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
  },
})

export const { setLoading, setUser, logout, setError } = authSlice.actions
export default authSlice.reducer