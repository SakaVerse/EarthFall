import React from 'react';
import { Volume2, VolumeX, Play, BookOpen, Settings, Trophy, Sparkles, ShoppingBag, Target } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { DailyMissionsManager } from '../game/dailyMissions';
import { CosmeticsManager } from '../game/cosmetics';

interface TitleScreenProps {
  onStart: () => void;
  onStory: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onToggleControlMode?: () => void;
  bestScore: number;
  muted: boolean;
  onToggleMute: () => void;
  isMobile: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onStory,
  onHowToPlay,
  onSettings,
  onOpenShop,
  onOpenMissions,
  onToggleControlMode,
  bestScore,
  muted,
  onToggleMute,
  isMobile,
}) => {
  const missions = DailyMissionsManager.getMissions();
  const unclaimedCount = missions.filter((m) => m.completed && !m.claimed).length;
  const completedCount = missions.filter((m) => m.completed).length;
  const scrapBalance = CosmeticsManager.getScrapBalance();
  const equippedSkin = CosmeticsManager.getEquippedSkin();

  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center p-3 sm:p-5 md:p-8 pointer-events-none select-none">
      {/* TOP COMMAND BAR */}
      <div className="w-full flex justify-between items-center max-w-5xl pointer-events-auto flex-wrap gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-mono-numbers text-sky-300 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-sky-500/30 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline text-slate-400 text-[11px] font-mono">RECORD</span>
            <span className="font-bold text-white text-glow-cyan">{bestScore.toLocaleString()}</span>
          </div>

          {/* Device & Controls Mode Interactive Switcher */}
          <button
            onClick={() => {
              soundEngine.playClick();
              if (onToggleControlMode) onToggleControlMode();
            }}
            className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-sky-200 bg-slate-950/80 hover:bg-slate-900 border border-sky-500/40 px-3 py-1.5 rounded-full transition-all duration-150 shadow-md active:scale-95 cursor-pointer"
            title="Click to toggle between PC and Mobile Controls mode"
          >
            <span>{isMobile ? '📱 MOBILE MODE' : '💻 PC MODE'}</span>
            <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-1.5 py-0.5 rounded-full">
              SWITCH
            </span>
          </button>

          {/* Space Scrap Counter */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenShop();
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/50 px-3 py-1.5 rounded-full transition-colors shadow-sm cursor-pointer"
            title="Open Cosmetic Hangar & Shop"
          >
            <span>⚙️</span>
            <span className="font-bold font-mono-numbers">{scrapBalance}</span>
            <span className="hidden sm:inline text-amber-400/80 text-[10px]">SCRAP</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Daily Directives Widget Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenMissions();
            }}
            className="relative flex items-center gap-1.5 text-xs font-mono text-sky-200 bg-slate-950/80 hover:bg-slate-900 border border-sky-500/35 px-3.5 py-1.5 rounded-full transition-colors shadow-md cursor-pointer"
            title="View Daily Directives"
          >
            <Target className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold hidden sm:inline">DIRECTIVES</span>
            <span className="text-[11px] font-mono-numbers text-sky-300">
              {completedCount}/{missions.length}
            </span>
            {unclaimedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-md">
                {unclaimedCount}
              </span>
            )}
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleMute();
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-950/80 hover:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700/60 transition-colors shadow-sm cursor-pointer"
            title="Toggle Audio"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            <span className="hidden sm:inline">{muted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>
        </div>
      </div>

      {/* HERO STARSHIP CENTERPIECE */}
      <div className="flex flex-col items-center text-center my-auto pointer-events-auto max-w-2xl px-2">
        <div className="relative mb-2">
          {/* Cosmic Emblem SVG */}
          <svg className="w-64 sm:w-80 md:w-96 h-28 mx-auto" viewBox="0 0 400 110" fill="none">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0)" />
                <stop offset="50%" stopColor="rgba(56, 189, 248, 0.85)" />
                <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
              </linearGradient>
            </defs>
            <ellipse cx="200" cy="55" rx="190" ry="24" stroke="url(#orbitGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
            <text
              x="200"
              y="58"
              textAnchor="middle"
              className="font-display font-black tracking-widest text-4xl sm:text-5xl"
              fill="url(#titleGrad)"
              style={{ filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.65))' }}
            >
              EARTHFALL
            </text>
            <text
              x="200"
              y="85"
              textAnchor="middle"
              className="font-mono text-xs tracking-[0.32em] font-semibold"
              fill="#bae6fd"
            >
              BEYOND THE SOLAR SYSTEM
            </text>
          </svg>
        </div>

        {/* Active Cosmetic Skin Badge */}
        <div className="mb-4">
          <span className="text-[11px] font-mono text-sky-200 bg-slate-950/80 border border-sky-500/35 px-3 py-1 rounded-full shadow-md">
            EQUIPPED: <span className="font-bold text-white">{equippedSkin.name}</span> &middot; THEME: <span className="uppercase text-amber-300 font-bold">{equippedSkin.themeId}</span>
          </span>
        </div>

        <p className="text-xs sm:text-sm md:text-base text-slate-300/90 max-w-lg mb-6 leading-relaxed font-normal">
          Severed from the Sun’s gravitational anchor by an unprecedented solar shockwave.
          Navigate Earth through uncharted asteroid belts, manage jump stamina, and evade cosmic singularities.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            onClick={() => {
              soundEngine.playClick();
              onStart();
            }}
            className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base md:text-lg rounded-2xl shadow-[0_0_35px_rgba(56,189,248,0.5)] hover:shadow-[0_0_45px_rgba(56,189,248,0.75)] active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current text-white" />
            <span className="tracking-wide">
              {isMobile ? 'LAUNCH FLIGHT' : 'LAUNCH INTO THE VOID'}
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenShop();
            }}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3.5 bg-slate-950/80 hover:bg-slate-900 text-amber-300 hover:text-white text-sm font-semibold rounded-2xl border border-amber-500/40 shadow-lg hover:border-amber-400 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Skin Shop & Hangar</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onStory();
            }}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3.5 bg-slate-950/80 hover:bg-slate-900 text-sky-200 hover:text-white text-sm font-semibold rounded-2xl border border-sky-500/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Story</span>
          </button>
        </div>

        {/* Secondary Links */}
        <div className="flex items-center gap-4 mt-5 text-xs text-slate-400">
          <button
            onClick={() => {
              soundEngine.playClick();
              onHowToPlay();
            }}
            className="flex items-center gap-1.5 hover:text-sky-300 transition-colors py-1 px-2 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Flight Manual & Hazards</span>
          </button>
          <span>·</span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onSettings();
            }}
            className="flex items-center gap-1.5 hover:text-sky-300 transition-colors py-1 px-2 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Controls</span>
          </button>
        </div>
      </div>

      {/* STRICT DEVICE CONTROLS GUIDE (PC VS MOBILE SEPARATION) */}
      <div className="pointer-events-none text-center">
        {isMobile ? (
          <p className="text-[11px] sm:text-xs font-mono text-slate-200 bg-slate-950/90 px-4 py-1.5 rounded-full border border-sky-500/40 shadow-lg">
            <span className="text-sky-300 font-bold">RIGHT THUMB</span> Ascend (Stamina) &middot;{' '}
            <span className="text-amber-300 font-bold">LEFT THUMB</span> Dive &middot;{' '}
            <span className="text-emerald-400 font-bold">TOUCH GROUND</span> Recharge &middot;{' '}
            <span className="text-cyan-300 font-bold">TACTICAL DOCK</span> Skills
          </p>
        ) : (
          <p className="text-[11px] sm:text-xs font-mono text-slate-300 bg-slate-950/90 px-4 py-1.5 rounded-full border border-slate-700/60 shadow-lg">
            <span className="text-sky-300 font-semibold">SPACE / ↑ / W</span> Ascend (Costs Stamina) &middot;{' '}
            <span className="text-amber-300 font-semibold">S / ↓</span> Dive &middot;{' '}
            <span className="text-emerald-400 font-semibold">GROUND</span> Recharges Stamina &middot;{' '}
            <span className="text-cyan-300 font-semibold">Q / E / F</span> Skills &middot;{' '}
            <span className="text-slate-300 font-semibold">ESC</span> Pause
          </p>
        )}
      </div>
    </div>
  );
};
