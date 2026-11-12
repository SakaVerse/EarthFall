import React from 'react';
import { X, BookOpen, Sun, Magnet, Compass, Rocket } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface StoryModalProps {
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ onClose }) => {
  const chapters = [
    {
      num: 1,
      title: 'Chapter 1: A Peaceful Home',
      icon: Sun,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
      text: 'For billions of years, Earth orbited safely around our warm Sun inside the Solar System. Life grew, oceans shone, and humanity called this blue planet home.',
    },
    {
      num: 2,
      title: 'Chapter 2: The Dark Visitor',
      icon: Magnet,
      color: 'from-purple-500/20 to-rose-500/10 border-purple-500/30 text-purple-300',
      text: 'One day, a giant wandering star entered the edge of our Solar System. Its super-strong gravity pulled on all the planets like a massive magnet, breaking their safe paths.',
    },
    {
      num: 3,
      title: 'Chapter 3: Lost in Space',
      icon: Compass,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300',
      text: "Earth was flung out of the Sun's orbit and pushed deep into dark, cold space—far away from our Solar System. Without the Sun's warmth, the sky turned pitch black.",
    },
    {
      num: 4,
      title: 'Chapter 4: Your Mission',
      icon: Rocket,
      color: 'from-sky-500/20 to-emerald-500/10 border-sky-500/30 text-sky-300',
      text: 'Now Earth is drifting alone through the universe. Humanity built giant engines and shields on the planet to survive asteroids, black holes, and space dangers. Guide Earth safely and find a new sun to call home!',
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-slate-900/95 border border-sky-500/40 rounded-3xl shadow-[0_0_50px_rgba(56,189,248,0.25)] p-5 sm:p-6 flex flex-col max-h-[88vh] text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-display font-black text-white tracking-wide flex items-center gap-2">
                <span>EARTHFALL CHRONICLES</span>
              </h3>
              <p className="text-[11px] font-mono text-sky-300/80">
                The Journey Beyond The Solar System
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Chapters List */}
        <div className="mt-3.5 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {chapters.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.num}
                className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br ${ch.color} border shadow-sm transition-all`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-black text-sm sm:text-base text-white tracking-wide">
                    {ch.title}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-sans">
                  {ch.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.4)] active:scale-95 transition-all text-xs sm:text-sm tracking-wide cursor-pointer"
          >
            RETURN TO FLIGHT DECK
          </button>
        </div>
      </div>
    </div>
  );
};
