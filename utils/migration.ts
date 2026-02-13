import { db, type SettingsEntry } from './db';
import type {
  Task,
  Note,
  Folder,
  Lesson,
  PomodoroSession,
  SavedPlaylist,
  MotivationalVideo,
  CollectionCard,
  TaskCategory,
  PomodoroProfile,
} from '../types';

const MIGRATION_KEY = 'indexeddb-migration-complete';
const BACKUP_KEY = 'indexeddb-migration-backup';

/**
 * Safely parse JSON from localStorage, returning null on failure.
 */
function safeParseLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Create a backup of all localStorage data before migration.
 */
function createBackup(): void {
  const backup: Record<string, string | null> = {};
  const keys = [
    'app-tasks', 'app-notes', 'app-folders', 'app-lessons',
    'app-pomodoro', 'app-saved-playlists', 'app-motivational-videos',
    'app-post-pomodoro-videos', 'app-collection-cards', 'app-task-categories',
    'app-pomodoro-profiles', 'app-active-profile-id', 'app-pomodoro-goal',
    'app-theme', 'app-active-page', 'app-background', 'app-bg-color',
    'app-bg-blur', 'app-bg-opacity', 'app-motivational-image',
    'app-flow-mode-enabled', 'app-game-tickets', 'app-wheel-spins',
    'app-op', 'app-unlocked-cards', 'app-session-count-for-cards',
    'app-legendary-unlocked-for-icon',
  ];
  for (const key of keys) {
    backup[key] = localStorage.getItem(key);
  }
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
}

/**
 * Restore localStorage data from backup (rollback).
 */
export function restoreBackup(): boolean {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return false;
    const backup = JSON.parse(raw) as Record<string, string | null>;
    for (const [key, value] of Object.entries(backup)) {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    }
    localStorage.removeItem(MIGRATION_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if migration has already been completed.
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Migrate all data from localStorage to IndexedDB.
 * Runs automatically on first launch after upgrade.
 */
export async function migrateToIndexedDB(): Promise<{ success: boolean; error?: string }> {
  if (isMigrationComplete()) {
    return { success: true };
  }

  try {
    // Step 1: Create backup
    createBackup();

    // Step 2: Migrate table data
    await db.transaction('rw',
      [db.tasks, db.notes, db.folders, db.lessons, db.pomodoroSessions,
       db.savedPlaylists, db.motivationalVideos, db.collectionCards,
       db.taskCategories, db.pomodoroProfiles, db.settings],
      async () => {
        // Tasks
        const tasks = safeParseLS<Task[]>('app-tasks');
        if (tasks?.length) await db.tasks.bulkPut(tasks);

        // Notes
        const notes = safeParseLS<Note[]>('app-notes');
        if (notes?.length) await db.notes.bulkPut(notes);

        // Folders
        const folders = safeParseLS<Folder[]>('app-folders');
        if (folders?.length) await db.folders.bulkPut(folders);

        // Lessons
        const lessons = safeParseLS<Lesson[]>('app-lessons');
        if (lessons?.length) await db.lessons.bulkPut(lessons);

        // Pomodoro Sessions
        const sessions = safeParseLS<PomodoroSession[]>('app-pomodoro');
        if (sessions?.length) await db.pomodoroSessions.bulkPut(sessions);

        // Saved Playlists
        const playlists = safeParseLS<SavedPlaylist[]>('app-saved-playlists');
        if (playlists?.length) await db.savedPlaylists.bulkPut(playlists);

        // Motivational Videos
        const videos = safeParseLS<MotivationalVideo[]>('app-motivational-videos');
        if (videos?.length) await db.motivationalVideos.bulkPut(videos);

        // Collection Cards
        const cards = safeParseLS<CollectionCard[]>('app-collection-cards');
        if (cards?.length) await db.collectionCards.bulkPut(cards);

        // Task Categories
        const categories = safeParseLS<TaskCategory[]>('app-task-categories');
        if (categories?.length) await db.taskCategories.bulkPut(categories);

        // Pomodoro Profiles
        const profiles = safeParseLS<PomodoroProfile[]>('app-pomodoro-profiles');
        if (profiles?.length) await db.pomodoroProfiles.bulkPut(profiles);

        // Settings (key-value pairs)
        const settingsKeys: Array<{ lsKey: string; dbKey: string }> = [
          { lsKey: 'app-theme', dbKey: 'theme' },
          { lsKey: 'app-active-page', dbKey: 'activePage' },
          { lsKey: 'app-background', dbKey: 'background' },
          { lsKey: 'app-bg-color', dbKey: 'backgroundColor' },
          { lsKey: 'app-bg-blur', dbKey: 'backgroundBlur' },
          { lsKey: 'app-bg-opacity', dbKey: 'backgroundOpacity' },
          { lsKey: 'app-motivational-image', dbKey: 'motivationalImage' },
          { lsKey: 'app-flow-mode-enabled', dbKey: 'flowModeEnabled' },
          { lsKey: 'app-game-tickets', dbKey: 'gameTickets' },
          { lsKey: 'app-wheel-spins', dbKey: 'wheelSpins' },
          { lsKey: 'app-op', dbKey: 'op' },
          { lsKey: 'app-unlocked-cards', dbKey: 'unlockedCardIds' },
          { lsKey: 'app-session-count-for-cards', dbKey: 'completedSessionCountForCards' },
          { lsKey: 'app-legendary-unlocked-for-icon', dbKey: 'legendaryCardsUnlockedForIcon' },
          { lsKey: 'app-active-profile-id', dbKey: 'activeProfileId' },
          { lsKey: 'app-pomodoro-goal', dbKey: 'pomodoroGoal' },
          { lsKey: 'app-post-pomodoro-videos', dbKey: 'postPomodoroVideos' },
        ];

        const settingsEntries: SettingsEntry[] = [];
        for (const { lsKey, dbKey } of settingsKeys) {
          const raw = localStorage.getItem(lsKey);
          if (raw !== null) {
            try {
              settingsEntries.push({ key: dbKey, value: JSON.parse(raw) });
            } catch {
              settingsEntries.push({ key: dbKey, value: raw });
            }
          }
        }
        if (settingsEntries.length) await db.settings.bulkPut(settingsEntries);
      }
    );

    // Step 3: Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, 'true');

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('IndexedDB migration failed:', message);
    return { success: false, error: message };
  }
}
