export interface TypingPassage {
  id: string;
  title: string;
  category: string;
  text: string;
  wordCount: number;
}

export const TYPING_PASSAGES: TypingPassage[] = [
  {
    id: 'passage-music-rhythm',
    title: 'The Rhythm of Life',
    category: 'Music & Focus',
    text: 'Music has a unique power to transform our ordinary days into moments of calm focus. When pleasant melodies fill the background, the mind relaxes and stress gently fades away. Your hands begin to move across the keyboard with natural rhythm, typing each word with ease and steady cadence. Practice becomes enjoyable rather than a chore when you synchronize your thoughts with the gentle beats.',
    wordCount: 65,
  },
  {
    id: 'passage-art-of-typing',
    title: 'The Art of Touch Typing',
    category: 'Skill & Speed',
    text: 'Learning to type with speed and accuracy is like playing a musical instrument. You do not look down at the keys; your fingers simply know where each letter lives through quiet muscle memory. Forty words per minute is a solid working pace, while fifty and sixty words per minute open the door to effortless productivity. Consistency and relaxed hands are the true secrets to building real speed.',
    wordCount: 68,
  },
  {
    id: 'passage-evening-breeze',
    title: 'An Evening in the City',
    category: 'Everyday Story',
    text: 'As the sun dipped below the distant horizon, golden light washed over the quiet street corners. A cool breeze moved gently through the trees, carrying the distant sound of an acoustic guitar playing from an open window. People strolled slowly along the sidewalk, enjoying the peaceful transition from a busy working afternoon to a serene evening filled with quiet music and warmth.',
    wordCount: 64,
  },
  {
    id: 'passage-curious-mind',
    title: 'The Curious Explorer',
    category: 'Inspiration',
    text: 'Great discoveries often begin with a simple question and the willingness to explore the unknown. When you dedicate time each day to practice a craft, small improvements compound over time. Every paragraph typed brings greater precision, sharper hand coordination, and a smoother flow of ideas. Keep your mind curious, stay patient with yourself, and enjoy every single step of the journey.',
    wordCount: 65,
  },
  {
    id: 'passage-coffee-and-keys',
    title: 'Chai and Flow State',
    category: 'Atmosphere',
    text: 'There is something deeply satisfying about sitting down with a warm cup of spiced chai and a good keyboard. As the steam rises from the cup and your favorite song plays softly in your headphones, the surrounding noise of the world recedes. Letters appear on the screen one by one, forming complete thoughts with fluid grace and calm focus.',
    wordCount: 62,
  },
  {
    id: 'passage-digital-craftsman',
    title: 'Mastering Your Craft',
    category: 'Productivity',
    text: 'True craftsmanship in the digital age comes down to how effortlessly you can communicate your ideas. High typing speed removes the friction between thinking a thought and capturing it in writing. When you can comfortably sustain fifty or sixty words per minute with ninety-five percent accuracy, your computer feels less like a machine and more like an extension of your own mind.',
    wordCount: 66,
  }
];

export function getRandomPassage(): TypingPassage {
  const index = Math.floor(Math.random() * TYPING_PASSAGES.length);
  return TYPING_PASSAGES[index];
}
