import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Radio, 
  Tv,
  Headphones,
  Music,
  RefreshCw,
  Volume2,
  Volume1,
  VolumeX,
  Sliders,
  Globe,
  Disc3
} from 'lucide-react';
import { SongTrack, InstantSwitchCategory } from '../types';
import { seekYouTubeVideo } from '../utils/youtubePlayer';

interface TypingMusicDockProps {
  currentTrack: SongTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  selectedCategory: InstantSwitchCategory;
  onSelectCategory: (category: InstantSwitchCategory) => void;
  showVideo: boolean;
  onToggleShowVideo: (force?: boolean) => void;
  autoAdvance?: boolean;
  onToggleAutoAdvance?: () => void;
  volume: number; // 0 to 100
  onVolumeChange: (vol: number) => void;
}

export const TypingMusicDock: React.FC<TypingMusicDockProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  selectedCategory,
  onSelectCategory,
  showVideo,
  onToggleShowVideo,
  autoAdvance = true,
  onToggleAutoAdvance,
  volume,
  onVolumeChange,
}) => {
  const [seekPercent, setSeekPercent] = useState<number>(0);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSeekPercent(val);
    // Standard song duration assumed 210s (3.5 mins) for scrubbing
    seekYouTubeVideo((val / 100) * 210);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col">
      
      {/* Dock Header with Side-Upward Volume Control */}
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="flex items-center gap-1.5 font-bold text-amber-400">
          <Radio className="w-3.5 h-3.5" />
          <span>Music Player</span>
        </span>

        <div className="flex items-center gap-2">
          {/* Side-upward Volume Control */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-lg">
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
              className="w-14 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Autoplay button */}
          {onToggleAutoAdvance && (
            <button
              onClick={onToggleAutoAdvance}
              className={`p-1 px-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 border ${
                autoAdvance
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
              title={autoAdvance ? 'Autoplay: ON (next song will play automatically)' : 'Autoplay: OFF'}
            >
              <RefreshCw className={`w-2.5 h-2.5 ${autoAdvance ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Auto</span>
            </button>
          )}

          {/* Collapse / Expand Video Preview */}
          <button
            onClick={() => onToggleShowVideo(!showVideo)}
            className={`p-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              showVideo ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40' : 'text-slate-400 bg-slate-800 hover:text-slate-200'
            }`}
            title={showVideo ? 'Switch to Audio only' : 'Watch full video window'}
          >
            {showVideo ? (
              <>
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">Video</span>
              </>
            ) : (
              <>
                <Headphones className="w-3.5 h-3.5" />
                <span className="text-[10px]">Audio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Mode Notice or Audio Streaming Banner */}
      {showVideo ? (
        <div className="relative h-24 w-full rounded-xl overflow-hidden bg-slate-950 border border-amber-500/40 mb-3 flex flex-col justify-end p-2.5 shadow-lg group">
          {currentTrack.thumbnail && (
            <img 
              src={currentTrack.thumbnail} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 transition-opacity" 
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Video Mode Active</span>
            </span>
            <button
              onClick={() => onToggleShowVideo(false)}
              className="text-[10px] bg-slate-900/90 hover:bg-slate-850 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 cursor-pointer"
            >
              Audio Only
            </button>
          </div>
        </div>
      ) : (
        <div className="relative h-20 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-3 flex items-center p-3 gap-3 shadow-inner">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-800 flex items-center justify-center">
            {currentTrack.thumbnail ? (
              <img 
                src={currentTrack.thumbnail} 
                alt="" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <Music className="w-6 h-6 text-amber-400" />
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-0.5">
                <span className="w-0.5 bg-amber-400 rounded-full animate-eq-1 h-4" />
                <span className="w-0.5 bg-amber-400 rounded-full animate-eq-2 h-5" />
                <span className="w-0.5 bg-amber-400 rounded-full animate-eq-3 h-3" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide">
              {isPlaying ? 'Audio Streaming' : 'Audio Paused'}
            </span>
            <h5 className="text-xs font-semibold text-slate-100 truncate" title={currentTrack.title}>{currentTrack.title}</h5>
            <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>
      )}

      {/* Now Playing Title & Artist */}
      <div className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-xl mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-amber-400 font-semibold tracking-wide uppercase">
              {currentTrack.tag || (currentTrack.language ? `${currentTrack.language.toUpperCase()} Track` : 'Now Playing')}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-100 truncate mt-0.5" title={currentTrack.title}>
            {currentTrack.title}
          </h4>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Primary Play/Pause Button */}
      <button
        onClick={onTogglePlay}
        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mb-2.5 ${
          isPlaying
            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-4 h-4 fill-slate-950" />
            <span>Pause Music</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <span>Play Music</span>
          </>
        )}
      </button>

      {/* Prev / Video Seek Slide Bar / Next */}
      <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800/90 p-2.5 rounded-xl mb-4 shadow-inner">
        <button
          onClick={onPrevTrack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Previous Song"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Video seek slide bar to go to video middle or wherever you want */}
        <div className="flex-1 flex flex-col gap-1 min-w-0 px-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Sliders className="w-3 h-3" />
              <span>Video Scrub</span>
            </span>
            <span>{seekPercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={seekPercent}
            onChange={handleSeekChange}
            aria-label="Video seek slider"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
            title="Drag to go to video middle or wherever you want"
          />
        </div>

        <button
          onClick={onNextTrack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Next Song"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Instant Song Switchers: All, Hindi, Bangla, English, Random */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2">
          <span>Click to Play Songs:</span>
          <span className="text-[10px] text-amber-400 font-medium">Instant Switch</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* All Button */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`col-span-2 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-amber-500/25 border-amber-500/70 text-amber-300 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
            title="Play hits across all categories"
          >
            <Disc3 className="w-3.5 h-3.5 text-amber-400" />
            <span>All Tracks</span>
            {selectedCategory === 'all' && (
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono ml-auto">
                Selected
              </span>
            )}
          </button>

          {/* Hindi */}
          <button
            onClick={() => onSelectCategory('hindi')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              selectedCategory === 'hindi'
                ? 'bg-amber-500/25 border-amber-500/70 text-amber-300 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
            title="Switch to Hindi Hits (Jhol, Pal Pal, etc.)"
          >
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">HI</span>
            <span>Hindi</span>
          </button>

          {/* Bangla */}
          <button
            onClick={() => onSelectCategory('bangla')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              selectedCategory === 'bangla'
                ? 'bg-amber-500/25 border-amber-500/70 text-amber-300 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
            title="Switch to Bangla Hits (Deora, Shada Shada Kala Kala, etc.)"
          >
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">BN</span>
            <span>Bangla</span>
          </button>

          {/* English */}
          <button
            onClick={() => onSelectCategory('english')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              selectedCategory === 'english'
                ? 'bg-amber-500/25 border-amber-500/70 text-amber-300 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
            title="Switch to English Hits (Lofi Girl, Golden Hour, etc.)"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>English</span>
          </button>

          {/* Random */}
          <button
            onClick={() => onSelectCategory('random')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              selectedCategory === 'random'
                ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-500/80 text-amber-300 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
            title="Pick a random surprise song"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Random</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 mt-2.5 text-center">
          Click any button to switch songs immediately. Music plays uninterrupted during your typing test.
        </p>
      </div>

    </div>
  );
};
