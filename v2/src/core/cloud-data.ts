import { getFirebaseApp } from './firebase';
import { collectLegacyData, restoreLegacyBackup } from './legacy-migration';

const COLLECTION = 'principiaUsers';
const SUBCOLLECTION = 'legacyData';
const CHUNK_CODEPOINTS = 120_000;

function splitValue(value: string): string[] {
  const points = Array.from(value);
  if (!points.length) return [''];
  const chunks: string[] = [];
  for (let offset = 0; offset < points.length; offset += CHUNK_CODEPOINTS) {
    chunks.push(points.slice(offset, offset + CHUNK_CODEPOINTS).join(''));
  }
  return chunks;
}

function safeDocumentId(key: string, part: number): string {
  return `${encodeURIComponent(key)}__${part}`;
}

export async function syncLegacyDataToCloud(uid: string): Promise<number> {
  if (!uid) throw new Error('Bạn cần đăng nhập trước khi đồng bộ.');
  const backup = collectLegacyData();
  const [app, firestore] = await Promise.all([
    getFirebaseApp(),
    import('firebase/firestore')
  ]);
  const db = firestore.getFirestore(app);
  const collectionRef = firestore.collection(db, COLLECTION, uid, SUBCOLLECTION);
  const existing = await firestore.getDocs(collectionRef);
  const expected = new Set<string>();
  const operations: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const [key, value] of Object.entries(backup.entries)) {
    const chunks = splitValue(value);
    chunks.forEach((chunk, part) => {
      const id = safeDocumentId(key, part);
      expected.add(id);
      operations.push({
        id,
        data: { key, part, total: chunks.length, value: chunk, updatedAt: firestore.serverTimestamp() }
      });
    });
  }

  const staleIds = existing.docs
    .map(snapshot => snapshot.id)
    .filter(id => !expected.has(id));

  const allOperations = [
    ...operations.map(operation => ({ kind: 'set' as const, ...operation })),
    ...staleIds.map(id => ({ kind: 'delete' as const, id }))
  ];

  for (let offset = 0; offset < allOperations.length; offset += 450) {
    const batch = firestore.writeBatch(db);
    for (const operation of allOperations.slice(offset, offset + 450)) {
      const reference = firestore.doc(collectionRef, operation.id);
      if (operation.kind === 'set') batch.set(reference, operation.data);
      else batch.delete(reference);
    }
    await batch.commit();
  }
  return Object.keys(backup.entries).length;
}

export async function publishLegacyContentToCloud(uid: string): Promise<number> {
  if (!uid) throw new Error('Bạn cần đăng nhập bằng tài khoản quản trị.');
  const keys = ['halo_data', 'halo_quiz', 'halo_fun'];
  const entries = Object.fromEntries(keys.flatMap(key => {
    const value = localStorage.getItem(key);
    return value === null ? [] : [[key, value]];
  })) as Record<string, string>;
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  const collectionRef = firestore.collection(db, 'principiaContent', 'legacyData', 'items');
  const existing = await firestore.getDocs(collectionRef);
  const expected = new Set<string>();
  const writes: Array<{ id: string; data: Record<string, unknown> }> = [];
  for (const [key, value] of Object.entries(entries)) {
    const chunks = splitValue(value);
    chunks.forEach((chunk, part) => {
      const id = safeDocumentId(key, part);
      expected.add(id);
      writes.push({ id, data: { key, part, total: chunks.length, value: chunk, updatedAt: firestore.serverTimestamp() } });
    });
  }
  const stale = existing.docs.map(item => item.id).filter(id => !expected.has(id));
  const operations = [
    ...writes.map(item => ({ kind: 'set' as const, ...item })),
    ...stale.map(id => ({ kind: 'delete' as const, id }))
  ];
  for (let offset = 0; offset < operations.length; offset += 450) {
    const batch = firestore.writeBatch(db);
    for (const operation of operations.slice(offset, offset + 450)) {
      const reference = firestore.doc(collectionRef, operation.id);
      if (operation.kind === 'set') batch.set(reference, operation.data);
      else batch.delete(reference);
    }
    await batch.commit();
  }
  return Object.keys(entries).length;
}

