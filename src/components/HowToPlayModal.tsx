import React, { useState } from 'react';
import { X, Shield, Zap, Clock, Compass, AlertTriangle, Layers, Gamepad2, Sparkles, Radio, Flame } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { POWER_UP_CONFIG } from '../game/constants';

interface HowToPlayModalProps {
  onClose: () => void;
  isMobile: boolean;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose, isMobile }) => {
  const [activeTab, setActiveTab] = useState<'easy' | 'controls' | 'skills' | 'hazards' | 'powerups' | 'zones'>('easy');

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-40 select-none animate-fadeIn overflow-y-auto">
      <div className="mobile-modal-card w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 flex flex-col max-h-[94vh] sm:max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
                MISSION FLIGHT MANUAL
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                {isMobile ? '📱 Mobile Touch Active' : '💻 Keyboard Active'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span>HOW TO PLAY & SURVIVE</span>
              <span className="text-xs sm:text-sm font-mono text-amber-300 font-normal">📖 Easy Guide</span>
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-2.5 border-b border-slate-800 text-xs font-semibold overflow-x-auto custom-scrollbar">
          {[
            { id: 'easy', label: '⭐ Easy Guide', icon: Sparkles },
            { id: 'controls', label: '🎮 Controls', icon: Gamepad2 },
            { id: 'skills', label: '🛡️ Abilities', icon: Radio },
            { id: 'hazards', label: '⚠️ Obstacles', icon: AlertTriangle },
            { id: 'powerups', label: '⚡ Power-Ups', icon: Zap },
            { id: 'zones', label: '🌌 5 Zones', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer text-xs ${
                  isActive
                    ? 'bg-sky-500 text-white font-bold shadow-md ring-1 ring-sky-300'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="py-3 sm:py-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm text-slate-300 custom-scrollbar flex-1">
          {/* EASY GUIDE: CONTROLS, ABILITIES, OBSTACLES IN SIMPLE LANGUAGE */}
          {activeTab === 'easy' && (
            <div className="space-y-3">
              {/* Section 1: Controls */}
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/40 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                    <Gamepad2 className="w-4 h-4" />
                  </span>
                  <h3 className="font-display font-black text-white text-sm sm:text-base">
                    1. HOW TO CONTROL EARTH (SUPER SIMPLE)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-sky-300 block mb-0.5">🚀 FLY UP / JUMP</span>
                    <p className="text-slate-300 leading-relaxed">
                      {isMobile ? 'Tap the RIGHT half of your screen.' : 'Press SPACE, W, or Up Arrow.'}
                      <br />
                      <span className="text-emerald-400 font-semibold font-mono">Tip: Earth has 10 jumps. Touch the ground to instantly refill back to 10!</span>
                    </p>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-amber-300 block mb-0.5">⬇️ DIVE DOWN</span>
                    <p className="text-slate-300 leading-relaxed">
                      {isMobile ? 'Tap the LEFT half of your screen.' : 'Press S or Down Arrow.'}
                      <br />
                      <span className="text-slate-400">Drops Earth fast to quickly duck under rocks and ceiling barriers.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: 3 Abilities */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="font-display font-black text-white text-sm sm:text-base">
                    2. YOUR 3 SUPER ABILITIES (PRESS WHEN IN TROUBLE)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-cyan-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-cyan-300">Phase Warp</span>
                      <span className="font-mono text-[9px] bg-cyan-950 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-500/40">KEY: Q</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Turns Earth completely ghost-like and invincible for 1.5 seconds! Pass right through impossible rocks without taking damage.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-sky-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sky-300">EMP Shockwave</span>
                      <span className="font-mono text-[9px] bg-sky-950 text-sky-200 px-1.5 py-0.2 rounded border border-sky-500/40">KEY: E</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      A giant electric blast that destroys all nearby obstacles and turns them into +250 bonus score points!
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-300">Plasma Vent</span>
                      <span className="font-mono text-[9px] bg-amber-950 text-amber-200 px-1.5 py-0.2 rounded border border-amber-500/40">KEY: F</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Rockets Earth upward out of the danger zone while blowing incoming rocks backwards to clear a safe flight path.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Obstacles */}
              <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/40 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h3 className="font-display font-black text-white text-sm sm:text-base">
                    3. OBSTACLES & DANGERS (WHAT TO DODGE)
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-start gap-2">
                    <span className="text-base shrink-0">🪨</span>
                    <div>
                      <span className="font-bold text-white">Asteroids & Space Rocks:</span>
                      <span className="text-slate-300 ml-1">Float in your path. Small rocks deal 20 damage, giant rocks deal 40 damage. Dodge them or blast them with EMP!</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-start gap-2">
                    <span className="text-base shrink-0">🔴</span>
                    <div>
                      <span className="font-bold text-rose-300">Red Warning Line / Meteors:</span>
                      <span className="text-slate-300 ml-1">When a red laser line appears on screen, a burning meteor will shoot across that lane 1 second later—move away quickly!</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-start gap-2">
                    <span className="text-base shrink-0">🔥</span>
                    <div>
                      <span className="font-bold text-amber-300">Solar Flares & Star Beams:</span>
                      <span className="text-slate-300 ml-1">Arches of hot plasma erupting from nearby stars. Dive underneath or use Phase Warp (Q) to glide through safely.</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-start gap-2">
                    <span className="text-base shrink-0">⚠️</span>
                    <div>
                      <span className="font-bold text-emerald-300">Ground Landing Rules:</span>
                      <span className="text-slate-300 ml-1">Touching the floor recharges your 10 jumps, but don't rest on the ground for more than 1 second or space friction damages your atmosphere!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* Mobile controls section */}
              {isMobile ? (
                <div className="rounded-xl p-4 border bg-sky-950/40 border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>📱 Mobile Touch Controls</span>
                      <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">(Active On This Device)</span>
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-sky-500/30">
                      <span className="text-sky-300 font-mono font-bold block mb-1">RIGHT THUMB: THRUST / JUMP</span>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        Activates Earth’s atmospheric ion thrusters to fly upward. Earth has 10 limited jumps. A live jump counter displays remaining jumps.
                      </p>
                    </div>
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/30">
                      <span className="text-amber-300 font-mono font-bold block mb-1">LEFT THUMB: DIVE / DESCEND</span>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        Fires emergency retro-burn to dive swiftly downward and duck under ceiling barriers and incoming asteroids.
                      </p>
                    </div>
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/60 sm:col-span-2">
                      <span className="text-cyan-300 font-mono font-bold block mb-1">CENTER DOCK: PLANETARY SKILLS</span>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        Tap the micro-dock buttons above the controls to trigger Dimensional Warp, EMP Shockwave, and Plasma Vent.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                    ⚡ <span className="font-bold text-white">JUMP SYSTEM TIP:</span> You have 10 limited jumps in mid-air. Landing on the ground instantly refills your jumps back to 10/10! When low (&le;3 jumps left), the counter flashes red. Avoid hugging the floor for &gt;1.1s or surface friction will burn Earth’s biosphere.
                  </div>
                </div>
              ) : (
                /* PC Desktop Keyboard controls section */
                <div className="rounded-xl p-4 border bg-sky-950/40 border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>💻 PC Keyboard & Mouse Controls</span>
                      <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">(Active On This Device)</span>
                    </h4>
                  </div>

                  <div className="space-y-2.5 mt-2">
                    <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">Ascend / Ion Thrusters</span>
                        <span className="text-[11px] text-slate-400">10 limited jumps. Recharges to 10/10 instantly on ground landing.</span>
                      </div>
                      <div className="flex gap-1.5 font-mono text-xs font-bold text-sky-300">
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">SPACE</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">↑</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">W</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">CLICK</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">Emergency Dive / Downward Burn</span>
                        <span className="text-[11px] text-slate-400">Quick vertical drop to clear overhead obstacles.</span>
                      </div>
                      <div className="flex gap-1.5 font-mono text-xs font-bold text-amber-300">
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">↓</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">S</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">Planetary Skills Hotkeys</span>
                        <span className="text-[11px] text-slate-400">Warp (Q) · EMP Blast (E) · Retro-Vent (F)</span>
                      </div>
                      <div className="flex gap-1.5 font-mono text-xs font-bold text-cyan-300">
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Q</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">E</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">F</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-300">Pause / Resume Flight</span>
                      <div className="font-mono text-xs font-bold text-sky-300">
                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">ESC</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                    ⚡ <span className="font-bold text-white">JUMP SYSTEM TIP:</span> You have 10 limited jumps in mid-air. Landing on the ground instantly refills your jumps back to 10/10! When low (&le;3 jumps left), the counter flashes red. Avoid hugging the floor for &gt;1.1s or surface friction will burn Earth’s biosphere.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-3">
              <div className="bg-slate-950/70 border border-sky-500/40 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-sky-900/60 text-sky-400">
                      <Radio className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-white text-sm">Geomagnetic EMP Shockwave</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-sky-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      KEY: E
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">14s CD</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Discharges Earth's molten core magnetic field in a violent 440px omnidirectional shockwave. Instantly vaporizes nearby obstacles and transmutes them into valuable Cosmic Energy Orbs (+250 PTS each)!
                </p>
              </div>

              <div className="bg-slate-950/70 border border-cyan-500/40 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-cyan-900/60 text-cyan-300">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-white text-sm">Dimensional Phase Warp</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      KEY: Q
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">10s CD</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Phases Earth temporarily into higher-dimensional subspace. Renders Earth completely immune to all physical and cosmic damage for 1.5 seconds while performing an instantaneous forward micro-jump.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-900/60 text-amber-400">
                      <Flame className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-white text-sm">Plasma Retro-Vent</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      KEY: F
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">18s CD</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Channels superheated atmospheric ion exhaust downwards. Rockets Earth sharply upwards out of danger while blowing oncoming obstacles backward by 180 light-units to clear a safe escape corridor.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'powerups' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">🛡️</span>
                  <h4 className="font-bold text-white text-sm">Magnetic Shield</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Deploys a geomagnetic forcefield around Earth that completely absorbs one collision.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">🌱</span>
                  <h4 className="font-bold text-white text-sm">Biosphere Repair</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Restores 30% of Earth’s damaged biosphere and atmospheric ozone layer.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">⏳</span>
                  <h4 className="font-bold text-white text-sm">Chrono Warp</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Distorts spacetime to slow down all incoming obstacles by 45% for 7 seconds.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">⚡</span>
                  <h4 className="font-bold text-white text-sm">Hyper-Drive Boost</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Grants temporary invincibility, obliterates colliding obstacles, and multiplies score 3X.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:col-span-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">🧲</span>
                  <h4 className="font-bold text-white text-sm">Gravitational Magnet</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Amplifies Earth’s gravitational pull to effortlessly attract nearby Cosmic Energy Orbs.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'hazards' && (
            <div className="space-y-3">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                  <span>Small & Giant Asteroids</span>
                  <span className="text-[10px] font-mono text-amber-400">Rocky Debris</span>
                </h4>
                <p className="text-slate-400 text-xs">
                  Tumbling irregular asteroids. Giant asteroids inflict heavy damage (40 HP) and cracked fissures.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                  <span>Meteor Showers (Telegraphed!)</span>
                  <span className="text-[10px] font-mono text-rose-400">High-Speed Threat</span>
                </h4>
                <p className="text-slate-400 text-xs">
                  Roaring burning meteors. A red warning laser line flashes 1 second in advance along their lane—evade immediately!
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                  <span>Solar Flares & Pulsar Star Beams</span>
                  <span className="text-[10px] font-mono text-amber-500">Coronal Waves & Radiation</span>
                </h4>
                <p className="text-slate-400 text-xs">
                  Gigantic undulating solar coronal arches erupting across space, and rapidly spinning neutron pulsars sweeping deadly particle beams.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                  <span>Void Crystals & Alien Proximity Mines</span>
                  <span className="text-[10px] font-mono text-violet-400">Dark Matter & Ordnance</span>
                </h4>
                <p className="text-slate-400 text-xs">
                  Resonant obsidian void crystals spinning with unstable dark matter cores, and ancient alien proximity mines armed with red detection triggers.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                  <span>Cosmic Leviathan & Antimatter Vortex</span>
                  <span className="text-[10px] font-mono text-cyan-400">Megafauna & Singularities</span>
                </h4>
                <p className="text-slate-400 text-xs">
                  Colossal undulating cosmic shadow leviathans spanning the void, and violent counter-rotating antimatter vortices that warp light and space.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div className="space-y-2.5">
              <div className="border border-sky-500/30 bg-sky-950/20 rounded-xl p-3">
                <span className="text-[10px] font-mono text-sky-400 font-bold">ZONE 1 (0 – 2,500 LY)</span>
                <h4 className="font-bold text-white text-sm">Solar System Outskirts</h4>
                <p className="text-slate-400 text-xs mt-0.5">Mars, Jupiter, and Saturn in parallax. Familiar cosmic scenery.</p>
              </div>

              <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-3">
                <span className="text-[10px] font-mono text-amber-400 font-bold">ZONE 2 (2,500 – 6,000 LY)</span>
                <h4 className="font-bold text-white text-sm">Main Asteroid Belt</h4>
                <p className="text-slate-400 text-xs mt-0.5">Dense rocky debris fields and sudden high-speed meteor showers.</p>
              </div>

              <div className="border border-purple-500/30 bg-purple-950/20 rounded-xl p-3">
                <span className="text-[10px] font-mono text-purple-400 font-bold">ZONE 3 (6,000 – 11,000 LY)</span>
                <h4 className="font-bold text-white text-sm">Dark Nebula Veil</h4>
                <p className="text-slate-400 text-xs mt-0.5">Deep violet clouds, cosmic storms, and crackling plasma barriers.</p>
              </div>

              <div className="border border-cyan-500/30 bg-cyan-950/20 rounded-xl p-3">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">ZONE 4 (11,000 – 17,500 LY)</span>
                <h4 className="font-bold text-white text-sm">Glacial Expanse</h4>
                <p className="text-slate-400 text-xs mt-0.5">Glacial cyan temperatures, frozen celestial bodies, and crystal comets.</p>
              </div>

              <div className="border border-rose-500/30 bg-rose-950/20 rounded-xl p-3">
                <span className="text-[10px] font-mono text-rose-400 font-bold">ZONE 5 (17,500+ LY)</span>
                <h4 className="font-bold text-white text-sm">The Unknown Universe</h4>
                <p className="text-slate-400 text-xs mt-0.5">Quantum anomalies, micro black holes, and surreal celestial megastructures.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs transition-colors"
          >
            DISMISS MANUAL
          </button>
        </div>
      </div>
    </div>
  );
};
