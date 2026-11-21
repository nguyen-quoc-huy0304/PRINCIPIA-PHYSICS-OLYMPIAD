const LEGACY_PREFIXES = ['halo_', 'principia_', 'cl_', 'video_'];
const EXCLUDED_KEYS = new Set([
  'principia_pending_page',
  'principia_google_account'
]);

export type LegacyBackup = {
  format: 'principia-legacy-backup';
  version: 1;
  createdAt: string;
  entries: Record<string, string>;
};

export function collectLegacyData(storage: Storage = localStorage): LegacyBackup {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || EXCLUDED_KEYS.has(key)) continue;
    if (!LEGACY_PREFIXES.some(prefix => key.startsWith(prefix))) continue;
    if (key.startsWith('firebase:') || key.toLowerCase().includes('token')) continue;
    const value = storage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return {
    format: 'principia-legacy-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    entries
  };
}

export function downloadLegacyBackup(): void {
  const backup = collectLegacyData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `principia-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function restoreLegacyBackup(fileText: string, storage: Storage = localStorage): number {
  const backup = JSON.parse(fileText) as Partial<LegacyBackup>;
  if (backup.format !== 'principia-legacy-backup' || backup.version !== 1 || !backup.entries || typeof backup.entries !== 'object') {
    throw new Error('Tệp sao lưu PRINCIPIA không hợp lệ hoặc không được hỗ trợ.');
  }

  let restored = 0;
  for (const [key, value] of Object.entries(backup.entries)) {
    if (EXCLUDED_KEYS.has(key) || typeof value !== 'string') continue;
    if (!LEGACY_PREFIXES.some(prefix => key.startsWith(prefix))) continue;
    if (key.startsWith('firebase:') || key.toLowerCase().includes('token')) continue;
    storage.setItem(key, value);
    restored += 1;
  }
  return restored;
}
