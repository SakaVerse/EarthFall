import React, { useState } from 'react';
import { X, Volume2, VolumeX, Vibrate, Trash2, Check } from 'lucide-react';
import { AudioSettings, GameSettings } from '../game/types';
import { soundEngine } from '../game/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClearHighScores: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClearHighScores,
  onClose,
}) => {
  const [clearedConfirm, setClearedConfirm] = useState(false);

  const handleSoundChange = (field: keyof AudioSettings, value: number | boolean) => {
    const updatedSound = { ...settings.sound, [field]: value };
    soundEngine.updateSettings(updatedSound);
    onUpdateSettings({ sound: updatedSound });
  };

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
              SYSTEM CONFIGURATION
            </span>
            <h2 className="text-xl font-display font-extrabold text-white">
              SETTINGS
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

        {/* Settings Form */}
        <div className="py-4 space-y-4 text-xs sm:text-sm">
          {/* Master Mute */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {settings.sound.muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-sky-400" />
              )}
              <div>
                <span className="font-semibold text-white block">Master Audio</span>
                <span className="text-[11px] text-slate-400">Toggle all music and sound</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                handleSoundChange('muted', !settings.sound.muted);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors ${
                settings.sound.muted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-sky-500 text-white'
              }`}
            >
              {settings.sound.muted ? 'MUTED' : 'ACTIVE'}
            </button>
          </div>

          {/* Music Volume Slider */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white">Synthesizer Space Music</span>
              <span className="font-mono text-sky-400">{Math.round(settings.sound.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sound.musicVolume}
              onChange={(e) => handleSoundChange('musicVolume', parseFloat(e.target.value))}
              className="w-full accent-sky-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* SFX Volume Slider */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white">Sound Effects (SFX)</span>
              <span className="font-mono text-sky-400">{Math.round(settings.sound.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sound.sfxVolume}
              onChange={(e) => handleSoundChange('sfxVolume', parseFloat(e.target.value))}
              className="w-full accent-sky-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Control Scheme Selector */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-white block">Control Scheme</span>
                <span className="text-[11px] text-slate-400">Auto-detected or manual override</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings({ controlMode: 'auto' });
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  settings.controlMode === 'auto'
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Auto-Detect
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings({ controlMode: 'mobile' });
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  settings.controlMode === 'mobile'
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📱 Mobile
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings({ controlMode: 'pc' });
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  settings.controlMode === 'pc'
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💻 PC
              </button>
            </div>
          </div>

          {/* Screen Shake Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Vibrate className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-semibold text-white block">Screen Shake FX</span>
                <span className="text-[11px] text-slate-400">Tactile impact camera tremor</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ screenShake: !settings.screenShake });
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors ${
                settings.screenShake
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {settings.screenShake ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Clear High Scores */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <div>
                <span className="font-semibold text-white block">Reset Mission Records</span>
                <span className="text-[11px] text-slate-400">Clear stored high scores</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClearHighScores();
                setClearedConfirm(true);
                setTimeout(() => setClearedConfirm(false), 2000);
              }}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono text-xs font-bold rounded-lg border border-rose-500/40 transition-colors"
            >
              {clearedConfirm ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> CLEARED
                </span>
              ) : (
                'RESET'
              )}
            </button>
          </div>
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
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
