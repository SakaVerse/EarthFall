import React, { useState, useEffect } from 'react';
import { Play, FastForward, Sun, Compass, ShieldAlert, Sparkles } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface StoryIntroProps {
  onComplete: () => void;
  isMobile: boolean;
}

const STORY_STEPS = [
  {
    phase: '01. SOLAR DETONATION',
    title: 'THE CORONA ERUPTION',
    text: 'In the year 2084, a mysterious hyper-energetic eruption erupts deep within the Sun. A class-X500 solar flare sends an immense cosmic shockwave radiating outward at 0.1c.',
    icon: Sun,
    accent: 'from-amber-500 to-rose-600',
    borderColor: 'border-amber-500/40',
  },
  {
    phase: '02. ORBIT SEVERANCE',
    title: 'THE GRAVITATIONAL SNAP',
    text: 'The solar shockwave violently disrupts Earth’s planetary equilibrium. Earth’s orbital tether snaps. The cradle of humanity is catapulted out of its 4.5-billion-year home.',
    icon: ShieldAlert,
    accent: 'from-rose-500 to-indigo-600',
    borderColor: 'border-rose-500/40',
  },
  {
    phase: '03. INTO THE DEEP DARK',
    title: 'THE SOLAR SYSTEM FADES',
    text: 'Mars, Jupiter, and Saturn recede into the distant starfield. Behind Earth lies warmth and memory. Ahead lies only the cold, uncharted abyss of the interstellar void.',
    icon: Compass,
    accent: 'from-blue-500 to-indigo-600',
    borderColor: 'border-sky-500/40',
  },
  {
    phase: '04. SURVIVAL DIRECTIVE',
    title: 'PILOT THE PLANET',
    text: 'Harness Earth’s emergency geomagnetic shields and planetary thrusters. Dodge rogue asteroids, navigate plasma storms, collect cosmic energy, and survive at all costs.',
    icon: Sparkles,
    accent: 'from-sky-400 to-cyan-500',
    borderColor: 'border-cyan-500/40',
  },
];

export const StoryIntro: React.FC<StoryIntroProps> = ({ onComplete, isMobile }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Space or Enter key progresses story
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'Escape') {
        soundEngine.playClick();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const handleNext = () => {
    soundEngine.playClick();
    if (currentStep < STORY_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = STORY_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between items-center p-6 md:p-12 z-40 select-none animate-fadeIn">
      {/* Top Bar with Skip */}
      <div className="w-full flex justify-between items-center max-w-4xl">
        <div className="flex items-center gap-2">
          {STORY_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-10 bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                  : idx < currentStep
                  ? 'w-6 bg-slate-600'
                  : 'w-4 bg-slate-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            onComplete();
          }}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/60 hover:border-slate-500 transition-colors"
        >
          <FastForward className="w-4 h-4" />
          <span>{isMobile ? 'Skip Prologue' : 'Skip Prologue (ESC)'}</span>
        </button>
      </div>

      {/* Center Cinematic Card */}
      <div className="max-w-2xl w-full my-auto flex flex-col items-center text-center">
        {/* Animated Icon Avatar */}
        <div
          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.accent} p-0.5 shadow-2xl mb-6 flex items-center justify-center`}
        >
          <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center">
            <Icon className="w-9 h-9 text-white animate-pulse" />
          </div>
        </div>

        <span className="text-xs font-mono tracking-widest text-sky-400 font-semibold mb-2">
          {step.phase}
        </span>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-white tracking-wide mb-4 text-glow-blue">
          {step.title}
        </h2>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal mb-8">
          {step.text}
        </p>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-base rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95 transition-all"
        >
          {currentStep === STORY_STEPS.length - 1 ? (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>{isMobile ? 'START FLIGHT NOW' : 'LAUNCH EARTHFALL MISSION'}</span>
            </>
          ) : (
            <>
              <span>CONTINUE SEQUENCE</span>
              {!isMobile && <span className="text-xs font-mono opacity-80">(Space)</span>}
            </>
          )}
        </button>
      </div>

      {/* Footer Hint */}
      <div className="text-center text-xs font-mono text-slate-500">
        {isMobile ? (
          <span>Tap <strong className="text-slate-300">CONTINUE</strong> or swipe to progress</span>
        ) : (
          <span>Press <strong className="text-slate-300">SPACE</strong> to advance &middot; Press <strong className="text-slate-300">ESC</strong> to skip</span>
        )}
      </div>
    </div>
  );
};
