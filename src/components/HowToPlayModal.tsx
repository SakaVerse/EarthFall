import React, { useState } from 'react';
import { X, Shield, Zap, Clock, Compass, AlertTriangle, Layers, Gamepad2, Sparkles, Radio, Flame } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { POWER_UP_CONFIG } from '../game/constants';

interface HowToPlayModalProps {
  onClose: () => void;
  isMobile: boolean;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose, isMobile }) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'skills' | 'powerups' | 'hazards' | 'zones'>('controls');

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-40 select-none animate-fadeIn overflow-y-auto">
      <div className="mobile-modal-card w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 flex flex-col max-h-[94vh] sm:max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
                MISSION FLIGHT MANUAL
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {isMobile ? '📱 Mobile Controls Active' : '💻 PC Controls Active'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              HOW TO PLAY
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'controls', label: 'Controls', icon: Gamepad2 },
            { id: 'skills', label: 'Active Skills', icon: Sparkles },
            { id: 'powerups', label: 'Power-Ups', icon: Zap },
            { id: 'hazards', label: 'Hazards', icon: AlertTriangle },
            { id: 'zones', label: '5 Space Zones', icon: Layers },
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="py-4 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
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
