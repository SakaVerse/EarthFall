import React, { useEffect } from 'react';
import { Trophy, Sparkles, Crown } from 'lucide-react';

interface NewBestOverlayProps {
  score: number;
  onDismiss?: () => void;
}

export const NewBestOverlay: React.FC<NewBestOverlayProps> = ({ score, onDismiss }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code) && onDismiss) {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md cursor-pointer select-none animate-fadeIn overflow-hidden"
    >
      {/* Background radial expansion glow & cosmic rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gradient-to-r from-amber-500/20 via-sky-500/15 to-purple-500/20 blur-3xl animate-pulse" />
        <div className="absolute w-[200px] sm:w-[320px] h-[200px] sm:h-[320px] rounded-full border border-amber-400/40 animate-ping opacity-60" />
        <div className="absolute w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] rounded-full border border-sky-400/30 animate-pulse opacity-40" />
      </div>

      {/* Main Center Overlay Card */}
      <div className="relative flex flex-col items-center text-center max-w-md w-full p-6 animate-scaleUp">
        {/* Crown & Floating Trophy Icon */}
        <div className="relative mb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-amber-600/30 border border-amber-400/60 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.6)]">
            <Trophy className="w-8 h-8 sm:w-11 sm:h-11 text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
          </div>
          <Crown className="absolute -top-3.5 -right-3.5 w-7 h-7 sm:w-8 sm:h-8 text-amber-300 fill-amber-300 rotate-12 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-bounce" />
          <Sparkles className="absolute -bottom-2 -left-3 w-5 h-5 text-sky-300 animate-pulse" />
        </div>

        {/* Small Ribbon / Pre-Title */}
        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] uppercase mb-2 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>ALL-TIME RECORD SHATTERED</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>

        {/* BIG ANIMATED 'NEW BEST!' HEADLINE */}
        <h1 className="text-4xl sm:text-7xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 filter drop-shadow-[0_0_35px_rgba(245,158,11,0.8)] leading-none my-1">
          NEW BEST!
        </h1>

        {/* Score Number Display */}
        <div className="mt-2.5 flex flex-col items-center bg-slate-900/80 border border-amber-500/40 rounded-2xl px-6 py-2.5 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400">
            RECORD FLIGHT SCORE
          </span>
          <span className="text-2xl sm:text-4xl font-mono-numbers font-black text-white text-glow-cyan">
            {score.toLocaleString()} <span className="text-xs sm:text-sm font-mono text-amber-400">PTS</span>
          </span>
        </div>

        <p className="text-[11px] font-mono text-slate-400 mt-3 animate-pulse">
          Tap or press Space to continue...
        </p>
      </div>
    </div>
  );
};
