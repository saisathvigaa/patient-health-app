import { create } from 'zustand';
import { api } from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await api.login(email, password);
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (email, name, password) => {
    set({ loading: true });
    try {
      const data = await api.register(email, name, password);
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    api.clearToken();
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const user = await api.getMe();
      set({ user, initialized: true });
    } catch {
      api.clearToken();
      set({ user: null, initialized: true });
    }
  },
}));
