
import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode, CSSProperties } from 'react';
import { Theme, Note, Folder, Lesson, PomodoroSession, SavedPlaylist, Page, MotivationalVideo, PostPomodoroVideoPools, PostPomodoroCategory, Task, TaskCategory, TaskPriority, PomodoroSettings, TimerMode, CollectionCard, LastEarnedRewards, PomodoroProfile, PRESET_POMODORO_PROFILES, PomodoroGoal, PlaylistPlatform } from '../types.ts';
import { usePomodoro } from '../hooks/usePomodoro.ts';
import { initialAllCards } from '../data/collectionCards.ts';
import NotificationService from '../utils/notifications';
import { useIndexedDBTable, useIndexedDBSetting } from '../hooks/useIndexedDB';
import { db } from '../utils/db';
import { migrateToIndexedDB } from '../utils/migration';

// --- MOCK DATA ---
const initialFolders: Folder[] = [
  { id: '1', name: 'Personal', createdAt: Date.now() },
  { id: '2', name: 'Work', createdAt: Date.now() },
];

const initialNotes: Note[] = [
  { id: 'n1', folderId: '1', title: 'Grocery List', content: '- Milk\n- Bread\n- Eggs', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'n2', folderId: '2', title: 'Q3 Project Plan', content: 'Initial draft for the Q3 project...', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'n3', folderId: null, title: 'Random thoughts', content: 'This is a note without a folder.', createdAt: Date.now(), updatedAt: Date.now() },
];

