import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Tv, 
  Headphones, 
  Search, 
  ExternalLink, 
  Music, 
  Loader2, 
  Sparkles, 
  Shuffle, 
  Radio, 
  RefreshCw, 
  Volume2, 
  Volume1, 
  VolumeX, 
  Sliders, 
  X, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { SongTrack, YouTubeSearchResult, InstantSwitchCategory } from '../types';
import { CURATED_TRACKS, extractYouTubeId } from '../data/musicTracks';
import { seekYouTubeVideo } from '../utils/youtubePlayer';
import { searchTracks, getDirectYouTubeSearchUrl } from '../utils/musicSearch';

interface YouTubeMusicLoungeProps {
  currentTrack: SongTrack;
  isPlaying: boolean;
  onTrackSelect: (track: SongTrack, autoPlay?: boolean, mode?: 'audio' | 'video') => void;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  selectedCategory: InstantSwitchCategory;
  onSelectCategory: (category: InstantSwitchCategory) => void;
  customTracks: SongTrack[];
  onAddCustomTrack: (track: SongTrack) => void;
  showVideo: boolean;
  onToggleShowVideo: (force?: boolean) => void;
  focusMode: boolean;
  autoAdvance?: boolean;
  onToggleAutoAdvance?: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

const RANDOM_QUERY_TOPICS = [
  'Coke Studio Pakistan Jhol Maanu',
  'Coke Studio Bangla Deora Shada Shada Kala Kala',
  'Arijit Singh Pal Pal Dil Ke Paas Acoustic',
  'Lofi Girl Chillhop Beats English',
  'Anuv Jain Husn Hindi indie',
  'Golden Hour JVKE acoustic english',
  'Bollywood Lo-Fi chill songs mix',
  'Pritom Hasan Coke Studio Bangla hits',
  'Sunflower Post Malone chill hits',
  'Pasoori Ali Sethi Shae Gill'
];

const TRENDING_SEARCH_TAGS = [
  { label: '🔥 Jhol · Coke Studio', query: 'Jhol Maanu Coke Studio' },
  { label: '✨ Pal Pal Dil Ke Paas', query: 'Pal Pal Dil Ke Paas' },
  { label: '🇧🇩 Deora · CS Bangla', query: 'Deora Coke Studio Bangla' },
  { label: '🎵 Husn · Anuv Jain', query: 'Husn Anuv Jain' },
  { label: '🎧 Lofi Girl Beats', query: 'Lofi Girl Chillhop' },
  { label: '🌟 Sunflower', query: 'Sunflower Post Malone' },
  { label: '⚡ Kesariya', query: 'Kesariya Arijit Singh' },
  { label: '🎼 Pasoori', query: 'Pasoori Coke Studio' },
];

export const YouTubeMusicLounge: React.FC<YouTubeMusicLoungeProps> = ({
  currentTrack,
  isPlaying,
  onTrackSelect,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  selectedCategory,
  onSelectCategory,
  customTracks,
  onAddCustomTrack,
  showVideo,
  onToggleShowVideo,
  focusMode,
  autoAdvance = true,
  onToggleAutoAdvance,
  volume,
  onVolumeChange,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'hindi' | 'bangla' | 'english'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [seekPercent, setSeekPercent] = useState<number>(0);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSeekPercent(val);
    seekYouTubeVideo((val / 100) * 210);
  };

  // On initial mount, load a rich randomized feed
  useEffect(() => {
    loadRandomFeed();
  }, []);

  const loadRandomFeed = async () => {
    setIsSearching(true);
    setSearchError(null);
    setActiveSearchTerm(null);
    try {
      const randomTopic = RANDOM_QUERY_TOPICS[Math.floor(Math.random() * RANDOM_QUERY_TOPICS.length)];
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(randomTopic)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
          setIsSearching(false);
          return;
        }
      }
      fallbackToCurated();
    } catch {
      fallbackToCurated();
    } finally {
      setIsSearching(false);
    }
  };

  const loadCategoryFeed = async (category: 'hindi' | 'bangla' | 'english') => {
    setActiveCategory(category);
    setActiveSearchTerm(null);
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/youtube/search?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
          setIsSearching(false);
          return;
        }
      }
      // Filter curated catalog by category
      const filtered = CURATED_TRACKS.filter(t => t.language === category);
      setSearchResults(filtered.map(t => ({
        id: t.youtubeId,
        title: t.title,
        channel: t.artist,
        duration: t.duration || 'Music',
        thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`,
      })));
    } catch {
      const filtered = CURATED_TRACKS.filter(t => t.language === category);
      setSearchResults(filtered.map(t => ({
        id: t.youtubeId,
        title: t.title,
        channel: t.artist,
        duration: t.duration || 'Music',
        thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`,
      })));
    } finally {
      setIsSearching(false);
    }
  };

  const fallbackToCurated = () => {
    const shuffled = [...CURATED_TRACKS].sort(() => Math.random() - 0.5);
    setSearchResults(shuffled.map(t => ({
      id: t.youtubeId,
      title: t.title,
      channel: t.artist,
      duration: t.duration || 'Music',
      thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`,
      viewCount: t.tag
    })));
  };

  // Execute Search: uses robust search utility
  const executeSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) {
      loadRandomFeed();
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setActiveSearchTerm(q);

    // Check if it's a direct YouTube URL or 11-char ID
    const directId = extractYouTubeId(q);
    if (directId && directId.length === 11) {
      const directTrack: SongTrack = {
        id: `direct-${directId}`,
        youtubeId: directId,
        title: `YouTube Video (${directId})`,
        artist: 'Custom Video Link',
        category: 'favorite',
        duration: 'Direct Stream',
        tag: 'Direct Link',
        thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`
      };
      onAddCustomTrack(directTrack);
      onTrackSelect(directTrack, true, 'video');
      setSearchResults([{
        id: directId,
        title: directTrack.title,
        channel: directTrack.artist,
        duration: 'Direct Stream',
        thumbnail: directTrack.thumbnail!,
        viewCount: 'Direct Link'
      }]);
      setIsSearching(false);
      return;
    }

    try {
      const searchRes = await searchTracks(q, customTracks);
      setSearchResults(searchRes.results);
      if (searchRes.results.length === 0) {
        setSearchError(`No tracks found matching "${q}" in catalog.`);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchError('Live search request was blocked or timed out.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleResetFeed = () => {
    setSearchQuery('');
    setActiveSearchTerm(null);
    setSearchError(null);
    loadRandomFeed();
  };

  const handleCategoryButtonClick = (cat: InstantSwitchCategory) => {
    onSelectCategory(cat);
    if (cat === 'random' || cat === 'all') {
      setActiveCategory('all');
      loadRandomFeed();
    } else {
      loadCategoryFeed(cat);
    }
  };

  const handleSelectSearchResult = (item: YouTubeSearchResult, mode: 'audio' | 'video') => {
    const track: SongTrack = {
      id: `yt-${item.id}`,
      youtubeId: item.id,
      title: item.title,
      artist: item.channel,
      category: 'favorite',
      duration: item.duration || 'YouTube',
      tag: 'YouTube Feed',
      thumbnail: item.thumbnail,
      highlightNote: item.viewCount ? `${item.viewCount} · YouTube` : undefined,
    };

    onAddCustomTrack(track);
    onToggleShowVideo(mode === 'video');
    onTrackSelect(track, true, mode);
  };

  // Direct ID detected from current search input
  const detectedDirectId = extractYouTubeId(searchQuery);

  return (
    <div className={`space-y-6 transition-all duration-300 ${focusMode ? 'opacity-85 hover:opacity-100' : ''}`}>
      
      {/* Player Header Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Currently Playing Track Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {currentTrack.thumbnail ? (
                <img 
                  src={currentTrack.thumbnail} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Music className="w-6 h-6 text-amber-400" />
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                  <span className="w-0.5 bg-amber-400 rounded-full animate-eq-1 h-3" />
                  <span className="w-0.5 bg-amber-400 rounded-full animate-eq-2 h-5" />
                  <span className="w-0.5 bg-amber-400 rounded-full animate-eq-3 h-2" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-400 tracking-wide flex items-center gap-1">
                  <Radio className="w-3 h-3 text-amber-400" />
                  {isPlaying ? 'Now Playing' : 'Paused'}
                </span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-xs text-slate-400 truncate">
                  {showVideo ? 'Video Mode' : 'Audio Mode'}
                </span>
                {currentTrack.language && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] uppercase font-bold tracking-wider">
                    {currentTrack.language}
                  </span>
                )}
              </div>
              <h3 className="text-sm md:text-base font-semibold text-slate-100 truncate mt-0.5" title={currentTrack.title}>
                {currentTrack.title}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {currentTrack.artist} {currentTrack.duration ? `· ${currentTrack.duration}` : ''}
              </p>
            </div>
          </div>

          {/* Central Controls: Prev, Play/Pause, Video Scrub Slide Bar, Next & Autoplay */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            <button
              onClick={onPrevTrack}
              aria-label="Previous Track"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-800"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause song' : 'Play song'}
              className="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-slate-950" />
              ) : (
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              )}
            </button>

            {/* Video seek slide bar between Prev and Next buttons */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/90 px-3 py-1.5 rounded-xl min-w-[180px] sm:min-w-[220px]">
              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 shrink-0 font-mono">
                <Sliders className="w-3 h-3" />
                <span>Scrub:</span>
              </span>
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
              <span className="text-[10px] font-mono font-semibold text-amber-400 w-8 text-right shrink-0">
                {seekPercent}%
              </span>
            </div>

            <button
              onClick={onNextTrack}
              aria-label="Next Track"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-800"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {onToggleAutoAdvance && (
              <button
                onClick={onToggleAutoAdvance}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                  autoAdvance
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
                title={autoAdvance ? 'Autoplay: ON (next song plays automatically)' : 'Autoplay: OFF'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoAdvance ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Autoplay: {autoAdvance ? 'ON' : 'OFF'}</span>
              </button>
            )}
          </div>

          {/* View Toggles, Side-upward Volume & External Link */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0 flex-wrap">
            {/* Side-upward Volume Control */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg">
              <button 
                onClick={() => onVolumeChange(volume === 0 ? 70 : 0)} 
                className="text-slate-400 hover:text-amber-400 cursor-pointer"
                title={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : volume < 50 ? (
                  <Volume1 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                aria-label="Volume slider"
                className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] font-mono font-semibold text-amber-400 w-7 text-right">
                {volume}%
              </span>
            </div>

            <button
              onClick={() => onToggleShowVideo(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                !showVideo
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
              }`}
              title="Play as background audio"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Audio Only</span>
            </button>

            <button
              onClick={() => onToggleShowVideo(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                showVideo
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
              }`}
              title="Watch full YouTube video window"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Watch Video</span>
            </button>

            <a
              href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open on YouTube"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              title="Open video on YouTube.com"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Video Mode Preview Notice */}
        {showVideo && (
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-amber-300/90 font-medium">
              📺 Video Mode Active — Video is currently streaming in sync with the audio player above.
            </p>
          </div>
        )}
      </div>

      {/* Language Quick Switchers & Instant Play Buttons */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Play By Language & Instant Switch</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any button to immediately play a song and load its YouTube feed:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* All Songs Button */}
          <button
            onClick={() => handleCategoryButtonClick('all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              selectedCategory === 'all'
                ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <span className="text-xl">🎶</span>
            <div className="min-w-0">
              <div className="text-xs font-bold">All Hits</div>
              <div className="text-[10px] text-slate-400 truncate">All songs & languages</div>
            </div>
          </button>

          {/* Hindi Button */}
          <button
            onClick={() => handleCategoryButtonClick('hindi')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              selectedCategory === 'hindi'
                ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <span className="text-xl">🇮🇳</span>
            <div className="min-w-0">
              <div className="text-xs font-bold">Hindi Songs</div>
              <div className="text-[10px] text-slate-400 truncate">Jhol, Pal Pal, Husn</div>
            </div>
          </button>

          {/* Bangla Button */}
          <button
            onClick={() => handleCategoryButtonClick('bangla')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              selectedCategory === 'bangla'
                ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <span className="text-xl">🇧🇩</span>
            <div className="min-w-0">
              <div className="text-xs font-bold">Bangla Songs</div>
              <div className="text-[10px] text-slate-400 truncate">Deora, Shada Shada</div>
            </div>
          </button>

          {/* English Button */}
          <button
            onClick={() => handleCategoryButtonClick('english')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              selectedCategory === 'english'
                ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <span className="text-xl">🌐</span>
            <div className="min-w-0">
              <div className="text-xs font-bold">English Lo-Fi</div>
              <div className="text-[10px] text-slate-400 truncate">Lofi Girl, JVKE</div>
            </div>
          </button>

          {/* Random Button */}
          <button
            onClick={() => handleCategoryButtonClick('random')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              selectedCategory === 'random'
                ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-500/80 text-amber-200 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <Shuffle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-300">Surprise Mix</div>
              <div className="text-[10px] text-slate-400 truncate">Random surprise track</div>
            </div>
          </button>
        </div>
      </div>

      {/* ENHANCED BIG YOUTUBE SEARCH & DIRECT BUTTON CONTAINER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-72 h-32 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-72 h-32 bg-red-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-400" />
                <span>Search YouTube Tracks</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Type any song, Coke Studio title, artist, or paste a YouTube video link / ID
              </p>
            </div>

            {/* Direct YouTube status pill */}
            <div className="flex items-center gap-2">
              <a 
                href={getDirectYouTubeSearchUrl(searchQuery || 'trending music')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-600/25 text-xs font-semibold transition-colors"
                title="Search directly on YouTube.com"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>Direct YouTube Search</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* BIG High-Visibility Search Form */}
          <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-amber-400/80" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search any song, Coke Studio, artist, or paste YouTube video link..."
                className="w-full pl-12 pr-10 py-3.5 sm:py-4 text-xs sm:text-sm md:text-base bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* BIG Search & Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* If user typed or pasted a YouTube URL or 11-char ID, show prominent Direct Play button */}
              {detectedDirectId ? (
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95"
                  title="Play this video link immediately"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
                  <span>Direct Play Now</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-95"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Search YouTube</span>
                    </>
                  )}
                </button>
              )}

              {/* BIG Direct YouTube Search Button */}
              <a
                href={getDirectYouTubeSearchUrl(searchQuery || 'trending songs')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-5 py-3.5 sm:py-4 bg-red-600/20 hover:bg-red-600/35 text-red-200 border border-red-500/40 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-95 shrink-0"
                title="Directly search on YouTube website in a new tab"
              >
                <ExternalLink className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-400" />
                <span className="hidden xs:inline sm:inline">Direct YouTube ↗</span>
                <span className="xs:hidden sm:hidden">YouTube ↗</span>
              </a>
            </div>
          </form>

          {/* Quick Clickable Trending Suggestions Chips */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Trending Quick Searches:</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {TRENDING_SEARCH_TAGS.map((tag) => (
                <button
                  key={tag.query}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag.query);
                    executeSearch(tag.query);
                  }}
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-slate-300 hover:text-amber-300 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {searchError && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-2">
              <span>{searchError}</span>
              <button 
                onClick={handleResetFeed}
                className="underline hover:text-amber-200 font-semibold cursor-pointer shrink-0"
              >
                View full catalog
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FEED RESULTS SECTION */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-slate-200 flex items-center gap-2">
              {activeSearchTerm ? (
                <>
                  <span>Search Results for:</span>
                  <span className="text-amber-400">"{activeSearchTerm}"</span>
                </>
              ) : (
                <span>YouTube Songs Feed</span>
              )}
              <span className="text-xs font-normal text-slate-400">
                ({searchResults.length} {searchResults.length === 1 ? 'track' : 'tracks'} ready to play)
              </span>
            </h3>

            {activeSearchTerm && (
              <button
                onClick={handleResetFeed}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Clear search and return to full feed"
              >
                <X className="w-3 h-3" />
                <span>Clear Search</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeSearchTerm && (
              <a
                href={getDirectYouTubeSearchUrl(activeSearchTerm)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                title="Search this query on YouTube.com"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Direct Search on YouTube ↗</span>
              </a>
            )}

            <button
              onClick={loadRandomFeed}
              disabled={isSearching}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle New Feed</span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isSearching ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-900/30 rounded-2xl border border-slate-800">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm font-medium text-slate-200">Searching YouTube Tracks...</p>
            <p className="text-xs text-slate-500">Querying live feeds and matching catalog tracks</p>
          </div>
        ) : searchResults.length === 0 ? (
          /* High-Quality Zero Results Panel with Direct YouTube button */
          <div className="py-12 px-4 text-center bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center max-w-xl mx-auto shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-100">
              No matching tracks found for "{activeSearchTerm || searchQuery}"
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md">
              Don't worry! You can search YouTube directly to play any video, or paste any YouTube link or 11-character video ID.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-5 w-full justify-center">
              <a
                href={getDirectYouTubeSearchUrl(activeSearchTerm || searchQuery || 'music')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Search "{activeSearchTerm || searchQuery}" on YouTube.com ↗</span>
              </a>

              <button
                onClick={handleResetFeed}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Back to All Songs Feed
              </button>
            </div>
          </div>
        ) : (
          /* Results Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {searchResults.map((item) => {
              const isCurrent = currentTrack.youtubeId === item.id;

              return (
                <div
                  key={item.id}
                  className={`group relative bg-slate-900/85 hover:bg-slate-850 border rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 shadow-md ${
                    isCurrent 
                      ? 'border-amber-500/70 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/30' 
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    {/* Thumbnail */}
                    <div className="relative w-24 sm:w-28 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-slate-800 shadow-inner">
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {item.duration && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/85 rounded text-[9px] font-mono font-medium text-slate-200 shadow-sm">
                          {item.duration}
                        </span>
                      )}
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-0.5">
                          <span className="w-0.5 bg-amber-400 rounded-full animate-eq-1 h-3" />
                          <span className="w-0.5 bg-amber-400 rounded-full animate-eq-2 h-5" />
                          <span className="w-0.5 bg-amber-400 rounded-full animate-eq-3 h-2" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-xs sm:text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors"
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        {item.channel}
                      </p>
                      {item.viewCount && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {item.viewCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Play Action Buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleSelectSearchResult(item, 'audio')}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                        isCurrent && !showVideo
                          ? 'bg-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title="Play background audio"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>{isCurrent && isPlaying && !showVideo ? 'Playing Audio' : 'Play Audio'}</span>
                    </button>

                    <button
                      onClick={() => handleSelectSearchResult(item, 'video')}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                        isCurrent && showVideo
                          ? 'bg-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title="Play with video window"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>{isCurrent && isPlaying && showVideo ? 'Playing Video' : 'Play Video'}</span>
                    </button>

                    <a
                      href={`https://www.youtube.com/watch?v=${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-colors border border-slate-800"
                      title="Open on YouTube.com"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
