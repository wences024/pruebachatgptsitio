import { create } from 'zustand';
import api from '@/lib/api';
import type { AuthResponse, Utente } from '@bar-tpv/shared';

interface AuthState {
  utente: Utente | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<boolean>;
  bootstrap: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  utente: null,
  token: null,
  refreshToken: null,
  login: async (email, password) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('bar-auth', JSON.stringify(data));
    set(data);
    return true;
  },
  logout: () => {
    localStorage.removeItem('bar-auth');
    set({ utente: null, token: null, refreshToken: null });
  },
  refresh: async () => {
    const refreshToken = get().refreshToken;
    if (!refreshToken) return false;
    try {
      const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
      localStorage.setItem('bar-auth', JSON.stringify(data));
      set(data);
      return true;
    } catch {
      get().logout();
      return false;
    }
  },
  bootstrap: () => {
    const raw = localStorage.getItem('bar-auth');
    if (!raw) return;
    const data = JSON.parse(raw) as AuthResponse;
    set(data);
  }
}));
