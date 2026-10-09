import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  RotateCcw, 
  Share2, 
  Check, 
  Zap, 
  Target, 
  Music, 
  Activity,
  Award,
  X
} from 'lucide-react';
import { TypingResult } from '../types';

interface TestResultsModalProps {
  result: TypingResult;
  isPersonalBest: boolean;
  onRestart: () => void;
  onClose: () => void;
}

export const TestResultsModal: React.FC<TestResultsModalProps> = ({
  result,
  isPersonalBest,
  onRestart,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isPersonalBest || result.wpm >= 60) {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24']
      });
    }
  }, [isPersonalBest, result.wpm]);

  // Handle keyboard restart shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onRestart]);

  const getSpeedTier = (wpm: number) => {
    if (wpm >= 110) return { title: 'Godspeed Maestro', desc: 'Lightning speed! Faster than a tabla solo.' };
    if (wpm >= 85) return { title: 'Sonic Virtuoso', desc: 'Incredible velocity with rhythmic mastery.' };
    if (wpm >= 65) return { title: 'Pro Groover', desc: 'Fast, confident typing pace matching the song beat.' };
    if (wpm >= 45) return { title: 'Fluent Flow', desc: 'Above average typing speed with solid steady consistency.' };
    if (wpm >= 25) return { title: 'Steady Explorer', desc: 'Good solid rhythm, building muscle memory.' };
    return { title: 'Rhythm Seeker', desc: 'Getting into the groove, focus on accuracy first.' };
  };

  const tier = getSpeedTier(result.wpm);

  const handleShare = () => {
    const text = `SurType Practice Result\nSpeed: ${result.wpm} WPM (Net)\nAccuracy: ${result.accuracy}%\nMode: ${result.mode} (${result.modeParam})${result.songListened ? `\nAudio Track: ${result.songListened}` : ""}`; 
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate SVG path for timeline chart
  const timeline = result.timeline || [];
  const maxWpmInTimeline = Math.max(...timeline.map(t => Math.max(t.wpm, t.rawWpm)), result.wpm, 40);
  const minWpmInTimeline = 0;

  const chartWidth = 500;
  const chartHeight = 120;
  const padding = 20;

  const getCoords = (second: number, val: number, totalSeconds: number) => {
    const x = padding + ((second / (totalSeconds || 1)) * (chartWidth - padding * 2));
    const y = chartHeight - padding - ((val / maxWpmInTimeline) * (chartHeight - padding * 2));
    return { x, y };
  };

  let wpmPath = '';
  let rawPath = '';
  if (timeline.length > 1) {
    const totalSecs = timeline[timeline.length - 1].second;
    timeline.forEach((pt, idx) => {
      const c = getCoords(pt.second, pt.wpm, totalSecs);
      wpmPath += `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)} `;

      const r = getCoords(pt.second, pt.rawWpm, totalSecs);
      rawPath += `${idx === 0 ? 'M' : 'L'} ${r.x.toFixed(1)} ${r.y.toFixed(1)} `;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Sticky Header with Personal Best Tag & Close button */}
        <div className="flex items-center justify-between px-5 sm:px-7 pt-5 pb-3 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isPersonalBest ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                <Trophy className="w-3.5 h-3.5" />
                New Personal Best!
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                Session Completed
              </span>
            )}
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-xs text-slate-400 capitalize font-mono">
              {result.mode} mode ({result.modeParam})
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close results dashboard"
            title="Close results (Esc)"
          >
            <X className="w-4 h-4 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-5 sm:px-7 py-4 space-y-4 flex-1 overscroll-contain">
          {/* Primary Score Numbers */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium">Net Word Measurement</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono tracking-tight tabular-nums">
                  {result.wpm}
                </span>
                <span className="text-sm font-semibold text-slate-400">WPM</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Official 5-stroke word standard</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium">Accuracy</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono tracking-tight tabular-nums">
                  {result.accuracy}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{result.correctChars} correct keystrokes</p>
            </div>
          </div>

        {/* Official 40, 50, 60 WPM Benchmarks Certification */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 my-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Official Speed Benchmarks (Typing Standards)
          </span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2 rounded-lg border transition-all ${
              result.wpm >= 40 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-semibold' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}>
              <span className="block font-mono text-sm">40 WPM</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Average Speed</span>
            </div>

            <div className={`p-2 rounded-lg border transition-all ${
              result.wpm >= 50 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-semibold' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}>
              <span className="block font-mono text-sm">50 WPM</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Fluent Speed</span>
            </div>

            <div className={`p-2 rounded-lg border transition-all ${
              result.wpm >= 60 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}>
              <span className="block font-mono text-sm">60 WPM</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pro Speed</span>
            </div>
          </div>
        </div>

        {/* Speed Tier Rank */}
        <div className="flex items-center gap-3 bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 my-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-100">{tier.title}</h4>
            <p className="text-xs text-slate-400 truncate">{tier.desc}</p>
          </div>
        </div>

        {/* Stats Grid Details */}
        <div className="grid grid-cols-3 gap-2.5 my-4 text-center">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5">
            <span className="text-[11px] text-slate-400 block">Raw WPM</span>
            <span className="text-base font-bold text-slate-200 font-mono tabular-nums">{result.rawWpm}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5">
            <span className="text-[11px] text-slate-400 block">Characters / Min</span>
            <span className="text-base font-bold text-slate-200 font-mono tabular-nums">{result.cpm}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5">
            <span className="text-[11px] text-slate-400 block">Typos / Misses</span>
            <span className="text-base font-bold text-rose-400 font-mono tabular-nums">{result.incorrectChars}</span>
          </div>
        </div>

        {/* Timeline SVG Chart if multiple samples */}
        {timeline.length > 2 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 my-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Speed Progression (WPM over test)
              </span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-amber-400 rounded-full" />
                  Net WPM
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-slate-500 rounded-full" />
                  Raw WPM
                </span>
              </div>
            </div>

            <div className="w-full overflow-hidden">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-24 overflow-visible"
              >
                {/* Horizontal baseline */}
                <line 
                  x1={padding} 
                  y1={chartHeight - padding} 
                  x2={chartWidth - padding} 
                  y2={chartHeight - padding} 
                  stroke="#334155" 
                  strokeDasharray="2,2" 
                />

                {/* Raw WPM Line */}
                {rawPath && (
                  <path 
                    d={rawPath} 
                    fill="none" 
                    stroke="#64748b" 
                    strokeWidth="1.5" 
                    strokeDasharray="3,3"
                    opacity="0.8"
                  />
                )}

                {/* Net WPM Line */}
                {wpmPath && (
                  <path 
                    d={wpmPath} 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}
              </svg>
            </div>
          </div>
        )}

        {/* Soundtrack Attribution */}
        {result.songListened && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5">
            <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">Song Groove:</span>
            <span className="text-slate-200 font-medium truncate">{result.songListened}</span>
          </div>
        )}
        </div>

        {/* Sticky Footer Actions - Always visible on any screen size */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-t border-slate-800/80 bg-slate-900/95 backdrop-blur-sm z-10 shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-400/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
              title="Start fresh practice race without song interruption"
            >
              <RotateCcw className="w-4 h-4 text-slate-950" />
              <span>Practice Again</span>
              <span className="hidden sm:inline text-[10px] text-slate-900/80 font-mono bg-amber-300/60 px-1.5 py-0.5 rounded">
                Tab / Enter
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
