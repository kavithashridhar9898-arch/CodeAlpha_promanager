import { create } from 'zustand';
import axios from 'axios';
import { api } from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  username?: string;
  phone?: string;
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  theme?: string;
  dateFormat?: string;
  timeFormat?: string;
  notificationSettings?: {
    taskAssignments?: boolean;
    mentions?: boolean;
    projectActivity?: boolean;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateMe: (data: Partial<User>) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken: token } = response.data.data;
      
      // Store in local storage for persistence
      localStorage.setItem('token', token);

      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Login failed. Please check your credentials.',
        isLoading: false 
      });
      throw error;
    }
  },

  demoLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/demo/login');
      const { user, accessToken: token } = response.data.data;
      
      localStorage.setItem('token', token);

      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Demo login failed.',
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, accessToken: token } = response.data.data;
      
      localStorage.setItem('token', token);

      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Registration failed.',
        isLoading: false 
      });
      throw error;
    }
  },

  updateMe: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Use raw axios here to match existing authStore style, wait, authStore calls api so let's use api?
      // Actually authStore imports api. Let's use it.
      const response = await api.patch('/auth/me', data);
      const user = response.data.data;
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Update failed.',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    api.post('/auth/logout').catch(() => {});
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Set token in state so the API interceptor can attach it to the request header
    set({ token });

    try {
      // Intentionally use `api` so that the token refresh interceptor triggers on 401
      const response = await api.get('/auth/me');
      // The interceptor might have updated the token in localStorage, so we fetch it again
      const currentToken = localStorage.getItem('token') || token;
      set({ user: response.data.data, token: currentToken, isAuthenticated: true });
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  }
}));
