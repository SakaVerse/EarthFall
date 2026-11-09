import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Zap, Sparkles, Radio, Flame } from 'lucide-react';
import { ActiveSkill, SkillType } from '../game/types';
import { soundEngine } from '../game/audio';

interface TouchControlsProps {
  onJump: () => void;
  onDive: () => void;
  skills?: ActiveSkill[];
  onTriggerSkill?: (type: SkillType) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onJump,
  onDive,
  skills = [],
  onTriggerSkill,
}) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  const triggerHaptic = (duration = 15) => {
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
    triggerHaptic(18);
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
    triggerHaptic(15);
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
    triggerHaptic(25);
    if (onTriggerSkill) onTriggerSkill(type);
  };

  const getSkillIcon = (type: SkillType) => {
    switch (type) {
      case 'PHASE_WARP':
        return <Sparkles className="w-4 h-4 text-cyan-300" />;
      case 'EMP_SHOCKWAVE':
        return <Radio className="w-4 h-4 text-sky-400" />;
      case 'RETRO_VENT':
        return <Flame className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <>
      {/* Invisible Left & Right Split-Screen Tap Zones (Ensures screen is responsive) */}
      <div className="absolute inset-0 z-20 flex pointer-events-auto select-none touch-none">
        {/* Left half screen tap: Dive */}
        <div
          className="w-1/2 h-full cursor-pointer opacity-0"
          onTouchStart={handleDiveStart}
          onTouchEnd={handleDiveEnd}
        />
        {/* Right half screen tap: Ascend */}
        <div
          className="w-1/2 h-full cursor-pointer opacity-0"
          onTouchStart={handleJumpStart}
          onTouchEnd={handleJumpEnd}
        />
      </div>

      {/* Tactile On-Screen Dual Thumb Controllers & Skills */}
      <div className="absolute inset-x-0 bottom-4 sm:bottom-6 px-4 sm:px-8 flex justify-between items-end pointer-events-none select-none z-30">
        {/* Left Thumb: DIVE / DODGE */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
          <button
            onTouchStart={handleDiveStart}
            onTouchEnd={handleDiveEnd}
            onMouseDown={handleDiveStart}
            onMouseUp={handleDiveEnd}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center transition-all duration-75 border-2 shadow-xl ${
              leftPressed
                ? 'bg-amber-500/90 border-amber-300 text-black scale-90 shadow-[0_0_30px_rgba(245,158,11,0.8)]'
                : 'bg-slate-950/80 backdrop-blur-md border-amber-500/60 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95'
            }`}
            aria-label="Dive Downward"
          >
            <ArrowDown className={`w-8 h-8 transition-transform ${leftPressed ? 'translate-y-1' : ''}`} />
            <span className="text-[11px] font-mono font-black tracking-wider uppercase">DIVE</span>
          </button>
          <span className="text-[10px] font-mono font-semibold text-amber-400/80 uppercase">
            LEFT THUMB
          </span>
        </div>

        {/* Center: Mobile Planetary Skill Quick-Triggers */}
        {skills.length > 0 && onTriggerSkill && (
          <div className="flex items-center gap-2 pointer-events-auto pb-2">
            {skills.map((s) => {
              const ready = s.cooldownRemaining <= 0;
              return (
                <button
                  key={s.type}
                  onTouchStart={(e) => ready && handleSkillTap(e, s.type)}
                  onClick={(e) => ready && handleSkillTap(e, s.type)}
                  disabled={!ready}
                  className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl border backdrop-blur-md transition-all active:scale-90 ${
                    s.isActive
                      ? 'bg-sky-500/40 border-sky-300 shadow-[0_0_15px_#38bdf8] scale-105'
                      : ready
                      ? 'bg-slate-950/90 border-sky-400/60 text-white shadow-lg shadow-sky-950/50'
                      : 'bg-slate-950/70 border-slate-800 text-slate-500 opacity-60'
                  }`}
                  aria-label={s.name}
                >
                  <div className="flex items-center gap-1">
                    {getSkillIcon(s.type)}
                    <span className="text-[10px] font-mono font-bold text-sky-200">
                      {s.keyLabel}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono mt-0.5">
                    {s.isActive ? 'ACT' : ready ? 'READY' : `${s.cooldownRemaining.toFixed(0)}s`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right Thumb: ASCEND / THRUST */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
          <button
            onTouchStart={handleJumpStart}
            onTouchEnd={handleJumpEnd}
            onMouseDown={handleJumpStart}
            onMouseUp={handleJumpEnd}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center transition-all duration-75 border-2 shadow-xl ${
              rightPressed
                ? 'bg-sky-400 text-black border-white scale-90 shadow-[0_0_35px_rgba(56,189,248,0.9)]'
                : 'bg-slate-950/80 backdrop-blur-md border-sky-400/70 text-sky-200 shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95'
            }`}
            aria-label="Ascend Thruster"
          >
            <ArrowUp className={`w-8 h-8 transition-transform ${rightPressed ? '-translate-y-1' : ''}`} />
            <span className="text-[11px] font-mono font-black tracking-wider uppercase">ASCEND</span>
          </button>
          <span className="text-[10px] font-mono font-semibold text-sky-400/80 uppercase">
            RIGHT THUMB
          </span>
        </div>
      </div>
    </>
  );
};
