export type TypingMode = 'time' | 'words' | 'quote' | 'custom';

export type TimeDuration = 15 | 30 | 60 | 120;
export type WordCountGoal = 25 | 50 | 100;
export type QuoteLength = 'short' | 'medium' | 'long';
export type SoundTheme = 'mechanical' | 'creamy' | 'bubble' | 'typewriter' | 'off';
export type TargetWpmGoal = 0 | 40 | 50 | 60 | 80;
export type NavigationTab = 'practice' | 'music' | 'multiplayer' | 'missions' | 'history' | 'settings';

export interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  viewCount?: string;
  publishedTime?: string;
}

export interface TypingStatsSnapshot {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
}

export interface TypingResult {
  id: string;
  timestamp: number;
  wpm: number;
  rawWpm: number;
  cpm: number;
  accuracy: number;
  mode: TypingMode;
  modeParam: number | string; // e.g. 60 (seconds), 50 (words), 'medium' (quote)
  elapsedSeconds: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  soundTheme: SoundTheme;
  songListened?: string;
  timeline: TypingStatsSnapshot[];
  targetGoal?: TargetWpmGoal;
  benchmarkPassed?: '40 WPM (Average)' | '50 WPM (Fluent)' | '60 WPM (Pro)' | '80+ WPM (Master)' | 'Under 40 WPM';
}

export interface SongTrack {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  category: 'favorite' | 'coke_studio' | 'lofi' | 'acoustic' | 'upbeat';
  language?: 'hindi' | 'bangla' | 'english';
  duration?: string;
  tag: string;
  highlightNote?: string;
  thumbnail?: string;
}

export type InstantSwitchCategory = 'all' | 'hindi' | 'bangla' | 'english' | 'random';

export interface TypingSettings {
  soundTheme: SoundTheme;
  soundVolume: number; // 0 to 1
  musicVolume?: number; // 0 to 100
  autoPlayMusicOnType: boolean;
  autoAdvanceSongs: boolean; // When one song finishes, auto-play the next song automatically
  autoShuffleOnNewTest: boolean; // Shuffle song on new test if not already playing
  caretStyle: 'line' | 'block' | 'underline';
  smoothCaret: boolean;
  confidenceMode: boolean; // Cannot backspace if true
  quickRestartKey: boolean; // Tab to restart
  fontSize: 'sm' | 'md' | 'lg';
  targetWpmGoal: TargetWpmGoal;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string | null;
  photoURL?: string | null;
  isAnonymous: boolean;
  xp: number;
  level: number;
}

export interface RoomPlayer {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  isHost: boolean;
  progress: number; // 0 to 100
  wpm: number;
  accuracy: number;
  finished: boolean;
  finishTime?: number;
  lastActive: number;
}

export interface MultiplayerRoom {
  id: string; // 4-digit code e.g. "4343"
  hostUid: string;
  hostName: string;
  status: 'waiting' | 'countdown' | 'in_progress' | 'finished';
  currentTrack: SongTrack;
  passageText: string;
  passageTitle: string;
  duration: 30 | 60;
  countdownStart?: number;
  raceStartTime?: number;
  createdAt: number;
  players: Record<string, RoomPlayer>;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  xpReward: number;
  icon: 'zap' | 'flame' | 'music' | 'target' | 'trophy' | 'users';
}
