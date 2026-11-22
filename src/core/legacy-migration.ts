/**
 * One-time, non-destructive migration from the V1 browser storage schema.
 * Source keys are intentionally retained so users can roll back safely.
 */
const MIGRATION_KEY = 'principia_v2_migrations';
const MIGRATION_VERSION = 'v1-to-unified-v2';

function readJson(storage: Storage, key: string): unknown {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}

function copyKey(storage: Storage, source: string, target: string, transform?: (value: unknown) => unknown): boolean {
  if (storage.getItem(target) !== null) return false;
  const raw = storage.getItem(source);
  if (raw === null) return false;
  const parsed = readJson(storage, source);
  const value = transform ? transform(parsed) : parsed;
  if (value === null || value === undefined) return false;
  storage.setItem(target, typeof value === 'string' ? value : JSON.stringify(value));
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export type MigrationReport = {
  version: string;
  copied: string[];
  skipped: string[];
};

export function migrateLegacyV1Storage(storage: Storage = localStorage): MigrationReport {
  const completed = readJson(storage, MIGRATION_KEY);
  const versions = isArray(completed) ? completed.filter((value): value is string => typeof value === 'string') : [];
  const report: MigrationReport = { version: MIGRATION_VERSION, copied: [], skipped: [] };
  if (versions.includes(MIGRATION_VERSION)) return report;

  const mappings: Array<{ source: string; target: string; validate?: (value: unknown) => boolean; transform?: (value: unknown) => unknown }> = [
    { source: 'halo_data', target: 'principia_v2_lessons', validate: isArray },
    { source: 'halo_quiz', target: 'principia_v2_quizzes', validate: isArray },
    { source: 'halo_fun', target: 'principia_v2_games', validate: isArray },
    { source: 'principia_ai_list', target: 'principia_v2_ai_custom', validate: isArray },
    { source: 'halo_profile', target: 'principia_v2_profile', validate: isRecord },
  ];

  for (const [source, target, allowed] of [['principia_ai_selected', 'principia_v2_ai_selected', value => !!value], ['principia_theme', 'principia_v2_theme', value => value === 'dark' || value === 'light']] as Array<[string, string, (value: string) => boolean]>) {
    const raw = storage.getItem(source);
    if (raw !== null && allowed(raw) && storage.getItem(target) === null) { storage.setItem(target, raw); report.copied.push(source); }
  }

  for (const mapping of mappings) {
    const value = readJson(storage, mapping.source);
    if (storage.getItem(mapping.source) === null || (mapping.validate && !mapping.validate(value))) {
      report.skipped.push(mapping.source);
      continue;
    }
    if (copyKey(storage, mapping.source, mapping.target, mapping.transform)) report.copied.push(mapping.source);
    else report.skipped.push(mapping.source);
  }

  const xpRaw = storage.getItem('halo_xp');
  const streakRaw = storage.getItem('halo_streak');
  const lastStudyDate = storage.getItem('halo_lastday') || '';
  const completedLessons = readJson(storage, 'halo_completed');
  const xp = xpRaw === null ? 0 : Number(xpRaw);
  const streak = streakRaw === null ? 0 : Number(streakRaw);
  if (xpRaw !== null || streakRaw !== null || storage.getItem('halo_lastday') !== null || storage.getItem('halo_completed') !== null) {
    const progress = {
      completed: isArray(completedLessons) ? completedLessons.filter((item): item is string => typeof item === 'string') : [],
      attempts: [],
      xp: Number.isFinite(xp) ? Math.max(0, xp) : 0,
      streak: Number.isFinite(streak) ? Math.max(0, streak) : 0,
      lastStudyDate,
    };
    const progressKey = 'principia_v2_progress:guest';
    if (storage.getItem(progressKey) === null) {
      storage.setItem(progressKey, JSON.stringify(progress));
      report.copied.push('halo_xp/halo_streak/halo_lastday/halo_completed');
    } else report.skipped.push('halo_progress');
    if (storage.getItem('principia_v2_xp') === null) storage.setItem('principia_v2_xp', String(progress.xp));
    if (storage.getItem('principia_v2_streak') === null) storage.setItem('principia_v2_streak', String(progress.streak));
    if (storage.getItem('principia_v2_completed') === null) storage.setItem('principia_v2_completed', JSON.stringify(progress.completed));
  }

  // Preserve V1-only content and companion settings under an explicit archive namespace.
  // This avoids silently discarding data that has not yet gained a V2 screen.
  const archivePrefixes = ['principia_companion_', 'principia_sticker_', 'principia_custom_stickers', 'principia_nav_', 'principia_node_icon_', 'principia_reader_', 'halo_quick_note', 'halo_outer_cover'];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !archivePrefixes.some(prefix => key.startsWith(prefix))) continue;
    const archiveKey = 'principia_v1_archive:' + key;
    if (storage.getItem(archiveKey) === null) {
      const value = storage.getItem(key);
      if (value !== null) storage.setItem(archiveKey, value);
      report.copied.push(key);
    }
  }

  storage.setItem(MIGRATION_KEY, JSON.stringify([...versions, MIGRATION_VERSION]));
  return report;
}
