import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Trophy,
  Medal,
  Crown,
  Cloud,
  Clock,
  RefreshCw,
  Globe,
  Flag,
  User,
  Sparkles,
  Shield,
  Zap,
  Check,
} from 'lucide-react';
import { LeaderboardManager } from '../game/leaderboard';
import { soundEngine } from '../game/audio';
import { LeaderboardEntry } from '../game/types';
import {
  COSMIC_AVATARS,
  getCountryFlag,
  CloudService,
  PlayerProfileData,
} from '../firebase/cloudService';

interface LeaderboardModalProps {
  onClose: () => void;
}

type TabFilter = 'global' | 'country' | 'alltime' | 'weekly';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabFilter>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => LeaderboardManager.getLeaderboard());
  const [activeDate, setActiveDate] = useState<string>(() => LeaderboardManager.getTodayDateString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<LeaderboardEntry | null>(null);
  const [detailedProfileData, setDetailedProfileData] = useState<PlayerProfileData | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [currentAvatar, setCurrentAvatar] = useState<string>(() => LeaderboardManager.getSelectedAvatar());

  const currentUsername = LeaderboardManager.getUsername();
  const playerCountry = LeaderboardManager.getPlayerCountry();

  // Load entries on tab change
  const loadTabEntries = useCallback(async (tab: TabFilter) => {
    soundEngine.playClick();
    setActiveTab(tab);
    if (tab === 'global') {
      setEntries(LeaderboardManager.getLeaderboard());
      return;
    }

    setIsLoading(true);
    try {
      const list = await LeaderboardManager.fetchFilterLeaderboard(tab);
      setEntries(list);
    } catch (e) {
      console.warn('Failed to fetch filtered leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen to live global daily scores
  useEffect(() => {
    if (activeTab !== 'global') return;

    return LeaderboardManager.subscribe((liveEntries, dateKey) => {
      setEntries(liveEntries);
      setActiveDate(dateKey);
    });
  }, [activeTab]);

  const handleRefresh = async () => {
    soundEngine.playClick();
    setIsLoading(true);
    try {
      if (activeTab === 'global') {
        const nick = await LeaderboardManager.refreshNicknameFromCloud();
        if (nick) setEntries(LeaderboardManager.getLeaderboard());
      } else {
        const list = await LeaderboardManager.fetchFilterLeaderboard(activeTab);
        setEntries(list);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAvatar = (avatarId: string) => {
    soundEngine.playClick();
    setCurrentAvatar(avatarId);
    LeaderboardManager.setSelectedAvatar(avatarId);
    setShowAvatarPicker(false);
  };

  const handleOpenProfile = async (entry: LeaderboardEntry) => {
    soundEngine.playClick();
    setSelectedProfile(entry);
    if (entry.uid) {
      const p = await CloudService.loadPlayerProfile(entry.uid);
      setDetailedProfileData(p);
    } else {
      setDetailedProfileData(null);
    }
  };

  // Top 3 Podium
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];
  const remainingEntries = entries.slice(3);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 z-50 animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-[0_0_60px_rgba(56,189,248,0.25)] p-4 sm:p-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-display font-black text-white tracking-wide">
                  COSMIC LEADERBOARD
                </h3>
                <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  <Cloud className="w-2.5 h-2.5 animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-sky-300/90 mt-0.5">
                <Clock className="w-3 h-3 text-sky-400" />
                <span>Resets daily at 12:00 AM IST</span>
                <span className="text-slate-500">({activeDate})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Refresh ranks"
              disabled={isLoading}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 p-1 bg-slate-950/80 border border-slate-800/90 rounded-2xl shrink-0 text-xs font-mono font-bold">
          <button
            onClick={() => loadTabEntries('global')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'global'
                ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate">GLOBAL</span>
          </button>

          <button
            onClick={() => loadTabEntries('country')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'country'
                ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <span>{getCountryFlag(playerCountry)}</span>
            <span className="truncate">{playerCountry}</span>
          </button>

          <button
            onClick={() => loadTabEntries('weekly')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span className="truncate">WEEKLY</span>
          </button>

          <button
            onClick={() => loadTabEntries('alltime')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'alltime'
                ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">ALL-TIME</span>
          </button>
        </div>

        {/* Current Player Bar */}
        {currentUsername && (
          <div className="mt-2.5 px-3 py-1.5 rounded-2xl bg-sky-950/50 border border-sky-500/40 flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase">YOUR PILOT:</span>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowAvatarPicker(!showAvatarPicker);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900 border border-sky-400/30 hover:border-sky-400 transition-colors cursor-pointer"
                title="Change Avatar"
              >
                <span>{COSMIC_AVATARS[currentAvatar]?.icon || '🌍'}</span>
                <span className="font-bold text-sky-200">{currentUsername}</span>
                <span className="text-xs">{getCountryFlag(playerCountry)}</span>
              </button>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowAvatarPicker(!showAvatarPicker);
              }}
              className="text-[10px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
            >
              {showAvatarPicker ? 'Hide Avatars' : 'Customize Avatar'}
            </button>
          </div>
        )}

        {/* Avatar Selection Drawer */}
        {showAvatarPicker && (
          <div className="mt-2 p-2.5 bg-slate-950/90 border border-sky-500/30 rounded-2xl shrink-0 grid grid-cols-4 sm:grid-cols-8 gap-2 animate-fadeIn">
            {Object.values(COSMIC_AVATARS).map((av) => (
              <button
                key={av.id}
                onClick={() => handleSelectAvatar(av.id)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                  currentAvatar === av.id
                    ? 'bg-sky-500/30 border-sky-400 ring-2 ring-sky-400'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">{av.icon}</span>
                <span className="text-[9px] font-mono text-slate-300 truncate w-full text-center mt-0.5">
                  {av.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Content Area: Podium + Scrollable List or Empty State */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>
              <h4 className="text-base sm:text-lg font-display font-black text-white tracking-wide mb-1">
                No scores yet—be the first!
              </h4>
              <p className="text-xs font-mono text-slate-400 max-w-sm">
                Launch Earth into deep space, dodge cosmic hazards, and claim Rank #1 on the leaderboard.
              </p>
            </div>
          ) : (
            <>
              {/* TOP 3 PODIUM */}
              <div className="grid grid-cols-3 gap-2 pt-3 pb-2 px-1">
                {/* 2nd Place */}
                <div className="flex flex-col items-center justify-end">
                  {top2 ? (
                    <button
                      onClick={() => handleOpenProfile(top2)}
                      className="w-full flex flex-col items-center p-2 rounded-2xl bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all cursor-pointer group"
                    >
                      <span className="text-xl mb-1">{COSMIC_AVATARS[top2.avatar || 'earth']?.icon || '🌍'}</span>
                      <div className="w-5 h-5 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center text-[10px] font-mono font-black mb-1">
                        #2
                      </div>
                      <span className="font-mono font-bold text-slate-200 text-xs truncate max-w-full">
                        {top2.username}
                      </span>
                      <span className="font-mono-numbers font-black text-xs sm:text-sm text-slate-300">
                        {top2.score.toLocaleString()}
                      </span>
                    </button>
                  ) : (
                    <div className="w-full h-24 rounded-2xl border border-dashed border-slate-800/60 flex items-center justify-center text-[10px] font-mono text-slate-600">
                      Empty
                    </div>
                  )}
                  <div className="w-full h-12 bg-gradient-to-t from-slate-800/80 to-slate-800/30 rounded-b-xl mt-1 border-t border-slate-700/50 flex items-center justify-center text-[11px] font-mono font-black text-slate-400">
                    2ND
                  </div>
                </div>

                {/* 1st Place (Center / Tallest) */}
                <div className="flex flex-col items-center justify-end -mt-3">
                  {top1 ? (
                    <button
                      onClick={() => handleOpenProfile(top1)}
                      className="w-full flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-amber-950/60 to-slate-900/90 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-400 transition-all cursor-pointer group"
                    >
                      <Crown className="w-5 h-5 text-amber-400 mb-0.5 animate-bounce" />
                      <span className="text-2xl mb-1">{COSMIC_AVATARS[top1.avatar || 'earth']?.icon || '🌍'}</span>
                      <span className="font-mono font-black text-amber-300 text-xs sm:text-sm truncate max-w-full">
                        {top1.username}
                      </span>
                      <span className="font-mono-numbers font-black text-sm sm:text-base text-white text-glow-amber">
                        {top1.score.toLocaleString()}
                      </span>
                    </button>
                  ) : (
                    <div className="w-full h-28 rounded-2xl border border-dashed border-amber-900/40 flex items-center justify-center text-[10px] font-mono text-amber-600">
                      Empty
                    </div>
                  )}
                  <div className="w-full h-16 bg-gradient-to-t from-amber-900/40 to-amber-900/10 rounded-b-xl mt-1 border-t border-amber-500/50 flex items-center justify-center text-xs font-mono font-black text-amber-400">
                    👑 1ST
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center justify-end">
                  {top3 ? (
                    <button
                      onClick={() => handleOpenProfile(top3)}
                      className="w-full flex flex-col items-center p-2 rounded-2xl bg-slate-900/80 border border-amber-800/40 hover:border-amber-600 transition-all cursor-pointer group"
                    >
                      <span className="text-xl mb-1">{COSMIC_AVATARS[top3.avatar || 'earth']?.icon || '🌍'}</span>
                      <div className="w-5 h-5 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center text-[10px] font-mono font-black mb-1">
                        #3
                      </div>
                      <span className="font-mono font-bold text-slate-200 text-xs truncate max-w-full">
                        {top3.username}
                      </span>
                      <span className="font-mono-numbers font-black text-xs sm:text-sm text-amber-500">
                        {top3.score.toLocaleString()}
                      </span>
                    </button>
                  ) : (
                    <div className="w-full h-24 rounded-2xl border border-dashed border-slate-800/60 flex items-center justify-center text-[10px] font-mono text-slate-600">
                      Empty
                    </div>
                  )}
                  <div className="w-full h-9 bg-gradient-to-t from-slate-800/80 to-slate-800/30 rounded-b-xl mt-1 border-t border-slate-700/50 flex items-center justify-center text-[11px] font-mono font-black text-amber-700">
                    3RD
                  </div>
                </div>
              </div>

              {/* REMAINING RANKS LIST */}
              <div className="space-y-1.5 pt-2">
                {remainingEntries.map((entry) => (
                  <button
                    key={`${entry.username}_${entry.rank}`}
                    onClick={() => handleOpenProfile(entry)}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all text-xs sm:text-sm text-left cursor-pointer ${
                      entry.isCurrentPlayer
                        ? 'bg-sky-950/80 border-sky-400/80 shadow-[0_0_18px_rgba(56,189,248,0.35)] ring-1 ring-sky-400/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Rank & Pilot Details */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-6 sm:w-7 text-center font-mono font-black text-xs text-slate-400 shrink-0">
                        #{entry.rank}
                      </div>

                      <div className="text-base sm:text-lg shrink-0">
                        {COSMIC_AVATARS[entry.avatar || 'earth']?.icon || '🌍'}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold font-mono tracking-tight ${
                              entry.isCurrentPlayer ? 'text-sky-300 font-black' : 'text-slate-100'
                            }`}
                          >
                            {entry.username}
                          </span>
                          <span className="text-xs">{getCountryFlag(entry.country)}</span>
                          {entry.isCurrentPlayer && (
                            <span className="text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded border border-sky-400/40">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[160px] sm:max-w-[240px]">
                          {entry.zone}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-end">
                      <span className="font-mono-numbers font-black text-white text-xs sm:text-sm">
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">PTS</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Detailed Player Profile Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-60 animate-fadeIn">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-[0_0_40px_rgba(56,189,248,0.3)] flex flex-col items-center text-center">
              <div className="text-4xl mb-2">
                {COSMIC_AVATARS[selectedProfile.avatar || 'earth']?.icon || '🌍'}
              </div>

              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-lg font-display font-black text-white">{selectedProfile.username}</h4>
                <span className="text-base">{getCountryFlag(selectedProfile.country)}</span>
              </div>

              <span className="text-[11px] font-mono text-sky-400 mb-3">
                {COSMIC_AVATARS[selectedProfile.avatar || 'earth']?.name || 'Cosmic Pilot'}
              </span>

              {/* Profile Stats */}
              <div className="w-full grid grid-cols-2 gap-2 text-left mb-4">
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">SCORE</span>
                  <span className="text-sm font-mono-numbers font-bold text-white">
                    {selectedProfile.score.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">RANK</span>
                  <span className="text-sm font-mono-numbers font-bold text-amber-400">
                    #{selectedProfile.rank || 1}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">DISTANCE</span>
                  <span className="text-sm font-mono-numbers font-bold text-sky-300">
                    {selectedProfile.distance ? `${selectedProfile.distance.toLocaleString()} LY` : 'Classified'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">SURVIVAL</span>
                  <span className="text-sm font-mono-numbers font-bold text-emerald-400">
                    {selectedProfile.survivalTime ? `${selectedProfile.survivalTime}s` : 'Unrecorded'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedProfile(null);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                CLOSE PROFILE
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 text-center shrink-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 transition-colors text-xs cursor-pointer"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};
