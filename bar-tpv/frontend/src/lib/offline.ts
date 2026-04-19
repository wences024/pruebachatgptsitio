// IndexedDB per modalità offline
const DB_NAME = 'bartpv_offline';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = (e.target as IDBOpenDBRequest).result;
      if (!d.objectStoreNames.contains('ordini_offline')) {
        d.createObjectStore('ordini_offline', { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains('azioni_pendenti')) {
        const store = d.createObjectStore('azioni_pendenti', { keyPath: 'id', autoIncrement: true });
        store.createIndex('creato_at', 'creato_at');
      }
    };
    req.onsuccess = () => { db = req.result; resolve(req.result); };
    req.onerror = () => reject(req.error);
  });
}

export async function salvaOrdineOffline(ordine: object & { id: string }) {
  const d = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction('ordini_offline', 'readwrite');
    tx.objectStore('ordini_offline').put(ordine);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOrdiniOffline(): Promise<object[]> {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const req = d.transaction('ordini_offline').objectStore('ordini_offline').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface AzionePendente {
  id?: number;
  tipo: 'aggiungi_riga' | 'elimina_riga' | 'paga';
  payload: object;
  creato_at: string;
}

export async function aggiungiAzionePendente(azione: Omit<AzionePendente, 'id' | 'creato_at'>) {
  const d = await openDB();
  const record: AzionePendente = { ...azione, creato_at: new Date().toISOString() };
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction('azioni_pendenti', 'readwrite');
    tx.objectStore('azioni_pendenti').add(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAzioniPendenti(): Promise<AzionePendente[]> {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const req = d.transaction('azioni_pendenti').objectStore('azioni_pendenti').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function eliminaAzionePendente(id: number) {
  const d = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction('azioni_pendenti', 'readwrite');
    tx.objectStore('azioni_pendenti').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
