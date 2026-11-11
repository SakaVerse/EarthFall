import React from 'react';
import { Volume2, VolumeX, Play, Settings, Trophy, ShoppingBag, Target, ListOrdered } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { DailyMissionsManager } from '../game/dailyMissions';
import { CosmeticsManager } from '../game/cosmetics';

interface TitleScreenProps {
  onStart: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onSettings: () => void;
  bestScore: number;
  muted: boolean;
  onToggleMute: () => void;
  isMobile: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenShop,
  onOpenMissions,
  onOpenLeaderboard,
  onSettings,
  bestScore,
  muted,
  onToggleMute,
  isMobile,
}) => {
  const missions = DailyMissionsManager.getMissions();
  const unclaimedCount = missions.filter((m) => m.completed && !m.claimed).length;
  const scrapBalance = CosmeticsManager.getScrapBalance();

  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center p-3 sm:p-6 pointer-events-none select-none z-30 overflow-hidden">
      {/* TOP HEADER: BEST SCORE & AUDIO / SETTINGS */}
      <div className="w-full flex justify-between items-center max-w-4xl pointer-events-auto">
        {/* Best Score Pill */}
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-sky-500/30 shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
            BEST SCORE
          </span>
          <span className="text-sm sm:text-base font-mono-numbers font-black text-white text-glow-cyan">
            {bestScore.toLocaleString()}
          </span>
        </div>

        {/* Currency & Quick Settings */}
        <div className="flex items-center gap-2">
          {/* Coins / Scrap Pill */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-2xl border border-amber-500/30 text-amber-300 shadow-md">
            <span className="text-xs">🪙</span>
            <span className="text-xs sm:text-sm font-mono-numbers font-black">{scrapBalance}</span>
          </div>

          {/* Quick Mute Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleMute();
            }}
            className="p-2.5 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Toggle Sound"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Settings Modal */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onSettings();
            }}
            className="p-2.5 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER: BIG TITLE "EARTH FALL" & BIG PLAY BUTTON */}
      <div className="flex flex-col items-center text-center my-auto pointer-events-auto max-w-lg w-full px-4">
        {/* BIG CLEAN TITLE */}
        <div className="mb-2">
          <h1 className="text-5xl sm:text-7xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-200 to-sky-500 filter drop-shadow-[0_0_35px_rgba(56,189,248,0.65)]">
            EARTH FALL
          </h1>
          <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.35em] text-sky-300 font-semibold mt-1">
            BEYOND THE SOLAR SYSTEM
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 mb-8 max-w-sm">
          Survive uncharted cosmic hazards and guide Earth across infinite deep space.
        </p>

        {/* BIGGEST CENTERED PLAY BUTTON */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onStart();
          }}
          className="group relative w-full sm:w-72 py-4 px-8 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-lg sm:text-xl rounded-3xl shadow-[0_0_40px_rgba(56,189,248,0.6)] hover:shadow-[0_0_55px_rgba(56,189,248,0.85)] active:scale-95 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer ring-2 ring-sky-400/50"
        >
          <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform" />
          <span className="tracking-wider">PLAY</span>
        </button>

        {/* CLEAN BUTTON ROW: SHOP, QUESTS, LEADERBOARD */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full sm:w-96 mt-4">
          {/* Shop */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenShop();
            }}
            className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[11px] sm:text-xs font-bold tracking-tight">Shop</span>
          </button>

          {/* Quests / Directives */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenMissions();
            }}
            className="relative flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Target className="w-5 h-5 text-sky-400 mb-1" />
            <span className="text-[11px] sm:text-xs font-bold tracking-tight">Quests</span>
            {unclaimedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-md">
                {unclaimedCount}
              </span>
            )}
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenLeaderboard();
            }}
            className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ListOrdered className="w-5 h-5 text-purple-400 mb-1" />
            <span className="text-[11px] sm:text-xs font-bold tracking-tight">Ranks</span>
          </button>
        </div>
      </div>

      {/* BOTTOM COMPACT CONTROLS HINT */}
      <div className="pointer-events-none text-center">
        <p className="text-[10px] sm:text-xs font-mono text-slate-400 bg-slate-950/80 px-3.5 py-1 rounded-full border border-slate-800 shadow">
          {isMobile ? (
            <span>Tap Right to Jump &bull; Tap Left to Dive &bull; Tap Icons for Skills</span>
          ) : (
            <span>SPACE to Jump &bull; S/DOWN to Dive &bull; Q / E / F for Skills</span>
          )}
        </p>
      </div>
    </div>
  );
};
