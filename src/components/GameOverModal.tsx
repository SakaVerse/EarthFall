import React, { useEffect } from 'react';
import { RotateCcw, Home, Trophy, Coins, Compass, ListOrdered } from 'lucide-react';
import { PlayerStats } from '../game/types';
import { ZONES } from '../game/constants';
import { soundEngine } from '../game/audio';

interface GameOverModalProps {
  stats: PlayerStats;
  bestScore: number;
  coinsEarned: number;
  onRestart: () => void;
  onHome: () => void;
  onOpenLeaderboard: () => void;
  isMobile: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  bestScore,
  coinsEarned,
  onRestart,
  onHome,
  onOpenLeaderboard,
  isMobile,
}) => {
  const isNewRecord = stats.score >= bestScore && stats.score > 0;
  const zoneConfig = ZONES[stats.zone];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        soundEngine.playClick();
        onRestart();
      } else if (e.code === 'Escape') {
        soundEngine.playClick();
        onHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, onHome]);

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-40 animate-fadeIn select-none overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.25)] p-5 sm:p-7 flex flex-col items-center text-center my-auto">
        {/* Header Badge */}
        {isNewRecord ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold tracking-widest mb-3 animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW ALL-TIME RECORD!</span>
          </div>
        ) : (
          <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold mb-2">
            ATMOSPHERE DEPLETED — MISSION FAILED
          </span>
        )}

        {/* Main Title */}
        <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-wider mb-1 text-glow-red">
          GAME OVER
        </h2>
        <p className="text-xs text-slate-400 mb-5 font-normal">
          Earth drifted beyond survival threshold in deep space.
        </p>

        {/* Stats Grid: Final Score, Best Score, Coins Earned */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-4 text-left">
          {/* Final Score */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">FINAL SCORE</span>
            <span className="text-xl sm:text-2xl font-mono-numbers font-black text-white text-glow-cyan">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Best Record */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">BEST SCORE</span>
            <span className="text-xl sm:text-2xl font-mono-numbers font-black text-amber-300">
              {Math.max(bestScore, stats.score).toLocaleString()}
            </span>
          </div>

          {/* Coins / Scrap Earned */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-400 font-bold mb-0.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>COINS EARNED</span>
            </div>
            <span className="text-lg font-mono-numbers font-black text-amber-300">
              +{coinsEarned}
            </span>
          </div>

          {/* Distance Traveled */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-sky-400 font-bold mb-0.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>DISTANCE</span>
            </div>
            <span className="text-lg font-mono-numbers font-bold text-sky-200">
              {Math.round(stats.distance).toLocaleString()} LY
            </span>
          </div>
        </div>

        {/* Sector Reached */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl px-3.5 py-2 mb-5 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400">ZONE REACHED:</span>
          <span className="font-display font-bold text-sky-300">{zoneConfig.name}</span>
        </div>

        {/* Action Buttons: Play Again (Big), Leaderboard, Main Menu */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-2xl shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 transition-all text-sm tracking-wide"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isMobile ? 'PLAY AGAIN' : 'PLAY AGAIN (SPACE)'}</span>
          </button>

          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenLeaderboard();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-2xl border border-slate-700 transition-colors text-xs"
            >
              <ListOrdered className="w-4 h-4 text-amber-400" />
              <span>LEADERBOARD</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onHome();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-2xl border border-slate-700 transition-colors text-xs"
            >
              <Home className="w-4 h-4" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
