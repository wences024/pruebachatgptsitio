// Dati demo per modalità senza backend
import type { Categoria, Prodotto, Attributo } from '../../../shared/types';

export const DEMO_TOKEN = 'demo-token-bartpv';

export const DEMO_UTENTE = {
  id: 'demo-1',
  nome: 'Admin Demo',
  email: 'admin@bartpv.it',
  ruolo: 'admin' as const,
  attivo: true,
};

export const DEMO_CATEGORIE: Categoria[] = [
  { id: 'cat-1', nome: 'Birre', emoji: '🍺', destinazione_stampa: 'bar', ordine: 0, creato_at: '', num_prodotti: 2 },
  { id: 'cat-2', nome: 'Vini', emoji: '🍷', destinazione_stampa: 'bar', ordine: 1, creato_at: '', num_prodotti: 2 },
  { id: 'cat-3', nome: 'Cocktail', emoji: '🍹', destinazione_stampa: 'bar', ordine: 2, creato_at: '', num_prodotti: 2 },
  { id: 'cat-4', nome: 'Analcolici', emoji: '🥤', destinazione_stampa: 'bar', ordine: 3, creato_at: '', num_prodotti: 3 },
  { id: 'cat-5', nome: 'Caffetteria', emoji: '☕', destinazione_stampa: 'bar', ordine: 4, creato_at: '', num_prodotti: 2 },
  { id: 'cat-6', nome: 'Cibo', emoji: '🍔', destinazione_stampa: 'cucina', ordine: 5, creato_at: '', num_prodotti: 2 },
  { id: 'cat-7', nome: 'Pizze', emoji: '🍕', destinazione_stampa: 'cucina', ordine: 6, creato_at: '', num_prodotti: 2 },
  { id: 'cat-8', nome: 'Dolci', emoji: '🍰', destinazione_stampa: 'cucina', ordine: 7, creato_at: '', num_prodotti: 1 },
];

export const DEMO_ATTRIBUTI: Attributo[] = [
  {
    id: 'attr-1', nome: 'Formato', max_selezionabili: 1, creato_at: '',
    valori: [
      { valore: '33cl', prezzo_aggiunta: 0 },
      { valore: '66cl', prezzo_aggiunta: 2.50 },
      { valore: 'Pinta', prezzo_aggiunta: 4.50 },
    ],
  },
  {
    id: 'attr-2', nome: 'Cottura', max_selezionabili: 1, creato_at: '',
    valori: [
      { valore: 'Al sangue', prezzo_aggiunta: 0 },
      { valore: 'Media', prezzo_aggiunta: 0 },
      { valore: 'Ben cotta', prezzo_aggiunta: 0 },
    ],
  },
];

