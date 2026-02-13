export enum Page {
  Guide = 'Nasıl Kullanılır',
  Dashboard = 'Dashboard',
  Notes = 'Notes',
  Lessons = 'Lessons',
  MusicPlaylists = 'My Music',
  Settings = 'Settings',
  Exercise = 'Yenilenme Alanı',
  Tasks = 'Görevler',
  Collection = 'Koleksiyonum',
  Analytics = 'İstatistikler',
}

export interface ExternalLink {
  name: string;
  url: string;
  icon: IconName;
}

export type Theme = 'light' | 'dark';

export enum TimerMode {
  Focus = 'focus',
  ShortBreak = 'shortBreak',
  LongBreak = 'longBreak',
}

export interface PomodoroSettings {
  focus: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

export interface PomodoroSession {
  id: string;
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  completed: boolean;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Note {
  id: string;
  folderId: string | null;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Lesson {
  id:string;
  type: 'udemy' | 'youtube';
  title: string;
  url: string;
  progress: number;
  noteContent: string;
}

export type PlaylistPlatform = 'youtube' | 'spotify' | 'custom';

export interface SavedPlaylist {
  id: string;
  name: string;
  url: string;
  platform: PlaylistPlatform;
  thumbnail: string | null;
  duration: number | null; // Duration in seconds
}

export interface MotivationalVideo {
  id: string;
  url: string;
}

export const PostPomodoroCategories = ['Kedi', 'Araba', 'Motor', 'Anime', 'Hayvanlar'] as const;
export type PostPomodoroCategory = typeof PostPomodoroCategories[number];

export interface PostPomodoroVideo {
  id: string;
  url: string;
}

export type PostPomodoroVideoPools = Record<PostPomodoroCategory, PostPomodoroVideo[]>;

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt: number | null;
  priority: TaskPriority;
  category: string | null;
  tags: string[];
  dueDate: number | null;
  estimatedPomodoros: number | null;
}

export interface CollectionCard {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Icon';
  description: string;
  imageData: string;
  opCost: number;
  unlockMethod: 'op' | 'session_streak';
}

export interface LastEarnedRewards {
  tickets: number;
  spins: number;
  op: number;
  newCard: CollectionCard | null;
}

// --- Pomodoro Profiles (Faz 2 - Task 23) ---

export interface PomodoroProfile {
  id: string;
  name: string;
  focus: number;        // Focus duration in minutes
  shortBreak: number;   // Short break duration in minutes
  longBreak: number;    // Long break duration in minutes
  longBreakInterval: number; // Number of focus sessions before long break
}

// Preset profile names for reference
export const PRESET_POMODORO_PROFILES: PomodoroProfile[] = [
  { id: 'default', name: 'Default', focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 },
  { id: 'deep-work', name: 'Derin Çalışma', focus: 90, shortBreak: 15, longBreak: 30, longBreakInterval: 2 },
  { id: 'quick-sprint', name: 'Hızlı Sprint', focus: 15, shortBreak: 5, longBreak: 10, longBreakInterval: 4 },
];

// --- Pomodoro Goals (Faz 2 - Task 25) ---

export interface PomodoroGoal {
  dailyTarget: number;      // Daily pomodoro count target
  weeklyTarget: number;     // Weekly pomodoro count target
  dailyCompleted: number;   // Completed pomodoros today
  weeklyCompleted: number;  // Completed pomodoros this week
  lastResetDate: string;    // YYYY-MM-DD - for daily reset tracking
  lastWeekResetDate: string; // YYYY-MM-DD - for weekly reset tracking
}

// --- Task Management (Faz 3 - Task 26) ---

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskCategory {
  id: string;
  name: string;
  color: string; // Hex color code for category badge
}

// --- Enhanced Note (Faz 4 - Task 29) ---

// Extended note type with tags, favorites, and archive support
// Note: The existing Note interface is preserved for backward compatibility.
export interface EnhancedNote extends Note {
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
}



// --- Widget Layout (Faz 11 - Task 40) ---

export interface WidgetLayoutItem {
  id: string;           // Widget identifier
  order: number;        // Display order (0-based)
  visible: boolean;     // Whether the widget is shown
}

export interface WidgetLayout {
  items: WidgetLayoutItem[];
}

export const DEFAULT_WIDGET_IDS = ['pomodoro', 'music', 'motivation', 'info'] as const;
export type WidgetId = typeof DEFAULT_WIDGET_IDS[number];

// --- Notification System (Faz 1 - Task 21) ---

export type NotificationType = 'pomodoroComplete' | 'taskComplete' | 'rewardEarned' | 'cardUnlocked' | 'goalReached' | 'general';

export interface NotificationOptions {
  title: string;
  body: string;
  type: NotificationType;
  icon?: string;
  silent?: boolean;
  urgency?: 'low' | 'normal' | 'critical';
}

// --- Analytics Data (Faz 6 - Task 33) ---

export interface DailyAnalytics {
  date: string;              // YYYY-MM-DD
  pomodoroCount: number;
  totalFocusMinutes: number;
  tasksCompleted: number;
  tasksCreated: number;
}

export interface HourlyProductivity {
  hour: number;              // 0-23
  pomodoroCount: number;
  focusMinutes: number;
}

export interface AnalyticsSummary {
  daily: DailyAnalytics[];
  hourlyProductivity: HourlyProductivity[];
  totalPomodoros: number;
  totalFocusMinutes: number;
  totalTasksCompleted: number;
  averageDailyPomodoros: number;
  averageDailyFocusMinutes: number;
  completionRate: number;    // 0-100 percentage
  mostProductiveHour: number; // 0-23
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export type IconName =
  | 'LayoutDashboard'
  | 'FileText'
  | 'BookOpen'
  | 'Play'
  | 'Pause'
  | 'SkipForward'
  | 'SkipBack'
  | 'RefreshCw'
  | 'Settings'
  | 'Sun'
  | 'Moon'
  | 'Plus'
  | 'Folder'
  | 'Trash2'
  | 'Edit'
  | 'X'
  | 'Move'
  | 'FilePlus'
  | 'MoreVertical'
  | 'Check'
  | 'ChevronDown'
  | 'ChevronLeft'
  | 'UploadCloud'
  | 'Link'
  | 'Youtube'
  | 'Music'
  | 'Sparkles'
  | 'Palette'
  | 'Image'
  | 'Volume2'
  | 'Save'
  | 'Wind'
  | 'Eye'
  | 'CheckSquare'
  | 'Search'
  | 'Ticket'
  | 'Gift'
  | 'Lock'
  | 'Op'
  | 'HelpCircle'
  | 'Star'
  | 'Award'
  | 'Expand'
  | 'BarChart'
  | 'Bell'
  | 'GripVertical'
  | 'Tag'
  | 'Archive'
  | 'Target'
  | 'Calendar'
  | 'Filter'
  | 'ArrowUpDown'
  | 'Download'
  | 'Shuffle'
  | 'VolumeX';