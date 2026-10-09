import { YouTubeSearchResult, SongTrack } from '../types';
import { CURATED_TRACKS, extractYouTubeId } from '../data/musicTracks';

export interface SearchResponse {
  results: YouTubeSearchResult[];
  source: 'direct-id' | 'api' | 'curated' | 'none';
  directVideoId?: string;
}

/**
 * Searches YouTube tracks via API or client-side curated catalog fallback.
 * Guarantees that search NEVER silently reloads the random feed when a query is provided.
 */
export async function searchTracks(
  query: string, 
  customTracks: SongTrack[] = []
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], source: 'none' };
  }

  // 1. Check if user typed or pasted a YouTube URL or direct 11-character video ID
  const directId = extractYouTubeId(trimmed);
  if (directId && directId.length === 11) {
    const directResult: YouTubeSearchResult = {
      id: directId,
      title: `Direct YouTube Video (${directId})`,
      channel: 'YouTube Video',
      duration: 'Direct Stream',
      thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
      viewCount: 'Direct Link'
    };
    return {
      results: [directResult],
      source: 'direct-id',
      directVideoId: directId,
    };
  }

  // 2. Try fetching from /api/youtube/search (works on dev server & Vercel serverless function)
  try {
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return {
          results: data.results,
          source: 'api',
        };
      }
    }
  } catch (err) {
    console.warn('API search failed or not available, falling back to local library:', err);
  }

  // 3. Client-side search through all curated & custom songs
  const allLibrary: SongTrack[] = [...customTracks, ...CURATED_TRACKS];
  const qTokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  const matchedTracks = allLibrary.filter(track => {
    const haystack = `${track.title} ${track.artist} ${track.tag || ''} ${track.language || ''} ${track.highlightNote || ''}`.toLowerCase();
    return qTokens.every(token => haystack.includes(token)) || 
           qTokens.some(token => haystack.includes(token));
  });

  // Sort: songs that match more tokens come first
  matchedTracks.sort((a, b) => {
    const hayA = `${a.title} ${a.artist}`.toLowerCase();
    const hayB = `${b.title} ${b.artist}`.toLowerCase();
    const scoreA = qTokens.filter(t => hayA.includes(t)).length;
    const scoreB = qTokens.filter(t => hayB.includes(t)).length;
    return scoreB - scoreA;
  });

  const convertedResults: YouTubeSearchResult[] = matchedTracks.map(t => ({
    id: t.youtubeId,
    title: t.title,
    channel: t.artist,
    duration: t.duration || 'Music',
    thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`,
    viewCount: t.tag,
  }));

  return {
    results: convertedResults,
    source: convertedResults.length > 0 ? 'curated' : 'none',
  };
}

/**
 * Direct YouTube search link helper
 */
export function getDirectYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
}
