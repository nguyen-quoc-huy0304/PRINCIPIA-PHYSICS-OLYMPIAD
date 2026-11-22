const EXCLUDED_KEYS = new Set(['principia_pending_page', 'principia_google_account']);
const SENSITIVE_KEY_PARTS = ['token', 'password', 'secret', 'credential', 'oauth'];

export type PrincipiaBackup = {
  format: 'principia-v2-backup';
  version: 2;
  app: 'PRINCIPIA';
  createdAt: string;
  entries: Record<string, string>;
};

function isAppDataKey(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (!normalized || EXCLUDED_KEYS.has(key)) return false;
  if (normalized.startsWith('firebase:') || normalized.startsWith('firebase_')) return false;
  if (SENSITIVE_KEY_PARTS.some(part => normalized.includes(part))) return false;
  return normalized.startsWith('principia_');
}

export function collectPrincipiaData(storage: Storage = localStorage): PrincipiaBackup {
  const entries: Record<string, string> = Object.create(null) as Record<string, string>;
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !isAppDataKey(key)) continue;
    const value = storage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return { format: 'principia-v2-backup', version: 2, app: 'PRINCIPIA', createdAt: new Date().toISOString(), entries };
}

export function downloadPrincipiaBackup(): void {
  const backup = collectPrincipiaData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `principia-v2-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function restorePrincipiaBackup(fileText: string, storage: Storage = localStorage): number {
  const backup = JSON.parse(fileText) as Partial<PrincipiaBackup>;
  if (backup.format !== 'principia-v2-backup' || backup.version !== 2 || backup.app !== 'PRINCIPIA' ||
      !backup.entries || typeof backup.entries !== 'object' || Array.isArray(backup.entries)) {
    throw new Error('Tệp sao lưu PRINCIPIA V2 không hợp lệ hoặc không được hỗ trợ.');
  }
  let restored = 0;
  for (const [key, value] of Object.entries(backup.entries)) {
    if (!isAppDataKey(key) || typeof value !== 'string') continue;
    storage.setItem(key, value);
    restored += 1;
  }
  return restored;
}
