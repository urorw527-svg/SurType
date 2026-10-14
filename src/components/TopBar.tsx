import React, { useState } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Users, 
  Award, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { NavigationTab, UserProfile } from '../types';
import { getLevelInfo } from '../utils/missionsData';

interface TopBarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  user: UserProfile | null;
  onLoginGoogle: () => void;
  onLoginGuest: () => void;
  onLogout: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  personalBestWpm: number;
  isLoggingIn?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  user,
  onLoginGoogle,
  onLoginGuest,
  onLogout,
  focusMode,
  onToggleFocusMode,
  personalBestWpm,
  isLoggingIn = false,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const levelInfo = user ? getLevelInfo(user.xp || 0) : null;

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      
      {/* Zone 1: Logo Wordmark & Navigation */}
      <div className="flex items-center gap-6">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onTabChange('practice'); }}
          className="text-xl font-bold tracking-tight text-slate-100 hover:text-amber-400 transition-colors flex items-center gap-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          <span>SurType</span>
          <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium">
            Multiplayer
          </span>
        </a>

        {/* Zone 2: Main Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-400">
          <button
            onClick={() => onTabChange('practice')}
            className={`hover:text-slate-100 transition-colors cursor-pointer py-1 ${
              activeTab === 'practice' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            Practice
          </button>
          
          <button
            onClick={() => onTabChange('multiplayer')}
            className={`flex items-center gap-1.5 hover:text-slate-100 transition-colors cursor-pointer py-1 ${
              activeTab === 'multiplayer' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Multiplayer Rooms</span>
            <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded font-mono">Live</span>
          </button>

          <button
            onClick={() => onTabChange('missions')}
            className={`flex items-center gap-1.5 hover:text-slate-100 transition-colors cursor-pointer py-1 ${
              activeTab === 'missions' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Levels & Missions</span>
            {user && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full font-bold">
                Lv.{levelInfo?.level}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('music')}
            className={`hover:text-slate-100 transition-colors cursor-pointer py-1 ${
              activeTab === 'music' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            Music Lounge
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`hover:text-slate-100 transition-colors cursor-pointer py-1 ${
              activeTab === 'history' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            History
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`hover:text-slate-100 transition-colors cursor-pointer py-1 ${
              activeTab === 'settings' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Zone 3: User Auth & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Nav Dropdown Buttons */}
        <div className="flex lg:hidden items-center gap-1">
          <button
            onClick={() => onTabChange('multiplayer')}
            className={`p-1.5 rounded-lg border text-xs ${
              activeTab === 'multiplayer' 
                ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold' 
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
            title="Multiplayer"
          >
            <Users className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onTabChange('missions')}
            className={`p-1.5 rounded-lg border text-xs ${
              activeTab === 'missions' 
                ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold' 
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
            title="Missions & Levels"
          >
            <Award className="w-3.5 h-3.5" />
          </button>
        </div>

        {personalBestWpm > 0 && (
          <span className="hidden md:inline-block text-xs font-mono text-slate-400 px-2 py-1 rounded bg-slate-900 border border-slate-800">
            PB: <strong className="text-amber-400 font-bold">{personalBestWpm}</strong> WPM
          </span>
        )}

        {/* Focus Mode Button */}
        <button
          onClick={onToggleFocusMode}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          title="Toggle Focus View"
        >
          {focusMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Exit</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Focus</span>
            </>
          )}
        </button>

        {/* Authentication Controls */}
        {!user ? (
          <div className="flex items-center gap-2">
            {/* Guest Mode Button (Single players can play immediately) */}
            <button
              onClick={onLoginGuest}
              disabled={isLoggingIn}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Play as Guest without signing in"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Guest Mode</span>
            </button>

            {/* Google Login Button */}
            <button
              onClick={onLoginGoogle}
              disabled={isLoggingIn}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Sign in with your Google account"
            >
              {isLoggingIn ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Google Login</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* User Profile Display When Logged In */
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(prev => !prev)}
              className="flex items-center gap-2 p-1 pl-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors cursor-pointer text-left"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-6 h-6 rounded-full object-cover border border-amber-400/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="hidden sm:flex flex-col min-w-0 pr-1 leading-tight">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                  {user.displayName}
                </span>
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <span>Lv.{levelInfo?.level}</span>
                  {user.isAnonymous && <span className="text-slate-500">(Guest)</span>}
                </span>
              </div>

              <ChevronDown className="w-3 h-3 text-slate-400 mr-1" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="pb-2.5 mb-2.5 border-b border-slate-800">
                  <div className="text-xs font-bold text-slate-100 truncate">
                    {user.displayName}
                  </div>
                  {user.email && (
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {user.email}
                    </div>
                  )}
                  <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400 font-medium">Rank & Level:</span>
                      <span className="text-amber-400 font-bold font-mono">Lv.{levelInfo?.level}</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-semibold mb-1">
                      {levelInfo?.title}
                    </div>
                    {/* XP Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${levelInfo?.progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono text-right mt-1">
                      {levelInfo?.xpIntoLevel}/{levelInfo?.xpNeeded} XP
                    </div>
                  </div>
                </div>

                {user.isAnonymous && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLoginGoogle();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 mb-1.5 text-xs text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Link Google Account</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onTabChange('missions');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 mb-1 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>View Level Missions</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onTabChange('multiplayer');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 mb-1 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
                >
                  <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Multiplayer Rooms</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left mt-1 border-t border-slate-800/80 pt-2"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
