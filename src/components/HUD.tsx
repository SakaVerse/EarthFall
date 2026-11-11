import React from 'react';
import { Pause, Volume2, VolumeX, Zap, Compass, Heart, Radio, Sparkles, AlertTriangle } from 'lucide-react';
import { ActivePowerUp, ActiveSkill, PlayerStats, SkillType } from '../game/types';
import { POWER_UP_CONFIG, ZONES } from '../game/constants';
import { soundEngine } from '../game/audio';
import { LeaderboardManager } from '../game/leaderboard';

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
  const isAtmosphereLow = healthPercent < 25;
  const gamesPlayed = LeaderboardManager.getGamesPlayedCount();
  const showAbilitiesHint = gamesPlayed <= 3;

  // Atmosphere bar styling
  const healthBarColor = isAtmosphereLow
    ? 'from-red-600 to-rose-500 shadow-[0_0_18px_rgba(239,68,68,1)] animate-pulse'
    : healthPercent > 60
    ? 'from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
    : 'from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.7)]';

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2.5 sm:p-4 z-20 overflow-hidden">
      {/* TOP FLIGHT TELEMETRY CONSOLE */}
      <div className="w-full flex items-start justify-between gap-2 max-w-full">
        {/* Left Cluster: Orbital Distance & Trajectory Score */}
        <div className="flex flex-col gap-1 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-sky-500/30 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
              SCORE
            </span>
            <span className="text-lg sm:text-2xl md:text-3xl font-mono-numbers font-black text-white text-glow-cyan tracking-tight">
              {stats.score.toLocaleString()}
            </span>
            {isBoosted && (
              <span className="text-[9px] font-black text-amber-300 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/60 animate-pulse">
                3X
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono-numbers text-slate-300">
            <div className="flex items-center gap-1 text-sky-300 text-[11px] sm:text-xs">
              <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />
              <span className="font-bold">{Math.round(stats.distance).toLocaleString()}</span>
              <span className="text-[9px] text-sky-400/80">LY</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1 text-slate-400 text-[10px] sm:text-[11px]">
              <span>BEST</span>
              <span className="text-slate-200 font-semibold">{Math.max(bestScore, stats.score).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Center Cluster: Current Celestial Sector */}
        <div className="hidden md:flex items-center gap-2 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-4 py-2 rounded-full shadow-lg">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-xs font-display font-bold uppercase tracking-widest text-slate-200">
            {currentZone.name}
          </span>
        </div>

        {/* Right Cluster: Earth Atmosphere, Stamina & Hardware Controls */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          <div
            className={`flex items-center gap-2 sm:gap-3 bg-slate-950/90 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-all ${
              isAtmosphereLow
                ? 'border-2 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.7)] animate-pulse'
                : 'border border-sky-500/25'
            }`}
          >
            {/* Atmosphere Integrity Gauge */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 mb-1">
                <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isAtmosphereLow ? 'text-rose-500 animate-ping' : 'text-emerald-400'}`} />
                <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase ${isAtmosphereLow ? 'text-red-400 font-black' : 'text-slate-400'}`}>
                  ATMOSPHERE
                </span>
                <span className={`text-[11px] sm:text-xs font-mono-numbers font-black ${isAtmosphereLow ? 'text-rose-300' : 'text-white'}`}>
                  {Math.round(healthPercent)}%
                </span>
              </div>
              <div className="w-20 sm:w-28 h-2 sm:h-2.5 bg-slate-900 border border-slate-700/60 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full transition-all duration-150 rounded-full bg-gradient-to-r ${healthBarColor}`}
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>

            <div className="h-6 sm:h-7 w-px bg-slate-800" />

            {/* Jump Stamina Gauge (PC HUD) */}
            {!isMobile && (
              <>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase text-slate-400">STAMINA</span>
                    <span className="text-[11px] sm:text-xs font-mono-numbers font-black text-cyan-200">{Math.round(stamina)}%</span>
                  </div>
                  <div className="w-16 sm:w-24 h-2 sm:h-2.5 bg-slate-900 border border-slate-700/60 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full transition-all duration-75 rounded-full ${
                        stamina < 22
                          ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                          : 'bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_8px_#22d3ee]'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, stamina))}%` }}
                    />
                  </div>
                </div>

                <div className="h-6 sm:h-7 w-px bg-slate-800" />
              </>
            )}

            {/* Space Currency & Collectibles */}
            <div className="flex flex-col items-start gap-0.5 sm:gap-1">
              <div className="flex items-center gap-1" title="Cosmic Energy Orbs">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 fill-cyan-400" />
                <span className="text-[11px] sm:text-xs font-mono-numbers font-black text-cyan-300">
                  {stats.energyCollected}
                </span>
              </div>
              <div className="flex items-center gap-1" title="Space Scrap Balance">
                <span className="text-[10px] sm:text-[11px]">⚙️</span>
                <span className="text-[10px] sm:text-[11px] font-mono-numbers font-bold text-amber-300">
                  {scrapBalance}
                </span>
              </div>
            </div>

            <div className="h-6 sm:h-7 w-px bg-slate-800" />

            {/* System Audio & Pause Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleMute();
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
                title="Toggle Mute"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />}
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onPause();
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
                title={isMobile ? 'Pause Flight' : 'Pause (ESC)'}
              >
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* CRITICAL WARNING BANNERS */}
          {isAtmosphereLow ? (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono font-black text-rose-100 bg-rose-600/95 border-2 border-rose-400 px-3 py-1 rounded-full animate-bounce shadow-[0_0_25px_rgba(239,68,68,0.9)]">
              <AlertTriangle className="w-4 h-4 text-yellow-300" />
              <span>ATMOSPHERE LOW!</span>
            </div>
          ) : isGroundHazardActive ? (
            <div className="text-[10px] sm:text-[11px] font-mono font-black text-rose-200 bg-rose-950/90 border border-rose-500 px-3 py-1 rounded-full animate-bounce shadow-[0_0_20px_#ef4444]">
              ⚠ SURFACE FRICTION CRITICAL — ASCEND NOW! ⚠
            </div>
          ) : stats.currentCombo >= 3 ? (
            <div className="text-[10px] sm:text-[11px] font-mono font-black text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full animate-pulse shadow-md">
              ⚡ COMBO X{stats.currentCombo}
            </div>
          ) : null}
        </div>
      </div>

      {/* BOTTOM CONSOLE: Active Powerups on Left, Desktop Skills on Right (PC Only) */}
      <div className="w-full flex items-end justify-between gap-2 max-w-full">
        {/* Active Buffs & Powerups */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto flex-wrap">
          {activePowerUps.map((p) => {
            const conf = POWER_UP_CONFIG[p.type];
            const ratio = Math.max(0, p.durationRemaining / p.maxDuration);
            return (
              <div
                key={p.type}
                className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-700/70 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl shadow-xl"
              >
                <span className="text-base sm:text-lg">{conf.symbol}</span>
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase font-black text-slate-200">
                    {conf.name}
                  </span>
                  <div className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
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

        {/* DESKTOP KEYBOARD SKILL CONSOLE */}
        {!isMobile && (
          <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
            {/* First 3 Games Keybind Hint Banner */}
            {showAbilitiesHint && (
              <div className="flex items-center gap-1.5 bg-sky-950/90 border border-sky-400/80 px-2.5 py-1 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.4)] animate-pulse">
                <span className="text-[10px] font-mono font-bold text-sky-200">
                  ⚡ TIP: PRESS <strong className="text-white underline">Q</strong> / <strong className="text-white underline">E</strong> / <strong className="text-white underline">F</strong> FOR SKILLS!
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {skills.map((s) => {
                const isReady = s.cooldownRemaining <= 0;
                return (
                  <button
                    key={s.type}
                    onClick={() => onTriggerSkill(s.type)}
                    disabled={!isReady}
                    title={`Press [${s.keyLabel}] to trigger ${s.name}`}
                    className={`relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-2xl border transition-all select-none ${
                      s.isActive
                        ? 'bg-sky-500/40 border-sky-300 text-white shadow-[0_0_22px_#38bdf8] scale-105 ring-2 ring-sky-400'
                        : isReady
                        ? 'bg-slate-950/90 hover:bg-slate-900 border-sky-400/80 text-slate-100 shadow-[0_0_16px_rgba(56,189,248,0.6)] animate-pulse active:scale-95 ring-1 ring-sky-400/50'
                        : 'bg-slate-950/70 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                      isReady ? 'bg-sky-500/30 text-sky-200 border-sky-400/60 font-black' : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      {s.keyLabel}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">
                        {s.name}
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${
                        s.isActive ? 'text-amber-300 animate-pulse' : isReady ? 'text-sky-300 font-black' : 'text-slate-400'
                      }`}>
                        {s.isActive ? 'ENGAGED' : isReady ? 'READY' : `${s.cooldownRemaining.toFixed(1)}s`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
