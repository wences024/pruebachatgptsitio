import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 3000,
});

// Inietta JWT automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bartpv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect al login se 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bartpv_token');
      localStorage.removeItem('bartpv_utente');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ——— Auth ———
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const getMe = () =>
  api.get('/auth/me').then(r => r.data);

// ——— Categorie ———
export const getCategorie = () =>
  api.get('/categorie').then(r => r.data);

export const creaCategoria = (d: object) =>
  api.post('/categorie', d).then(r => r.data);

export const aggiornaCategoria = (id: string, d: object) =>
  api.put(`/categorie/${id}`, d).then(r => r.data);

export const eliminaCategoria = (id: string) =>
  api.delete(`/categorie/${id}`).then(r => r.data);

// ——— Prodotti ———
export const getProdotti = () =>
  api.get('/prodotti').then(r => r.data);

export const creaProdotto = (d: object) =>
  api.post('/prodotti', d).then(r => r.data);

export const aggiornaProdotto = (id: string, d: object) =>
  api.put(`/prodotti/${id}`, d).then(r => r.data);

export const aggiornaStock = (id: string, stock: number) =>
  api.patch(`/prodotti/${id}/stock`, { stock }).then(r => r.data);

export const eliminaProdotto = (id: string) =>
  api.delete(`/prodotti/${id}`).then(r => r.data);

// ——— Attributi ———
export const getAttributi = () =>
  api.get('/attributi').then(r => r.data);

export const creaAttributo = (d: object) =>
  api.post('/attributi', d).then(r => r.data);

export const aggiornaAttributo = (id: string, d: object) =>
  api.put(`/attributi/${id}`, d).then(r => r.data);

export const eliminaAttributo = (id: string) =>
  api.delete(`/attributi/${id}`).then(r => r.data);

// ——— Sale e Tavoli ———
export const getSale = () =>
  api.get('/sale').then(r => r.data);

export const creaSala = (d: object) =>
  api.post('/sale', d).then(r => r.data);

export const aggiornaSala = (id: string, d: object) =>
  api.put(`/sale/${id}`, d).then(r => r.data);

export const eliminaSala = (id: string) =>
  api.delete(`/sale/${id}`).then(r => r.data);

export const creaTavolo = (sala_id: string, numero: number) =>
  api.post(`/sale/${sala_id}/tavoli`, { numero }).then(r => r.data);

export const eliminaTavolo = (id: string) =>
  api.delete(`/sale/tavoli/${id}`).then(r => r.data);

// ——— Ordini ———
export const getOrdineAttivo = (tavolo_id: string) =>
  api.get(`/ordini/tavolo/${tavolo_id}`).then(r => r.data);

export const apriOrdine = (tavolo_id?: string) =>
  api.post('/ordini', { tavolo_id }).then(r => r.data);

export const aggiungiRiga = (ordine_id: string, d: object) =>
  api.post(`/ordini/${ordine_id}/righe`, d).then(r => r.data);

export const modificaRiga = (ordine_id: string, riga_id: string, d: object) =>
  api.put(`/ordini/${ordine_id}/righe/${riga_id}`, d).then(r => r.data);

export const eliminaRiga = (ordine_id: string, riga_id: string) =>
  api.delete(`/ordini/${ordine_id}/righe/${riga_id}`).then(r => r.data);

export const liberaTavolo = (ordine_id: string) =>
  api.post(`/ordini/${ordine_id}/libera`).then(r => r.data);

// ——— Transazioni ———
export const pagaOrdine = (d: object) =>
  api.post('/transazioni', d).then(r => r.data);

export const getRiepilogoOggi = () =>
  api.get('/transazioni/riepilogo-oggi').then(r => r.data);

// ——— Stampanti ———
export const getStampanti = () =>
  api.get('/stampanti').then(r => r.data);

export const creaStampante = (d: object) =>
  api.post('/stampanti', d).then(r => r.data);

export const aggiornaStampante = (id: string, d: object) =>
  api.put(`/stampanti/${id}`, d).then(r => r.data);

export const eliminaStampante = (id: string) =>
  api.delete(`/stampanti/${id}`).then(r => r.data);

export const testStampante = (id: string) =>
  api.post(`/stampanti/${id}/test`).then(r => r.data);

export const stampaComanda = (ordine_id: string, tavolo_numero?: number) =>
  api.post('/stampanti/comanda', { ordine_id, tavolo_numero }).then(r => r.data);

export const apriCassetto = () =>
  api.post('/stampanti/cassetto').then(r => r.data);

export const inviaZReport = () =>
  api.post('/stampanti/z-report').then(r => r.data);

// ——— Analytics ———
export const getDashboard = () =>
  api.get('/analytics/dashboard').then(r => r.data);

export const getVenditeGiornaliere = (da?: string, a?: string) =>
  api.get('/analytics/vendite-giornaliere', { params: { da, a } }).then(r => r.data);

export const getProdottiVenduti = (da?: string, a?: string) =>
  api.get('/analytics/prodotti-venduti', { params: { da, a } }).then(r => r.data);

export const getCategorieStat = (da?: string, a?: string) =>
  api.get('/analytics/categorie', { params: { da, a } }).then(r => r.data);

export const getMetodiPagamento = (da?: string, a?: string) =>
  api.get('/analytics/metodi-pagamento', { params: { da, a } }).then(r => r.data);

// ——— Satispay ———
export const creaPagamentoSatispay = (importo: number, ordine_id: string) =>
  api.post('/satispay/crea-pagamento', { importo, ordine_id }).then(r => r.data);

export const verificaSatispay = (payment_id: string) =>
  api.get(`/satispay/verifica/${payment_id}`).then(r => r.data);

export const getStatoSatispay = () =>
  api.get('/satispay/stato').then(r => r.data);

// ——— Utenti ———
export const getUtenti = () =>
  api.get('/utenti').then(r => r.data);

export const creaUtente = (d: object) =>
  api.post('/utenti', d).then(r => r.data);

export const aggiornaUtente = (id: string, d: object) =>
  api.put(`/utenti/${id}`, d).then(r => r.data);
