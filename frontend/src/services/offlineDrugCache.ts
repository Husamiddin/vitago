/**
 * VitaGo Offline Drug Reference Cache (IndexedDB)
 * Stores approved public medicine reference info for offline lookups.
 * Strictly NO patient medical data, prescriptions, or user tokens stored here.
 */

export interface PublicDrugReference {
  id: number;
  trade_name: string;
  trade_name_ru?: string;
  inn: string;
  inn_uz?: string;
  inn_ru?: string;
  dosage_and_form?: string;
  description?: string;
  simple_purpose_uz?: string;
  simple_purpose_ru?: string;
  manufacturer?: string;
  is_local_uz?: boolean;
  source?: string;
}

const DB_NAME = 'vitago_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'public_drugs';
const META_KEY_LAST_SYNC = 'vitago_offline_catalog_last_sync';
const META_KEY_TOTAL = 'vitago_offline_catalog_total';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB is not supported in this browser.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('trade_name', 'trade_name', { unique: false });
        store.createIndex('inn', 'inn', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves an array of public drug reference items into IndexedDB transactionally.
 */
export async function savePublicDrugs(drugs: PublicDrugReference[]): Promise<void> {
  if (!drugs || drugs.length === 0) return;
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const drug of drugs) {
      if (drug.id && drug.trade_name) {
        store.put(drug);
      }
    }

    tx.oncomplete = () => {
      try {
        localStorage.setItem(META_KEY_LAST_SYNC, new Date().toISOString());
        localStorage.setItem(META_KEY_TOTAL, drugs.length.toString());
      } catch {
        // ignore quota error
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Searches the local IndexedDB catalog by trade name or active ingredient (INN).
 */
export async function searchOfflineDrugs(
  query: string,
  limit = 15
): Promise<PublicDrugReference[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const results: PublicDrugReference[] = [];

    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor && results.length < limit) {
        const item: PublicDrugReference = cursor.value;
        const tn = (item.trade_name || '').toLowerCase();
        const tnRu = (item.trade_name_ru || '').toLowerCase();
        const inn = (item.inn || '').toLowerCase();
        const innUz = (item.inn_uz || '').toLowerCase();
        const innRu = (item.inn_ru || '').toLowerCase();

        if (
          tn.includes(cleanQ) ||
          tnRu.includes(cleanQ) ||
          inn.includes(cleanQ) ||
          innUz.includes(cleanQ) ||
          innRu.includes(cleanQ)
        ) {
          results.push(item);
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    cursorRequest.onerror = () => reject(cursorRequest.error);
  });
}

/**
 * Returns the ISO string of the last successful catalog sync, or null.
 */
export function getLastSyncTimestamp(): string | null {
  try {
    return localStorage.getItem(META_KEY_LAST_SYNC);
  } catch {
    return null;
  }
}

/**
 * Returns total cached offline drugs count.
 */
export function getCachedDrugCount(): number {
  try {
    return parseInt(localStorage.getItem(META_KEY_TOTAL) || '0', 10);
  } catch {
    return 0;
  }
}

/**
 * Synchronizes public drug catalogue from backend and caches into IndexedDB.
 */
export async function syncPublicDrugs(): Promise<{ success: boolean; count: number; synced_at: string }> {
  try {
    const resp = await fetch('/api/v1/drugs/public-catalogue?limit=300');
    if (!resp.ok) {
      throw new Error(`Sync failed with status ${resp.status}`);
    }
    const data = await resp.json();
    if (data && Array.isArray(data.drugs) && data.drugs.length > 0) {
      await savePublicDrugs(data.drugs);
      const syncedAt = data.synced_at || new Date().toISOString();
      return {
        success: true,
        count: data.drugs.length,
        synced_at: syncedAt,
      };
    }
    return { success: false, count: 0, synced_at: '' };
  } catch (err) {
    console.warn('[OfflineCache] Sync error:', err);
    return {
      success: false,
      count: getCachedDrugCount(),
      synced_at: getLastSyncTimestamp() || '',
    };
  }
}
