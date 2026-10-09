export const COMMON_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'great', 'between', 'need', 'large', 'under', 'never', 'last', 'let', 'thought', 'city',
  'tree', 'cross', 'farm', 'hard', 'start', 'might', 'story', 'saw', 'far', 'sea',
  'draw', 'left', 'late', 'run', 'don’t', 'while', 'press', 'close', 'night', 'real',
  'life', 'few', 'north', 'open', 'seem', 'together', 'next', 'white', 'children', 'begin',
  'got', 'walk', 'example', 'ease', 'paper', 'group', 'always', 'music', 'those', 'both',
  'mark', 'often', 'letter', 'until', 'mile', 'river', 'car', 'feet', 'care', 'second',
  'book', 'carry', 'took', 'science', 'eat', 'room', 'friend', 'began', 'idea', 'fish',
  'mountain', 'stop', 'once', 'base', 'hear', 'horse', 'cut', 'sure', 'watch', 'color',
  'face', 'wood', 'main', 'enough', 'plain', 'girl', 'usual', 'young', 'ready', 'above',
  'ever', 'red', 'list', 'though', 'feel', 'talk', 'bird', 'soon', 'body', 'dog',
  'family', 'direct', 'pose', 'leave', 'song', 'measure', 'door', 'product', 'black', 'short',
  'numeral', 'class', 'wind', 'question', 'happen', 'complete', 'ship', 'area', 'half', 'rock',
  'order', 'fire', 'south', 'problem', 'piece', 'told', 'knew', 'pass', 'since', 'top',
  'whole', 'king', 'space', 'heard', 'best', 'hour', 'better', 'true', 'during', 'hundred',
  'five', 'remember', 'step', 'early', 'hold', 'west', 'ground', 'interest', 'reach', 'fast',
  'verb', 'sing', 'listen', 'six', 'table', 'travel', 'less', 'morning', 'ten', 'simple',
  'several', 'vowel', 'toward', 'war', 'lay', 'against', 'pattern', 'slow', 'center', 'love',
  'person', 'money', 'serve', 'appear', 'road', 'map', 'rain', 'rule', 'govern', 'pull',
  'cold', 'notice', 'voice', 'unit', 'power', 'town', 'fine', 'certain', 'fly', 'fall',
  'lead', 'cry', 'dark', 'machine', 'note', 'wait', 'plan', 'figure', 'star', 'box',
  'noun', 'field', 'rest', 'correct', 'able', 'pound', 'done', 'beauty', 'drive', 'stood',
  'contain', 'front', 'teach', 'week', 'final', 'gave', 'green', 'oh', 'quick', 'develop',
  'ocean', 'warm', 'free', 'minute', 'strong', 'special', 'mind', 'behind', 'clear', 'tail',
  'produce', 'fact', 'street', 'inch', 'multiply', 'nothing', 'course', 'stay', 'wheel', 'full',
  'force', 'blue', 'object', 'decide', 'surface', 'deep', 'moon', 'island', 'foot', 'system'
];

export const ADVANCED_WORDS = [
  'keyboard', 'rhythm', 'frequency', 'melody', 'harmony', 'tempo', 'acoustic', 'symphony',
  'resonance', 'vibration', 'velocity', 'momentum', 'precision', 'cadence', 'flow',
  'effortless', 'mastery', 'focus', 'clarity', 'creativity', 'ambition', 'journey',
  'discovery', 'imagination', 'brilliance', 'inspiration', 'meditation', 'balance',
  'tranquil', 'serenade', 'composition', 'synchronize', 'vibrant', 'nostalgia', 'euphoria',
  'dynamism', 'elegance', 'fluency', 'dexterity', 'instinct', 'coordination', 'tempo',
  'improvisation', 'expression', 'luminescent', 'infinite', 'whisper', 'horizon', 'solitude'
];

export interface CuratedQuote {
  id: string;
  length: 'short' | 'medium' | 'long';
  text: string;
  author: string;
  category: string;
}

export const CURATED_QUOTES: CuratedQuote[] = [
  {
    id: 'quote-1',
    length: 'short',
    text: 'Music expresses that which cannot be put into words and that which cannot remain silent.',
    author: 'Victor Hugo',
    category: 'Music',
  },
  {
    id: 'quote-2',
    length: 'short',
    text: 'Typing is not just pressing keys; it is the rhythm of turning thoughts directly into words without hesitation.',
    author: 'Unknown',
    category: 'Craft',
  },
  {
    id: 'quote-3',
    length: 'short',
    text: 'Where words fail, music speaks. Let the melody guide the cadence of your fingers across the keyboard.',
    author: 'Hans Christian Andersen',
    category: 'Music',
  },
  {
    id: 'quote-4',
    length: 'short',
    text: 'Simplicity is about subtracting the obvious and adding the meaningful.',
    author: 'John Maeda',
    category: 'Design',
  },
  {
    id: 'quote-5',
    length: 'medium',
    text: 'In the middle of difficulty lies opportunity. Keep your hands steady, maintain your inner rhythm, and let each sentence flow naturally without rushing.',
    author: 'Albert Einstein',
    category: 'Focus',
  },
  {
    id: 'quote-6',
    length: 'medium',
    text: 'The true secret of high typing speed is not frantically rushing your fingers, but moving with calm consistency, precision, and zero wasted effort.',
    author: 'Mechanical Keys Guide',
    category: 'Technique',
  },
  {
    id: 'quote-7',
    length: 'medium',
    text: 'One good thing about music, when it hits you, you feel no pain. Listening to soulful melodies turns repetitive practice into pure meditation and effortless joy.',
    author: 'Bob Marley',
    category: 'Music',
  },
  {
    id: 'quote-8',
    length: 'long',
    text: 'Practice does not make perfect; only perfect practice makes perfect. When you combine the warmth of your favorite songs with deliberate keyboard discipline, typing ceases to be a tedious chore and transforms into an art form where mind, rhythm, and keystrokes sing together in total harmony.',
    author: 'Vince Lombardi (Adapted)',
    category: 'Mastery',
  },
  {
    id: 'quote-9',
    length: 'long',
    text: 'The keyboard is the modern instrument of the digital age. Just as a pianist listens intently to the reverberation of each note, a skilled typist senses the tactile actuation of every key switch, creating paragraphs with fluid cadence, high accuracy, and calm concentration.',
    author: 'Digital Craftsman',
    category: 'Flow',
  },
];

export function getRandomWords(count: number, includeAdvanced = false): string[] {
  const pool = includeAdvanced ? [...COMMON_WORDS, ...ADVANCED_WORDS] : COMMON_WORDS;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    result.push(pool[randomIndex]);
  }
  return result;
}
