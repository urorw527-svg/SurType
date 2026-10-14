/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Tv } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { MiniSongBar } from './components/MiniSongBar';
import { TypingMusicDock } from './components/TypingMusicDock';
import { YouTubeMusicLounge } from './components/YouTubeMusicLounge';
import { MultiplayerLounge } from './components/MultiplayerLounge';
import { MissionsLounge } from './components/MissionsLounge';
import { TypingEngine } from './components/TypingEngine';
import { TestResultsModal } from './components/TestResultsModal';
import { HistoryStats } from './components/HistoryStats';
import { SettingsView } from './components/SettingsView';
import { 
  SongTrack, 
  TypingResult, 
  TypingSettings, 
  InstantSwitchCategory,
  UserProfile,
  NavigationTab 
} from './types';
import { CURATED_TRACKS } from './data/musicTracks';
import { 
  playYouTubeVideo, 
  pauseYouTubeVideo, 
  switchYouTubeVideo, 
  setupYouTubeStateListener,
  setYouTubeVolume,
  seekYouTubeVideo,
  parseDurationToSeconds
} from './utils/youtubePlayer';
import { 
  loginWithGoogle, 
  loginAsGuest, 
  logoutUser, 
  onAuthUserChanged,
  addXPToUser 
} from './utils/firebase';
import { loadStoredMissions, saveStoredMissions } from './utils/missionsData';

const DEFAULT_SETTINGS: TypingSettings = {
  soundTheme: 'creamy',
  soundVolume: 0.6,
  autoPlayMusicOnType: true,
  autoAdvanceSongs: true,
  autoShuffleOnNewTest: false,
  caretStyle: 'line',
  smoothCaret: true,
  confidenceMode: false,
  quickRestartKey: true,
  fontSize: 'md',
  targetWpmGoal: 50,
};

