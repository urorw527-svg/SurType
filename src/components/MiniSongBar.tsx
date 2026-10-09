import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Headphones, 
  Tv, 
  Search, 
  Music, 
  RefreshCw,
  Volume2,
  Volume1,
  VolumeX,
  Sliders
} from 'lucide-react';
import { SongTrack } from '../types';
import { seekYouTubeVideo } from '../utils/youtubePlayer';

interface MiniSongBarProps {
  currentTrack: SongTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  showVideo: boolean;
  onToggleShowVideo: (force?: boolean) => void;
  onOpenFullMusicPage: () => void;
  autoAdvance?: boolean;
  onToggleAutoAdvance?: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const MiniSongBar: React.FC<MiniSongBarProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  showVideo,
  onToggleShowVideo,
  onOpenFullMusicPage,
  autoAdvance = true,
  onToggleAutoAdvance,
  volume,
  onVolumeChange,
}) => {
  const [seekPercent, setSeekPercent] = useState<number>(0);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSeekPercent(val);
    seekYouTubeVideo((val / 100) * 210);
  };

  return (
    <div className="w-full bg-slate-950/95 border-b border-slate-800/80 px-4 py-2 sticky top-0 z-50 backdrop-blur-md shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
        
        {/* Left: Now Playing Song Tag & Title */}
        <div className="flex items-center gap-2.5 min-w-0 max-w-[30%] sm:max-w-[35%]">
          <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 overflow-hidden relative">
            {currentTrack.thumbnail ? (
              <img 
                src={currentTrack.thumbnail} 
                alt="" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <Music className="w-3.5 h-3.5 text-amber-400" />
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                <span className="w-0.5 bg-amber-400 rounded-full animate-eq-1 h-3" />
                <span className="w-0.5 bg-amber-400 rounded-full animate-eq-2 h-4" />
                <span className="w-0.5 bg-amber-400 rounded-full animate-eq-3 h-2" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] text-amber-400 font-semibold tracking-wide uppercase">
                {isPlaying ? 'Playing' : 'Paused'}
              </span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-[10px] text-slate-400 truncate hidden sm:inline">{currentTrack.artist}</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-100 truncate mt-0.5" title={currentTrack.title}>
              {currentTrack.title}
            </h4>
          </div>
        </div>

        {/* Center: Mini Playback Controls with Video Seek Slide Bar */}
        <div className="flex items-center justify-center gap-2 shrink-0">
          <button
            onClick={onPrevTrack}
            aria-label="Previous Song"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Previous song"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause song' : 'Play song'}
            className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-slate-950" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />
            )}
          </button>

          {/* Video Seek Slide Bar */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Sliders className="w-3 h-3 text-amber-400 shrink-0" />
            <div className="relative flex items-center w-28 md:w-36">
              <input
                type="range"
                min="0"
                max="100"
                value={seekPercent}
                onChange={handleSeekChange}
                aria-label="Video timeline seek slider"
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition-all"
                title="Drag to scrub through video timeline"
              />
            </div>
            <span className="text-[10px] font-mono font-semibold text-amber-400 w-8 text-right shrink-0">
              {seekPercent}%
            </span>
          </div>

          <button
            onClick={onNextTrack}
            aria-label="Next Song"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Next song"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Autoplay Next Song Toggle Button */}
          {onToggleAutoAdvance && (
            <button
              onClick={onToggleAutoAdvance}
              className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer border ${
                autoAdvance
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={autoAdvance ? 'Autoplay: ON (next song plays automatically)' : 'Autoplay: OFF'}
            >
              <RefreshCw className={`w-2.5 h-2.5 ${autoAdvance ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Auto</span>
            </button>
          )}
        </div>

        {/* Right: Side-Upward Volume Control, Audio/Video Mode & Full Music Page Link */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Side-upward Volume Control */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
            <button
              onClick={() => onVolumeChange(volume === 0 ? 70 : 0)}
              className="text-slate-400 hover:text-amber-400 cursor-pointer"
              title={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? (
                <VolumeX className="w-3 h-3 text-rose-400" />
              ) : volume < 50 ? (
                <Volume1 className="w-3 h-3 text-amber-400" />
              ) : (
                <Volume2 className="w-3 h-3 text-amber-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume slider"
              className="w-14 sm:w-16 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[10px] font-mono text-amber-400 w-6 text-right">
              {volume}%
            </span>
          </div>

          {/* Audio vs Video Quick Toggle */}
          <button
            onClick={() => onToggleShowVideo(!showVideo)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              showVideo 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={showVideo ? 'Video window open (click for Audio only)' : 'Audio only active (click to show Video)'}
          >
            {showVideo ? (
              <>
                <Tv className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Video Mode</span>
              </>
            ) : (
              <>
                <Headphones className="w-3 h-3" />
                <span className="hidden sm:inline">Audio Mode</span>
              </>
            )}
          </button>

          {/* Full Music Control Page Button */}
          <button
            onClick={onOpenFullMusicPage}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
            title="Open Full Music Hub & Search YouTube Feed"
          >
            <Search className="w-3 h-3 text-amber-400" />
            <span>Search YT Songs</span>
          </button>
        </div>

      </div>
    </div>
  );
};