export async function restorePublishedContentFromCloud(): Promise<number> {
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  const snapshot = await firestore.getDocs(firestore.collection(db, 'principiaContent', 'legacyData', 'items'));
  if (snapshot.empty) return 0;
  const groups = new Map<string, Array<{ part: number; total: number; value: string }>>();
  snapshot.docs.forEach(document => {
    const data = document.data();
    if (!['halo_data', 'halo_quiz', 'halo_fun'].includes(data.key) || typeof data.value !== 'string') return;
    const group = groups.get(data.key) || [];
    group.push({ part: Number(data.part) || 0, total: Number(data.total) || 1, value: data.value });
    groups.set(data.key, group);
  });
  const entries: Record<string, string> = {};
  for (const [key, parts] of groups) {
    parts.sort((left, right) => left.part - right.part);
    if (parts.length !== parts[0].total) throw new Error(`Dữ liệu học tập “${key}” trên cloud chưa đầy đủ.`);
    entries[key] = parts.map(part => part.value).join('');
  }
  return restoreLegacyBackup(JSON.stringify({
    format: 'principia-legacy-backup', version: 1, createdAt: new Date().toISOString(), entries
  }));
}

export async function restoreLegacyDataFromCloud(uid: string): Promise<number> {
  if (!uid) throw new Error('Bạn cần đăng nhập trước khi khôi phục.');
  const [app, firestore] = await Promise.all([
    getFirebaseApp(),
    import('firebase/firestore')
  ]);
  const db = firestore.getFirestore(app);
  const snapshot = await firestore.getDocs(firestore.collection(db, COLLECTION, uid, SUBCOLLECTION));
  if (snapshot.empty) throw new Error('Tài khoản này chưa có bản sao lưu trên đám mây.');

  const groups = new Map<string, Array<{ part: number; total: number; value: string }>>();
  snapshot.docs.forEach(document => {
    const data = document.data();
    if (typeof data.key !== 'string' || typeof data.value !== 'string') return;
    const group = groups.get(data.key) || [];
    group.push({
      part: Number(data.part) || 0,
      total: Number(data.total) || 1,
      value: data.value
    });
    groups.set(data.key, group);
  });

  const entries: Record<string, string> = {};
  for (const [key, parts] of groups) {
    parts.sort((left, right) => left.part - right.part);
    if (parts.length !== parts[0].total) throw new Error(`Bản sao lưu của "${key}" chưa đầy đủ.`);
    entries[key] = parts.map(part => part.value).join('');
  }

  return restoreLegacyBackup(JSON.stringify({
    format: 'principia-legacy-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    entries
  }));
}

export type PrincipiaProgress = {
  completed: string[];
  attempts: Array<{ title: string; score: number; total: number; at: string }>;
  xp: number;
  streak: number;
  lastStudyDate: string;
};

export async function syncProgressToCloud(uid: string, progress: PrincipiaProgress): Promise<void> {
  if (!uid) throw new Error('Bạn cần đăng nhập trước khi đồng bộ tiến độ.');
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  await firestore.setDoc(firestore.doc(db, 'principiaProgress', uid), {
    completed: progress.completed,
    attempts: progress.attempts.slice(0, 100),
    xp: progress.xp,
    streak: progress.streak || 0,
    lastStudyDate: progress.lastStudyDate || '',
    updatedAt: firestore.serverTimestamp()
  });
}

export async function restoreProgressFromCloud(uid: string): Promise<PrincipiaProgress | null> {
  if (!uid) throw new Error('Bạn cần đăng nhập trước khi khôi phục tiến độ.');
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  const snapshot = await firestore.getDoc(firestore.doc(db, 'principiaProgress', uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    completed: Array.isArray(data.completed) ? data.completed.filter((value: unknown): value is string => typeof value === 'string') : [],
    attempts: Array.isArray(data.attempts) ? data.attempts.filter((value: any) => value && typeof value.title === 'string' && typeof value.score === 'number' && typeof value.total === 'number' && typeof value.at === 'string').slice(0, 100) : [],
    xp: Number.isFinite(data.xp) ? Math.max(0, data.xp) : 0,
    streak: Number.isFinite(data.streak) ? Math.max(0, data.streak) : 0,
    lastStudyDate: typeof data.lastStudyDate === 'string' ? data.lastStudyDate : ''
  };
}
