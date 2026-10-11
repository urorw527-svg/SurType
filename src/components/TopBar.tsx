import React from 'react';
import { Maximize2, Minimize2, User, Sparkles } from 'lucide-react';

interface AuthUser {
  id: string;
  isAnonymous?: boolean;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface TopBarProps {
  activeTab: 'practice' | 'music' | 'history' | 'settings';
  onTabChange: (tab: 'practice' | 'music' | 'history' | 'settings') => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  personalBestWpm: number;
  user: AuthUser | null;
  onOpenAuthModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  focusMode,
  onToggleFocusMode,
  personalBestWpm,
  user,
  onOpenAuthModal,
}) => {
  const displayName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : (user?.isAnonymous ? 'Guest' : null));

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

      {/* Zone 2: Navigation links */}
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

      {/* Zone 3: Actions + Account */}
      <div className="flex items-center gap-3">
        {personalBestWpm > 0 && (
          <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
            PB: <strong className="text-amber-400 font-bold">{personalBestWpm}</strong> WPM
          </span>
        )}

        {/* Account / Log in Button */}
        <button
          onClick={onOpenAuthModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
            user
              ? 'text-slate-200 bg-slate-900 border border-slate-700 hover:border-amber-400/50'
              : 'text-slate-950 bg-amber-400 hover:bg-amber-300 font-semibold shadow-sm'
          }`}
          title={user ? 'Account Settings' : 'Log In with Google or Guest'}
        >
          <User className="w-3.5 h-3.5" />
          <span className="max-w-[100px] truncate">
            {user ? displayName || 'Account' : 'Log In'}
          </span>
          {!user && <Sparkles className="w-3 h-3 ml-0.5 text-slate-950" />}
        </button>

        <button
          onClick={onToggleFocusMode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
        >
          {focusMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Exit Focus</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Focus</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
