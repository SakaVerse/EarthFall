import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Crown, Cloud } from 'lucide-react';
import { LeaderboardManager } from '../game/leaderboard';
import { soundEngine } from '../game/audio';
import { LeaderboardEntry } from '../game/types';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => LeaderboardManager.getLeaderboard());
  const [activeDate, setActiveDate] = useState<string>(() => LeaderboardManager.getTodayDateString());
  const currentUsername = LeaderboardManager.getUsername();

  useEffect(() => {
    const unsub = LeaderboardManager.subscribe((updated, date) => {
      setEntries(updated);
      setActiveDate(date);
    });
    return () => unsub();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(56,189,248,0.2)] p-5 sm:p-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-display font-black text-white tracking-wide">
                  GLOBAL LEADERBOARD
                </h3>
                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  <Cloud className="w-2.5 h-2.5 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Daily Top 20 &bull; Resets 12:00 AM IST ({activeDate})
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Callout Banner if registered */}
        {currentUsername && (
          <div className="mt-3 px-3.5 py-2 rounded-2xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-between text-xs font-mono shrink-0">
            <span className="text-slate-400">YOUR CALLSIGN:</span>
            <span className="font-bold text-sky-300">{currentUsername}</span>
          </div>
        )}

        {/* Scrollable Leaderboard Table or Empty State */}
        <div className="mt-4 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[140px] flex flex-col justify-center">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-base font-display font-black text-white tracking-wide mb-1">
                No scores yet - Be the first!
              </h4>
              <p className="text-xs font-mono text-slate-400 max-w-xs">
                Launch Earth into deep space, dodge cosmic hazards, and claim Rank #1 on today's leaderboard.
              </p>
            </div>
          ) : (
            entries.map((entry) => {
              const isTop1 = entry.rank === 1;
              const isTop2 = entry.rank === 2;
              const isTop3 = entry.rank === 3;

              return (
                <div
                  key={`${entry.username}_${entry.rank}`}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-xs sm:text-sm ${
                    entry.isCurrentPlayer
                      ? 'bg-sky-950/80 border-sky-400/80 shadow-[0_0_18px_rgba(56,189,248,0.4)] ring-1 ring-sky-400/50'
                      : isTop1
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  {/* Rank & Username */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0">
                      {isTop1 ? (
                        <Crown className="w-5 h-5 text-amber-400" />
                      ) : isTop2 ? (
                        <Medal className="w-5 h-5 text-slate-300" />
                      ) : isTop3 ? (
                        <Medal className="w-5 h-5 text-amber-600" />
                      ) : (
                        <span className="text-slate-500">#{entry.rank}</span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold font-mono tracking-tight ${
                            entry.isCurrentPlayer ? 'text-sky-300 font-black' : isTop1 ? 'text-amber-300' : 'text-slate-100'
                          }`}
                        >
                          {entry.username}
                        </span>
                        {entry.isCurrentPlayer && (
                          <span className="text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded border border-sky-400/40">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[160px] sm:max-w-[220px]">
                        {entry.zone}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-end">
                    <span className="font-mono-numbers font-black text-white text-sm sm:text-base">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">POINTS</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center shrink-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 transition-colors text-xs cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
