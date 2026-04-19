import { create } from 'zustand';

type TabKey = 'rapido' | 'tavoli' | 'magazzino' | 'impostazioni' | 'analytics';

interface UiState {
  isOnline: boolean;
  activeTab: TabKey;
  setOnline: (value: boolean) => void;
  setActiveTab: (tab: TabKey) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isOnline: navigator.onLine,
  activeTab: 'tavoli',
  setOnline: (value) => set({ isOnline: value }),
  setActiveTab: (activeTab) => set({ activeTab })
}));
