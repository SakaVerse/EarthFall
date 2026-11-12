import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Clock, Cloud, ArrowRight } from 'lucide-react';
import { LeaderboardManager } from '../game/leaderboard';
import { LeaderboardEntry } from '../game/types';

interface DailyTop10CardProps {
  onOpenFullLeaderboard?: () => void;
  compact?: boolean;
}

export const DailyTop10Card: React.FC<DailyTop10CardProps> = ({
  onOpenFullLeaderboard,
  compact = false,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => LeaderboardManager.getLeaderboard().slice(0, 10));
  const [dateKey, setDateKey] = useState<string>(() => LeaderboardManager.getTodayDateString());

  useEffect(() => {
    return LeaderboardManager.subscribe((liveEntries, activeDate) => {
      setEntries(liveEntries.slice(0, 10));
      setDateKey(activeDate);
    });
  }, []);

  return (
    <div className="w-full bg-slate-950/85 backdrop-blur-md border border-sky-500/30 rounded-2xl p-3 sm:p-4 shadow-[0_0_30px_rgba(56,189,248,0.15)] flex flex-col text-left text-xs">
      {/* Title & Live Status Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-white tracking-wide text-xs sm:text-sm">
                Today's Top 10 Global Leaderboard
              </span>
              <span className="flex items-center gap-1 text-[8.5px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded-full">
                <Cloud className="w-2 h-2 animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9.5px] font-mono text-sky-300/80">
              <Clock className="w-2.5 h-2.5" />
              <span>Resets daily at 12:00 AM</span>
              <span className="text-slate-500">({dateKey})</span>
            </div>
          </div>
        </div>

        {onOpenFullLeaderboard && (
          <button
            onClick={onOpenFullLeaderboard}
            className="flex items-center gap-1 text-[10px] font-mono text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Table Content or Empty State */}
      {entries.length === 0 ? (
        <div className="py-4 px-2 text-center flex flex-col items-center justify-center">
          <p className="text-xs font-mono font-semibold text-slate-300">
            No scores yet—be the first!
          </p>
          <span className="text-[10px] font-mono text-slate-500 mt-0.5">
            Play a run to claim Rank #1 for today.
          </span>
        </div>
      ) : (
        <div className={`space-y-1.5 overflow-y-auto custom-scrollbar ${compact ? 'max-h-[160px]' : 'max-h-[220px]'}`}>
          {/* Table Header */}
          <div className="grid grid-cols-12 text-[9px] font-mono uppercase text-slate-500 font-bold px-2 py-0.5 border-b border-slate-900">
            <span className="col-span-2">Rank</span>
            <span className="col-span-6">Nickname</span>
            <span className="col-span-4 text-right">Score</span>
          </div>

          {entries.map((entry) => {
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;

            return (
              <div
                key={`${entry.username}_${entry.rank}`}
                className={`grid grid-cols-12 items-center px-2 py-1.5 rounded-xl border text-[11px] sm:text-xs transition-colors ${
                  entry.isCurrentPlayer
                    ? 'bg-sky-950/80 border-sky-400/80 text-sky-200 shadow-sm ring-1 ring-sky-400/40'
                    : isTop1
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : isTop2
                    ? 'bg-slate-900/60 border-slate-700/60 text-slate-200'
                    : isTop3
                    ? 'bg-amber-950/20 border-amber-700/30 text-amber-300'
                    : 'bg-slate-950/60 border-slate-900 text-slate-300'
                }`}
              >
                {/* Rank */}
                <div className="col-span-2 flex items-center font-mono font-black text-xs">
                  {isTop1 ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  ) : isTop2 ? (
                    <Medal className="w-3.5 h-3.5 text-slate-300" />
                  ) : isTop3 ? (
                    <Medal className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <span className="text-slate-500 text-[10px]">#{entry.rank}</span>
                  )}
                </div>

                {/* Nickname */}
                <div className="col-span-6 flex items-center gap-1.5 truncate pr-1">
                  <span className="text-xs shrink-0">{entry.avatar === 'mars' ? '🔴' : entry.avatar === 'europa' ? '❄️' : entry.avatar === 'solar' ? '☀️' : entry.avatar === 'cyber' ? '⚡' : entry.avatar === 'void' ? '🌑' : entry.avatar === 'phoenix' ? '🔥' : '🌍'}</span>
                  <span className={`font-mono font-bold truncate ${entry.isCurrentPlayer ? 'text-sky-300 font-black' : isTop1 ? 'text-amber-300' : 'text-slate-100'}`}>
                    {entry.username}
                  </span>
                  {entry.isCurrentPlayer && (
                    <span className="text-[8px] font-mono font-black bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded border border-sky-400/40 shrink-0">
                      YOU
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="col-span-4 text-right font-mono-numbers font-black text-white text-[11px] sm:text-xs">
                  {entry.score.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
