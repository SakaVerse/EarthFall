import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Medal, Crown, Cloud, Clock, Sparkles, User, ShieldCheck } from 'lucide-react';
import { LeaderboardManager } from '../game/leaderboard';
import { soundEngine } from '../game/audio';
import { LeaderboardEntry } from '../game/types';
import { getTimeUntilMidnightIST } from '../utils/date';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => LeaderboardManager.getLeaderboard());
  const [activeDate, setActiveDate] = useState<string>(() => LeaderboardManager.getTodayDateString());
  const [countdown, setCountdown] = useState<string>(() => getTimeUntilMidnightIST().formatted);
  const currentUsername = LeaderboardManager.getUsername();
  const listRef = useRef<HTMLDivElement>(null);

  // Mount real-time subscription directly via LeaderboardManager
  useEffect(() => {
    return LeaderboardManager.subscribe((liveEntries, dateKey) => {
      setEntries(liveEntries);
      setActiveDate(dateKey);
      // Ensure scroll position is reset to top so Rank #1 is fully visible
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    });
  }, []);

  // Update 12:00 AM IST countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnightIST().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentPlayerEntry = entries.find((e) => e.isCurrentPlayer);
  const top1Entry = entries.length > 0 && entries[0].rank === 1 ? entries[0] : null;
  const remainingEntries = entries.length > 0 && entries[0].rank === 1 ? entries.slice(1) : entries;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 z-50 animate-fadeIn select-none overflow-hidden">
      <div className="mobile-modal-card w-full max-w-lg bg-slate-900/95 border border-sky-500/30 rounded-3xl shadow-[0_0_60px_rgba(56,189,248,0.25)] p-3 sm:p-5 flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden">
        
        {/* Header */}
        <div className="mobile-modal-header flex items-center justify-between pb-2.5 sm:pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Trophy className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="mobile-modal-title text-sm sm:text-lg font-display font-black text-white tracking-wide">
                  TODAY'S TOP 10 PILOTS
                </h3>
                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <Cloud className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  REAL-TIME
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9.5px] sm:text-[11px] font-mono text-sky-300 mt-0.5">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-400 shrink-0" />
                <span className="text-slate-300">Resets at 12:00 AM IST:</span>
                <span className="font-bold text-amber-300 bg-amber-950/50 px-1 sm:px-1.5 py-0.2 rounded border border-amber-500/30">
                  {countdown}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Close Leaderboard"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Callsign & Daily Status Banner */}
        <div className="mt-2 sm:mt-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-sky-500/30 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />
            <span className="text-slate-400 text-[10px] sm:text-[11px]">PILOT:</span>
            <span className="font-black text-sky-300 truncate text-[11px] sm:text-xs">
              {currentUsername || 'Anonymous Cadet'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded-lg border border-amber-500/30 shrink-0">
            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
            <span>DAILY CYCLE</span>
          </div>
        </div>

        {/* Notice Bar */}
        <div className="mt-1.5 px-2.5 py-1 rounded-lg sm:rounded-xl bg-sky-950/40 border border-sky-500/20 text-[9px] sm:text-[10px] font-mono text-sky-200/90 shrink-0 flex items-center justify-between">
          <span>⚡ Real-time play active • Standings lock at 12:00 AM IST</span>
          <span className="text-slate-400">{activeDate}</span>
        </div>

        {/* Scrollable Leaderboard Area: Dedicated Champion Card for #1 + List for #2-#10 */}
        <div
          ref={listRef}
          className="mt-2 overflow-y-auto space-y-2 px-1 pt-1 pb-2 custom-scrollbar flex-1 min-h-0 mobile-modal-list"
        >
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-sm sm:text-base font-display font-black text-white tracking-wide mb-1">
                New Daily Cycle Begins!
              </h4>
              <p className="text-[11px] font-mono text-slate-300 max-w-xs mb-2">
                All past scores reset to 0. Fly a run to claim Rank #1 for today!
              </p>
              <div className="text-[9px] font-mono text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                100% Real Players • No Bots
              </div>
            </div>
          ) : (
            <>
              {/* TOP-RANKED PLAYER (#1): ICONIC GOLDEN CHAMPION SHOWCASE CARD */}
              {top1Entry && (
                <div
                  key={`${top1Entry.username}_1`}
                  className={`p-3 sm:p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                    top1Entry.isCurrentPlayer
                      ? 'bg-gradient-to-r from-amber-500/25 via-sky-950/60 to-slate-900 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)] ring-2 ring-cyan-400/60'
                      : 'bg-gradient-to-r from-amber-500/20 via-yellow-950/40 to-slate-900/95 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] ring-1 ring-amber-300/40'
                  }`}
                >
                  {/* Subtle cosmic golden glow in background */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-400/15 blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between gap-2.5">
                    {/* Golden Crown Medallion & Player Identity */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-[0_0_20px_rgba(245,158,11,0.7)] shrink-0 border border-amber-200">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 text-slate-950 animate-pulse" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-white text-xs sm:text-base tracking-wide truncate">
                            {top1Entry.username}
                          </span>

                          <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-mono font-black uppercase bg-amber-400 text-slate-950 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                            CHAMPION
                          </span>

                          {top1Entry.isCurrentPlayer && (
                            <span className="text-[8px] sm:text-[9px] font-mono font-black bg-cyan-500/30 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
                              YOU
                            </span>
                          )}
                        </div>

                        <span className="text-[9.5px] sm:text-xs font-mono text-amber-300/90 truncate mt-0.5 font-semibold">
                          {top1Entry.zone}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-end pl-2 shrink-0">
                      <span className="font-mono-numbers font-black text-base sm:text-2xl text-amber-300 drop-shadow-[0_0_14px_rgba(245,158,11,0.8)] tracking-tight">
                        {top1Entry.score.toLocaleString()}
                      </span>
                      <span className="text-[8.5px] sm:text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                        POINTS
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* RANKS #2 TO #10 */}
              {remainingEntries.map((entry) => {
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <div
                    key={`${entry.username}_${entry.rank}`}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm ${
                      entry.isCurrentPlayer
                        ? 'bg-gradient-to-r from-cyan-950/90 via-sky-950/90 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/60'
                        : isTop2
                        ? 'bg-gradient-to-r from-slate-800/80 via-slate-900 to-slate-950 border-slate-300/80 shadow-[0_0_15px_rgba(203,213,225,0.2)] ring-1 ring-slate-300/40'
                        : isTop3
                        ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-amber-700/80 ring-1 ring-amber-700/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Rank & Identity */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                          isTop2
                            ? 'bg-slate-300/20 border border-slate-300/60 text-slate-200'
                            : isTop3
                            ? 'bg-amber-700/20 border border-amber-700/60 text-amber-400'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                      >
                        {isTop2 ? (
                          <Medal className="w-4 h-4 text-slate-300" />
                        ) : isTop3 ? (
                          <Medal className="w-4 h-4 text-amber-600" />
                        ) : (
                          <span>#{entry.rank}</span>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-mono font-bold tracking-tight text-xs sm:text-sm truncate ${
                              entry.isCurrentPlayer
                                ? 'text-cyan-300 font-black'
                                : isTop2
                                ? 'text-slate-100 font-bold'
                                : isTop3
                                ? 'text-amber-200 font-bold'
                                : 'text-slate-200'
                            }`}
                          >
                            {entry.username}
                          </span>

                          {isTop2 && (
                            <span className="text-[7.5px] sm:text-[8px] font-mono font-bold bg-slate-700/50 text-slate-300 px-1 py-0.2 rounded border border-slate-500/40">
                              2ND
                            </span>
                          )}

                          {isTop3 && (
                            <span className="text-[7.5px] sm:text-[8px] font-mono font-bold bg-amber-900/40 text-amber-300 px-1 py-0.2 rounded border border-amber-700/40">
                              3RD
                            </span>
                          )}

                          {entry.isCurrentPlayer && (
                            <span className="text-[8px] sm:text-[8.5px] font-mono font-black bg-cyan-500/25 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-400/60 shadow-sm shrink-0">
                              YOU
                            </span>
                          )}
                        </div>

                        <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
                          {entry.zone}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-end pl-2 shrink-0">
                      <span
                        className={`font-mono-numbers font-black text-xs sm:text-base tracking-tight ${
                          entry.isCurrentPlayer
                            ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                            : 'text-white'
                        }`}
                      >
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="text-[8px] sm:text-[8.5px] font-mono text-slate-500">
                        POINTS
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer with Player Standings Summary */}
        <div className="mt-2 pt-2 sm:pt-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate">
            {currentPlayerEntry ? (
              <span className="text-cyan-300 font-bold">
                Your Rank: #{currentPlayerEntry.rank} ({currentPlayerEntry.score.toLocaleString()} pts)
              </span>
            ) : (
              <span>Fly a run to enter today's standings!</span>
            )}
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-1.5 sm:px-5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl sm:rounded-2xl border border-slate-700 transition-colors text-xs cursor-pointer shrink-0"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
