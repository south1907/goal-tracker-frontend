/**
 * Authentication state management with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, ApiError } from './client';
import type { User, LoginRequest, RegisterRequest, AuthTokens } from '../types/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          // Login and get tokens
          await apiClient.login(credentials);
          
          // Fetch user profile
          const user = await apiClient.getCurrentUser();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.detail 
            : 'Login failed. Please try again.';
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          // Register user
          const user = await apiClient.register(userData);
          
          // Auto-login after registration
          await apiClient.login({
            email: userData.email,
            password: userData.password,
          });
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.detail 
            : 'Registration failed. Please try again.';
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiClient.logout();
        } catch (error) {
          console.warn('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refresh: async () => {
        set({ isLoading: true });
        
        try {
          await apiClient.refresh();
          const user = await apiClient.getCurrentUser();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User | null) => {
        set({ 
          user,
          isAuthenticated: !!user,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook to require authentication
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (typeof window !== 'undefined' && !isLoading && !isAuthenticated) {
    window.location.href = '/login';
  }
  
  return { isAuthenticated, isLoading };
};