export const DEMO_PRODOTTI: Prodotto[] = [
  { id: 'p-1', nome: 'Birra Moretti', emoji: '🍺', categoria_id: 'cat-1', categoria: DEMO_CATEGORIE[0], prezzo: 4.50, costo: 1.20, stock: 48, stock_minimo: 10, attributi_ids: ['attr-1'], attributi: [DEMO_ATTRIBUTI[0]], attivo: true, creato_at: '' },
  { id: 'p-2', nome: 'Birra Peroni', emoji: '🍺', categoria_id: 'cat-1', categoria: DEMO_CATEGORIE[0], prezzo: 4.50, costo: 1.20, stock: 3, stock_minimo: 10, attributi_ids: ['attr-1'], attributi: [DEMO_ATTRIBUTI[0]], attivo: true, creato_at: '' },
  { id: 'p-3', nome: 'Prosecco', emoji: '🍾', categoria_id: 'cat-2', categoria: DEMO_CATEGORIE[1], prezzo: 5.00, costo: 2.00, stock: 24, stock_minimo: 5, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-4', nome: 'Vino Rosso', emoji: '🍷', categoria_id: 'cat-2', categoria: DEMO_CATEGORIE[1], prezzo: 4.50, costo: 1.80, stock: 24, stock_minimo: 5, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-5', nome: 'Spritz', emoji: '🍹', categoria_id: 'cat-3', categoria: DEMO_CATEGORIE[2], prezzo: 6.00, costo: 2.50, stock: 30, stock_minimo: 5, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-6', nome: 'Negroni', emoji: '🍸', categoria_id: 'cat-3', categoria: DEMO_CATEGORIE[2], prezzo: 7.00, costo: 2.80, stock: 30, stock_minimo: 5, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-7', nome: 'Coca Cola', emoji: '🥤', categoria_id: 'cat-4', categoria: DEMO_CATEGORIE[3], prezzo: 3.00, costo: 0.80, stock: 50, stock_minimo: 10, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-8', nome: 'Acqua Naturale', emoji: '💧', categoria_id: 'cat-4', categoria: DEMO_CATEGORIE[3], prezzo: 1.50, costo: 0.30, stock: 100, stock_minimo: 20, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-9', nome: 'Acqua Frizzante', emoji: '💧', categoria_id: 'cat-4', categoria: DEMO_CATEGORIE[3], prezzo: 1.50, costo: 0.30, stock: 100, stock_minimo: 20, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-10', nome: 'Caffè', emoji: '☕', categoria_id: 'cat-5', categoria: DEMO_CATEGORIE[4], prezzo: 1.20, costo: 0.20, stock: 200, stock_minimo: 30, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-11', nome: 'Cappuccino', emoji: '☕', categoria_id: 'cat-5', categoria: DEMO_CATEGORIE[4], prezzo: 1.50, costo: 0.30, stock: 100, stock_minimo: 20, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-12', nome: 'Hamburger', emoji: '🍔', categoria_id: 'cat-6', categoria: DEMO_CATEGORIE[5], prezzo: 9.00, costo: 3.50, stock: 20, stock_minimo: 5, attributi_ids: ['attr-2'], attributi: [DEMO_ATTRIBUTI[1]], attivo: true, creato_at: '' },
  { id: 'p-13', nome: 'Patatine Fritte', emoji: '🍟', categoria_id: 'cat-6', categoria: DEMO_CATEGORIE[5], prezzo: 4.00, costo: 1.00, stock: 40, stock_minimo: 5, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-14', nome: 'Pizza Margherita', emoji: '🍕', categoria_id: 'cat-7', categoria: DEMO_CATEGORIE[6], prezzo: 8.00, costo: 2.50, stock: 30, stock_minimo: 5, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-15', nome: 'Pizza Diavola', emoji: '🌶️', categoria_id: 'cat-7', categoria: DEMO_CATEGORIE[6], prezzo: 9.00, costo: 2.80, stock: 30, stock_minimo: 5, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
  { id: 'p-16', nome: 'Tiramisù', emoji: '🍰', categoria_id: 'cat-8', categoria: DEMO_CATEGORIE[7], prezzo: 4.50, costo: 1.50, stock: 15, stock_minimo: 3, attributi_ids: [], attributi: [], attivo: true, creato_at: '' },
];

export const DEMO_SALE = [
  {
    id: 'sala-1', nome: 'Interno', ordine: 0,
    tavoli: Array.from({ length: 8 }, (_, i) => ({
      id: `tavolo-int-${i + 1}`, numero: i + 1, sala_id: 'sala-1',
      stato: i === 2 ? 'occupato' : i === 5 ? 'conto' : 'libero' as 'libero' | 'occupato' | 'conto',
      ordine_attivo: i === 2 ? { id: 'ord-demo', totale: 23.50, aperto_at: new Date(Date.now() - 25 * 60000).toISOString() } : i === 5 ? { id: 'ord-demo-2', totale: 41.00, aperto_at: new Date(Date.now() - 55 * 60000).toISOString() } : null,
    })),
  },
  {
    id: 'sala-2', nome: 'Terrazza', ordine: 1,
    tavoli: Array.from({ length: 4 }, (_, i) => ({
      id: `tavolo-ter-${i + 1}`, numero: i + 1, sala_id: 'sala-2',
      stato: 'libero' as const,
      ordine_attivo: null,
    })),
  },
];
