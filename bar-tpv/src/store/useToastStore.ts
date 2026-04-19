import { create } from 'zustand';

export interface Toast {
  id: string;
  messaggio: string;
  tipo: 'successo' | 'errore' | 'info';
}

interface ToastState {
  toasts: Toast[];
  aggiungi: (messaggio: string, tipo?: Toast['tipo']) => void;
  rimuovi: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  aggiungi: (messaggio, tipo = 'successo') => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, messaggio, tipo }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 2200);
  },
  rimuovi: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
