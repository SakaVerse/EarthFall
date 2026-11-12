import React from 'react';
import { Pause, Volume2, VolumeX, Zap, Compass, Heart, Radio, AlertTriangle, Rocket, Shield } from 'lucide-react';
import { ActivePowerUp, ActiveSkill, PlayerStats, SkillType } from '../game/types';
import { POWER_UP_CONFIG, ZONES } from '../game/constants';
import { soundEngine } from '../game/audio';
import { LeaderboardManager } from '../game/leaderboard';

interface HUDProps {
  stats: PlayerStats;
  health: number;
  jumpsRemaining?: number;
  maxJumps?: number;
  isGrounded?: boolean;
  isGroundHazardActive?: boolean;
  scrapBalance?: number;
  shardsBalance?: number;
  isFistMode?: boolean;
  onToggleFistMode?: () => void;
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
  jumpsRemaining = 10,
  maxJumps = 10,
  isGrounded = false,
  isGroundHazardActive = false,
  scrapBalance = 0,
  shardsBalance = 0,
  isFistMode = false,
  onToggleFistMode,
  activePowerUps,
  skills,
  bestScore,
  muted,
  isMobile = false,
  onPause,
  onToggleMute,
  onTriggerSkill,
}) => {
  const currentZone = ZONES[stats.zone] || ZONES.solar_system;
  const isBoosted = activePowerUps.some((p) => p.type === 'COSMIC_BOOST');
  const healthPercent = Math.max(0, Math.min(100, health));
  const isAtmosphereLow = healthPercent < 25;
  const isLowJumps = jumpsRemaining <= 3;
  const gamesPlayed = LeaderboardManager.getGamesPlayedCount();
  const showAbilitiesHint = gamesPlayed <= 3;

  // Atmosphere bar styling
  const healthBarColor = isAtmosphereLow
    ? 'from-red-600 to-rose-500 shadow-[0_0_18px_rgba(239,68,68,1)] animate-pulse'
    : healthPercent > 60
    ? 'from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
    : 'from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.7)]';

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-1.5 sm:p-4 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] pl-[max(0.4rem,env(safe-area-inset-left))] pr-[max(0.4rem,env(safe-area-inset-right))] z-20 overflow-hidden">
      {/* TOP FLIGHT TELEMETRY CONSOLE */}
      <div className="w-full flex items-start justify-between gap-1 sm:gap-2 max-w-full">
        {/* Left Cluster: Distance & Score */}
        <div className="flex flex-col gap-0.5 pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-sky-500/30 px-2 py-1 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="text-[7.5px] sm:text-[9.5px] font-mono uppercase text-sky-400 font-bold tracking-widest">
              SCORE
            </span>
            <span className="text-sm sm:text-2xl font-mono-numbers font-black text-white text-glow-cyan tracking-tight">
              {stats.score.toLocaleString()}
            </span>
            {isBoosted && (
              <span className="text-[7.5px] sm:text-[9px] font-black text-amber-300 bg-amber-950/90 px-1 py-0.2 rounded border border-amber-500/60 animate-pulse">
                3X
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono-numbers text-slate-300">
            <div className="flex items-center gap-1 text-sky-300 text-[9px] sm:text-xs">
              <Compass className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-sky-400" />
              <span className="font-bold">{Math.round(stats.distance).toLocaleString()}</span>
              <span className="text-[7.5px] sm:text-[9px] text-sky-400/80">LY</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1 text-slate-400 text-[8.5px] sm:text-[10.5px]">
              <span>BEST</span>
              <span className="text-slate-200 font-semibold">{Math.max(bestScore, stats.score).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Center Cluster: Current Celestial Sector */}
        <div className="hidden md:flex items-center gap-2 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-3.5 py-1.5 rounded-full shadow-lg">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-xs font-display font-bold uppercase tracking-widest text-slate-200">
            {currentZone.name}
          </span>
        </div>

        {/* Right Cluster: Earth Atmosphere, 10 Jumps Counter & Controls */}
        <div className="flex flex-col items-end gap-1 pointer-events-auto">
          <div
            className={`flex items-center gap-1 sm:gap-2 bg-slate-950/90 backdrop-blur-md px-1.5 py-1 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all ${
              isAtmosphereLow
                ? 'border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse'
                : 'border border-sky-500/25'
            }`}
          >
            {/* Atmosphere Integrity Gauge */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 mb-0.5">
                <Heart className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${isAtmosphereLow ? 'text-rose-500 animate-ping' : 'text-emerald-400'}`} />
                <span className={`text-[7.5px] sm:text-[9px] font-mono font-bold uppercase ${isAtmosphereLow ? 'text-red-400 font-black' : 'text-slate-400'}`}>
                  {isMobile ? 'ATMO' : 'ATMOSPHERE'}
                </span>
                <span className={`text-[9px] sm:text-xs font-mono-numbers font-black ${isAtmosphereLow ? 'text-rose-300' : 'text-white'}`}>
                  {Math.round(healthPercent)}%
                </span>
              </div>
              <div className="w-12 sm:w-20 h-1 sm:h-1.5 bg-slate-900 border border-slate-700/60 rounded-full overflow-hidden p-0.2">
                <div
                  className={`h-full transition-all duration-150 rounded-full bg-gradient-to-r ${healthBarColor}`}
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>

            <div className="h-4 sm:h-6 w-px bg-slate-800" />

            {/* JUMPS COUNTER (10 LIMITED JUMPS, RECOVER ON GROUND) */}
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border transition-all ${
                isLowJumps
                  ? 'bg-rose-950/90 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse ring-1 ring-rose-400'
                  : 'bg-slate-900/90 border-sky-500/40 shadow-sm'
              }`}
              title="10 Limited Jumps - Recharges on Ground"
            >
              <Rocket className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${isLowJumps ? 'text-rose-400' : 'text-sky-400'}`} />
              <div className="flex flex-col items-end">
                <span className={`text-[8.5px] sm:text-xs font-mono font-black ${
                  isLowJumps ? 'text-rose-300' : 'text-sky-200'
                }`}>
                  {jumpsRemaining}/{maxJumps}
                </span>
                {/* On desktop show 10 tick marks, on mobile keep it clean */}
                {!isMobile && (
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: maxJumps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-1 sm:w-1.5 rounded-xs transition-all ${
                          i < jumpsRemaining
                            ? isLowJumps
                              ? 'bg-rose-500 shadow-[0_0_4px_#f43f5e]'
                              : 'bg-sky-400 shadow-[0_0_4px_#38bdf8]'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="h-4 sm:h-6 w-px bg-slate-800" />

            {/* Currency & Shards */}
            <div className="flex flex-col items-start gap-0.5">
              <div className="flex items-center gap-1" title="Cosmic Shards">
                <span className="text-[8px] sm:text-[10px]">💎</span>
                <span className="text-[8.5px] sm:text-[10.5px] font-mono-numbers font-black text-cyan-300">
                  {shardsBalance}
                </span>
              </div>
              <div className="flex items-center gap-1" title="Space Scrap">
                <span className="text-[8px] sm:text-[10px]">🪙</span>
                <span className="text-[8.5px] sm:text-[10.5px] font-mono-numbers font-bold text-amber-300">
                  {scrapBalance}
                </span>
              </div>
            </div>

            <div className="h-4 sm:h-6 w-px bg-slate-800" />

            {/* GUARDIAN COMBAT STATUS / TOGGLE */}
            {onToggleFistMode && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleFistMode();
                }}
                className={`p-1 sm:p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isFistMode
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Toggle Guardian Combat (Earth on Back Solar Ring)"
              >
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}

            {/* System Audio & Pause Buttons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleMute();
                }}
                className="p-1 sm:p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm cursor-pointer"
                title="Toggle Mute"
              >
                {muted ? <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" /> : <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />}
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onPause();
                }}
                className="p-1 sm:p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm cursor-pointer"
                title={isMobile ? 'Pause Flight' : 'Pause (ESC)'}
              >
                <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* CRITICAL WARNING BANNERS */}
          {isAtmosphereLow ? (
            <div className="flex items-center gap-1 text-[9.5px] sm:text-xs font-mono font-black text-rose-100 bg-rose-600/95 border-2 border-rose-400 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.9)]">
              <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300" />
              <span>ATMOSPHERE LOW!</span>
            </div>
          ) : isGroundHazardActive ? (
            <div className="text-[8.5px] sm:text-[10px] font-mono font-black text-rose-200 bg-rose-950/90 border border-rose-500 px-2 py-0.5 rounded-full animate-bounce shadow-[0_0_15px_#ef4444]">
              ⚠ SURFACE FRICTION CRITICAL — ASCEND NOW! ⚠
            </div>
          ) : isLowJumps && !isGrounded ? (
            <div className="text-[8px] sm:text-[10px] font-mono font-black text-rose-200 bg-rose-950/90 border border-rose-500 px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_15px_#f43f5e]">
              ⚡ {jumpsRemaining === 0 ? 'OUT OF JUMPS!' : `LOW JUMPS: ${jumpsRemaining}/${maxJumps}`} — TOUCH GROUND/PLATFORM TO REFILL!
            </div>
          ) : stats.currentCombo >= 3 ? (
            <div className="text-[8.5px] sm:text-[10px] font-mono font-black text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-full animate-pulse shadow-md">
              ⚡ COMBO X{stats.currentCombo}
            </div>
          ) : null}
        </div>
      </div>

      {/* BOTTOM CONSOLE: Active Powerups on Left, Desktop Skills on Right (PC Only) */}
      <div className="w-full flex items-end justify-between gap-2 max-w-full">
        {/* Active Buffs & Powerups */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto flex-wrap">
          {activePowerUps.map((p) => {
            const conf = POWER_UP_CONFIG[p.type];
            const ratio = Math.max(0, p.durationRemaining / p.maxDuration);
            return (
              <div
                key={p.type}
                className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-700/70 px-2 py-1 rounded-xl shadow-lg"
              >
                <span className="text-sm sm:text-base">{conf.symbol}</span>
                <div className="flex flex-col">
                  <span className="text-[7.5px] sm:text-[9px] font-mono uppercase font-black text-slate-200">
                    {conf.name}
                  </span>
                  <div className="w-12 sm:w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
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

        {/* DESKTOP KEYBOARD SKILL CONSOLE */}
        {!isMobile && (
          <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
            {/* First 3 Games Keybind Hint Banner */}
            {showAbilitiesHint && (
              <div className="flex items-center gap-1.5 bg-sky-950/90 border border-sky-400/80 px-2 py-0.5 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.4)] animate-pulse">
                <span className="text-[9px] font-mono font-bold text-sky-200">
                  ⚡ PRESS <strong className="text-white underline">X</strong> PUNCH &bull; <strong className="text-white underline">C</strong> RING &bull; <strong className="text-white underline">Q/E/F</strong> SKILLS!
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2">
              {skills.map((s) => {
                const isReady = s.cooldownRemaining <= 0;
                return (
                  <button
                    key={s.type}
                    onClick={() => onTriggerSkill(s.type)}
                    disabled={!isReady}
                    title={`Press [${s.keyLabel}] to trigger ${s.name}`}
                    className={`relative flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all select-none ${
                      s.isActive
                        ? 'bg-sky-500/40 border-sky-300 text-white shadow-[0_0_20px_#38bdf8] scale-105 ring-2 ring-sky-400'
                        : isReady
                        ? 'bg-slate-950/90 hover:bg-slate-900 border-sky-400/80 text-slate-100 shadow-[0_0_14px_rgba(56,189,248,0.5)] animate-pulse active:scale-95 ring-1 ring-sky-400/50'
                        : 'bg-slate-950/70 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded border ${
                      isReady ? 'bg-sky-500/30 text-sky-200 border-sky-400/60' : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      {s.keyLabel}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">
                        {s.name}
                      </span>
                      <span className={`text-[8.5px] sm:text-[9.5px] font-mono font-bold ${
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
