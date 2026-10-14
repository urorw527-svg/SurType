import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Zap, 
  Flame, 
  Target, 
  Music, 
  Users, 
  Trophy, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { UserProfile, Mission } from '../types';
import { LEVEL_TIERS, getLevelInfo, loadStoredMissions, saveStoredMissions } from '../utils/missionsData';
import { addXPToUser } from '../utils/firebase';
import confetti from 'canvas-confetti';

interface MissionsLoungeProps {
  user: UserProfile | null;
  onRequireLogin: () => void;
  onSelectPractice: () => void;
  onSelectMultiplayer: () => void;
  onUpdateUserXP?: (newXP: number, newLevel: number) => void;
}

export const MissionsLounge: React.FC<MissionsLoungeProps> = ({
  user,
  onRequireLogin,
  onSelectPractice,
  onSelectMultiplayer,
  onUpdateUserXP,
}) => {
  const [missions, setMissions] = useState<Mission[]>(() => loadStoredMissions());
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null);

  const xp = user?.xp || 0;
  const levelInfo = getLevelInfo(xp);

  const handleClaimMission = async (mission: Mission) => {
    if (mission.completed) return;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#10b981', '#fbbf24']
    });

    const updated = missions.map(m => m.id === mission.id ? { ...m, completed: true } : m);
    setMissions(updated);
    saveStoredMissions(updated);
    setJustClaimedId(mission.id);

    if (user) {
      const res = await addXPToUser(user.uid, mission.xpReward);
      if (onUpdateUserXP) {
        onUpdateUserXP(res.newXP, res.newLevel);
      }
    }
  };

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Hero Level Progression Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-mono font-extrabold shadow-sm">
                LEVEL {levelInfo.level}
              </span>
              <span className="text-xs font-semibold text-amber-300">
                {levelInfo.title}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Typing Mastery & Missions
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Earn XP by completing English typing tests, hitting speed milestones, and competing in 4-digit multiplayer rooms.
            </p>
          </div>

          {/* XP Gauge Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 min-w-[220px] shadow-lg">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-slate-400">Total XP</span>
              <strong className="text-amber-400 text-base">{levelInfo.currentXP} XP</strong>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{levelInfo.xpIntoLevel} / {levelInfo.xpNeeded} XP</span>
              <span>Next: Lv.{levelInfo.level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onSelectPractice}
          className="p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">Start Typing Test</h4>
              <p className="text-[10px] text-slate-400">Practice with Jhol & Pal Pal</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
        </button>

        <button
          onClick={onSelectMultiplayer}
          className="p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">Join Multiplayer Race</h4>
              <p className="text-[10px] text-slate-400">Create or join 4-digit room</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>

      {/* Core Missions List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Daily Missions & Milestones</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Completed: <strong className="text-emerald-400">{completedCount}</strong>/{missions.length}
          </span>
        </div>

        <div className="space-y-3">
          {missions.map((mission) => {
            const isCompleted = mission.completed;
            const canClaim = !isCompleted;

            return (
              <div 
                key={mission.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted 
                    ? 'bg-slate-950/60 border-slate-800/60 opacity-80' 
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isCompleted 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {mission.icon === 'zap' && <Zap className="w-4 h-4" />}
                    {mission.icon === 'flame' && <Flame className="w-4 h-4" />}
                    {mission.icon === 'target' && <Target className="w-4 h-4" />}
                    {mission.icon === 'music' && <Music className="w-4 h-4" />}
                    {mission.icon === 'users' && <Users className="w-4 h-4" />}
                    {mission.icon === 'trophy' && <Trophy className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-200">{mission.title}</h4>
                      <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded text-[10px] font-mono font-bold">
                        +{mission.xpReward} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {mission.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center">
                  {isCompleted ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaimMission(mission)}
                      className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim +{mission.xpReward} XP</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Tiers Roadmap */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Level Rank Tiers</h3>
          </div>
          <span className="text-[11px] text-slate-400">200 XP per level milestone</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {LEVEL_TIERS.map(tier => {
            const isUnlocked = levelInfo.level >= tier.level;
            const isCurrent = levelInfo.level === tier.level;

            return (
              <div 
                key={tier.level}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isCurrent 
                    ? 'bg-amber-400/10 border-amber-400/60 shadow-md ring-1 ring-amber-400/30' 
                    : isUnlocked 
                    ? 'bg-slate-950/70 border-slate-800' 
                    : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${tier.badgeColor}`}>
                    Level {tier.level}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {tier.minXP} XP
                  </span>
                </div>
                <div className="font-bold text-slate-200 mt-1">{tier.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isCurrent ? '★ Current Level' : isUnlocked ? '✓ Unlocked' : 'Locked'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