// Function to select a random different track on page load / refresh
function pickInitialTrack(): SongTrack {
  try {
    const lastPlayedId = localStorage.getItem('surtype_last_played_id');
    const available = CURATED_TRACKS.filter(t => t.id !== lastPlayedId);
    const pool = available.length > 0 ? available : CURATED_TRACKS;
    const randomTrack = pool[Math.floor(Math.random() * pool.length)];
    localStorage.setItem('surtype_last_played_id', randomTrack.id);
    return randomTrack;
  } catch {
    return CURATED_TRACKS[Math.floor(Math.random() * CURATED_TRACKS.length)];
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('practice');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [practiceKey, setPracticeKey] = useState<number>(0);

  // User Authentication state
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('surtype_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Music state - selects a fresh different song on every page refresh!
  const [currentTrack, setCurrentTrack] = useState<SongTrack>(() => pickInitialTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(() => parseDurationToSeconds(currentTrack.duration));
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<InstantSwitchCategory>('all');
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('surtype_volume');
      return saved ? Number(saved) : 75;
    } catch {
      return 75;
    }
  });

  // Track history stack (for Skip Back) and unplayed pool set (to prevent circling same songs)
  const historyStackRef = useRef<SongTrack[]>([]);
  const playedIdsRef = useRef<Set<string>>(new Set([currentTrack.id]));

  const [customTracks, setCustomTracks] = useState<SongTrack[]>(() => {
    try {
      const saved = localStorage.getItem('surtype_custom_tracks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Typing test state & history
  const [results, setResults] = useState<TypingResult[]>(() => {
    try {
      const saved = localStorage.getItem('surtype_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeResult, setActiveResult] = useState<TypingResult | null>(null);
  const [isPersonalBest, setIsPersonalBest] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<TypingSettings>(() => {
    try {
      const saved = localStorage.getItem('surtype_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const personalBestWpm = results.length > 0 ? Math.max(...results.map(r => r.wpm)) : 0;

  const handleUpdateSettings = (newSettings: Partial<TypingSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('surtype_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleVolumeChange = (newVol: number) => {
    const safe = Math.min(100, Math.max(0, Math.round(newVol)));
    setVolume(safe);
    setYouTubeVolume(safe);
    try {
      localStorage.setItem('surtype_volume', String(safe));
    } catch {}
  };

  const durationRef = useRef(duration);
  durationRef.current = duration;

  // Smooth real-time playback clock that runs in sync with video timing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const max = durationRef.current;
        const next = prev + 0.5;
        if (max > 0 && next >= max) {
          return max;
        }
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Scrub handler
  const handleSeek = (seconds: number) => {
    const safeSec = Math.max(0, Math.min(seconds, duration || 210));
    setCurrentTime(safeSec);
    seekYouTubeVideo(safeSec);
  };

  // Music playback handlers
  const handleTrackSelect = (track: SongTrack, autoPlay = true, mode?: 'audio' | 'video') => {
    historyStackRef.current.push(currentTrack);
    playedIdsRef.current.add(track.id);
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(parseDurationToSeconds(track.duration));
    if (mode) {
      setShowVideo(mode === 'video');
    }
    if (autoPlay) {
      setIsPlaying(true);
      switchYouTubeVideo(track.youtubeId, volume);
    }
  };

  const handleToggleShowVideo = (force?: boolean) => {
    setShowVideo(prev => typeof force === 'boolean' ? force : !prev);
  };

  const handleTogglePlay = () => {
    setIsPlaying(prev => {
      const next = !prev;
      if (next) {
        playYouTubeVideo();
      } else {
        pauseYouTubeVideo();
      }
      return next;
    });
  };

  const getCategoryPool = (category: InstantSwitchCategory) => {
    const all = [...customTracks, ...CURATED_TRACKS];
    if (category === 'hindi') return all.filter(t => t.language === 'hindi');
    if (category === 'bangla') return all.filter(t => t.language === 'bangla');
    if (category === 'english') return all.filter(t => t.language === 'english');
    return all;
  };

  // Non-repeating true random selection to prevent circling the same song!
  const handleNextTrack = () => {
    const pool = getCategoryPool(selectedCategory);
    if (pool.length === 0) return;

    historyStackRef.current.push(currentTrack);

    // Filter to songs that haven't been played in this queue cycle yet
    let unplayed = pool.filter(t => !playedIdsRef.current.has(t.id) && t.id !== currentTrack.id);
    if (unplayed.length === 0) {
      // All tracks have been played! Reset unplayed pool to start a fresh non-repeating cycle
      playedIdsRef.current.clear();
      playedIdsRef.current.add(currentTrack.id);
      unplayed = pool.filter(t => t.id !== currentTrack.id);
    }

    const next = unplayed.length > 0
      ? unplayed[Math.floor(Math.random() * unplayed.length)]
      : pool[0];

    playedIdsRef.current.add(next.id);
    setCurrentTrack(next);
    setCurrentTime(0);
    setDuration(parseDurationToSeconds(next.duration));
    setIsPlaying(true);
    switchYouTubeVideo(next.youtubeId, volume);
  };

  const handlePrevTrack = () => {
    const pool = getCategoryPool(selectedCategory);
    if (pool.length === 0) return;

    let prev = historyStackRef.current.pop();
    if (!prev || prev.id === currentTrack.id) {
      const candidates = pool.filter(t => t.id !== currentTrack.id);
      prev = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : pool[0];
    }

    setCurrentTrack(prev);
    setCurrentTime(0);
    setDuration(parseDurationToSeconds(prev.duration));
    setIsPlaying(true);
    switchYouTubeVideo(prev.youtubeId, volume);
  };

  // Setup Autoplay listener: when current video ends, automatically play next track!
  const handleNextTrackRef = useRef(handleNextTrack);
  handleNextTrackRef.current = handleNextTrack;
  const autoAdvanceRef = useRef(settings.autoAdvanceSongs);
  autoAdvanceRef.current = settings.autoAdvanceSongs;

  useEffect(() => {
    const cleanup = setupYouTubeStateListener(
      () => {
        if (autoAdvanceRef.current) {
          handleNextTrackRef.current();
        }
      },
      (ytCurrentTime, ytDuration) => {
        setCurrentTime(ytCurrentTime);
        if (ytDuration > 0) {
          setDuration(prev => (Math.abs(prev - ytDuration) > 1 ? ytDuration : prev));
        }
      }
    );
    return cleanup;
  }, []);

  const handleToggleAutoAdvance = () => {
    handleUpdateSettings({ autoAdvanceSongs: !settings.autoAdvanceSongs });
  };

  // Instant switch category selection (All, Hindi, Bangla, English, Random)
  const handleSelectCategory = (cat: InstantSwitchCategory) => {
    setSelectedCategory(cat);
    const pool = getCategoryPool(cat);
    if (pool.length === 0) return;

    historyStackRef.current.push(currentTrack);

    // Pick a truly different unplayed track in this category
    let unplayed = pool.filter(t => !playedIdsRef.current.has(t.id) && t.id !== currentTrack.id);
    if (unplayed.length === 0) {
      playedIdsRef.current.clear();
      playedIdsRef.current.add(currentTrack.id);
      unplayed = pool.filter(t => t.id !== currentTrack.id);
    }

    const chosen = unplayed.length > 0
      ? unplayed[Math.floor(Math.random() * unplayed.length)]
      : pool[0];

    playedIdsRef.current.add(chosen.id);
    setCurrentTrack(chosen);
    setCurrentTime(0);
    setDuration(parseDurationToSeconds(chosen.duration));
    setIsPlaying(true);
    switchYouTubeVideo(chosen.youtubeId, volume);
  };

  const handleAddCustomTrack = (track: SongTrack) => {
    setCustomTracks(prev => {
      const updated = [track, ...prev];
      localStorage.setItem('surtype_custom_tracks', JSON.stringify(updated));
      return updated;
    });
  };

  const [authWarning, setAuthWarning] = useState<string | null>(null);

  // Firebase Auth Subscription
  useEffect(() => {
    const unsub = onAuthUserChanged((fbUser) => {
      setUser(fbUser);
    });
    return unsub;
  }, []);

  const handleLoginGoogle = async () => {
    setIsLoggingIn(true);
    setAuthWarning(null);
    try {
      const res = await loginWithGoogle();
      setUser(res.profile);
      if (res.warning) {
        setAuthWarning(res.warning);
      }
    } catch (err: any) {
      console.warn('Google sign-in notice:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginGuest = async () => {
    setIsLoggingIn(true);
    setAuthWarning(null);
    try {
      const profile = await loginAsGuest();
      setUser(profile);
    } catch (err: any) {
      console.warn('Guest sign-in failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  // Typing test completion
  const handleCompleteTest = (result: TypingResult) => {
    const prevBest = personalBestWpm;
    const isPB = result.wpm > prevBest && result.wpm > 0;
    setIsPersonalBest(isPB);
    setActiveResult(result);

    setResults(prev => {
      const updated = [result, ...prev];
      localStorage.setItem('surtype_history', JSON.stringify(updated));
      return updated;
    });

    // Award XP to user
    if (user) {
      const gainedXP = Math.max(25, Math.round(result.wpm * 0.8));
      addXPToUser(user.uid, gainedXP).then(res => {
        setUser(prev => prev ? { ...prev, xp: res.newXP, level: res.newLevel } : null);
      });
    }

    // Auto-progress daily missions
    try {
      const curMissions = loadStoredMissions();
      let changed = false;
      const updatedMissions = curMissions.map(m => {
        if (m.id === 'first_test') {
          m.currentCount = Math.min(m.targetCount, m.currentCount + 1);
          changed = true;
        }
        if (m.id === 'pace_45' && result.wpm >= 45) {
          m.currentCount = 1;
          changed = true;
        }
        if (m.id === 'pace_60' && result.wpm >= 60) {
          m.currentCount = 1;
          changed = true;
        }
        if (m.id === 'accuracy_95' && result.accuracy >= 95) {
          m.currentCount = 1;
          changed = true;
        }
        return m;
      });
      if (changed) saveStoredMissions(updatedMissions);
    } catch {}
  };

  const handleClearHistory = () => {
    setResults([]);
    localStorage.removeItem('surtype_history');
  };

  // Starting a test must NEVER interrupt already playing music!
  const handleFirstKeyStroke = () => {
    if (isPlaying) {
      return; // Already playing smoothly, do nothing!
    }

    if (settings.autoPlayMusicOnType) {
      setIsPlaying(true);
      playYouTubeVideo();
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 
        SINGLE UNIFIED PERSISTENT YOUTUBE PLAYER:
        Only ONE iframe exists in the entire application.
        - When showVideo is false: sits off-screen playing background audio seamlessly.
        - When showVideo is true: renders as a sleek floating Picture-in-Picture window.
        - NEVER remounts, so switching modes, pages, or restarting races never creates a second audio or resets playback!
      */}
      <div 
        className={
          showVideo 
            ? "fixed bottom-5 right-5 z-40 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-slate-950 backdrop-blur-md transition-all duration-300"
            : "fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none"
        }
      >
        {showVideo && (
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate" title={currentTrack.title}>
                {currentTrack.title}
              </span>
            </div>
            <button
              onClick={() => setShowVideo(false)}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer shrink-0 ml-2"
              title="Switch to Audio Only"
            >
              Audio Only
            </button>
          </div>
        )}

        <div className={showVideo ? "relative aspect-video w-full bg-black" : "w-1 h-1"}>
          <iframe
            id="persistent-youtube-player"
            src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&origin=${encodeURIComponent(origin)}`}
            title={currentTrack.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => {
              setYouTubeVolume(volume);
            }}
          />
        </div>
      </div>

      {/* 1. Mini Song Control Panel Above Page */}
      <MiniSongBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        onTogglePlay={handleTogglePlay}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        showVideo={showVideo}
        onToggleShowVideo={handleToggleShowVideo}
        onOpenFullMusicPage={() => setActiveTab('music')}
        autoAdvance={settings.autoAdvanceSongs}
        onToggleAutoAdvance={handleToggleAutoAdvance}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      />

      {/* 2. Top Navigation Bar */}
      {!focusMode && (
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          onLoginGoogle={handleLoginGoogle}
          onLoginGuest={handleLoginGuest}
          onLogout={handleLogout}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode(prev => !prev)}
          personalBestWpm={personalBestWpm}
          isLoggingIn={isLoggingIn}
        />
      )}

      {/* Auth Guidance Notice */}
      {authWarning && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-amber-400 shrink-0">ℹ Note:</span>
            <span className="truncate">{authWarning}</span>
          </div>
          <button 
            onClick={() => setAuthWarning(null)} 
            className="text-amber-400 hover:text-white font-bold ml-3 px-2 py-0.5 rounded hover:bg-amber-500/20 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col ${focusMode ? 'p-4 md:p-8 justify-center' : 'p-4 md:p-8 max-w-6xl w-full mx-auto'}`}>
        
        {/* Practice View: Practice tab is kept mounted offscreen when viewing other tabs so audio is NEVER interrupted */}
        <div className={activeTab === 'practice' ? 'block' : 'fixed -left-[99999px] top-0 opacity-0 pointer-events-none'}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Main Typing Engine (30s / 1m standard test) */}
            <div className={focusMode ? 'lg:col-span-4' : 'lg:col-span-3'}>
              <TypingEngine
                key={practiceKey}
                testKey={practiceKey}
                onCompleteTest={handleCompleteTest}
                onFirstKeyStroke={handleFirstKeyStroke}
                currentSongTitle={`${currentTrack.title} · ${currentTrack.artist}`}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode(prev => !prev)}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            </div>

            {/* Quick Song Controls Beside Typing Area */}
            {!focusMode && (
              <div className="lg:col-span-1">
                <TypingMusicDock
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={handleSeek}
                  onTogglePlay={handleTogglePlay}
                  onNextTrack={handleNextTrack}
                  onPrevTrack={handlePrevTrack}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  showVideo={showVideo}
                  onToggleShowVideo={handleToggleShowVideo}
                  autoAdvance={settings.autoAdvanceSongs}
                  onToggleAutoAdvance={handleToggleAutoAdvance}
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Multiplayer Rooms (Firestore-backed 4-Digit Codes) */}
        {activeTab === 'multiplayer' && (
          <MultiplayerLounge
            user={user}
            onRequireLogin={handleLoginGoogle}
            currentTrack={currentTrack}
            onTrackSelect={(track) => handleTrackSelect(track, true)}
            onPlaySong={() => {
              setIsPlaying(true);
              playYouTubeVideo();
            }}
          />
        )}

        {/* Levels & Missions Progression View */}
        {activeTab === 'missions' && (
          <MissionsLounge
            user={user}
            onRequireLogin={handleLoginGoogle}
            onSelectPractice={() => setActiveTab('practice')}
            onSelectMultiplayer={() => setActiveTab('multiplayer')}
            onUpdateUserXP={(newXP, newLevel) => {
              setUser(prev => prev ? { ...prev, xp: newXP, level: newLevel } : null);
            }}
          />
        )}

        {/* Dedicated Full Page for Song Control & YouTube Search Feed */}
        {activeTab === 'music' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Full Song Control & YouTube Lounge</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search any song, stream the video or audio, and queue up Hindi, Bangla, or English hits.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('practice')}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                ← Back to Typing Practice
              </button>
            </div>

            <YouTubeMusicLounge
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              onTrackSelect={handleTrackSelect}
              onTogglePlay={handleTogglePlay}
              onNextTrack={handleNextTrack}
              onPrevTrack={handlePrevTrack}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              customTracks={customTracks}
              onAddCustomTrack={handleAddCustomTrack}
              showVideo={showVideo}
              onToggleShowVideo={handleToggleShowVideo}
              focusMode={false}
              autoAdvance={settings.autoAdvanceSongs}
              onToggleAutoAdvance={handleToggleAutoAdvance}
              volume={volume}
              onVolumeChange={handleVolumeChange}
            />

            <div className="text-center pt-4">
              <button
                onClick={() => setActiveTab('practice')}
                className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Start Typing With This Song
              </button>
            </div>
          </div>
        )}

        {/* History View */}
        {activeTab === 'history' && (
          <HistoryStats
            results={results}
            onClearHistory={handleClearHistory}
            onSelectPractice={() => setActiveTab('practice')}
          />
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onSelectPractice={() => setActiveTab('practice')}
          />
        )}
      </main>


      {/* Completion Modal */}
      {activeResult && (
        <TestResultsModal
          result={activeResult}
          isPersonalBest={isPersonalBest}
          onRestart={() => {
            setActiveResult(null);
            setActiveTab('practice');
            setPracticeKey(prev => prev + 1); // Fresh new practice window without interrupting song!
          }}
          onClose={() => {
            setActiveResult(null);
            setPracticeKey(prev => prev + 1);
          }}
        />
      )}

      {/* Footer */}
      {!focusMode && (
        <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-400">
          <p>
            SurType · 30-Second & 1-Minute English typing practice with uninterrupted Hindi, Bangla & English music.
          </p>
        </footer>
      )}
    </div>
  );
}
