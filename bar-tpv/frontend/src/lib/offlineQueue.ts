import { openDB } from 'idb';

const DB_NAME = 'bar-tpv-offline';
const STORE_NAME = 'azioni';

export interface OfflineAction {
  id?: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: unknown;
  creatoAt: number;
}

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    }
  });
}

export async function enqueueOfflineAction(action: OfflineAction) {
  const db = await getDb();
  await db.add(STORE_NAME, action);
}

export async function listOfflineActions() {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function clearOfflineAction(id: number) {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}
