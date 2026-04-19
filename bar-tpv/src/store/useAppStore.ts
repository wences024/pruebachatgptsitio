import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Utente, Categoria, Prodotto, Attributo } from '../../../shared/types';

interface AppState {
  utente: Utente | null;
  token: string | null;
  categorie: Categoria[];
  prodotti: Prodotto[];
  attributi: Attributo[];
  isOnline: boolean;

  setAuth: (utente: Utente, token: string) => void;
  logout: () => void;
  setCategorie: (c: Categoria[]) => void;
  setProdotti: (p: Prodotto[]) => void;
  setAttributi: (a: Attributo[]) => void;
  setOnline: (v: boolean) => void;
  aggiornaStock: (prodotto_id: string, stock: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      utente: null,
      token: null,
      categorie: [],
      prodotti: [],
      attributi: [],
      isOnline: true,

      setAuth: (utente, token) => {
        localStorage.setItem('bartpv_token', token);
        set({ utente, token });
      },
      logout: () => {
        localStorage.removeItem('bartpv_token');
        localStorage.removeItem('bartpv_utente');
        set({ utente: null, token: null });
      },
      setCategorie: (categorie) => set({ categorie }),
      setProdotti: (prodotti) => set({ prodotti }),
      setAttributi: (attributi) => set({ attributi }),
      setOnline: (isOnline) => set({ isOnline }),
      aggiornaStock: (prodotto_id, stock) =>
        set((s) => ({
          prodotti: s.prodotti.map((p) =>
            p.id === prodotto_id ? { ...p, stock } : p
          ),
        })),
    }),
    {
      name: 'bartpv-app',
      partialize: (s) => ({ utente: s.utente, token: s.token }),
    }
  )
);
