import React from 'react';
import { Volume2, VolumeX, Play, BookOpen, Settings, Trophy, Sparkles } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  onStory: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
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
  bestScore,
  muted,
  onToggleMute,
  isMobile,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center p-4 sm:p-6 md:p-10 pointer-events-none select-none">
      {/* Top Bar Status */}
      <div className="w-full flex justify-between items-center max-w-5xl pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-mono-numbers text-sky-300/80 bg-slate-900/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-sky-500/20 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">RECORD:</span>
            <span className="font-bold text-white text-glow-cyan">{bestScore.toLocaleString()}</span>
          </div>

          {/* Auto-detected Device Indicator */}
          <div className="text-[11px] font-mono text-slate-300 bg-slate-900/70 border border-slate-700/60 px-2.5 py-1 rounded-full">
            {isMobile ? '📱 MOBILE DETECTED' : '💻 PC DETECTED'}
          </div>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            onToggleMute();
          }}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-900/60 hover:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50 transition-colors"
          title="Toggle Audio"
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          <span className="hidden sm:inline">{muted ? 'MUTED' : 'AUDIO ON'}</span>
        </button>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto pointer-events-auto max-w-2xl">
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
                <stop offset="50%" stopColor="rgba(56, 189, 248, 0.8)" />
                <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
              </linearGradient>
            </defs>
            {/* Planetary Orbit Ring */}
            <ellipse cx="200" cy="55" rx="190" ry="24" stroke="url(#orbitGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
            {/* Title Text */}
            <text
              x="200"
              y="58"
              textAnchor="middle"
              className="font-display font-black tracking-widest text-4xl sm:text-5xl"
              fill="url(#titleGrad)"
              style={{ filter: 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.55))' }}
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

        <p className="text-sm md:text-base text-slate-300/90 max-w-lg mb-8 leading-relaxed font-normal">
          Severed from the Sun’s gravitational anchor by an unprecedented cosmic shockwave.
          Navigate Earth through uncharted asteroid belts, nebulae, and quantum anomalies.
        </p>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            onClick={() => {
              soundEngine.playClick();
              onStart();
            }}
            className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base md:text-lg rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:shadow-[0_0_40px_rgba(56,189,248,0.65)] active:scale-95 transition-all duration-150"
          >
            <Play className="w-5 h-5 fill-current text-white" />
            <span className="tracking-wide">
              {isMobile ? 'TAP TO LAUNCH FLIGHT' : 'LAUNCH INTO THE VOID'}
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onStory();
            }}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-slate-900/70 hover:bg-slate-800 text-sky-200 hover:text-white text-sm font-semibold rounded-xl border border-sky-500/30 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Story Prologue</span>
          </button>
        </div>

        {/* Secondary Action Links */}
        <div className="flex items-center gap-4 mt-6 text-xs text-slate-400">
          <button
            onClick={() => {
              soundEngine.playClick();
              onHowToPlay();
            }}
            className="flex items-center gap-1.5 hover:text-sky-300 transition-colors py-1 px-2"
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
            className="flex items-center gap-1.5 hover:text-sky-300 transition-colors py-1 px-2"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Controls</span>
          </button>
        </div>
      </div>

      {/* Device-Specific Single-Line Control Hint */}
      <div className="pointer-events-none text-center">
        {isMobile ? (
          <p className="text-[11px] sm:text-xs font-mono text-slate-300 bg-slate-950/85 px-4 py-1.5 rounded-full border border-sky-500/30 shadow-md">
            <span className="text-sky-300 font-bold">RIGHT THUMB</span> Ascend &middot;{' '}
            <span className="text-amber-300 font-bold">LEFT THUMB</span> Dive &middot;{' '}
            <span className="text-cyan-300 font-bold">SKILLS</span> Warp &middot; EMP &middot; Vent
          </p>
        ) : (
          <p className="text-[11px] sm:text-xs font-mono text-slate-400/90 bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800/60 shadow-md">
            <span className="text-sky-300 font-semibold">SPACE / ↑</span> Ascend &middot;{' '}
            <span className="text-amber-300 font-semibold">↓ / S</span> Dive &middot;{' '}
            <span className="text-cyan-300 font-semibold">Q</span> Warp &middot;{' '}
            <span className="text-sky-300 font-semibold">E</span> EMP &middot;{' '}
            <span className="text-amber-300 font-semibold">F</span> Vent &middot;{' '}
            <span className="text-slate-300 font-semibold">ESC</span> Pause
          </p>
        )}
      </div>
    </div>
  );
};
