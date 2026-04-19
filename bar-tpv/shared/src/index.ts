export type RuoloUtente = 'admin' | 'cassiere' | 'cameriere';
export type StatoTavolo = 'libero' | 'occupato' | 'conto';
export type StatoOrdine = 'aperto' | 'chiuso' | 'pagato';
export type MetodoPagamento = 'contanti' | 'carta' | 'satispay';
export type DestinazioneStampa = 'cucina' | 'bar' | 'entrambe';
export type TipoStampante = 'fiscale' | 'cucina' | 'bar';
export type ModalitaIncasso = 'totale' | 'selezione' | 'divisione';

export interface Categoria {
  id: string;
  nome: string;
  emoji?: string;
  destinazione_stampa: DestinazioneStampa;
  ordine: number;
  creato_at?: string;
}

export interface ValoreAttributo {
  valore: string;
  prezzo_aggiunta: number;
}

export interface Attributo {
  id: string;
  nome: string;
  valori: ValoreAttributo[];
  max_selezionabili: number;
  creato_at?: string;
}

export interface Prodotto {
  id: string;
  nome: string;
  emoji?: string;
  categoria_id?: string | null;
  prezzo: number;
  costo: number;
  stock: number;
  stock_minimo: number;
  attributi_ids: string[];
  attivo: boolean;
  creato_at?: string;
}

export interface Sala {
  id: string;
  nome: string;
  ordine: number;
}

export interface Tavolo {
  id: string;
  numero: number;
  sala_id: string;
  stato: StatoTavolo;
  importo?: number;
}

export interface RigaOrdine {
  id: string;
  ordine_id: string;
  prodotto_id: string;
  nome_prodotto: string;
  quantita: number;
  prezzo_unitario: number;
  attributi_selezionati: Record<string, string[]>;
  nota: string;
  selezionata: boolean;
  creato_at?: string;
}

export interface Ordine {
  id: string;
  tavolo_id?: string | null;
  aperto_at: string;
  stato: StatoOrdine;
  totale: number;
  righe?: RigaOrdine[];
}

export interface Stampante {
  id: string;
  nome: string;
  ip: string;
  porta: number;
  tipo: TipoStampante;
  attiva: boolean;
  online?: boolean;
}

export interface Transazione {
  id: string;
  ordine_id: string;
  tipo: 'totale' | 'selezione' | 'divisione';
  metodo: MetodoPagamento;
  importo: number;
  righe_pagate: Array<{ riga_id: string; quantita_pagata: number }>;
  stampato: boolean;
  creato_at?: string;
}

export interface VenditaGiornaliera {
  data: string;
  totale: number;
  contanti: number;
  carta: number;
  satispay: number;
  num_transazioni: number;
}

export interface Utente {
  id: string;
  nome: string;
  email: string;
  ruolo: RuoloUtente;
  attivo: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  utente: Utente;
}
