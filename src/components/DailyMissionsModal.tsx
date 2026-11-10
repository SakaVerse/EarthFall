import React, { useState } from 'react';
import { X, CheckCircle2, Award, Zap, Compass, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import { DailyMission } from '../game/types';
import { DailyMissionsManager } from '../game/dailyMissions';
import { soundEngine } from '../game/audio';

interface DailyMissionsModalProps {
  onClose: () => void;
  onClaimReward: () => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({ onClose, onClaimReward }) => {
  const [missions, setMissions] = useState<DailyMission[]>(() => DailyMissionsManager.getMissions());

  const handleClaim = (missionId: string) => {
    soundEngine.playRewardClaim();
    const result = DailyMissionsManager.claimReward(missionId);
    if (result.success) {
      setMissions(DailyMissionsManager.getMissions());
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
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 select-none animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
                DAILY FLIGHT DIRECTIVES
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                {completedCount}/{missions.length} COMPLETED
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span>DAILY MISSIONS</span>
              <span className="text-base text-amber-400 font-mono font-normal">⚙️ Earn Space Scrap</span>
            </h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missions List */}
        <div className="py-4 overflow-y-auto space-y-3">
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
          <span className="font-mono text-[11px]">Resets daily at 00:00 UTC</span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
