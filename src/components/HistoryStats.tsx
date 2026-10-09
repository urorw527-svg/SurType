import React from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Trash2, 
  Music, 
  Zap, 
  Target, 
  BarChart3,
  Calendar
} from 'lucide-react';
import { TypingResult } from '../types';

interface HistoryStatsProps {
  results: TypingResult[];
  onClearHistory: () => void;
  onSelectPractice: () => void;
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({
  results,
  onClearHistory,
  onSelectPractice,
}) => {
  if (results.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">No Typing Sessions Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
          Start your first typing test while listening to Jhol or Pal Pal. Your WPM, accuracy records, and milestones will appear right here.
        </p>
        <button
          onClick={onSelectPractice}
          className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md"
        >
          Start Practicing Now
        </button>
      </div>
    );
  }

  // Calculate statistics
  const bestWpm = Math.max(...results.map(r => r.wpm));
  const avgWpm = Math.round(results.reduce((acc, r) => acc + r.wpm, 0) / results.length);
  const avgAcc = Math.round(results.reduce((acc, r) => acc + r.accuracy, 0) / results.length);
  const totalPracticeSeconds = results.reduce((acc, r) => acc + r.elapsedSeconds, 0);
  const practiceMinutes = Math.round(totalPracticeSeconds / 60);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Personal Best</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-amber-400 font-mono tabular-nums">{bestWpm}</span>
            <span className="text-xs text-slate-400">WPM</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Top recorded speed</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Speed</span>
            <Zap className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-100 font-mono tabular-nums">{avgWpm}</span>
            <span className="text-xs text-slate-400">WPM</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across all modes</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Accuracy</span>
            <Target className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">{avgAcc}%</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Precision rate</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Completed</span>
            <Clock className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-100 font-mono tabular-nums">{results.length}</span>
            <span className="text-xs text-slate-400">tests</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">~{practiceMinutes} min in flow</span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-slate-100">Recent Test History</h4>
            <span className="text-xs text-slate-400">· {results.length} records</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your typing history?')) {
                onClearHistory();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded transition-colors cursor-pointer"
            title="Clear all saved history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-medium border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4">Speed (WPM)</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Groove Soundtrack</th>
                <th className="py-3 px-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {results.slice(0, 25).map(item => {
                const isBest = item.wpm === bestWpm;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm tabular-nums">
                          {item.wpm}
                        </span>
                        {isBest && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-sans font-medium">
                            PB
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`tabular-nums ${item.accuracy >= 95 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {item.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 capitalize">
                      {item.mode} ({item.modeParam})
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3 h-3 text-amber-400/80 shrink-0" />
                        <span className="truncate">{item.songListened || 'Hindi Lo-Fi'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-sans">
                      {new Date(item.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
