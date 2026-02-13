import Dexie, { type Table } from 'dexie';
import type {
  Task,
  Note,
  Lesson,
  PomodoroSession,
  SavedPlaylist,
  Folder,
  MotivationalVideo,
  PostPomodoroVideoPools,
  CollectionCard,
  TaskCategory,
  PomodoroProfile,
  PomodoroGoal,
  Theme,
  Page,
} from '../types';

// Settings stored as key-value pairs
export interface SettingsEntry {
  key: string;
  value: any;
}

export class AppDatabase extends Dexie {
  tasks!: Table<Task, string>;
  notes!: Table<Note, string>;
  folders!: Table<Folder, string>;
  lessons!: Table<Lesson, string>;
  pomodoroSessions!: Table<PomodoroSession, string>;
  savedPlaylists!: Table<SavedPlaylist, string>;
  motivationalVideos!: Table<MotivationalVideo, string>;
  collectionCards!: Table<CollectionCard, string>;
  taskCategories!: Table<TaskCategory, string>;
  pomodoroProfiles!: Table<PomodoroProfile, string>;
  settings!: Table<SettingsEntry, string>;

  constructor() {
    super('FullFocusDashboard');

    this.version(1).stores({
      tasks: 'id, completed, priority, category, dueDate',
      notes: 'id, folderId, updatedAt',
      folders: 'id',
      lessons: 'id, type',
      pomodoroSessions: 'id, date',
      savedPlaylists: 'id, platform',
      motivationalVideos: 'id',
      collectionCards: 'id, rarity, unlockMethod',
      taskCategories: 'id',
      pomodoroProfiles: 'id',
      settings: 'key',
    });
  }
}

export const db = new AppDatabase();
