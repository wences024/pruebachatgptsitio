import { create } from 'zustand';
import type { AttributiSelezionati } from '../../../shared/types';

export interface RigaScontrino {
  id: string;
  prodotto_id: string;
  nome_prodotto: string;
  quantita: number;
  prezzo_unitario: number;
  attributi_selezionati: AttributiSelezionati;
  nota: string;
  selezionata: boolean;
}

interface ScontrinoState {
  righe: RigaScontrino[];
  ordine_id: string | null;

  setOrdineId: (id: string | null) => void;
  setRighe: (righe: RigaScontrino[]) => void;
  aggiungiRiga: (riga: Omit<RigaScontrino, 'selezionata'>) => void;
  rimuoviRiga: (id: string) => void;
  aggiornaRiga: (id: string, dati: Partial<RigaScontrino>) => void;
  toggleSelezione: (id: string) => void;
  selezionaTutte: (v: boolean) => void;
  svuota: () => void;

  totale: () => number;
  totaleSelezionato: () => number;
}

export const useScontrinoStore = create<ScontrinoState>()((set, get) => ({
  righe: [],
  ordine_id: null,

  setOrdineId: (id) => set({ ordine_id: id }),
  setRighe: (righe) => set({ righe: righe.map(r => ({ ...r, selezionata: r.selezionata ?? false })) }),

  aggiungiRiga: (riga) =>
    set((s) => {
      // Se stessa combinazione (prodotto + attributi + nota), incrementa quantità
      const key = JSON.stringify({ pid: riga.prodotto_id, attr: riga.attributi_selezionati, nota: riga.nota });
      const existing = s.righe.find(r =>
        JSON.stringify({ pid: r.prodotto_id, attr: r.attributi_selezionati, nota: r.nota }) === key &&
        r.prezzo_unitario === riga.prezzo_unitario
      );
      if (existing) {
        return {
          righe: s.righe.map(r =>
            r.id === existing.id ? { ...r, quantita: r.quantita + riga.quantita } : r
          ),
        };
      }
      return { righe: [...s.righe, { ...riga, selezionata: false }] };
    }),

  rimuoviRiga: (id) => set((s) => ({ righe: s.righe.filter(r => r.id !== id) })),

  aggiornaRiga: (id, dati) =>
    set((s) => ({ righe: s.righe.map(r => r.id === id ? { ...r, ...dati } : r) })),

  toggleSelezione: (id) =>
    set((s) => ({ righe: s.righe.map(r => r.id === id ? { ...r, selezionata: !r.selezionata } : r) })),

  selezionaTutte: (v) => set((s) => ({ righe: s.righe.map(r => ({ ...r, selezionata: v })) })),

  svuota: () => set({ righe: [], ordine_id: null }),

  totale: () => get().righe.reduce((s, r) => s + r.quantita * r.prezzo_unitario, 0),
  totaleSelezionato: () =>
    get().righe.filter(r => r.selezionata).reduce((s, r) => s + r.quantita * r.prezzo_unitario, 0),
}));
