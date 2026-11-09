import React from 'react';
import { Pause, Volume2, VolumeX, Shield, Zap, Clock, Compass, Heart, Radio, Flame, Sparkles } from 'lucide-react';
import { ActivePowerUp, ActiveSkill, PlayerStats, SkillType } from '../game/types';
import { POWER_UP_CONFIG, ZONES } from '../game/constants';
import { soundEngine } from '../game/audio';

interface HUDProps {
  stats: PlayerStats;
  health: number;
  activePowerUps: ActivePowerUp[];
  skills: ActiveSkill[];
  bestScore: number;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onTriggerSkill: (type: SkillType) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  health,
  activePowerUps,
  skills,
  bestScore,
  muted,
  onPause,
  onToggleMute,
  onTriggerSkill,
}) => {
  const currentZone = ZONES[stats.zone];
  const isBoosted = activePowerUps.some((p) => p.type === 'COSMIC_BOOST');
  const healthPercent = Math.max(0, Math.min(100, health));

  // Health color
  const healthBarColor =
    healthPercent > 60
      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
      : healthPercent > 30
      ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
      : 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.85)] animate-pulse';

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 z-20">
      {/* TOP BAR: Primary Mission Telemetry */}
      <div className="w-full flex items-start justify-between gap-3">
        {/* Left Cluster: Score & Distance */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] sm:text-xs font-mono uppercase text-sky-400 font-semibold tracking-wider">
              SCORE
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-mono-numbers font-black text-white text-glow-cyan tracking-tight">
              {stats.score.toLocaleString()}
            </span>
            {isBoosted && (
              <span className="text-[10px] sm:text-xs font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 animate-pulse">
                3X BOOST
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm font-mono-numbers text-slate-300">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>{Math.round(stats.distance).toLocaleString()} LY</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px] uppercase">RECORD</span>
              <span className="text-slate-200">{Math.max(bestScore, stats.score).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Center Cluster: Current Zone Badge */}
        <div className="hidden md:flex flex-col items-center pointer-events-auto bg-slate-950/70 border border-slate-800/80 px-4 py-1.5 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-200">
              {currentZone.name}
            </span>
          </div>
        </div>

        {/* Right Cluster: Earth Health & Energy & Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Health & Energy Bar */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 px-3.5 py-2 rounded-xl shadow-lg">
            {/* Biosphere Health */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart className={`w-3.5 h-3.5 ${healthPercent < 35 ? 'text-rose-500 animate-ping' : 'text-emerald-400'}`} />
                <span className="text-[10px] font-mono uppercase text-slate-400">BIOSPHERE</span>
                <span className="text-xs font-mono-numbers font-bold text-white">{Math.round(healthPercent)}%</span>
              </div>
              <div className="w-24 sm:w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 rounded-full ${healthBarColor}`}
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            {/* Cosmic Energy */}
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <span className="text-sm font-mono-numbers font-bold text-cyan-300">
                {stats.energyCollected}
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleMute();
                }}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Toggle Mute"
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onPause();
                }}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Pause (ESC)"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dodge Combo Indicator */}
          {stats.currentCombo >= 3 && (
            <div className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-500/30 px-2.5 py-0.5 rounded-full animate-bounce">
              ⚡ COMBO x{stats.currentCombo}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM BAR: Active Skills & Active Power-Ups */}
      <div className="w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-3">
        {/* Left: Active Power-Ups */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {activePowerUps.map((p) => {
            const conf = POWER_UP_CONFIG[p.type];
            const ratio = Math.max(0, p.durationRemaining / p.maxDuration);
            return (
              <div
                key={p.type}
                className="flex items-center gap-2 bg-slate-950/85 border border-slate-800/90 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm"
              >
                <span className="text-base">{conf.symbol}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-200">
                    {conf.name}
                  </span>
                  <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${ratio * 100}%`,
                        backgroundColor: conf.color,
                        boxShadow: `0 0 6px ${conf.color}`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center/Right: Active Planetary Skills */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {skills.map((s) => {
            const isReady = s.cooldownRemaining <= 0;
            return (
              <button
                key={s.type}
                onClick={() => onTriggerSkill(s.type)}
                disabled={!isReady}
                title={`Press ${s.keyLabel} to activate ${s.name}`}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all select-none ${
                  s.isActive
                    ? 'bg-sky-500/30 border-sky-400 text-white shadow-[0_0_15px_#38bdf8] scale-105'
                    : isReady
                    ? 'bg-slate-950/85 hover:bg-slate-900 border-sky-500/40 text-slate-100 hover:border-sky-400 shadow-md active:scale-95'
                    : 'bg-slate-950/70 border-slate-800 text-slate-500 cursor-not-allowed opacity-75'
                }`}
              >
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded border border-slate-700">
                  {s.keyLabel}
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight whitespace-nowrap">
                    {s.name}
                  </span>
                  <span className="text-[9px] font-mono">
                    {s.isActive ? 'ACTIVE' : isReady ? 'READY' : `${s.cooldownRemaining.toFixed(1)}s`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
