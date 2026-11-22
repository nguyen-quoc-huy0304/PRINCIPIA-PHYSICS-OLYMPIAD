import { getFirebaseApp } from './firebase';
import { collectPrincipiaData, restorePrincipiaBackup } from './backup';

const COLLECTION = 'principiaUsers';
const SUBCOLLECTION = 'v2Data';
const CONTENT_COLLECTION = 'principiaContent';
const CONTENT_DOCUMENT = 'v2';
const CHUNK_CODEPOINTS = 120_000;

function splitValue(value: string): string[] {
  const points = Array.from(value);
  if (!points.length) return [''];
  const chunks: string[] = [];
  for (let offset = 0; offset < points.length; offset += CHUNK_CODEPOINTS) chunks.push(points.slice(offset, offset + CHUNK_CODEPOINTS).join(''));
  return chunks;
}
function safeDocumentId(key: string, part: number): string { return `${encodeURIComponent(key)}__${part}`; }

async function writeEntries(collectionRef: any, entries: Record<string, string>, firestore: any): Promise<void> {
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
  const stale = existing.docs.map((doc: any) => doc.id).filter((id: string) => !expected.has(id));
  const operations = [...writes.map(item => ({ kind: 'set' as const, ...item })), ...stale.map((id: string) => ({ kind: 'delete' as const, id }))];
  for (let offset = 0; offset < operations.length; offset += 450) {
    const batch = firestore.writeBatch(collectionRef.firestore);
    for (const operation of operations.slice(offset, offset + 450)) {
      const reference = firestore.doc(collectionRef, operation.id);
      if (operation.kind === 'set') batch.set(reference, operation.data); else batch.delete(reference);
    }
    await batch.commit();
  }
}

async function readEntries(collectionRef: any, firestore: any): Promise<Record<string, string>> {
  const snapshot = await firestore.getDocs(collectionRef);
  const groups = new Map<string, Array<{ part: number; total: number; value: string }>>();
  snapshot.docs.forEach((document: any) => {
    const data = document.data();
    if (typeof data.key !== 'string' || typeof data.value !== 'string') return;
    const group = groups.get(data.key) || [];
    group.push({ part: Number(data.part) || 0, total: Number(data.total) || 1, value: data.value });
    groups.set(data.key, group);
  });
  const entries: Record<string, string> = {};
  for (const [key, parts] of groups) {
    parts.sort((a, b) => a.part - b.part);
    if (parts.length !== parts[0].total) throw new Error(`Dữ liệu "${key}" trên cloud chưa đầy đủ.`);
    entries[key] = parts.map(part => part.value).join('');
  }
  return entries;
}

export async function syncPrincipiaDataToCloud(uid: string): Promise<number> {
  if (!uid) throw new Error('Bạn cần đăng nhập trước khi đồng bộ.');
  const backup = collectPrincipiaData();
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  const collectionRef = firestore.collection(db, COLLECTION, uid, SUBCOLLECTION);
  const existing = await firestore.getDocs(collectionRef);
  const expected = new Set<string>();
  const operations: Array<{ id: string; data?: Record<string, unknown>; kind: 'set' | 'delete' }> = [];
  for (const [key, value] of Object.entries(backup.entries)) {
    const chunks = splitValue(value);
    chunks.forEach((chunk, part) => {
      const id = safeDocumentId(key, part); expected.add(id);
      operations.push({ kind: 'set', id, data: { key, part, total: chunks.length, value: chunk, updatedAt: firestore.serverTimestamp() } });
    });
  }
  existing.docs.map(doc => doc.id).filter(id => !expected.has(id)).forEach(id => operations.push({ kind: 'delete', id }));
  for (let offset = 0; offset < operations.length; offset += 450) {
    const batch = firestore.writeBatch(db);
    for (const op of operations.slice(offset, offset + 450)) {
      const ref = firestore.doc(collectionRef, op.id);
      if (op.kind === 'set') batch.set(ref, op.data!); else batch.delete(ref);
    }
    await batch.commit();
  }
  return Object.keys(backup.entries).length;
}

export async function restorePrincipiaDataFromCloud(uid: string): Promise<number> {
  if (!uid) throw new Error('Bạn cần đăng nhập trước khi khôi phục.');
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  const entries = await readEntries(firestore.collection(db, COLLECTION, uid, SUBCOLLECTION), firestore);
  if (!Object.keys(entries).length) throw new Error('Tài khoản này chưa có bản sao lưu V2 trên đám mây.');
  return restorePrincipiaBackup(JSON.stringify({ format: 'principia-v2-backup', version: 2, app: 'PRINCIPIA', createdAt: new Date().toISOString(), entries }));
}

