import { create } from 'zustand';
import type { Categoria, Prodotto, RigaOrdine, Sala, Tavolo, Attributo } from '@bar-tpv/shared';

const righeDemo: RigaOrdine[] = [
  {
    id: 'r1',
    ordine_id: 'o1',
    prodotto_id: 'p1',
    nome_prodotto: 'Gin Tonic',
    quantita: 2,
    prezzo_unitario: 8,
    attributi_selezionati: { Ghiaccio: ['Extra'] },
    nota: '',
    selezionata: false,
    creato_at: new Date().toISOString()
  }
];

interface PosState {
  categorie: Categoria[];
  attributi: Attributo[];
  prodotti: Prodotto[];
  sale: Sala[];
  tavoli: Tavolo[];
  righeCorrenti: RigaOrdine[];
  setRigheCorrenti: (righe: RigaOrdine[]) => void;
  toggleRiga: (id: string) => void;
}

export const usePosStore = create<PosState>((set) => ({
  categorie: [
    { id: 'c1', nome: 'Cocktail', emoji: '🍸', destinazione_stampa: 'bar', ordine: 1 },
    { id: 'c2', nome: 'Birre', emoji: '🍺', destinazione_stampa: 'bar', ordine: 2 },
    { id: 'c3', nome: 'Cucina', emoji: '🍔', destinazione_stampa: 'cucina', ordine: 3 }
  ],
  attributi: [
    {
      id: 'a1',
      nome: 'Formato',
      max_selezionabili: 1,
      valori: [
        { valore: '33cl', prezzo_aggiunta: 0 },
        { valore: '66cl', prezzo_aggiunta: 2.5 }
      ]
    }
  ],
  prodotti: [
    { id: 'p1', nome: 'Gin Tonic', emoji: '🍸', categoria_id: 'c1', prezzo: 8, costo: 2.5, stock: 48, stock_minimo: 8, attributi_ids: [], attivo: true },
    { id: 'p2', nome: 'Moretti', emoji: '🍺', categoria_id: 'c2', prezzo: 4, costo: 1.2, stock: 20, stock_minimo: 6, attributi_ids: ['a1'], attivo: true },
    { id: 'p3', nome: 'Hamburger', emoji: '🍔', categoria_id: 'c3', prezzo: 12, costo: 4.5, stock: 10, stock_minimo: 3, attributi_ids: [], attivo: true }
  ],
  sale: [
    { id: 's1', nome: 'Interno', ordine: 1 },
    { id: 's2', nome: 'Terrazza', ordine: 2 },
    { id: 's3', nome: 'VIP', ordine: 3 }
  ],
  tavoli: [
    { id: 't1', numero: 1, sala_id: 's1', stato: 'occupato', importo: 16 },
    { id: 't2', numero: 2, sala_id: 's1', stato: 'libero' },
    { id: 't3', numero: 12, sala_id: 's2', stato: 'conto', importo: 54 }
  ],
  righeCorrenti: righeDemo,
  setRigheCorrenti: (righeCorrenti) => set({ righeCorrenti }),
  toggleRiga: (id) => set((state) => ({
    righeCorrenti: state.righeCorrenti.map((riga) => riga.id === id ? { ...riga, selezionata: !riga.selezionata } : riga)
  }))
}));
