import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Award, Zap, Compass, ShieldAlert, Sparkles, Flame, Clock } from 'lucide-react';
import { DailyMission } from '../game/types';
import { DailyMissionsManager } from '../game/dailyMissions';
import { soundEngine } from '../game/audio';
import { getTimeUntilMidnightIST } from '../utils/date';

interface DailyMissionsModalProps {
  onClose: () => void;
  onClaimReward: () => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({ onClose, onClaimReward }) => {
  const [missions, setMissions] = useState<DailyMission[]>(() => DailyMissionsManager.getMissions());
  const [streakData, setStreakData] = useState(() => DailyMissionsManager.getStreakData());
  const [countdown, setCountdown] = useState<string>(() => getTimeUntilMidnightIST().formatted);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnightIST().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaim = (missionId: string) => {
    soundEngine.playRewardClaim();
    const result = DailyMissionsManager.claimReward(missionId);
    if (result.success) {
      setMissions(DailyMissionsManager.getMissions());
      onClaimReward();
    }
  };

  const handleClaimStreak = () => {
    soundEngine.playRewardClaim();
    const result = DailyMissionsManager.claimStreakReward();
    if (result.success) {
      setStreakData(DailyMissionsManager.getStreakData());
      onClaimReward();
    }
  };

  const getMissionIcon = (type: string) => {
    switch (type) {
      case 'energy':
        return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'dodge':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'distance':
        return <Compass className="w-5 h-5 text-sky-400" />;
      case 'skills':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'combo':
        return <Flame className="w-5 h-5 text-rose-400" />;
      default:
        return <Award className="w-5 h-5 text-amber-400" />;
    }
  };

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] pl-[max(0.4rem,env(safe-area-inset-left))] pr-[max(0.4rem,env(safe-area-inset-right))] z-40 select-none animate-fadeIn overflow-y-auto">
      <div className="mobile-modal-card w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-3 sm:p-6 flex flex-col my-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
                DAILY FLIGHT DIRECTIVES
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                {completedCount}/{missions.length} COMPLETED
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span>DAILY MISSIONS & STREAK</span>
              <span className="text-xs sm:text-sm text-amber-400 font-mono font-normal">⚙️ Earn Space Scrap</span>
            </h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DAILY RETENTION STREAK CARD */}
        <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950/80 to-slate-900 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] relative overflow-hidden">
          {/* Subtle cosmic background glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0 animate-pulse">
                <Flame className="w-5 h-5 fill-amber-400 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-display font-black text-white tracking-wide">
                    {streakData.currentStreak} DAY STREAK
                  </h3>
                  <span className="text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                    BEST: {streakData.bestStreak} DAYS
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Log in daily to unlock escalating Space Scrap retention bonuses!
                </p>
              </div>
            </div>

            {/* Streak Claim Button */}
            {streakData.canClaim ? (
              <button
                onClick={handleClaimStreak}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs font-mono rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.6)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 animate-bounce"
              >
                <span>CLAIM DAY {((streakData.currentStreak - 1) % 7) + 1} BONUS</span>
                <span className="text-slate-900 font-extrabold">(+{streakData.todayReward} ⚙️)</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>CLAIMED TODAY (+{streakData.todayReward} ⚙️)</span>
              </div>
            )}
          </div>

          {/* 7-Day Roadmap Cards */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2 border-t border-slate-800/80">
            {streakData.days.map((d) => (
              <div
                key={d.day}
                className={`flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl text-center border transition-all ${
                  d.isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : d.isToday
                    ? 'bg-amber-950/50 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-400 text-white'
                    : d.isMilestone
                    ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className={`text-[8.5px] sm:text-[10px] font-mono font-bold ${
                  d.isToday ? 'text-amber-300' : d.isCompleted ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  D{d.day}
                </span>

                <div className="my-1">
                  {d.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  ) : d.isMilestone ? (
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-pulse" />
                  ) : (
                    <span className="text-xs">⚙️</span>
                  )}
                </div>

                <span className={`text-[9px] sm:text-[10px] font-mono font-black ${
                  d.isCompleted ? 'text-emerald-300' : d.isToday ? 'text-amber-300' : d.isMilestone ? 'text-purple-300' : 'text-slate-400'
                }`}>
                  +{d.reward}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Missions List Header */}
        <div className="mt-4 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              PILOT DIRECTIVES
            </span>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded">
              PERSONALIZED
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-400">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>Resets in: {countdown} (12:00 AM IST)</span>
          </div>
        </div>

        {/* Missions List */}
        <div className="overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar">
          {missions.map((mission) => {
            const percent = Math.min(100, Math.round((mission.currentCount / mission.targetCount) * 100));
            return (
              <div
                key={mission.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  mission.claimed
                    ? 'bg-slate-950/50 border-slate-800/60 opacity-65'
                    : mission.completed
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-950/70 border-slate-800/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                      {getMissionIcon(mission.targetType)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                        <span>{mission.title}</span>
                        {mission.completed && !mission.claimed && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 animate-pulse">
                            READY!
                          </span>
                        )}
                      </h4>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{mission.description}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 font-mono font-bold text-amber-300 text-xs">
                      <span>+{mission.reward}</span>
                      <span>⚙️</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar and claim button */}
                <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-800/60">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-400">
                      <span>PROGRESS</span>
                      <span>
                        {mission.currentCount} / {mission.targetCount} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          mission.completed ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-sky-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {mission.claimed ? (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>CLAIMED</span>
                    </div>
                  ) : mission.completed ? (
                    <button
                      onClick={() => handleClaim(mission.id)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 transition-all"
                    >
                      CLAIM REWARD
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      IN PROGRESS
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-400">
            Resets at 12:00 AM IST • New distinct quests generated daily
          </span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
