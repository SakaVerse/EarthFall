import React, { useEffect } from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, ShoppingBag } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenShop?: () => void;
  muted: boolean;
  isMobile?: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  onOpenShop,
  muted,
  isMobile = false,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        soundEngine.playClick();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] z-40 select-none animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col items-center text-center my-auto custom-scrollbar">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold mb-1">
          ORBITAL STABILIZERS ENGAGED
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wider mb-4 sm:mb-6">
          GAME PAUSED
        </h2>

        <div className="w-full flex flex-col gap-2 sm:gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-colors text-xs sm:text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isMobile ? 'RESUME FLIGHT' : 'RESUME (ESC)'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl sm:rounded-2xl border border-slate-700 transition-colors text-xs sm:text-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART FLIGHT</span>
          </button>

          {onOpenShop && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenShop();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 hover:text-white font-semibold rounded-xl sm:rounded-2xl border border-amber-500/40 transition-colors text-xs sm:text-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>COSMETIC HANGAR</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleMute();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl sm:rounded-2xl border border-slate-700 transition-colors text-xs sm:text-sm cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            <span>{muted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onHome();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold rounded-xl sm:rounded-2xl border border-slate-800 transition-colors text-xs sm:text-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
