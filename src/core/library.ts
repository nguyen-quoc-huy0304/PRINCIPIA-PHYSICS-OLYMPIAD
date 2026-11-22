export type PrincipiaLibraryItem = {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
};

type StoredLibraryItem = PrincipiaLibraryItem & { blob: Blob };

const DB_NAME = 'principia-v2-library';
const STORE_NAME = 'items';

function openLibraryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('Thiết bị không hỗ trợ kho tài liệu ngoại tuyến.')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('ownerId', 'ownerId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Không mở được kho tài liệu.'));
  });
}

export async function listLibraryItems(ownerId: string): Promise<PrincipiaLibraryItem[]> {
  const db = await openLibraryDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).index('ownerId').getAll(ownerId);
      request.onsuccess = () => resolve((request.result as StoredLibraryItem[]).map(({ blob: _blob, ...item }) => item).sort((a,b) => b.addedAt.localeCompare(a.addedAt)));
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function saveLibraryFiles(files: File[], ownerId: string): Promise<PrincipiaLibraryItem[]> {
  const db = await openLibraryDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      for (const file of files) {
        const id = crypto.randomUUID?.() || ('file-' + Date.now() + '-' + Math.random().toString(36).slice(2));
        store.put({ id, ownerId, name: file.name, type: file.type || 'application/octet-stream', size: file.size, addedAt: new Date().toISOString(), blob: file } satisfies StoredLibraryItem);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Không lưu được tài liệu.'));
      transaction.onabort = () => reject(transaction.error || new Error('Đã hủy lưu tài liệu.'));
    });
  } finally { db.close(); }
  return listLibraryItems(ownerId);
}

export async function getLibraryBlob(id: string, ownerId: string): Promise<Blob | null> {
  const db = await openLibraryDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const item = request.result as StoredLibraryItem | undefined;
        resolve(item && item.ownerId === ownerId ? item.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function deleteLibraryBlob(id: string, ownerId: string): Promise<void> {
  const db = await openLibraryDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result as StoredLibraryItem | undefined;
        if (item && item.ownerId === ownerId) store.delete(id);
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
