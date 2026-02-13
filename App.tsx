
import React, { Suspense, useContext, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, ExternalLink } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import MiniPlayer from './components/MiniPlayer.tsx';
import Dashboard from './pages/Dashboard.tsx';
import { DataContext, PomodoroContext } from './context/DataContext.tsx';
import { fadeIn } from './utils/animations';

// Lazy-loaded page components (Dashboard excluded - always mounted for persistent music)
const Guide = lazy(() => import('./pages/Guide.tsx'));
const Notes = lazy(() => import('./pages/Notes.tsx'));
const Lessons = lazy(() => import('./pages/Lessons.tsx'));
const MusicPlaylists = lazy(() => import('./pages/MusicPlaylists.tsx'));
const Settings = lazy(() => import('./pages/Settings.tsx'));
const Exercise = lazy(() => import('./pages/Exercise.tsx'));
const Tasks = lazy(() => import('./pages/Tasks.tsx'));
const Collection = lazy(() => import('./pages/Collection.tsx'));
const Analytics = lazy(() => import('./pages/Analytics.tsx'));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="inline-block w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const externalLinks: ExternalLink[] = [
  { name: 'Notebook', url: 'https://www.onenote.com', icon: 'BookOpen' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: 'Youtube' },
  { name: 'Notion', url: 'https://www.notion.so', icon: 'FileText' },
  { name: 'NotebookLM', url: 'https://notebooklm.google.com/', icon: 'FileText' },
  { name: 'AI Studio', url: 'https://aistudio.google.com/', icon: 'Sparkles' },
];

export default function App() {
  const { theme, backgroundStyle, activePage, setActivePage, globalMusicPlayer, setGlobalMusicPlayer, globalMusicPlayerControls, isLoading } = useContext(DataContext);
  const { isFlowModeActive } = useContext(PomodoroContext);

  if (isLoading) {
    return (
      <div className={`${theme} font-sans`}>
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case Page.Guide:
        return <Guide />;
      case Page.Tasks:
        return <Tasks />;
      case Page.Exercise:
        return <Exercise />;
      case Page.Notes:
        return <Notes />;
      case Page.Lessons:
        return <Lessons />;
      case Page.MusicPlaylists:
        return <MusicPlaylists />;
      case Page.Collection:
        return <Collection />;
      case Page.Analytics:
        return <Analytics />;
      case Page.Settings:
        return <Settings />;
      default:
        return null;
    }
  };

  const isDashboard = activePage === Page.Dashboard;

  return (
    <div className={`${theme} font-sans`}>
      <div 
        className="fixed inset-0 transition-all duration-500 z-[-2]" 
        style={backgroundStyle}
      >
      </div>
       <div className="fixed inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40 dark:from-black/40 dark:to-black/60 z-[-1]"></div>
      
       {isFlowModeActive && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[60] flex items-center justify-center animate-fade-in"
        >
          <h1 
            className="text-6xl font-bold text-white animate-glow-text-flow"
            style={{ '--glow-color': '#FFFFFF' } as React.CSSProperties}
          >
            Akıştasın.
          </h1>
        </div>
      )}

      <div className="flex h-screen text-gray-800 dark:text-gray-200">
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage}
          externalLinks={externalLinks}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
          {/* Dashboard - always mounted, hidden when not active (keeps MusicWidget alive) */}
          <div className={isDashboard ? 'h-full' : 'hidden'}>
            <Dashboard />
          </div>

          {/* Other pages - lazy loaded with animations */}
          {!isDashboard && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full"
              >
                <Suspense fallback={<PageLoader />}>
                  {renderPage()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Mini Player - Show on all pages except Dashboard when music is playing */}
      {globalMusicPlayer.isVisible && !isDashboard && (
        <MiniPlayer
          isPlaying={globalMusicPlayer.isPlaying}
          currentTrack={globalMusicPlayer.currentTrack}
          onPlayPause={() => globalMusicPlayerControls.onPlayPause?.()}
          onNext={() => globalMusicPlayerControls.onNext?.()}
          onPrevious={() => globalMusicPlayerControls.onPrevious?.()}
          onClose={() => setGlobalMusicPlayer({ ...globalMusicPlayer, isVisible: false })}
        />
      )}
    </div>
  );
}
