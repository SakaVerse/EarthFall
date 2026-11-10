import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Sparkles, Radio, Flame } from 'lucide-react';
import { ActiveSkill, SkillType } from '../game/types';

interface TouchControlsProps {
  onJump: () => void;
  onDive: () => void;
  skills?: ActiveSkill[];
  onTriggerSkill?: (type: SkillType) => void;
  stamina?: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onJump,
  onDive,
  skills = [],
  onTriggerSkill,
  stamina = 100,
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
        return <Sparkles className="w-4 h-4 text-cyan-300" />;
      case 'EMP_SHOCKWAVE':
        return <Radio className="w-4 h-4 text-sky-400" />;
      case 'RETRO_VENT':
        return <Flame className="w-4 h-4 text-amber-400" />;
    }
  };

  const isLowStamina = stamina < 22;
  const staminaPercent = Math.max(0, Math.min(100, stamina));
  const staminaCircumference = 2 * Math.PI * 26; // r = 26
  const strokeDashoffset = staminaCircumference - (staminaPercent / 100) * staminaCircumference;

  return (
    <div
      className="absolute inset-x-0 bottom-3 px-4 sm:px-8 flex justify-between items-end pointer-events-none select-none z-30"
      style={{ touchAction: 'none' }}
    >
      {/* LEFT ACTUATOR: AERODYNAMIC DIVE (Compact Aerospace Circular Pad) */}
      <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
        <button
          onTouchStart={handleDiveStart}
          onTouchEnd={handleDiveEnd}
          onMouseDown={handleDiveStart}
          onMouseUp={handleDiveEnd}
          className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center transition-transform duration-75 border-2 shadow-2xl backdrop-blur-md ${
            leftPressed
              ? 'bg-amber-500/90 border-amber-300 text-black scale-90 shadow-[0_0_28px_rgba(245,158,11,0.85)]'
              : 'bg-slate-950/70 hover:bg-slate-900/80 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-90'
          }`}
          aria-label="Dive Downward"
        >
          <ArrowDown className={`w-6 h-6 transition-transform ${leftPressed ? 'translate-y-1' : ''}`} />
          <span className="text-[9px] font-mono font-black tracking-widest uppercase">
            DIVE
          </span>
        </button>
      </div>

      {/* CENTER DOCK: TACTICAL PLANETARY SKILLS (Clean Micro Dock) */}
      {skills.length > 0 && onTriggerSkill && (
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-sky-500/30 px-2.5 py-1.5 rounded-2xl shadow-xl">
          {skills.map((s) => {
            const ready = s.cooldownRemaining <= 0;
            return (
              <button
                key={s.type}
                onTouchStart={(e) => ready && handleSkillTap(e, s.type)}
                onClick={(e) => ready && handleSkillTap(e, s.type)}
                disabled={!ready}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all active:scale-90 ${
                  s.isActive
                    ? 'bg-sky-500/60 border-sky-300 text-white shadow-[0_0_16px_#38bdf8] scale-105'
                    : ready
                    ? 'bg-slate-900/80 border-sky-400/50 text-white shadow-md hover:border-sky-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60'
                }`}
                aria-label={s.name}
              >
                {getSkillIcon(s.type)}
                <span className="text-[8px] font-mono font-bold leading-none mt-1">
                  {s.isActive ? 'ACT' : ready ? 'READY' : `${Math.ceil(s.cooldownRemaining)}s`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* RIGHT ACTUATOR: ION ASCENT / JUMP WITH RADIAL STAMINA RING */}
      <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
        <button
          onTouchStart={handleJumpStart}
          onTouchEnd={handleJumpEnd}
          onMouseDown={handleJumpStart}
          onMouseUp={handleJumpEnd}
          className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center transition-transform duration-75 border-2 shadow-2xl backdrop-blur-md ${
            isLowStamina
              ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : rightPressed
              ? 'bg-sky-400 text-black border-white scale-90 shadow-[0_0_32px_rgba(56,189,248,0.95)]'
              : 'bg-slate-950/70 hover:bg-slate-900/80 border-sky-400/60 text-sky-200 shadow-[0_0_18px_rgba(56,189,248,0.3)] active:scale-90'
          }`}
          aria-label="Ascend Thrusters"
        >
          {/* Radial Stamina SVG Ring directly on the Jump Button */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r="26"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="3.5"
            />
            <circle
              cx="30"
              cy="30"
              r="26"
              fill="none"
              stroke={isLowStamina ? '#f43f5e' : '#38bdf8'}
              strokeWidth="3.5"
              strokeDasharray={staminaCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </svg>

          <ArrowUp className={`w-6 h-6 transition-transform relative z-10 ${rightPressed ? '-translate-y-1' : ''}`} />
          <span className="text-[9px] font-mono font-black tracking-widest uppercase relative z-10">
            {isLowStamina ? 'LOW' : 'THRUST'}
          </span>
        </button>
      </div>
    </div>
  );
};
