import React from 'react';
import { Pause, Volume2, VolumeX, Zap, Compass, Heart, Radio, Sparkles } from 'lucide-react';
import { ActivePowerUp, ActiveSkill, PlayerStats, SkillType } from '../game/types';
import { POWER_UP_CONFIG, ZONES } from '../game/constants';
import { soundEngine } from '../game/audio';

interface HUDProps {
  stats: PlayerStats;
  health: number;
  stamina?: number;
  isGrounded?: boolean;
  isGroundHazardActive?: boolean;
  scrapBalance?: number;
  activePowerUps: ActivePowerUp[];
  skills: ActiveSkill[];
  bestScore: number;
  muted: boolean;
  isMobile?: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onTriggerSkill: (type: SkillType) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  health,
  stamina = 100,
  isGrounded = false,
  isGroundHazardActive = false,
  scrapBalance = 0,
  activePowerUps,
  skills,
  bestScore,
  muted,
  isMobile = false,
  onPause,
  onToggleMute,
  onTriggerSkill,
}) => {
  const currentZone = ZONES[stats.zone];
  const isBoosted = activePowerUps.some((p) => p.type === 'COSMIC_BOOST');
  const healthPercent = Math.max(0, Math.min(100, health));

  // Health color gradient
  const healthBarColor =
    healthPercent > 60
      ? 'from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
      : healthPercent > 30
      ? 'from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
      : 'from-rose-600 to-red-500 shadow-[0_0_14px_rgba(244,63,94,0.9)] animate-pulse';

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 z-20">
      {/* TOP FLIGHT TELEMETRY CONSOLE */}
      <div className="w-full flex items-start justify-between gap-3">
        {/* Left Cluster: Orbital Distance & Trajectory Score */}
        <div className="flex flex-col gap-1.5 pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-sky-500/25 px-4 py-2.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
              SCORE
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-mono-numbers font-black text-white text-glow-cyan tracking-tight">
              {stats.score.toLocaleString()}
            </span>
            {isBoosted && (
              <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50 animate-pulse">
                3X WARP
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono-numbers text-slate-300">
            <div className="flex items-center gap-1 text-sky-300">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold">{Math.round(stats.distance).toLocaleString()}</span>
              <span className="text-[10px] text-sky-400/80">LY</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span>BEST</span>
              <span className="text-slate-200 font-semibold">{Math.max(bestScore, stats.score).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Center Cluster: Current Celestial Sector */}
        <div className="hidden lg:flex items-center gap-2 pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-4 py-2 rounded-full shadow-lg">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-xs font-display font-bold uppercase tracking-widest text-slate-200">
            {currentZone.name}
          </span>
        </div>

        {/* Right Cluster: Earth Biosphere, Stamina & Hardware Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-sky-500/25 px-3.5 py-2.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            {/* Biosphere Integrity Gauge */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart className={`w-3.5 h-3.5 ${healthPercent < 35 ? 'text-rose-500 animate-ping' : 'text-emerald-400'}`} />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">BIOSPHERE</span>
                <span className="text-xs font-mono-numbers font-black text-white">{Math.round(healthPercent)}%</span>
              </div>
              <div className="w-20 sm:w-28 h-2.5 bg-slate-900 border border-slate-700/60 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full transition-all duration-150 rounded-full bg-gradient-to-r ${healthBarColor}`}
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            {/* Jump Stamina Gauge (Only on PC HUD; Mobile has direct radial thumb ring) */}
            {!isMobile && (
              <>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">STAMINA</span>
                    <span className="text-xs font-mono-numbers font-black text-cyan-200">{Math.round(stamina)}%</span>
                  </div>
                  <div className="w-20 sm:w-28 h-2.5 bg-slate-900 border border-slate-700/60 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full transition-all duration-75 rounded-full ${
                        stamina < 22
                          ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                          : 'bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_8px_#22d3ee]'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, stamina))}%` }}
                    />
                  </div>
                  {isGrounded && (
                    <span className="text-[8px] font-mono font-bold text-emerald-400 leading-none mt-1 animate-pulse">
                      ⚡ GROUND CHARGING
                    </span>
                  )}
                </div>

                <div className="h-7 w-px bg-slate-800" />
              </>
            )}

            {/* Space Currency & Collectibles */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5" title="Cosmic Energy Orbs">
                <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                <span className="text-xs font-mono-numbers font-black text-cyan-300">
                  {stats.energyCollected}
                </span>
              </div>
              <div className="flex items-center gap-1.5" title="Space Scrap Balance">
                <span className="text-[11px]">⚙️</span>
                <span className="text-[11px] font-mono-numbers font-bold text-amber-300">
                  {scrapBalance}
                </span>
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            {/* System Audio & Pause Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleMute();
                }}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
                title="Toggle Mute"
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onPause();
                }}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
                title={isMobile ? 'Pause Flight' : 'Pause (ESC)'}
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hazard Alert / Multiplier Banner */}
          {isGroundHazardActive ? (
            <div className="text-[11px] font-mono font-black text-rose-200 bg-rose-950/90 border border-rose-500 px-3 py-1 rounded-full animate-bounce shadow-[0_0_20px_#ef4444]">
              ⚠ SURFACE FRICTION OVERHEAT — ASCEND NOW! ⚠
            </div>
          ) : stats.currentCombo >= 3 ? (
            <div className="text-[11px] font-mono font-black text-amber-300 bg-amber-950/80 border border-amber-500/50 px-3 py-0.5 rounded-full animate-pulse shadow-md">
              ⚡ COMBO X{stats.currentCombo}
            </div>
          ) : null}
        </div>
      </div>

      {/* BOTTOM CONSOLE: Active Powerups on Left, Desktop Skills on Right (PC Only) */}
      <div className="w-full flex items-end justify-between gap-3">
        {/* Active Buffs & Powerups */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {activePowerUps.map((p) => {
            const conf = POWER_UP_CONFIG[p.type];
            const ratio = Math.max(0, p.durationRemaining / p.maxDuration);
            return (
              <div
                key={p.type}
                className="flex items-center gap-2.5 bg-slate-950/85 backdrop-blur-md border border-slate-700/70 px-3.5 py-2 rounded-2xl shadow-xl"
              >
                <span className="text-lg">{conf.symbol}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase font-black text-slate-200">
                    {conf.name}
                  </span>
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${ratio * 100}%`,
                        backgroundColor: conf.color,
                        boxShadow: `0 0 8px ${conf.color}`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP KEYBOARD SKILL CONSOLE (Only rendered on PC; Mobile uses the TouchControls thumb dock) */}
        {!isMobile && (
          <div className="flex items-center gap-2 pointer-events-auto">
            {skills.map((s) => {
              const isReady = s.cooldownRemaining <= 0;
              return (
                <button
                  key={s.type}
                  onClick={() => onTriggerSkill(s.type)}
                  disabled={!isReady}
                  title={`Press [${s.keyLabel}] to trigger ${s.name}`}
                  className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all select-none ${
                    s.isActive
                      ? 'bg-sky-500/40 border-sky-300 text-white shadow-[0_0_20px_#38bdf8] scale-105'
                      : isReady
                      ? 'bg-slate-950/85 hover:bg-slate-900 border-sky-500/40 text-slate-100 hover:border-sky-300 shadow-lg active:scale-95'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="text-[10px] font-mono font-black bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-lg border border-sky-400/30">
                    {s.keyLabel}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold tracking-tight text-white">
                      {s.name}
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-slate-400">
                      {s.isActive ? 'ENGAGED' : isReady ? 'READY' : `${s.cooldownRemaining.toFixed(1)}s`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