const initialLessons: Lesson[] = [
  { id: 'l1', type: 'youtube', title: 'React Hooks Tutorial', url: 'https://www.youtube.com/playlist?list=PLC3y8-rFHvwisvxhZ135pPducxAbbing4', progress: 25, noteContent: '' },
  { id: 'l2', type: 'udemy', title: 'The Complete 2023 Web Development Bootcamp', url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/', progress: 60, noteContent: 'Initial draft for the Q3 project...' },
];

const initialPomodoroSessions: PomodoroSession[] = [
  {id: 'p1', date: '2023-10-26', duration: 25, completed: true},
  {id: 'p2', date: '2023-10-27', duration: 25, completed: true},
  {id: 'p3', date: '2023-10-27', duration: 25, completed: true},
];

const initialMotivationalVideos: MotivationalVideo[] = [
    { id: 'mv1', url: 'https://www.youtube.com/watch?v=wnHW6o8WMas' },
    { id: 'mv2', url: 'https://www.youtube.com/watch?v=g-jwWYX7Jlo' },
    { id: 'mv3', url: 'https://www.youtube.com/watch?v=k6_qHxh_g20' }
];

const initialPostPomodoroVideos: PostPomodoroVideoPools = {
    'Kedi': [{id: 'pk1', url: 'https://www.youtube.com/watch?v=Vt2_wkF3_U4'}],
    'Araba': [{id: 'pc1', url: 'https://www.youtube.com/watch?v=3V9B5d_L4bQ'}],
    'Motor': [],
    'Anime': [],
    'Hayvanlar': [],
};

// Helper to get from localStorage
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Could not save state for key "${key}" to localStorage.`, e);
    }
  }, [key, value]);

  return [value, setValue];
}

// --- CONTEXT PROPS INTERFACES ---

interface DataContextProps {
  isLoading: boolean;
  theme: Theme;
  toggleTheme: () => void;
  background: string | null;
  setBackground: (url: string) => void;
  backgroundColor: string | null;
  setBackgroundColor: (color: string) => void;
  backgroundBlur: number;
  setBackgroundBlur: (blur: number) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (opacity: number) => void;
  backgroundStyle: CSSProperties;
  motivationalImage: string | null;
  setMotivationalImage: (image: string | null) => void;
  isFlowModeEnabled: boolean;
  setIsFlowModeEnabled: (isEnabled: boolean) => void;
  folders: Folder[];
  addFolder: (name: string) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id:string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
  moveNote: (noteId: string, targetFolderId: string | null) => void;
  lessons: Lesson[];
  addLesson: (lesson: Omit<Lesson, 'id'>) => void;
  updateLesson: (id: string, updates: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  pomodoroSessions: PomodoroSession[];
  addPomodoroSession: (session: Omit<PomodoroSession, 'id'>) => LastEarnedRewards;
  savedPlaylists: SavedPlaylist[];
  addSavedPlaylist: (name: string, url: string) => void;
  updateSavedPlaylist: (id: string, name: string) => void;
  deleteSavedPlaylist: (id: string) => void;
  playlistToPlay: SavedPlaylist | null;
  playPlaylist: (playlist: SavedPlaylist) => void;
  setPlaylistToPlay: (playlist: SavedPlaylist | null) => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
  motivationalVideos: MotivationalVideo[];
  addMotivationalVideo: (url: string) => void;
  deleteMotivationalVideo: (id: string) => void;
  postPomodoroVideos: PostPomodoroVideoPools;
  addPostPomodoroVideo: (category: PostPomodoroCategory, url: string) => void;
  deletePostPomodoroVideo: (category: PostPomodoroCategory, videoId: string) => void;
  tasks: Task[];
  addTask: (text: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;
  taskCategories: TaskCategory[];
  addTaskCategory: (name: string, color: string) => void;
  updateTaskCategory: (id: string, name: string, color: string) => void;
  deleteTaskCategory: (id: string) => void;
  gameTickets: number;
  wheelSpins: number;
  op: number;
  unlockedCardIds: string[];
  collectionCards: CollectionCard[];
  addCollectionCard: (card: Omit<CollectionCard, 'id' | 'unlockMethod'>) => void;
  updateCollectionCard: (id: string, updates: Partial<CollectionCard>) => void;
  deleteCollectionCard: (id: string) => void;
  spendGameTicket: () => void;
  spendWheelSpin: () => void;
  addGameTickets: (amount: number) => void;
  addOp: (amount: number) => void;
  unlockCardWithOp: (cardId: string) => boolean;
  completedSessionCountForCards: number;
  claimLegendaryCard: (cardToUnlockId: string) => CollectionCard | null;
  legendaryCardsUnlockedForIcon: number;
  claimIconCard: () => CollectionCard | null;
  pomodoroProfiles: PomodoroProfile[];
  activeProfileId: string;
  addProfile: (profile: Omit<PomodoroProfile, 'id'>) => void;
  updateProfile: (id: string, updates: Partial<PomodoroProfile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfileId: (id: string) => void;
  pomodoroGoal: PomodoroGoal;
  setDailyGoal: (target: number) => void;
  setWeeklyGoal: (target: number) => void;
  dailyGoalProgress: number;
  weeklyGoalProgress: number;
  // Global Music Player State
  globalMusicPlayer: {
    isPlaying: boolean;
    currentTrack: { title: string; artist: string; cover: string | null } | null;
    isVisible: boolean;
  };
  setGlobalMusicPlayer: (state: { isPlaying: boolean; currentTrack: { title: string; artist: string; cover: string | null } | null; isVisible: boolean }) => void;
  globalMusicPlayerControls: {
    onPlayPause: (() => void) | null;
    onNext: (() => void) | null;
    onPrevious: (() => void) | null;
  };
  setGlobalMusicPlayerControls: (controls: { onPlayPause: (() => void) | null; onNext: (() => void) | null; onPrevious: (() => void) | null }) => void;
}

interface PomodoroContextProps {
    isFlowModeActive: boolean;
    timeLeft: number;
    mode: TimerMode;
    isActive: boolean;
    cycles: number;
    settings: PomodoroSettings;
    toggleTimer: () => void;
    resetTimer: () => void;
    skipTimer: () => void;
    updateSettings: (newSettings: Partial<PomodoroSettings>) => void;
    pomodoroFocusCompleted: boolean;
    acknowledgePomodoroFocusCompleted: () => void;
    lastEarnedRewards: LastEarnedRewards | null;
}


// --- CONTEXT CREATION ---
export const DataContext = createContext<DataContextProps>({} as DataContextProps);
export const PomodoroContext = createContext<PomodoroContextProps>({} as PomodoroContextProps);


// --- POMODORO PROVIDER ---
export const PomodoroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addPomodoroSession, isFlowModeEnabled, pomodoroProfiles, activeProfileId } = useContext(DataContext);
    const [isFlowModeActive, setFlowModeActive] = useState(false);
    const [pomodoroFocusCompleted, setPomodoroFocusCompleted] = useState(false);
    const [lastEarnedRewards, setLastEarnedRewards] = useState<LastEarnedRewards | null>(null);

    // Compute active profile settings from pomodoroProfiles and activeProfileId
    const activeProfileSettings = useMemo((): PomodoroSettings => {
        const activeProfile = pomodoroProfiles.find(p => p.id === activeProfileId);
        if (activeProfile) {
            return {
                focus: activeProfile.focus,
                shortBreak: activeProfile.shortBreak,
                longBreak: activeProfile.longBreak,
                longBreakInterval: activeProfile.longBreakInterval,
            };
        }
        // Fallback to default if active profile not found
        return { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
    }, [pomodoroProfiles, activeProfileId]);

    const acknowledgePomodoroFocusCompleted = useCallback(() => {
        setPomodoroFocusCompleted(false)
        setLastEarnedRewards(null);
    }, []);

    const handleFocusComplete = useCallback((durationInMinutes: number) => {
        const rewards = addPomodoroSession({
            // id is set in addPomodoroSession
            date: new Date().toISOString().split('T')[0],
            duration: durationInMinutes,
            completed: true
        });
        setLastEarnedRewards(rewards);
        setPomodoroFocusCompleted(true);

        // Fire-and-forget: Show pomodoro complete notification
        NotificationService.showPomodoroComplete().catch(() => {});
    }, [addPomodoroSession]);
    
    const pomodoro = usePomodoro(
        activeProfileSettings,
        handleFocusComplete,
        setFlowModeActive,
        isFlowModeEnabled
    );

    const pomodoroValue = useMemo(() => ({
        ...pomodoro,
        isFlowModeActive,
        pomodoroFocusCompleted,
        acknowledgePomodoroFocusCompleted,
        lastEarnedRewards,
    }), [pomodoro, isFlowModeActive, pomodoroFocusCompleted, acknowledgePomodoroFocusCompleted, lastEarnedRewards]);
    
    return (
        <PomodoroContext.Provider value={pomodoroValue}>
            {children}
        </PomodoroContext.Provider>
    )
}

// --- MAIN DATA PROVIDER COMPONENT ---
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Run migration from localStorage to IndexedDB on first load
  const [migrationDone, setMigrationDone] = useState(false);
  useEffect(() => {
    migrateToIndexedDB().then(() => setMigrationDone(true)).catch(() => setMigrationDone(true));
  }, []);

  // Settings (scalar values) - useIndexedDBSetting
  const [activePage, setActivePage, loadingActivePage] = useIndexedDBSetting<Page>(
    'activePage', Page.Dashboard, 'app-active-page'
  );
  const [theme, setTheme, loadingTheme] = useIndexedDBSetting<Theme>(
    'theme', 'dark', 'app-theme'
  );
  const [background, _setBackground, loadingBg] = useIndexedDBSetting<string | null>(
    'background', null, 'app-background'
  );
  const [backgroundColor, _setBackgroundColor] = useIndexedDBSetting<string | null>(
    'backgroundColor', null, 'app-bg-color'
  );
  const [backgroundBlur, setBackgroundBlur] = useIndexedDBSetting<number>(
    'backgroundBlur', 8, 'app-bg-blur'
  );
  const [backgroundOpacity, setBackgroundOpacity] = useIndexedDBSetting<number>(
    'backgroundOpacity', 50, 'app-bg-opacity'
  );
  const [motivationalImage, setMotivationalImage] = useIndexedDBSetting<string | null>(
    'motivationalImage', null, 'app-motivational-image'
  );
  const [isFlowModeEnabled, setIsFlowModeEnabled] = useIndexedDBSetting<boolean>(
    'flowModeEnabled', true, 'app-flow-mode-enabled'
  );

  // Table data - useIndexedDBTable
  const [folders, setFolders, loadingFolders] = useIndexedDBTable<Folder>(
    db.folders, initialFolders, 'app-folders'
  );
  const [notes, setNotes, loadingNotes] = useIndexedDBTable<Note>(
    db.notes, initialNotes, 'app-notes'
  );
  const [lessons, setLessons, loadingLessons] = useIndexedDBTable<Lesson>(
    db.lessons, initialLessons, 'app-lessons'
  );
  const [pomodoroSessions, setPomodoroSessions, loadingSessions] = useIndexedDBTable<PomodoroSession>(
    db.pomodoroSessions, initialPomodoroSessions, 'app-pomodoro'
  );

  // One-time migration: Remove old mock data (2023 dated fake sessions)
  useEffect(() => {
    const migrated = localStorage.getItem('app-mock-data-cleaned');
    if (!migrated) {
      setPomodoroSessions(prev => prev.filter(s => s.date >= '2025-01-01'));
      localStorage.setItem('app-mock-data-cleaned', 'true');
    }
  }, []);
  const [savedPlaylists, setSavedPlaylists] = useIndexedDBTable<SavedPlaylist>(
    db.savedPlaylists, [], 'app-saved-playlists'
  );
  const [playlistToPlay, setPlaylistToPlay] = useState<SavedPlaylist | null>(null);
  const [motivationalVideos, setMotivationalVideos] = useIndexedDBTable<MotivationalVideo>(
    db.motivationalVideos, initialMotivationalVideos, 'app-motivational-videos'
  );
  const [postPomodoroVideos, setPostPomodoroVideos] = useIndexedDBSetting<PostPomodoroVideoPools>(
    'postPomodoroVideos', initialPostPomodoroVideos, 'app-post-pomodoro-videos'
  );
  const [tasks, setTasks] = useIndexedDBTable<Task>(
    db.tasks, [], 'app-tasks'
  );
  const [taskCategories, setTaskCategories] = useIndexedDBTable<TaskCategory>(
    db.taskCategories, [
      { id: 'work', name: 'İş', color: '#3b82f6' },
      { id: 'personal', name: 'Kişisel', color: '#10b981' },
      { id: 'study', name: 'Ders Çalışma', color: '#8b5cf6' },
      { id: 'health', name: 'Sağlık', color: '#ef4444' },
    ], 'app-task-categories'
  );

  // Gamification states
  const [gameTickets, setGameTickets] = useIndexedDBSetting<number>(
    'gameTickets', 5, 'app-game-tickets'
  );
  const [wheelSpins, setWheelSpins] = useIndexedDBSetting<number>(
    'wheelSpins', 3, 'app-wheel-spins'
  );
  const [op, setOp] = useIndexedDBSetting<number>(
    'op', 100, 'app-op'
  );
  const [unlockedCardIds, setUnlockedCardIds] = useIndexedDBSetting<string[]>(
    'unlockedCardIds', ['C001'], 'app-unlocked-cards'
  );
  const [completedSessionCountForCards, setCompletedSessionCountForCards] = useIndexedDBSetting<number>(
    'completedSessionCountForCards', 0, 'app-session-count-for-cards'
  );
  const [collectionCards, setCollectionCards] = useIndexedDBTable<CollectionCard>(
    db.collectionCards, initialAllCards, 'app-collection-cards'
  );
  const [legendaryCardsUnlockedForIcon, setLegendaryCardsUnlockedForIcon] = useIndexedDBSetting<number>(
    'legendaryCardsUnlockedForIcon', 0, 'app-legendary-unlocked-for-icon'
  );

  // Pomodoro Profile states
  const [pomodoroProfiles, setPomodoroProfiles] = useIndexedDBTable<PomodoroProfile>(
    db.pomodoroProfiles, PRESET_POMODORO_PROFILES, 'app-pomodoro-profiles'
  );
  const [activeProfileId, setActiveProfileId] = useIndexedDBSetting<string>(
    'activeProfileId', 'default', 'app-active-profile-id'
  );

  // Pomodoro Goal states
  const getTodayDateString = () => new Date().toISOString().split('T')[0];
  const getWeekStartDateString = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start of week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - diff);
    return weekStart.toISOString().split('T')[0];
  };

  const [pomodoroGoal, setPomodoroGoal] = useIndexedDBSetting<PomodoroGoal>(
    'pomodoroGoal', {
      dailyTarget: 8,
      weeklyTarget: 40,
      dailyCompleted: 0,
      weeklyCompleted: 0,
      lastResetDate: getTodayDateString(),
      lastWeekResetDate: getWeekStartDateString(),
    }, 'app-pomodoro-goal'
  );

  // Combined loading state
  const isLoading = !migrationDone || loadingActivePage || loadingTheme || loadingBg || loadingFolders || loadingNotes || loadingLessons || loadingSessions;

  // Global Music Player State
  const [globalMusicPlayer, setGlobalMusicPlayer] = useState<{
    isPlaying: boolean;
    currentTrack: { title: string; artist: string; cover: string | null } | null;
    isVisible: boolean;
  }>({
    isPlaying: false,
    currentTrack: null,
    isVisible: false,
  });

  const [globalMusicPlayerControls, setGlobalMusicPlayerControls] = useState<{
    onPlayPause: (() => void) | null;
    onNext: (() => void) | null;
    onPrevious: (() => void) | null;
  }>({
    onPlayPause: null,
    onNext: null,
    onPrevious: null,
  });

  
  const spendOp = useCallback((amount: number) => {
    setOp(prev => Math.max(0, prev - amount));
  }, [setOp]);

  // Pomodoro Profile management functions
  const addProfile = useCallback((profile: Omit<PomodoroProfile, 'id'>) => {
    const newProfile: PomodoroProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
    };
    setPomodoroProfiles(prev => [...prev, newProfile]);
  }, [setPomodoroProfiles]);

  const updateProfile = useCallback((id: string, updates: Partial<PomodoroProfile>) => {
    setPomodoroProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setPomodoroProfiles]);

  const deleteProfile = useCallback((id: string) => {
    // Prevent deleting the active profile
    if (id === activeProfileId) return;
    // Prevent deleting preset profiles
    const presetIds = PRESET_POMODORO_PROFILES.map(p => p.id);
    if (presetIds.includes(id)) return;
    setPomodoroProfiles(prev => prev.filter(p => p.id !== id));
  }, [setPomodoroProfiles, activeProfileId]);

  // Pomodoro Goal management functions
  const setDailyGoal = useCallback((target: number) => {
    setPomodoroGoal(prev => ({ ...prev, dailyTarget: target }));
  }, [setPomodoroGoal]);

  const setWeeklyGoal = useCallback((target: number) => {
    setPomodoroGoal(prev => ({ ...prev, weeklyTarget: target }));
  }, [setPomodoroGoal]);

  // Reset logic: Check if we need to reset daily/weekly counters
  useEffect(() => {
    const today = getTodayDateString();
    const weekStart = getWeekStartDateString();

    setPomodoroGoal(prev => {
      let updated = { ...prev };
      
      // Reset daily counter if date changed
      if (prev.lastResetDate !== today) {
        updated.dailyCompleted = 0;
        updated.lastResetDate = today;
      }

      // Reset weekly counter if week changed
      if (prev.lastWeekResetDate !== weekStart) {
        updated.weeklyCompleted = 0;
        updated.lastWeekResetDate = weekStart;
      }

      return updated;
    });
  }, []); // Run once on mount

  // Compute goal progress percentages
  const dailyGoalProgress = useMemo(() => {
    if (pomodoroGoal.dailyTarget === 0) return 0;
    return Math.min(100, Math.round((pomodoroGoal.dailyCompleted / pomodoroGoal.dailyTarget) * 100));
  }, [pomodoroGoal.dailyCompleted, pomodoroGoal.dailyTarget]);

  const weeklyGoalProgress = useMemo(() => {
    if (pomodoroGoal.weeklyTarget === 0) return 0;
    return Math.min(100, Math.round((pomodoroGoal.weeklyCompleted / pomodoroGoal.weeklyTarget) * 100));
  }, [pomodoroGoal.weeklyCompleted, pomodoroGoal.weeklyTarget]);

  const addCollectionCard = useCallback((card: Omit<CollectionCard, 'id' | 'unlockMethod'>) => {
    const newCard: CollectionCard = {
      ...card,
      id: `CSTM-${Date.now()}`,
      unlockMethod: 'op'
    };
    setCollectionCards(prev => [...prev, newCard]);
  }, [setCollectionCards]);
  
  const updateCollectionCard = useCallback((id: string, updates: Partial<CollectionCard>) => {
    setCollectionCards(prev => prev.map(card => card.id === id ? { ...card, ...updates } : card));
  }, [setCollectionCards]);

  const deleteCollectionCard = useCallback((id: string) => {
    // Also remove from unlocked cards if it's there
    setUnlockedCardIds(prev => prev.filter(cardId => cardId !== id));
    setCollectionCards(prev => prev.filter(card => card.id !== id));
  }, [setCollectionCards, setUnlockedCardIds]);

  const unlockCardWithOp = useCallback((cardId: string): boolean => {
    const cardToUnlock = collectionCards.find(card => card.id === cardId);
    if (!cardToUnlock || cardToUnlock.unlockMethod !== 'op' || unlockedCardIds.includes(cardId)) {
        return false;
    }

    if (op >= cardToUnlock.opCost) {
        spendOp(cardToUnlock.opCost);
        setUnlockedCardIds(prev => [...prev, cardId]);

        // Fire-and-forget: Show card unlocked notification
        NotificationService.showCardUnlocked(cardToUnlock.name, cardToUnlock.rarity).catch(() => {});

        return true;
    }
    
    return false;
  }, [op, spendOp, unlockedCardIds, setUnlockedCardIds, collectionCards]);


  const addPomodoroSession = useCallback((session: Omit<PomodoroSession, 'id'>): LastEarnedRewards => {
    setPomodoroSessions(prev => [...prev, { ...session, id: String(Date.now()) }]);
    
    const duration = session.duration;
    let ticketsEarned = 0;
    let spinsEarned = 0;
    // Award 1 OP per minute of focus
    let opEarned = duration;
    
    if (duration >= 90) {
        ticketsEarned = 6;
        spinsEarned = 2;
    } else if (duration >= 40) {
        ticketsEarned = 2;
        spinsEarned = 1;
    } else if (duration >= 25) {
        ticketsEarned = 1;
    }
    
    if (ticketsEarned > 0) setGameTickets(prev => prev + ticketsEarned);
    if (spinsEarned > 0) setWheelSpins(prev => prev + spinsEarned);
    if (opEarned > 0) setOp(prev => prev + opEarned);

    // Fire-and-forget: Show reward notification when rewards are earned
    if (ticketsEarned > 0 || spinsEarned > 0 || opEarned > 0) {
      const rewardParts: string[] = [];
      if (ticketsEarned > 0) rewardParts.push(`${ticketsEarned} bilet`);
      if (spinsEarned > 0) rewardParts.push(`${spinsEarned} çevirme hakkı`);
      if (opEarned > 0) rewardParts.push(`${opEarned} OP`);
      NotificationService.showRewardEarned(rewardParts.join(', ') + ' kazandın!').catch(() => {});
    }

    // Legendary card progress is now manual. Just increment the counter.
    if (duration >= 20) {
        setCompletedSessionCountForCards(prev => prev + 1);
    }

    // Update goal progress (count 1 pomodoro per session)
    setPomodoroGoal(prev => {
      const newDailyCompleted = prev.dailyCompleted + 1;
      const newWeeklyCompleted = prev.weeklyCompleted + 1;
      
      // Check for goal completion and show notifications + bonus rewards
      if (newDailyCompleted === prev.dailyTarget && prev.dailyTarget > 0) {
        NotificationService.showRewardEarned('Günlük hedefini tamamladın! 🎉').catch(() => {});
        // Bonus rewards for daily goal completion
        setGameTickets(prev => prev + 2);
        setOp(prev => prev + 50);
        opEarned += 50;
        ticketsEarned += 2;
      }
      if (newWeeklyCompleted === prev.weeklyTarget && prev.weeklyTarget > 0) {
        NotificationService.showRewardEarned('Haftalık hedefini tamamladın! 🏆').catch(() => {});
        // Bonus rewards for weekly goal completion
        setGameTickets(prev => prev + 5);
        setWheelSpins(prev => prev + 2);
        setOp(prev => prev + 200);
        opEarned += 200;
        ticketsEarned += 5;
        spinsEarned += 2;
      }

      return {
        ...prev,
        dailyCompleted: newDailyCompleted,
        weeklyCompleted: newWeeklyCompleted,
      };
    });

    return { tickets: ticketsEarned, spins: spinsEarned, op: opEarned, newCard: null };
  }, [setPomodoroSessions, setGameTickets, setWheelSpins, setOp, setCompletedSessionCountForCards, setPomodoroGoal]);

  const claimLegendaryCard = useCallback((cardToUnlockId: string): CollectionCard | null => {
    if (completedSessionCountForCards < 10) {
        return null;
    }

    const card = collectionCards.find(c => c.id === cardToUnlockId);

    if (!card || card.unlockMethod !== 'session_streak' || unlockedCardIds.includes(cardToUnlockId)) {
        return null;
    }

    setUnlockedCardIds(prev => [...prev, card.id]);
    setCompletedSessionCountForCards(prev => prev - 10);
    setLegendaryCardsUnlockedForIcon(prev => prev + 1);

    // Fire-and-forget: Show card unlocked notification
    NotificationService.showCardUnlocked(card.name, card.rarity).catch(() => {});

    return card;
  }, [completedSessionCountForCards, collectionCards, unlockedCardIds, setCompletedSessionCountForCards, setUnlockedCardIds, setLegendaryCardsUnlockedForIcon]);
  
  const claimIconCard = useCallback((): CollectionCard | null => {
      const availableIconCards = collectionCards.filter(c => c.rarity === 'Icon' && !unlockedCardIds.includes(c.id));
      if (legendaryCardsUnlockedForIcon < 3 || availableIconCards.length === 0) {
          return null;
      }

      const cardToUnlock = availableIconCards[Math.floor(Math.random() * availableIconCards.length)];
      setUnlockedCardIds(prev => [...prev, cardToUnlock.id]);
      setLegendaryCardsUnlockedForIcon(prev => prev - 3);

      return cardToUnlock;
  }, [legendaryCardsUnlockedForIcon, collectionCards, unlockedCardIds, setLegendaryCardsUnlockedForIcon, setUnlockedCardIds]);


  const spendGameTicket = useCallback(() => {
    setGameTickets(prev => Math.max(0, prev - 1));
  }, [setGameTickets]);

  const spendWheelSpin = useCallback(() => {
    setWheelSpins(prev => Math.max(0, prev - 1));
  }, [setWheelSpins]);

  const addGameTickets = useCallback((amount: number) => {
    setGameTickets(prev => prev + amount);
  }, [setGameTickets]);
  
  const addOp = useCallback((amount: number) => {
    setOp(prev => prev + amount);
  }, [setOp]);


  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), [setTheme]);
  
  const setBackground = useCallback((url: string) => {
    _setBackground(url);
    _setBackgroundColor(null);
  }, [_setBackground, _setBackgroundColor]);
  
  const setBackgroundColor = useCallback((color: string) => {
    _setBackground(null);
    _setBackgroundColor(color);
  }, [_setBackground, _setBackgroundColor]);

  const addFolder = useCallback((name: string) => {
    setFolders(prev => [...prev, { id: String(Date.now()), name, createdAt: Date.now() }]);
  }, [setFolders]);
  const updateFolder = useCallback((id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  }, [setFolders]);
  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
  }, [setFolders, setNotes]);
  
  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const newNote: Note = {
      ...note,
      id: String(Date.now()),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, [setNotes]);
  const updateNote = useCallback((id: string, title: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n));
  }, [setNotes]);
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [setNotes]);
  const moveNote = useCallback((noteId: string, targetFolderId: string | null) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId: targetFolderId } : n));
  }, [setNotes]);

  const addLesson = useCallback((lesson: Omit<Lesson, 'id'>) => {
    setLessons(prev => [...prev, { ...lesson, id: String(Date.now()) }]);
  }, [setLessons]);
  const updateLesson = useCallback((id: string, updates: Partial<Lesson>) => {
    setLessons(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, [setLessons]);
  const deleteLesson = useCallback((id: string) => {
    setLessons(prev => prev.filter(l => l.id !== id));
  }, [setLessons]);
  
  const addSavedPlaylist = useCallback((name: string, url: string) => {
    // Auto-detect platform from URL
    let platform: PlaylistPlatform = 'custom';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
    } else if (url.includes('spotify.com')) {
      platform = 'spotify';
    }
    
    const newPlaylist: SavedPlaylist = { 
      id: String(Date.now()), 
      name, 
      url,
      platform,
      thumbnail: null,
      duration: null
    };
    setSavedPlaylists(prev => [...prev, newPlaylist]);
  }, [setSavedPlaylists]);
  const updateSavedPlaylist = useCallback((id: string, name: string) => {
    setSavedPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }, [setSavedPlaylists]);
  const deleteSavedPlaylist = useCallback((id: string) => {
    setSavedPlaylists(prev => prev.filter(p => p.id !== id));
  }, [setSavedPlaylists]);
  const playPlaylist = useCallback((playlist: SavedPlaylist) => {
    setPlaylistToPlay(playlist);
    setActivePage(Page.Dashboard);
  }, [setActivePage]);

  const addMotivationalVideo = useCallback((url: string) => {
    setMotivationalVideos(prev => [...prev, { id: String(Date.now()), url }]);
  }, [setMotivationalVideos]);
  const deleteMotivationalVideo = useCallback((id: string) => {
    setMotivationalVideos(prev => prev.filter(v => v.id !== id));
  }, [setMotivationalVideos]);
  const addPostPomodoroVideo = useCallback((category: PostPomodoroCategory, url: string) => {
    const newVideo = { id: String(Date.now()), url };
    setPostPomodoroVideos(prev => ({ ...prev, [category]: [...(prev[category] || []), newVideo] }));
  }, [setPostPomodoroVideos]);
  const deletePostPomodoroVideo = useCallback((category: PostPomodoroCategory, videoId: string) => {
    setPostPomodoroVideos(prev => ({ ...prev, [category]: prev[category].filter(v => v.id !== videoId) }));
  }, [setPostPomodoroVideos]);

  const addTask = useCallback((text: string) => {
    const newTask: Task = { 
      id: String(Date.now()), 
      text, 
      completed: false, 
      completedAt: null,
      priority: 'medium',
      category: null,
      tags: [],
      dueDate: null,
      estimatedPomodoros: null
    };
    setTasks(prev => [newTask, ...prev]);
  }, [setTasks]);
  
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [setTasks]);
  
  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      // Fire-and-forget: Show notification only when task is being completed (not uncompleted)
      if (task && !task.completed) {
        NotificationService.showTaskComplete(task.text).catch(() => {});
      }
      return prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : null } : t);
    });
  }, [setTasks]);
  
  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);
  
  const clearCompletedTasks = useCallback(() => {
    setTasks(prev => prev.filter(t => !t.completed));
  }, [setTasks]);

  // Task Category management
  const addTaskCategory = useCallback((name: string, color: string) => {
    const newCategory: TaskCategory = {
      id: `cat-${Date.now()}`,
      name,
      color
    };
    setTaskCategories(prev => [...prev, newCategory]);
  }, [setTaskCategories]);

  const updateTaskCategory = useCallback((id: string, name: string, color: string) => {
    setTaskCategories(prev => prev.map(c => c.id === id ? { ...c, name, color } : c));
  }, [setTaskCategories]);

  const deleteTaskCategory = useCallback((id: string) => {
    // Remove category from all tasks that use it
    setTasks(prev => prev.map(t => t.category === id ? { ...t, category: null } : t));
    setTaskCategories(prev => prev.filter(c => c.id !== id));
  }, [setTaskCategories, setTasks]);

  const backgroundStyle = useMemo((): CSSProperties => ({
    backgroundImage: background ? `url(${background})` : 'none',
    backgroundColor: backgroundColor ? backgroundColor : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: `blur(${backgroundBlur}px) brightness(${backgroundOpacity / 100})`,
  }), [background, backgroundColor, backgroundBlur, backgroundOpacity]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const stableValue = useMemo(() => ({
    isLoading,
    theme, toggleTheme,
    background, setBackground, backgroundColor, setBackgroundColor, backgroundBlur, setBackgroundBlur, backgroundOpacity, setBackgroundOpacity, backgroundStyle,
    motivationalImage, setMotivationalImage,
    isFlowModeEnabled, setIsFlowModeEnabled,
    folders, addFolder, updateFolder, deleteFolder,
    notes, addNote, updateNote, deleteNote, moveNote,
    lessons, addLesson, updateLesson, deleteLesson,
    pomodoroSessions, addPomodoroSession,
    savedPlaylists, addSavedPlaylist, updateSavedPlaylist, deleteSavedPlaylist,
    playlistToPlay, playPlaylist, setPlaylistToPlay,
    activePage, setActivePage,
    motivationalVideos, addMotivationalVideo, deleteMotivationalVideo,
    postPomodoroVideos, addPostPomodoroVideo, deletePostPomodoroVideo,
    tasks, addTask, updateTask, toggleTask, deleteTask, clearCompletedTasks,
    taskCategories, addTaskCategory, updateTaskCategory, deleteTaskCategory,
    gameTickets, wheelSpins, op, unlockedCardIds,
    spendGameTicket, spendWheelSpin, addGameTickets, addOp, unlockCardWithOp,
    collectionCards, addCollectionCard, updateCollectionCard, deleteCollectionCard,
    completedSessionCountForCards, claimLegendaryCard,
    legendaryCardsUnlockedForIcon, claimIconCard,
    pomodoroProfiles, activeProfileId, addProfile, updateProfile, deleteProfile, setActiveProfileId,
    pomodoroGoal, setDailyGoal, setWeeklyGoal, dailyGoalProgress, weeklyGoalProgress,
    globalMusicPlayer, setGlobalMusicPlayer, globalMusicPlayerControls, setGlobalMusicPlayerControls,
  }), [
    isLoading,
    theme, toggleTheme, background, setBackground, backgroundColor, setBackgroundColor, backgroundBlur, setBackgroundBlur, backgroundOpacity, setBackgroundOpacity, backgroundStyle,
    motivationalImage, setMotivationalImage, isFlowModeEnabled, setIsFlowModeEnabled,
    folders, addFolder, updateFolder, deleteFolder, notes, addNote, updateNote, deleteNote, moveNote,
    lessons, addLesson, updateLesson, deleteLesson, pomodoroSessions, addPomodoroSession, savedPlaylists, addSavedPlaylist, updateSavedPlaylist, deleteSavedPlaylist,
    playlistToPlay, playPlaylist, setPlaylistToPlay, activePage, setActivePage, motivationalVideos, addMotivationalVideo, deleteMotivationalVideo,
    postPomodoroVideos, addPostPomodoroVideo, deletePostPomodoroVideo, tasks, addTask, updateTask, toggleTask, deleteTask, clearCompletedTasks,
    taskCategories, addTaskCategory, updateTaskCategory, deleteTaskCategory,
    gameTickets, wheelSpins, op, unlockedCardIds, spendGameTicket, spendWheelSpin, addGameTickets, addOp, unlockCardWithOp,
    collectionCards, addCollectionCard, updateCollectionCard, deleteCollectionCard,
    completedSessionCountForCards, claimLegendaryCard, legendaryCardsUnlockedForIcon, claimIconCard,
    pomodoroProfiles, activeProfileId, addProfile, updateProfile, deleteProfile, setActiveProfileId,
    pomodoroGoal, setDailyGoal, setWeeklyGoal, dailyGoalProgress, weeklyGoalProgress,
    globalMusicPlayer, setGlobalMusicPlayer, globalMusicPlayerControls, setGlobalMusicPlayerControls,
  ]);

  return (
    <DataContext.Provider value={stableValue}>
        {children}
    </DataContext.Provider>
  );
};
