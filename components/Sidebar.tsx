
import React, { useContext, useMemo, useCallback } from 'react';
// Fix: Import IconName type
import { Page, ExternalLink, IconName } from '../types.ts';
import Icon from './Icon.tsx';
import { DataContext } from '../context/DataContext.tsx';
import { openExternalLink } from '../utils/links.ts';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  externalLinks: ExternalLink[];
}

const navItems: { name: Page; icon: IconName }[] = [
  { name: Page.Guide, icon: 'HelpCircle' },
  { name: Page.Dashboard, icon: 'LayoutDashboard' },
  { name: Page.Tasks, icon: 'CheckSquare' },
  { name: Page.Exercise, icon: 'Wind' },
  { name: Page.Notes, icon: 'FileText' },
  { name: Page.MusicPlaylists, icon: 'Music' },
  { name: Page.Collection, icon: 'Gift' },
  { name: Page.Analytics, icon: 'BarChart' },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, externalLinks }) => {
  const { theme, toggleTheme, gameTickets, wheelSpins, op } = useContext(DataContext);

  return (
    <nav className="h-full w-16 md:w-64 bg-light-surface/70 dark:bg-dark-surface/50 backdrop-blur-2xl flex flex-col p-2 md:p-4 border-r border-white/20 dark:border-white/10 transition-all duration-300">
      {/* --- Top Section (non-scrolling) --- */}
      <div className="shrink-0">
        <div className="flex items-center mb-8 md:mb-12">
          <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/30">
             <Icon name="BookOpen" className="text-white h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold ml-3 hidden md:block dark:text-white">Full-Focus</h1>
        </div>
      </div>

      {/* --- Middle Section (scrolling) --- */}
      {/* flex-1 allows this div to grow and shrink, and overflow-y-auto enables scrolling when content exceeds available space. */}
      {/* Negative margin and padding on the right are used to visually hide the scrollbar track while keeping the thumb functional. */}
      <div className="flex-1 overflow-y-auto -mr-2 md:-mr-4 pr-2 md:pr-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => setActivePage(item.name)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 relative ${
                  activePage === item.name
                    ? 'bg-primary/20 text-primary dark:text-white font-bold'
                    : 'hover:bg-gray-500/10 dark:hover:bg-white/10'
                }`}
              >
                 {activePage === item.name && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></div>}
                <Icon name={item.icon} className="h-5 w-5" />
                <span className="ml-4 font-semibold hidden md:inline">{item.name}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => setActivePage(Page.Lessons)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group relative ${
                activePage === Page.Lessons
                  ? 'bg-primary text-white shadow-lg shadow-primary/40 font-bold'
                  : 'bg-primary/20 text-primary hover:bg-primary hover:text-white dark:text-white dark:hover:bg-primary'
              }`}
            >
              {activePage === Page.Lessons && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r-full"></div>}
              <Icon name="BookOpen" className="h-5 w-5" />
              <span className="ml-4 font-semibold hidden md:inline">Dersler</span>
            </button>
          </li>
        </ul>

        <div className="mt-8 pt-4 border-t border-white/20 dark:border-white/10">
          <h2 className="hidden md:block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shortcuts</h2>
          <ul className="space-y-2">
            {externalLinks.map((link) => (
              <li key={link.name}>
                <button
                  onClick={() => openExternalLink(link.url)}
                  className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-gray-500/10 dark:hover:bg-white/10"
                >
                  <Icon name={link.icon} className={`h-5 w-5 ${link.name === 'AI Studio' ? 'text-primary animate-glow' : ''}`} />
                  <span className={`ml-4 font-semibold hidden md:inline ${link.name === 'AI Studio' ? 'text-primary' : ''}`}>{link.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* --- Bottom Section (non-scrolling) --- */}
      {/* shrink-0 prevents this section from shrinking. pt-4 adds space between the scrollable content and the footer. */}
      <div className="shrink-0 pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-around space-y-2 md:space-y-0 md:mb-4 px-2 border-t border-white/20 dark:border-white/10 pt-4">
            <div className="flex items-center space-x-2 text-sm" title={`${op} Odak Puanı`}>
                <span className="font-bold text-green-400">OP:</span>
                <span className="font-bold">{op}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm" title={`${gameTickets} Oyun Bileti`}>
                <Icon name="Ticket" className="w-5 h-5 text-primary" />
                <span className="font-bold">{gameTickets}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm" title={`${wheelSpins} Çark Hakkı`}>
                <Icon name="RefreshCw" className="w-5 h-5 text-yellow-500" />
                <span className="font-bold">{wheelSpins}</span>
            </div>
        </div>
        <div className="flex items-center justify-center space-x-2">
            <button onClick={toggleTheme} className="flex-1 flex items-center justify-center p-2 rounded-lg hover:bg-gray-500/10 dark:hover:bg-white/10">
                {theme === 'light' ? <Icon name="Moon" className="h-5 w-5"/> : <Icon name="Sun" className="h-5 w-5"/>}
                <span className="ml-2 font-semibold hidden md:inline">Theme</span>
            </button>
            <button onClick={() => setActivePage(Page.Settings)} className="p-3 rounded-lg hover:bg-gray-500/10 dark:hover:bg-white/10" title="Settings">
                <Icon name="Settings" className="h-5 w-5" />
            </button>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Sidebar);