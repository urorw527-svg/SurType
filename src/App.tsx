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
import { TypingEngine } from './components/TypingEngine';
import { TestResultsModal } from './components/TestResultsModal';
import { HistoryStats } from './components/HistoryStats';
import { SettingsView } from './components/SettingsView';
import { LoginPage } from './components/LoginPage';
import { SongTrack, TypingResult, TypingSettings, InstantSwitchCategory } from './types';
import { CURATED_TRACKS } from './data/musicTracks';
import { 
  playYouTubeVideo, 
  pauseYouTubeVideo, 
  switchYouTubeVideo, 
  setupYouTubeStateListener,
  setYouTubeVolume 
} from './utils/youtubePlayer';

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
  const [activeTab, setActiveTab] = useState<'practice' | 'music' | 'history' | 'settings' | 'login'>('practice');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [practiceKey, setPracticeKey] = useState<number>(0);

  // Music state - selects a fresh different song on every page refresh!
  const [currentTrack, setCurrentTrack] = useState<SongTrack>(() => pickInitialTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
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

  // Music playback handlers
  const handleTrackSelect = (track: SongTrack, autoPlay = true, mode?: 'audio' | 'video') => {
    setCurrentTrack(track);
    if (mode) {
      setShowVideo(mode === 'video');
    }
    if (autoPlay) {
      setIsPlaying(true);
      switchYouTubeVideo(track.youtubeId);
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

  const handleNextTrack = () => {
    const pool = getCategoryPool(selectedCategory);
    if (pool.length === 0) return;
    const currentIndex = pool.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % pool.length;
    const next = pool[nextIndex];
    setCurrentTrack(next);
    setIsPlaying(true);
    switchYouTubeVideo(next.youtubeId);
  };

  const handlePrevTrack = () => {
    const pool = getCategoryPool(selectedCategory);
    if (pool.length === 0) return;
    const currentIndex = pool.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + pool.length) % pool.length;
    const prev = pool[prevIndex];
    setCurrentTrack(prev);
    setIsPlaying(true);
    switchYouTubeVideo(prev.youtubeId);
  };

  // Setup Autoplay listener: when current video ends, automatically play next track!
  const handleNextTrackRef = useRef(handleNextTrack);
  handleNextTrackRef.current = handleNextTrack;
  const autoAdvanceRef = useRef(settings.autoAdvanceSongs);
  autoAdvanceRef.current = settings.autoAdvanceSongs;

  useEffect(() => {
    const cleanup = setupYouTubeStateListener(() => {
      if (autoAdvanceRef.current) {
        handleNextTrackRef.current();
      }
    });
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

    // Pick a different track in this category
    const candidates = pool.filter(t => t.id !== currentTrack.id);
    const chosen = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : pool[0];

    setCurrentTrack(chosen);
    setIsPlaying(true);
    switchYouTubeVideo(chosen.youtubeId);
  };

  const handleAddCustomTrack = (track: SongTrack) => {
    setCustomTracks(prev => {
      const updated = [track, ...prev];
      localStorage.setItem('surtype_custom_tracks', JSON.stringify(updated));
      return updated;
    });
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
          />
        </div>
      </div>

      {/* 1. Mini Song Control Panel Above Page */}
      <MiniSongBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
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
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode(prev => !prev)}
          personalBestWpm={personalBestWpm}
        />
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

        {/* Login Page View */}
        {activeTab === 'login' && (
          <LoginPage onReturnToPractice={() => setActiveTab('practice')} />
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
