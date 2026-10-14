import { Mission } from '../types';

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'first_test',
    title: 'First Beat',
    description: 'Complete your first English typing test while listening to music',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    xpReward: 50,
    icon: 'zap'
  },
  {
    id: 'pace_45',
    title: 'Smooth Groove (45 WPM)',
    description: 'Reach 45+ WPM with steady rhythmic keystrokes',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    xpReward: 75,
    icon: 'flame'
  },
  {
    id: 'accuracy_95',
    title: 'Precision Maestro',
    description: 'Finish a test with 95% or higher accuracy',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    xpReward: 100,
    icon: 'target'
  },
  {
    id: 'tracks_3',
    title: 'Music Connoisseur',
    description: 'Type along to 3 different songs in your session',
    targetCount: 3,
    currentCount: 0,
    completed: false,
    xpReward: 90,
    icon: 'music'
  },
  {
    id: 'multiplayer_race',
    title: 'Room Racer',
    description: 'Create or join a 4-digit Multiplayer Room and race live with friends',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    xpReward: 150,
    icon: 'users'
  },
  {
    id: 'pace_60',
    title: 'Pro Virtuoso (60 WPM)',
    description: 'Hit 60+ WPM pro benchmark speed to unlock the gold tier',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    xpReward: 200,
    icon: 'trophy'
  }
];

export const LEVEL_TIERS: { level: number; title: string; minXP: number; badgeColor: string }[] = [
  { level: 1, title: 'Novice Strummer', minXP: 0, badgeColor: 'text-slate-400 bg-slate-800 border-slate-700' },
  { level: 2, title: 'Rhythmic Typist', minXP: 200, badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-500/40' },
  { level: 3, title: 'Beat Synchronizer', minXP: 400, badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40' },
  { level: 4, title: 'Melody Sprinter', minXP: 600, badgeColor: 'text-sky-400 bg-sky-950/80 border-sky-500/40' },
  { level: 5, title: 'Lounge Maestro', minXP: 800, badgeColor: 'text-purple-400 bg-purple-950/80 border-purple-500/40' },
  { level: 6, title: 'Godspeed Virtuoso', minXP: 1000, badgeColor: 'text-rose-400 bg-rose-950/80 border-rose-500/40' }
];

export function getLevelInfo(xp: number) {
  const currentLevelNumber = Math.max(1, Math.floor(xp / 200) + 1);
  const tier = LEVEL_TIERS.find(t => t.level === currentLevelNumber) || {
    level: currentLevelNumber,
    title: 'Grandmaster Typist',
    minXP: (currentLevelNumber - 1) * 200,
    badgeColor: 'text-amber-300 bg-amber-900/80 border-amber-400'
  };

  const xpIntoLevel = xp % 200;
  const xpNeeded = 200;
  const progressPercent = Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));

  return {
    level: currentLevelNumber,
    title: tier.title,
    badgeColor: tier.badgeColor,
    currentXP: xp,
    xpIntoLevel,
    xpNeeded,
    progressPercent
  };
}

export function loadStoredMissions(): Mission[] {
  try {
    const raw = localStorage.getItem('surtype_missions');
    if (!raw) return INITIAL_MISSIONS;
    const parsed = JSON.parse(raw);
    return INITIAL_MISSIONS.map(def => {
      const existing = parsed.find((m: Mission) => m.id === def.id);
      return existing ? { ...def, ...existing } : def;
    });
  } catch {
    return INITIAL_MISSIONS;
  }
}

export function saveStoredMissions(missions: Mission[]): void {
  try {
    localStorage.setItem('surtype_missions', JSON.stringify(missions));
  } catch {}
}
