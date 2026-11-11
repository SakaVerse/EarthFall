import React from 'react';
import { Volume2, VolumeX, Play, Settings, Trophy, ShoppingBag, Target, ListOrdered, BookOpen } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { DailyMissionsManager } from '../game/dailyMissions';
import { CosmeticsManager } from '../game/cosmetics';
import { LeaderboardManager } from '../game/leaderboard';

interface TitleScreenProps {
  onStart: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onOpenStory: () => void;
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
  onOpenStory,
  onSettings,
  bestScore,
  muted,
  onToggleMute,
  isMobile,
}) => {
  const unclaimedCount = DailyMissionsManager.getUnclaimedCount();
  const scrapBalance = CosmeticsManager.getScrapBalance();
  const currentNickname = LeaderboardManager.getUsername();

  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center p-2 sm:p-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pointer-events-none select-none z-30 overflow-hidden">
      {/* TOP HEADER: BEST SCORE & QUICK SETTINGS */}
      <div className="w-full flex justify-between items-center max-w-4xl pointer-events-auto shrink-0 px-1 sm:px-2">
        {/* Best Score & Callsign Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="mobile-header-pill flex items-center gap-1 sm:gap-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl border border-sky-500/30 shadow-lg">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[8.5px] sm:text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              BEST
            </span>
            <span className="text-xs sm:text-base font-mono-numbers font-black text-white text-glow-cyan">
              {bestScore.toLocaleString()}
            </span>
          </div>

          {currentNickname && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-700/70 text-slate-300 text-xs font-mono shadow-md">
              <span className="text-slate-500 font-bold">PILOT:</span>
              <span className="font-bold text-sky-300">{currentNickname}</span>
            </div>
          )}
        </div>

        {/* Currency & Audio / Settings Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Coins / Scrap Pill */}
          <div className="mobile-header-pill flex items-center gap-1 sm:gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-amber-500/30 text-amber-300 shadow-md">
            <span className="text-xs">🪙</span>
            <span className="text-xs sm:text-sm font-mono-numbers font-black">{scrapBalance}</span>
          </div>

          {/* Quick Mute Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleMute();
            }}
            className="mobile-header-btn p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Toggle Sound"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />}
          </button>

          {/* Settings Modal */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onSettings();
            }}
            className="mobile-header-btn p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* SLEEK SIDE 'STORY' BUTTON (Scaled down cleanly on mobile) */}
      <div className="absolute left-2 sm:left-6 top-[22%] sm:top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenStory();
          }}
          className="mobile-story-pill group flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-950/90 hover:bg-slate-900 border border-sky-500/40 hover:border-sky-400 text-sky-300 hover:text-white transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_30px_rgba(56,189,248,0.45)] active:scale-95 cursor-pointer backdrop-blur-md"
          title="Read the Earthfall Story"
        >
          <div className="p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 group-hover:scale-110 transition-transform">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] sm:text-xs font-display font-black tracking-wider text-white">
              STORY
            </span>
            <span className="hidden sm:inline text-[8px] sm:text-[9px] font-mono text-sky-400/80 -mt-0.5">
              CHRONICLES
            </span>
          </div>
        </button>
      </div>

      {/* CENTER AREA: CLEAN MAIN MENU (RESPONSIVE FOR ALL SCREEN RATIOS) */}
      <div className="mobile-main-menu flex flex-col items-center text-center my-auto pointer-events-auto max-w-md w-full px-2 sm:px-4">
        {/* BIG CLEAN TITLE */}
        <div className="mb-0.5 sm:mb-2">
          <h1 className="mobile-title-text text-4xl sm:text-7xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-200 to-sky-500 filter drop-shadow-[0_0_35px_rgba(56,189,248,0.65)]">
            EARTH FALL
          </h1>
          <p className="mobile-subtitle-text text-[9.5px] sm:text-xs font-mono uppercase tracking-[0.35em] text-sky-300 font-semibold mt-0.5 sm:mt-1">
            BEYOND THE SOLAR SYSTEM
          </p>
        </div>

        <p className="mobile-desc-text text-[11px] sm:text-sm text-slate-400 mb-3 sm:mb-8 max-w-sm">
          Survive uncharted cosmic hazards and guide Earth across infinite deep space.
        </p>

        {/* BIG PLAY BUTTON */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onStart();
          }}
          className="mobile-play-btn group relative w-full max-w-[210px] sm:max-w-none sm:w-72 py-3 sm:py-4 px-6 sm:px-8 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm sm:text-xl rounded-2xl sm:rounded-3xl shadow-[0_0_35px_rgba(56,189,248,0.6)] hover:shadow-[0_0_55px_rgba(56,189,248,0.85)] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 sm:gap-3 cursor-pointer ring-2 ring-sky-400/50 mb-2.5 sm:mb-4"
        >
          <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-white text-white group-hover:scale-110 transition-transform" />
          <span className="tracking-wider">PLAY</span>
        </button>

        {/* CLEAN BUTTON ROW: SHOP, QUESTS, RANKS */}
        <div className="mobile-nav-grid grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[260px] sm:max-w-none sm:w-96">
          {/* Shop */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenShop();
            }}
            className="mobile-nav-btn flex flex-col items-center justify-center py-1.5 sm:py-3 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400 mb-0.5 sm:mb-1" />
            <span className="text-[10px] sm:text-xs font-bold tracking-tight">Shop</span>
          </button>

          {/* Quests */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenMissions();
            }}
            className="mobile-nav-btn relative flex flex-col items-center justify-center py-1.5 sm:py-3 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Target className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-sky-400 mb-0.5 sm:mb-1" />
            <span className="text-[10px] sm:text-xs font-bold tracking-tight">Quests</span>
            {unclaimedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-md">
                {unclaimedCount}
              </span>
            )}
          </button>

          {/* Ranks (Opens Global Leaderboard Popup) */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenLeaderboard();
            }}
            className="mobile-nav-btn flex flex-col items-center justify-center py-1.5 sm:py-3 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Today's Top 10 Global Leaderboard"
          >
            <ListOrdered className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-purple-400 mb-0.5 sm:mb-1" />
            <span className="text-[10px] sm:text-xs font-bold tracking-tight">Ranks</span>
          </button>
        </div>
      </div>

      {/* BOTTOM CONTROLS HINT */}
      <div className="pointer-events-none text-center shrink-0 pb-1">
        <p className="text-[8.5px] sm:text-xs font-mono text-slate-400 bg-slate-950/80 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-slate-800 shadow">
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
