import React from 'react';
import { Sparkles, Maximize2, Minimize2 } from 'lucide-react';

interface TopBarProps {
  activeTab: 'practice' | 'music' | 'history' | 'settings';
  onTabChange: (tab: 'practice' | 'music' | 'history' | 'settings') => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  personalBestWpm: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  focusMode,
  onToggleFocusMode,
  personalBestWpm,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark in display face */}
      <a 
        href="#" 
        onClick={(e) => { e.preventDefault(); onTabChange('practice'); }}
        className="text-xl font-bold tracking-tight text-slate-100 hover:text-amber-400 transition-colors"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        SurType
      </a>

      {/* Zone 2: 4 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onTabChange('practice')}
          className={`hover:text-slate-100 transition-colors cursor-pointer ${
            activeTab === 'practice' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Practice
        </button>
        <button
          onClick={() => onTabChange('music')}
          className={`hover:text-slate-100 transition-colors cursor-pointer ${
            activeTab === 'music' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Music Lounge
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`hover:text-slate-100 transition-colors cursor-pointer ${
            activeTab === 'history' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          History
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`hover:text-slate-100 transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Settings
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {personalBestWpm > 0 && (
          <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
            PB: <strong className="text-amber-400 font-bold">{personalBestWpm}</strong> WPM
          </span>
        )}
        <button
          onClick={onToggleFocusMode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
        >
          {focusMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Exit Focus</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Focus Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
