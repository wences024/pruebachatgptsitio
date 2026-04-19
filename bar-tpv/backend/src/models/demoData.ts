import type { Attributo, Categoria, Prodotto, Sala, Tavolo, Utente, VenditaGiornaliera } from '@bar-tpv/shared';

export const utentiDemo: Array<Utente & { password: string }> = [
  { id: 'u1', nome: 'Teresa', email: 'admin@bartpv.it', ruolo: 'admin', attivo: true, password: 'admin123' },
  { id: 'u2', nome: 'Marco', email: 'cassiere@bartpv.it', ruolo: 'cassiere', attivo: true, password: 'cassa123' },
  { id: 'u3', nome: 'Giulia', email: 'cameriere@bartpv.it', ruolo: 'cameriere', attivo: true, password: 'cameriere123' }
];

export const categorieDemo: Categoria[] = [
  { id: 'c1', nome: 'Cocktail', emoji: '🍸', destinazione_stampa: 'bar', ordine: 1 },
  { id: 'c2', nome: 'Birre', emoji: '🍺', destinazione_stampa: 'bar', ordine: 2 },
  { id: 'c3', nome: 'Cucina', emoji: '🍔', destinazione_stampa: 'cucina', ordine: 3 }
];

export const attributiDemo: Attributo[] = [
  { id: 'a1', nome: 'Formato', valori: [{ valore: '33cl', prezzo_aggiunta: 0 }, { valore: '66cl', prezzo_aggiunta: 2.5 }], max_selezionabili: 1 },
  { id: 'a2', nome: 'Extra', valori: [{ valore: 'Ghiaccio', prezzo_aggiunta: 0 }, { valore: 'Tonica premium', prezzo_aggiunta: 1.5 }], max_selezionabili: 2 }
];

export const prodottiDemo: Prodotto[] = [
  { id: 'p1', nome: 'Gin Tonic', emoji: '🍸', categoria_id: 'c1', prezzo: 8, costo: 2.5, stock: 48, stock_minimo: 8, attributi_ids: ['a2'], attivo: true },
  { id: 'p2', nome: 'Moretti', emoji: '🍺', categoria_id: 'c2', prezzo: 4, costo: 1.2, stock: 20, stock_minimo: 6, attributi_ids: ['a1'], attivo: true },
  { id: 'p3', nome: 'Hamburger', emoji: '🍔', categoria_id: 'c3', prezzo: 12, costo: 4.5, stock: 10, stock_minimo: 3, attributi_ids: [], attivo: true }
];

export const saleDemo: Sala[] = [
  { id: 's1', nome: 'Interno', ordine: 1 },
  { id: 's2', nome: 'Terrazza', ordine: 2 },
  { id: 's3', nome: 'VIP', ordine: 3 }
];

export const tavoliDemo: Tavolo[] = [
  { id: 't1', numero: 1, sala_id: 's1', stato: 'occupato', importo: 16 },
  { id: 't2', numero: 2, sala_id: 's1', stato: 'libero' },
  { id: 't3', numero: 12, sala_id: 's2', stato: 'conto', importo: 54 }
];

export const venditeDemo: VenditaGiornaliera[] = [
  { data: '2026-04-19', totale: 1280, contanti: 390, carta: 660, satispay: 230, num_transazioni: 48 }
];
