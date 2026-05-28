import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('hommey_token') || null;
const userString = localStorage.getItem('hommey_user');
let user = null;

try {
  if (userString) {
    user = JSON.parse(userString);
  }
} catch (e) {
  console.error('Failed to parse localStorage user data:', e);
}

const initialState = {
  user: user,
  token: token,
  isAuthenticated: !!token,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
      localStorage.setItem('hommey_token', action.payload.token);
      localStorage.setItem('hommey_user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem('hommey_token');
      localStorage.removeItem('hommey_user');
    },
    updateUserSuccess: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('hommey_user', JSON.stringify(state.user));
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUserSuccess } = authSlice.actions;
export default authSlice.reducer;
