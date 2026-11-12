import React from 'react';
import { Volume2, VolumeX, Play, Settings, Trophy, ShoppingBag, Target, ListOrdered, BookOpen, Infinity as InfinityIcon, HelpCircle, Shield, RotateCcw } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { DailyMissionsManager } from '../game/dailyMissions';
import { CosmeticsManager } from '../game/cosmetics';
import { LeaderboardManager } from '../game/leaderboard';
import { StoryProgressionManager } from '../game/storyProgression';
import { CHAPTERS } from '../game/constants';
import { CheckpointData } from '../game/types';
import { COSMIC_AVATARS, getCountryFlag } from '../firebase/cloudService';

interface TitleScreenProps {
  onStartInfiniteRun: () => void;
  onStartStoryMode: (fromCheckpoint: boolean) => void;
  savedCheckpoint: CheckpointData | null;
  onClearCheckpoint?: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onOpenStory: () => void;
  onOpenHowToPlay: () => void;
  onSettings: () => void;
  bestScore: number;
  muted: boolean;
  onToggleMute: () => void;
  isMobile: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartInfiniteRun,
  onStartStoryMode,
  savedCheckpoint,
  onClearCheckpoint,
  onOpenShop,
  onOpenMissions,
  onOpenLeaderboard,
  onOpenStory,
  onOpenHowToPlay,
  onSettings,
  bestScore,
  muted,
  onToggleMute,
  isMobile,
}) => {
  const unclaimedCount = DailyMissionsManager.getUnclaimedCount();
  const scrapBalance = CosmeticsManager.getScrapBalance();
  const shardsBalance = StoryProgressionManager.getShards();
  const currentNickname = LeaderboardManager.getUsername();

  const activeChapterInfo = savedCheckpoint ? CHAPTERS[savedCheckpoint.chapter] : null;

  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center p-2 sm:p-5 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pointer-events-none select-none z-30 overflow-y-auto overflow-x-hidden">
      {/* TOP HEADER: BEST SCORE, PILOT & CURRENCIES */}
      <div className="w-full flex justify-between items-center max-w-4xl pointer-events-auto shrink-0 gap-1.5 sm:gap-2">
        {/* Left Cluster: Best Score & Callsign */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/90 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-sky-500/30 shadow-lg">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[8px] sm:text-[9px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              BEST
            </span>
            <span className="text-[11px] sm:text-sm font-mono-numbers font-black text-white text-glow-cyan">
              {bestScore.toLocaleString()}
            </span>
          </div>

          {currentNickname && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/70 text-slate-300 text-xs font-mono shadow-md">
              <span className="text-xs">{COSMIC_AVATARS[LeaderboardManager.getSelectedAvatar()]?.icon || '🌍'}</span>
              <span className="font-bold text-sky-300 truncate max-w-[110px]">{currentNickname}</span>
              <span className="text-xs">{getCountryFlag(LeaderboardManager.getPlayerCountry())}</span>
            </div>
          )}
        </div>

        {/* Right Cluster: Coins, Shards, Mute & Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Space Scrap / Coins */}
          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-amber-500/30 text-amber-300 shadow-md" title="Space Scrap">
            <span className="text-[10px] sm:text-xs">🪙</span>
            <span className="text-[10px] sm:text-xs font-mono-numbers font-black">{scrapBalance}</span>
          </div>

          {/* Cosmic Shards */}
          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-cyan-500/30 text-cyan-300 shadow-md" title="Cosmic Shards">
            <span className="text-[10px] sm:text-xs">💎</span>
            <span className="text-[10px] sm:text-xs font-mono-numbers font-black">{shardsBalance}</span>
          </div>

          {/* Quick Mute Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleMute();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Toggle Sound"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
          </button>

          {/* Settings Modal */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onSettings();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CENTER HERO AREA: BRANDING & DUAL MODE SELECTION */}
      <div className="flex flex-col items-center text-center my-auto pointer-events-auto max-w-lg w-full px-2 sm:px-4 py-2">
        {/* LOGO & TITLE */}
        <div className="mb-2 sm:mb-3">
          <div className="inline-flex items-center gap-1.5 bg-sky-950/60 border border-sky-400/40 px-2.5 py-0.5 rounded-full mb-1 sm:mb-1.5 backdrop-blur-md">
            <Shield className="w-3 h-3 text-sky-400" />
            <span className="text-[8.5px] sm:text-[10px] font-mono tracking-widest text-sky-300 font-bold uppercase">
              2.5D MECHA-TITAN GUARDIAN
            </span>
          </div>

          <h1 className="text-3xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-200 to-sky-500 filter drop-shadow-[0_0_35px_rgba(56,189,248,0.7)] leading-none">
            EARTH FALL
          </h1>
          <p className="text-[8.5px] sm:text-xs font-mono uppercase tracking-[0.3em] text-sky-300 font-bold mt-1">
            BEYOND THE SOLAR SYSTEM
          </p>
        </div>

        <p className="text-[10px] sm:text-xs text-slate-300/90 mb-3 sm:mb-5 max-w-sm line-clamp-2">
          The Cosmic Guardian carries Earth across uncharted celestial realms. Defend the planet through hostile cosmic hazards!
        </p>

        {/* DUAL MODE PLAY BUTTONS (MATCHING REFERENCE IMAGE 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-[340px] sm:max-w-md mb-3 sm:mb-4">
          {/* 1. INFINITE RUN BUTTON */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onStartInfiniteRun();
            }}
            className="group relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/25 via-amber-600/35 to-slate-950/90 border-2 border-amber-500/80 hover:border-amber-400 text-white shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:shadow-[0_0_36px_rgba(245,158,11,0.6)] active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <InfinityIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-115 transition-transform" />
              <span className="font-display font-black text-sm sm:text-base tracking-wider text-amber-200">
                INFINITE RUN
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-400 group-hover:text-white uppercase tracking-wider">
                PLAY &gt;
              </span>
            </div>
            <span className="text-[8px] sm:text-[8.5px] font-mono text-amber-300/70 mt-0.5">
              Eternal Cosmic Voyage
            </span>
          </button>

          {/* 2. STORY MODE BUTTON (WITH CHECKPOINT RESUME) */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onStartStoryMode(Boolean(savedCheckpoint));
            }}
            className="group relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-sky-500/25 via-blue-600/35 to-slate-950/90 border-2 border-sky-400/80 hover:border-sky-300 text-white shadow-[0_0_24px_rgba(56,189,248,0.35)] hover:shadow-[0_0_36px_rgba(56,189,248,0.6)] active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 group-hover:scale-115 transition-transform" />
              <span className="font-display font-black text-sm sm:text-base tracking-wider text-sky-200">
                STORY MODE
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-sky-300 group-hover:text-white uppercase tracking-wider">
                {savedCheckpoint ? `RESUME CH.${savedCheckpoint.chapter} >` : 'PLAY >'}
              </span>
            </div>
            <span className="text-[8px] sm:text-[8.5px] font-mono text-sky-300/70 mt-0.5 truncate max-w-full">
              {activeChapterInfo ? activeChapterInfo.subtitle : '6 Chapters · Bosses · Havens'}
            </span>
          </button>
        </div>

        {/* RESTART FRESH CHECKPOINT TOGGLE (IF CHECKPOINT EXISTS) */}
        {savedCheckpoint && onClearCheckpoint && (
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
            <span className="text-[8.5px] sm:text-[9.5px] font-mono text-slate-400">
              Saved at: Ch.{savedCheckpoint.chapter} ({activeChapterInfo ? activeChapterInfo.subtitle : `${Math.round(savedCheckpoint.distance)} LY`})
            </span>
            <button
              onClick={() => {
                soundEngine.playClick();
                if (confirm('Restart Story Mode from Chapter 1? (Checkpoint will reset)')) {
                  onClearCheckpoint();
                }
              }}
              className="flex items-center gap-1 text-[8px] sm:text-[9px] font-mono text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset to Ch. 1</span>
            </button>
          </div>
        )}

        {/* SECONDARY ROW: SHOP, QUESTS, RANKS, LORE, HOW TO PLAY */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 w-full max-w-[340px] sm:max-w-md">
          {/* Shop */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenShop();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Skins & Hangar Shop"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Shop</span>
          </button>

          {/* Quests */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenMissions();
            }}
            className="relative flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Daily Directives"
          >
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Quests</span>
            {unclaimedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[7.5px] font-black px-1 rounded-full animate-pulse shadow-md">
                {unclaimedCount}
              </span>
            )}
          </button>

          {/* Ranks (Real Players Global Leaderboard) */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenLeaderboard();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Daily Real Player Leaderboard"
          >
            <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Ranks</span>
          </button>

          {/* Story Chronicles */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenStory();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Earthfall Chronicles Lore"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Lore</span>
          </button>

          {/* How To Play */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenHowToPlay();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Controls & Mechanics Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Guide</span>
          </button>
        </div>
      </div>

      {/* BOTTOM COMBAT STRIP & CONTROLS FOOTER */}
      <div className="w-full flex flex-col items-center gap-1 shrink-0 pointer-events-none pb-0.5">
        {/* Transformation & Combat Feature Bar (Matching Reference Image 2) */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-950/85 border border-sky-500/30 px-3 py-1 rounded-full text-[9px] font-mono text-slate-300 shadow">
          <span className="text-sky-300 font-bold">GUARDIAN COMBAT:</span>
          <span>1. Hold Earth</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="text-amber-300">2. Solar Back-Holder</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="text-rose-300">3. Cosmic Punches</span>
        </div>

        {/* Input Controls Legend */}
        <p className="text-[8.5px] sm:text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-slate-800 shadow max-w-[90vw] truncate">
          {isMobile ? (
            <span>Tap Right = Jump (10 Jumps) &bull; Tap Left = Dive &bull; Fists / Skills on Bar</span>
          ) : (
            <span>SPACE = Jump &bull; S/DOWN = Dive &bull; X/Melee = Punch &bull; C = Toggle Back-Ring &bull; Q/E/F = Skills</span>
          )}
        </p>
      </div>
    </div>
  );
};
