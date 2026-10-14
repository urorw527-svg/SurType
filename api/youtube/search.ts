import type { IncomingMessage, ServerResponse } from 'http';

interface SearchResultItem {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  category?: 'hindi' | 'bangla' | 'english';
  viewCount?: string;
  publishedTime?: string;
}

const ALL_CURATED_FEED: SearchResultItem[] = [
  // --- HINDI ---
  {
    id: '-2RAq5o5pwc',
    title: 'Jhol | Coke Studio Pakistan | Season 15 | Maanu x Annural Khalid',
    channel: 'Coke Studio Pakistan',
    duration: '4:39',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/-2RAq5o5pwc/hqdefault.jpg',
    viewCount: '18M views'
  },
  {
    id: 'lgTHGZF3BQw',
    title: 'Pal Pal Dil Ke Paas - Title Track | Arijit Singh & Parampara',
    channel: 'Zee Music Company',
    duration: '4:14',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/lgTHGZF3BQw/hqdefault.jpg',
    viewCount: '95M views'
  },
  {
    id: 'T53pDKTLvcY',
    title: 'Pal Pal Har Pal - Lage Raho Munna Bhai | Sonu Nigam & Shreya Ghoshal',
    channel: 'T-Series',
    duration: '4:35',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/T53pDKTLvcY/hqdefault.jpg',
    viewCount: '28M views'
  },
  {
    id: '5Eqb_-j3FDA',
    title: 'Pasoori | Coke Studio | Season 14 | Ali Sethi x Shae Gill',
    channel: 'Coke Studio',
    duration: '4:36',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/5Eqb_-j3FDA/hqdefault.jpg',
    viewCount: '700M views'
  },
  {
    id: 'AX6OrbgS8lI',
    title: 'Tu Hai Kahan - AUR (Official Music Video)',
    channel: 'AUR',
    duration: '4:22',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/AX6OrbgS8lI/hqdefault.jpg',
    viewCount: '80M views'
  },
  {
    id: 'gvyUuxdRdR4',
    title: 'Husn - Anuv Jain (Official Video)',
    channel: 'Anuv Jain',
    duration: '3:38',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg',
    viewCount: '120M views'
  },
  {
    id: 'BddP6PYo2gs',
    title: 'Kesariya - Brahmāstra | Arijit Singh, Pritam, Amitabh B',
    channel: 'Sony Music India',
    duration: '4:28',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
    viewCount: '620M views'
  },
  {
    id: 'T94PHkuydcw',
    title: 'Iktara - Wake Up Sid | Kavita Seth & Amit Trivedi',
    channel: 'Sony Music India',
    duration: '4:13',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/T94PHkuydcw/hqdefault.jpg',
    viewCount: '65M views'
  },
  {
    id: '284Ov7ysmfA',
    title: 'Channa Mereya - Ae Dil Hai Mushkil | Arijit Singh',
    channel: 'Sony Music India',
    duration: '4:49',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/284Ov7ysmfA/hqdefault.jpg',
    viewCount: '580M views'
  },
  {
    id: 'IJq0yyWug1k',
    title: 'Tum Hi Ho - Aashiqui 2 | Arijit Singh',
    channel: 'T-Series',
    duration: '4:22',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/IJq0yyWug1k/hqdefault.jpg',
    viewCount: '850M views'
  },
  {
    id: 'ILmsf1v1w9M',
    title: 'Shayad - Love Aaj Kal | Arijit Singh & Pritam',
    channel: 'Sony Music India',
    duration: '4:07',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/ILmsf1v1w9M/hqdefault.jpg',
    viewCount: '410M views'
  },
  {
    id: 'fdubeMFwuGs',
    title: 'Ilahi - Yeh Jawaani Hai Deewani | Arijit Singh',
    channel: 'T-Series',
    duration: '3:48',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg',
    viewCount: '320M views'
  },
  {
    id: 'jHNNMj5bNQw',
    title: 'Kabira - Yeh Jawaani Hai Deewani | Tochi Raina & Rekha Bhardwaj',
    channel: 'T-Series',
    duration: '3:43',
    category: 'hindi',
    thumbnail: 'https://i.ytimg.com/vi/jHNNMj5bNQw/hqdefault.jpg',
    viewCount: '490M views'
  },

  // --- BANGLA ---
  {
    id: 'O8yq399dsyk',
    title: 'Deora | Coke Studio Bangla | Season 2 | Pritom Hasan x Fazlu Majhi',
    channel: 'Coke Studio Bangla',
    duration: '4:20',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/O8yq399dsyk/hqdefault.jpg',
    viewCount: '110M views'
  },
  {
    id: 'Eq_okYibcGc',
    title: 'Shada Shada Kala Kala - HAWA | Chanchal Chowdhury',
    channel: 'Jaaz Multimedia',
    duration: '3:45',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/Eq_okYibcGc/hqdefault.jpg',
    viewCount: '135M views'
  },
  {
    id: 'sqJ2QhjBQaw',
    title: 'Long Distance Love | Coke Studio Bangla | Season 3 | Ankan X Afrin',
    channel: 'Coke Studio Bangla',
    duration: '4:15',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/sqJ2QhjBQaw/hqdefault.jpg',
    viewCount: '25M views'
  },
  {
    id: 'oCAj84fs1bA',
    title: 'Kalachan (কালাচান) | Tosiba & FA Pritom (Official Video)',
    channel: 'Dhruba Music Station',
    duration: '3:50',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/oCAj84fs1bA/hqdefault.jpg',
    viewCount: '48M views'
  },
  {
    id: 'a7V9bUwc4cU',
    title: 'Kotha Koiyo Na | Coke Studio Bangla | Season 2 | Shiblu Mredha x Aleya Begum',
    channel: 'Coke Studio Bangla',
    duration: '4:52',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/a7V9bUwc4cU/hqdefault.jpg',
    viewCount: '62M views'
  },
  {
    id: 'zEqqW-USajs',
    title: 'Ma Lo Ma | Coke Studio Bangla | Season 3 | Pritom Hasan x Sagor Dewan',
    channel: 'Coke Studio Bangla',
    duration: '4:40',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/zEqqW-USajs/hqdefault.jpg',
    viewCount: '45M views'
  },
  {
    id: '9c1NIrAqXe4',
    title: 'Bulbuli | Coke Studio Bangla | Season 2 | Ritu Raj x Nandita',
    channel: 'Coke Studio Bangla',
    duration: '3:58',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/9c1NIrAqXe4/hqdefault.jpg',
    viewCount: '30M views'
  },
  {
    id: 'YxJjFjP0crs',
    title: 'Patar Bashori | Coke Studio Bangla | Season 4 | Ishaan x Sunidhi',
    channel: 'Coke Studio Bangla',
    duration: '4:10',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/YxJjFjP0crs/hqdefault.jpg',
    viewCount: '15M views'
  },
  {
    id: 'mT9Z0nYP70I',
    title: 'Mothura | Coke Studio Bangla | Season 3 | Ankan x Nandita',
    channel: 'Coke Studio Bangla',
    duration: '4:30',
    category: 'bangla',
    thumbnail: 'https://i.ytimg.com/vi/mT9Z0nYP70I/hqdefault.jpg',
    viewCount: '18M views'
  },

  // --- ENGLISH ---
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to 24/7',
    channel: 'Lofi Girl',
    duration: 'Live Stream',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    viewCount: '150M views'
  },
  {
    id: 'PEM0Vs8jf1w',
    title: 'Golden Hour - JVKE (Official Music Video)',
    channel: 'JVKE',
    duration: '3:29',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/PEM0Vs8jf1w/hqdefault.jpg',
    viewCount: '240M views'
  },
  {
    id: 'ApXoWvfEYVU',
    title: 'Sunflower - Post Malone, Swae Lee (Spider-Man: Into the Spider-Verse)',
    channel: 'Post Malone',
    duration: '2:42',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/ApXoWvfEYVU/hqdefault.jpg',
    viewCount: '2.1B views'
  },
  {
    id: 'mRD0-GxqHVo',
    title: 'Heat Waves - Glass Animals (Official Video)',
    channel: 'Glass Animals',
    duration: '3:59',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/mRD0-GxqHVo/hqdefault.jpg',
    viewCount: '650M views'
  },
  {
    id: 'GxldQ9eX2wo',
    title: 'Until I Found You - Stephen Sanchez (Official Video)',
    channel: 'Stephen Sanchez',
    duration: '2:57',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/GxldQ9eX2wo/hqdefault.jpg',
    viewCount: '340M views'
  },
  {
    id: 'H5v3kku4y6Q',
    title: 'As It Was - Harry Styles (Official Video)',
    channel: 'Harry Styles',
    duration: '2:47',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg',
    viewCount: '780M views'
  },
  {
    id: 'kTJczUoc26U',
    title: 'Stay - The Kid LAROI & Justin Bieber',
    channel: 'The Kid LAROI',
    duration: '2:21',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/kTJczUoc26U/hqdefault.jpg',
    viewCount: '890M views'
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights - The Weeknd',
    channel: 'The Weeknd',
    duration: '3:20',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    viewCount: '920M views'
  },
  {
    id: 'TUVcZfQe-Kw',
    title: 'Levitating - Dua Lipa',
    channel: 'Dua Lipa',
    duration: '3:23',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg',
    viewCount: '870M views'
  },
  {
    id: '2Vv-BfVoq4g',
    title: 'Perfect - Ed Sheeran',
    channel: 'Ed Sheeran',
    duration: '4:23',
    category: 'english',
    thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    viewCount: '3.6B views'
  }
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function searchYouTubeFeed(query: string): Promise<SearchResultItem[]> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (response.ok) {
      const html = await response.text();
      const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        const sectionContents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        const itemSection = sectionContents?.find((c: any) => c.itemSectionRenderer)?.itemSectionRenderer;
        const contents = itemSection?.contents || [];

        const results: SearchResultItem[] = [];
        for (const item of contents) {
          if (item.videoRenderer) {
            const vr = item.videoRenderer;
            const videoId = vr.videoId;
            if (!videoId) continue;

            const title = vr.title?.runs?.map((r: any) => r.text).join('') || vr.title?.simpleText || 'Untitled Video';
            const channel = vr.ownerText?.runs?.map((r: any) => r.text).join('') || 'YouTube Artist';
            const duration = vr.lengthText?.simpleText || '';
            const viewCount = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || '';
            const publishedTime = vr.publishedTimeText?.simpleText || '';
            const thumbs = vr.thumbnail?.thumbnails || [];
            const thumbnail = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            results.push({
              id: videoId,
              title,
              channel,
              duration,
              thumbnail,
              viewCount,
              publishedTime,
            });

            if (results.length >= 25) break;
          }
        }

        if (results.length > 0) {
          return results;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching live YouTube feed:', error);
  }

  // Fallback search through curated list matching query terms
  const qTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = ALL_CURATED_FEED.filter(t => {
    const text = `${t.title} ${t.channel} ${t.category || ''}`.toLowerCase();
    return qTokens.some(token => text.includes(token));
  });

  return shuffleArray(filtered.length > 0 ? filtered : ALL_CURATED_FEED);
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Parse query params
  const urlObj = new URL(req.url || '', 'https://localhost');
  const q = (req.query?.q || urlObj.searchParams.get('q') || '').trim();
  const category = (req.query?.category || urlObj.searchParams.get('category') || '').trim();

  try {
    if (category && ['hindi', 'bangla', 'english'].includes(category)) {
      const matchingCurated = ALL_CURATED_FEED.filter(t => t.category === category);
      const queryTerm = category === 'hindi' ? 'hindi hit songs coke studio lofi' : category === 'bangla' ? 'coke studio bangla songs' : 'english chill lofi songs';
      const live = await searchYouTubeFeed(q || queryTerm);
      const combined = [...matchingCurated, ...live.filter(l => !matchingCurated.some(m => m.id === l.id))];
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ results: shuffleArray(combined) }));
    }

    if (!q || q === 'random') {
      const shuffled = shuffleArray(ALL_CURATED_FEED);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ results: shuffled }));
    }

    const results = await searchYouTubeFeed(q);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ results: shuffleArray(results), query: q }));
  } catch (err: any) {
    console.error('Search error in handler:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ results: shuffleArray(ALL_CURATED_FEED), error: 'Fallback to random catalog' }));
  }
}
