import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, Trophy, Coins, Compass, ListOrdered, Sparkles, Play } from 'lucide-react';
import { PlayerStats } from '../game/types';
import { ZONES } from '../game/constants';
import { soundEngine } from '../game/audio';
import { DailyTop10Card } from './DailyTop10Card';

interface GameOverModalProps {
  stats: PlayerStats;
  bestScore: number;
  coinsEarned: number;
  onRestart: () => void;
  onHome: () => void;
  onOpenLeaderboard: () => void;
  onClaimBonusScrap?: () => void;
  isMobile: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  bestScore,
  coinsEarned,
  onRestart,
  onHome,
  onOpenLeaderboard,
  onClaimBonusScrap,
  isMobile,
}) => {
  const [bonusClaimed, setBonusClaimed] = useState(false);
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

  const handleRewardClick = () => {
    if (bonusClaimed) return;
    soundEngine.playClick();
    if (onClaimBonusScrap) {
      onClaimBonusScrap();
      setBonusClaimed(true);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] z-40 animate-fadeIn select-none overflow-y-auto">
      <div className="w-full max-w-lg max-h-[94vh] overflow-y-auto bg-slate-900/95 border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.25)] p-3.5 sm:p-6 flex flex-col items-center text-center my-auto custom-scrollbar">
        {/* Header Badge */}
        {isNewRecord ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold tracking-widest mb-2 animate-pulse">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW ALL-TIME RECORD!</span>
          </div>
        ) : (
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold mb-1">
            ATMOSPHERE DEPLETED — MISSION FAILED
          </span>
        )}

        {/* Main Title */}
        <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-wider mb-0.5 text-glow-red">
          GAME OVER
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mb-3 font-normal">
          Earth drifted beyond survival threshold in deep space.
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2 mb-3 text-left">
          {/* Final Score */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col">
            <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">FINAL SCORE</span>
            <span className="text-base sm:text-xl font-mono-numbers font-black text-white text-glow-cyan">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Best Record */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col">
            <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">BEST SCORE</span>
            <span className="text-base sm:text-xl font-mono-numbers font-black text-amber-300">
              {Math.max(bestScore, stats.score).toLocaleString()}
            </span>
          </div>

          {/* Coins / Scrap Earned */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col">
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-amber-400 font-bold mb-0.5">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>COINS EARNED</span>
            </div>
            <span className="text-sm sm:text-base font-mono-numbers font-black text-amber-300">
              +{coinsEarned}
            </span>
          </div>

          {/* Distance Traveled */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col">
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-sky-400 font-bold mb-0.5">
              <Compass className="w-3 h-3 text-sky-400" />
              <span>DISTANCE</span>
            </div>
            <span className="text-sm sm:text-base font-mono-numbers font-bold text-sky-200">
              {Math.round(stats.distance).toLocaleString()} LY
            </span>
          </div>
        </div>

        {/* Sector Reached */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 mb-3 flex items-center justify-between text-xs">
          <span className="font-mono text-[10px] text-slate-400">ZONE REACHED:</span>
          <span className="font-display font-bold text-sky-300 text-xs">{zoneConfig.name}</span>
        </div>

        {/* Rewarded Ad Bonus Button */}
        {onClaimBonusScrap && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRewardClick();
            }}
            disabled={bonusClaimed}
            className={`w-full mb-3 flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-xs font-mono font-bold cursor-pointer ${
              bonusClaimed
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 opacity-80 cursor-default'
                : 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-amber-500/50 hover:border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <Play className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <span>{bonusClaimed ? '✓ +150 BONUS SCRAP CLAIMED!' : 'WATCH AD FOR +150 BONUS SCRAP'}</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </button>
        )}

        {/* TODAY'S TOP 10 GLOBAL LEADERBOARD PANEL */}
        <div className="w-full mb-3">
          <DailyTop10Card
            onOpenFullLeaderboard={onOpenLeaderboard}
            compact={true}
          />
        </div>

        {/* Action Buttons: Play Again (Big), Leaderboard, Main Menu */}
        <div className="w-full flex flex-col gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 transition-all text-xs sm:text-sm tracking-wide cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isMobile ? 'PLAY AGAIN' : 'PLAY AGAIN (SPACE)'}</span>
          </button>

          <div className="w-full grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                soundEngine.playClick();
                onOpenLeaderboard();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition-colors text-xs cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              <span>FULL RANKS</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                soundEngine.playClick();
                onHome();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition-colors text-xs cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