export async function publishPrincipiaContentToCloud(uid: string): Promise<number> {
  if (!uid) throw new Error('Bạn cần đăng nhập bằng tài khoản quản trị.');
  const keys = ['principia_v2_lessons', 'principia_v2_quizzes', 'principia_v2_games'];
  const entries = Object.fromEntries(keys.flatMap(key => {
    const value = localStorage.getItem(key);
    return value === null ? [] : [[key, value]];
  })) as Record<string, string>;
  if (!Object.keys(entries).length) throw new Error('Chưa có nội dung V2 để xuất bản.');
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  const collectionRef = firestore.collection(db, CONTENT_COLLECTION, CONTENT_DOCUMENT, 'items');
  await writeEntries(collectionRef, entries, firestore);
  return Object.keys(entries).length;
}

export async function restorePublishedPrincipiaContentFromCloud(): Promise<number> {
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  const entries = await readEntries(firestore.collection(db, CONTENT_COLLECTION, CONTENT_DOCUMENT, 'items'), firestore);
  let restored = 0;
  for (const [key, value] of Object.entries(entries)) {
    if (!['principia_v2_lessons', 'principia_v2_quizzes', 'principia_v2_games'].includes(key)) continue;
    localStorage.setItem(key, value); restored += 1;
  }
  return restored;
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
    completed: progress.completed, attempts: progress.attempts.slice(0, 100), xp: progress.xp,
    streak: progress.streak || 0, lastStudyDate: progress.lastStudyDate || '', updatedAt: firestore.serverTimestamp()
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
    completed: Array.isArray(data.completed) ? data.completed.filter((v: unknown): v is string => typeof v === 'string') : [],
    attempts: Array.isArray(data.attempts) ? data.attempts.filter((v: any) => v && typeof v.title === 'string' && typeof v.score === 'number' && typeof v.total === 'number' && typeof v.at === 'string').slice(0, 100) : [],
    xp: Number.isFinite(data.xp) ? Math.max(0, data.xp) : 0,
    streak: Number.isFinite(data.streak) ? Math.max(0, data.streak) : 0,
    lastStudyDate: typeof data.lastStudyDate === 'string' ? data.lastStudyDate : ''
  };
}


export type GameLeaderboardEntry = {
  uid: string;
  name: string;
  gamePoints: number;
  matches: number;
  wins: number;
  week: string;
  updatedAt?: unknown;
};

export async function publishGameLeaderboardScore(
  uid: string,
  entry: Omit<GameLeaderboardEntry, 'uid' | 'updatedAt'>
): Promise<void> {
  if (!uid) throw new Error('Bạn cần đăng nhập để cập nhật bảng xếp hạng.');
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  await firestore.setDoc(firestore.doc(db, 'principiaLeaderboard', uid), {
    uid,
    name: String(entry.name || 'Học sinh').slice(0, 60),
    gamePoints: Math.max(0, Math.floor(entry.gamePoints)),
    matches: Math.max(0, Math.floor(entry.matches)),
    wins: Math.max(0, Math.floor(entry.wins)),
    week: entry.week,
    updatedAt: firestore.serverTimestamp()
  }, { merge: true });
}

export async function subscribeGameLeaderboard(
  onRows: (rows: GameLeaderboardEntry[]) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  const [app, firestore] = await Promise.all([getFirebaseApp(), import('firebase/firestore')]);
  const db = firestore.getFirestore(app);
  const ranked = firestore.query(
    firestore.collection(db, 'principiaLeaderboard'),
    firestore.orderBy('gamePoints', 'desc'),
    firestore.limit(50)
  );
  return firestore.onSnapshot(ranked, snapshot => {
    onRows(snapshot.docs.map(document => {
      const data = document.data();
      return {
        uid: String(data.uid || document.id),
        name: String(data.name || 'Học sinh'),
        gamePoints: Math.max(0, Number(data.gamePoints) || 0),
        matches: Math.max(0, Number(data.matches) || 0),
        wins: Math.max(0, Number(data.wins) || 0),
        week: String(data.week || '')
      };
    }));
  }, error => onError(error));
}
