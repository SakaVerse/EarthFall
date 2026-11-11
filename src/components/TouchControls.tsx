import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Sparkles, Radio, Flame, Rocket } from 'lucide-react';
import { ActiveSkill, SkillType } from '../game/types';

interface TouchControlsProps {
  onJump: () => void;
  onDive: () => void;
  skills?: ActiveSkill[];
  onTriggerSkill?: (type: SkillType) => void;
  jumpsRemaining?: number;
  maxJumps?: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onJump,
  onDive,
  skills = [],
  onTriggerSkill,
  jumpsRemaining = 10,
  maxJumps = 10,
}) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  const triggerHaptic = (duration = 10) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(duration);
      }
    } catch (e) {}
  };

  const handleDiveStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLeftPressed(true);
    triggerHaptic(14);
    onDive();
  };

  const handleDiveEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLeftPressed(false);
  };

  const handleJumpStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRightPressed(true);
    triggerHaptic(12);
    onJump();
  };

  const handleJumpEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRightPressed(false);
  };

  const handleSkillTap = (e: React.TouchEvent | React.MouseEvent, type: SkillType) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic(20);
    if (onTriggerSkill) onTriggerSkill(type);
  };

  const getSkillIcon = (type: SkillType) => {
    switch (type) {
      case 'PHASE_WARP':
        return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />;
      case 'EMP_SHOCKWAVE':
        return <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />;
      case 'RETRO_VENT':
        return <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />;
    }
  };

  const isLowJumps = jumpsRemaining <= 3;

  return (
    <div
      className="absolute inset-x-0 bottom-2 sm:bottom-3 px-2 sm:px-8 pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] flex justify-between items-end pointer-events-none select-none z-30"
      style={{ touchAction: 'none' }}
    >
      {/* LEFT ACTUATOR: AERODYNAMIC DIVE (Compact 20-25% scaled down on mobile) */}
      <div className="flex flex-col items-center gap-1 pointer-events-auto">
        <button
          onTouchStart={handleDiveStart}
          onTouchEnd={handleDiveEnd}
          onMouseDown={handleDiveStart}
          onMouseUp={handleDiveEnd}
          className={`relative w-13 h-13 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center transition-transform duration-75 border-2 shadow-xl backdrop-blur-md ${
            leftPressed
              ? 'bg-amber-500/90 border-amber-300 text-black scale-90 shadow-[0_0_24px_rgba(245,158,11,0.85)]'
              : 'bg-slate-950/75 hover:bg-slate-900/80 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-90'
          }`}
          aria-label="Dive Downward"
        >
          <ArrowDown className={`w-4 h-4 sm:w-6 sm:h-6 transition-transform ${leftPressed ? 'translate-y-1' : ''}`} />
          <span className="text-[7.5px] sm:text-[9px] font-mono font-black tracking-widest uppercase">
            DIVE
          </span>
        </button>
      </div>

      {/* CENTER DOCK: TACTICAL PLANETARY SKILLS (Scaled down 20-25% on mobile to prevent overflow) */}
      {skills.length > 0 && onTriggerSkill && (
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-sky-500/30 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-xl">
          {skills.map((s) => {
            const ready = s.cooldownRemaining <= 0;
            return (
              <button
                key={s.type}
                onTouchStart={(e) => ready && handleSkillTap(e, s.type)}
                onClick={(e) => ready && handleSkillTap(e, s.type)}
                disabled={!ready}
                className={`relative flex flex-col items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border transition-all active:scale-90 ${
                  s.isActive
                    ? 'bg-sky-500/60 border-sky-300 text-white shadow-[0_0_16px_#38bdf8] scale-105 ring-2 ring-sky-400'
                    : ready
                    ? 'bg-sky-950/80 border-sky-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.7)] animate-pulse ring-1 ring-sky-400/60'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                }`}
                aria-label={s.name}
              >
                {getSkillIcon(s.type)}
                <span className={`text-[6.5px] sm:text-[8px] font-mono font-bold leading-none mt-0.5 sm:mt-1 ${
                  ready ? 'text-sky-300 font-black' : 'text-slate-400'
                }`}>
                  {s.isActive ? 'ACT' : ready ? 'READY' : `${s.cooldownRemaining.toFixed(1)}s`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* RIGHT ACTUATOR: JUMP WITH 10 LIMITED JUMPS COUNTER (Scaled down on mobile) */}
      <div className="flex flex-col items-center gap-1 pointer-events-auto">
        {/* Above-button jump status pill */}
        <div className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-black border transition-all ${
          isLowJumps
            ? 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-[0_0_10px_#f43f5e] animate-pulse'
            : 'bg-slate-950/80 text-sky-300 border-sky-500/50'
        }`}>
          {jumpsRemaining}/{maxJumps}
        </div>

        <button
          onTouchStart={handleJumpStart}
          onTouchEnd={handleJumpEnd}
          onMouseDown={handleJumpStart}
          onMouseUp={handleJumpEnd}
          disabled={jumpsRemaining <= 0}
          className={`relative w-13 h-13 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center transition-transform duration-75 border-2 shadow-xl backdrop-blur-md ${
            jumpsRemaining <= 0
              ? 'bg-slate-900/60 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
              : isLowJumps
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.7)] animate-pulse'
              : rightPressed
              ? 'bg-sky-400 text-black border-white scale-90 shadow-[0_0_28px_rgba(56,189,248,0.95)]'
              : 'bg-slate-950/75 hover:bg-slate-900/80 border-sky-400/60 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-90'
          }`}
          aria-label="Ascend Thrusters"
        >
          <ArrowUp className={`w-4 h-4 sm:w-6 sm:h-6 transition-transform relative z-10 ${rightPressed ? '-translate-y-1' : ''}`} />
          <span className="text-[7.5px] sm:text-[9px] font-mono font-black tracking-widest uppercase relative z-10">
            {isLowJumps ? (jumpsRemaining === 0 ? 'LAND' : 'JUMP') : 'JUMP'}
          </span>
        </button>
      </div>
    </div>
  );
};
