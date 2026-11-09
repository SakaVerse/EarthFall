import React, { useEffect } from 'react';
import { RotateCcw, Home, Trophy, Compass, Zap, Shield, Sparkles } from 'lucide-react';
import { PlayerStats } from '../game/types';
import { ZONES } from '../game/constants';
import { soundEngine } from '../game/audio';

interface GameOverModalProps {
  stats: PlayerStats;
  bestScore: number;
  onRestart: () => void;
  onHome: () => void;
  isMobile: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  bestScore,
  onRestart,
  onHome,
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
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Header Badge */}
        {isNewRecord ? (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-widest mb-3 animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW ALL-TIME RECORD ACHIEVED</span>
          </div>
        ) : (
          <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-semibold mb-2">
            BIOSPHERE INTEGRITY COMPROMISED
          </span>
        )}

        {/* Main Title */}
        <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-wider mb-2 text-glow-red">
          GAME OVER
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 font-normal">
          Earth drifted deep into the cold cosmos before succumbing to celestial hazards.
        </p>

        {/* Telemetry Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6 text-left">
          {/* Final Score */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] font-mono uppercase text-slate-400">FINAL SCORE</span>
            <span className="text-xl sm:text-2xl font-mono-numbers font-black text-white text-glow-cyan">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Best Record */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] font-mono uppercase text-slate-400">ALL-TIME BEST</span>
            <span className="text-xl sm:text-2xl font-mono-numbers font-black text-amber-300">
              {Math.max(bestScore, stats.score).toLocaleString()}
            </span>
          </div>

          {/* Distance Traveled */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>DISTANCE</span>
            </div>
            <span className="text-lg font-mono-numbers font-bold text-sky-200">
              {Math.round(stats.distance).toLocaleString()} LY
            </span>
          </div>

          {/* Energy Collected */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>ENERGY HARVESTED</span>
            </div>
            <span className="text-lg font-mono-numbers font-bold text-cyan-300">
              {stats.energyCollected} ORBS
            </span>
          </div>
        </div>

        {/* Sector Reached */}
        <div className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl px-4 py-2.5 mb-6 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400">LAST SECTOR:</span>
          <span className="font-display font-bold text-slate-200">{zoneConfig.name}</span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] active:scale-95 transition-all text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isMobile ? 'PLAY AGAIN' : 'PLAY AGAIN (SPACE)'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onHome();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-700 transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
