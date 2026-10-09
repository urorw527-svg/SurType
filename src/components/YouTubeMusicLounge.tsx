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
  Check,
  RefreshCw,
  Volume2,
  Volume1,
  VolumeX,
  Sliders
} from 'lucide-react';
import { SongTrack, YouTubeSearchResult, InstantSwitchCategory } from '../types';
import { CURATED_TRACKS, extractYouTubeId } from '../data/musicTracks';
import { seekYouTubeVideo } from '../utils/youtubePlayer';

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

  // Every time user visits the music page, generate a fresh random feed!
  useEffect(() => {
    loadRandomFeed();
  }, []);

  const loadRandomFeed = async () => {
    setIsSearching(true);
    setSearchError(null);
    try {
      // Pick a random topic to fetch fresh real results
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
      // Fallback
      fallbackToCurated();
    } catch {
      fallbackToCurated();
    } finally {
      setIsSearching(false);
    }
  };

  const loadCategoryFeed = async (category: 'hindi' | 'bangla' | 'english') => {
    setActiveCategory(category);
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
      // Filter curated
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
    // Shuffle curated tracks
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

  const handleSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) {
      loadRandomFeed();
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const directId = extractYouTubeId(q);
      if (directId && directId.length === 11) {
        const directTrack: SongTrack = {
          id: `direct-${directId}`,
          youtubeId: directId,
          title: `YouTube Video (${directId})`,
          artist: 'Custom URL',
          category: 'favorite',
          duration: 'Custom',
          tag: 'Direct Link',
          thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`
        };
        onAddCustomTrack(directTrack);
        onTrackSelect(directTrack, true, 'video');
        setIsSearching(false);
        return;
      }

      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve YouTube feed');
      }
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err: any) {
      console.error('YouTube search error:', err);
      setSearchError('Live search failed. Showing matching curated songs.');
      fallbackToCurated();
    } finally {
      setIsSearching(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  // When user clicks category buttons on the music page:
  // 1. Immediately play a song from that category
  // 2. Load feed for that category
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

          {/* Central Controls: Prev, Play/Pause, Volume Slider, Next & Autoplay */}
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

        {/* Video Mode Preview Notice: The single unified YouTube video player renders at the top so audio never plays twice */}
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

      {/* YouTube Live Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <form onSubmit={onSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search any song, artist, Coke Studio, or paste YouTube video link..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md shrink-0"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="hidden sm:inline">Search YouTube</span>
          </button>
        </form>

        {searchError && (
          <p className="text-xs text-amber-400/90 mt-2">{searchError}</p>
        )}
      </div>

      {/* Feed Results Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>YouTube Songs Feed</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({searchResults.length} {searchResults.length === 1 ? 'song' : 'songs'} ready to play)
            </span>
          </h3>

          <button
            onClick={loadRandomFeed}
            disabled={isSearching}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer transition-colors"
          >
            <Shuffle className="w-3 h-3" />
            <span>Shuffle New Feed</span>
          </button>
        </div>

        {isSearching ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-900/30 rounded-2xl border border-slate-800">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <p className="text-xs">Fetching songs from YouTube...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
            <p className="text-xs">No songs found. Try searching another song or click "Shuffle New Feed" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((item) => {
              const isCurrent = currentTrack.youtubeId === item.id;

              return (
                <div
                  key={item.id}
                  className={`group relative bg-slate-900/80 hover:bg-slate-850 border rounded-xl p-3 flex flex-col justify-between transition-all duration-200 ${
                    isCurrent 
                      ? 'border-amber-500/60 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30' 
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    {/* Thumbnail */}
                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-slate-800">
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {item.duration && (
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[9px] font-mono text-slate-200">
                          {item.duration}
                        </span>
                      )}
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-0.5">
                          <span className="w-0.5 bg-amber-400 rounded-full animate-eq-1 h-3" />
                          <span className="w-0.5 bg-amber-400 rounded-full animate-eq-2 h-4" />
                          <span className="w-0.5 bg-amber-400 rounded-full animate-eq-3 h-2" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-xs font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors"
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        {item.channel}
                      </p>
                      {item.viewCount && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.viewCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Play Action Buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                    <button
                      onClick={() => handleSelectSearchResult(item, 'audio')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isCurrent && !showVideo
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title="Play background audio"
                    >
                      <Headphones className="w-3 h-3" />
                      <span>{isCurrent && isPlaying && !showVideo ? 'Playing Audio' : 'Play Audio'}</span>
                    </button>

                    <button
                      onClick={() => handleSelectSearchResult(item, 'video')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isCurrent && showVideo
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title="Play with video window"
                    >
                      <Tv className="w-3 h-3" />
                      <span>{isCurrent && isPlaying && showVideo ? 'Playing Video' : 'Play Video'}</span>
                    </button>
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
