import React, { useState, useRef, useEffect } from 'react';
import { User, Rocket, AlertCircle } from 'lucide-react';
import { LeaderboardManager } from '../game/leaderboard';
import { soundEngine } from '../game/audio';

interface UsernameModalProps {
  onComplete: (username: string) => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ensure input keeps focus and opens virtual keyboard on mobile smoothly
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username');
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 15) {
      setError('Username must be 3-15 characters');
      inputRef.current?.focus();
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscores (_) allowed');
      inputRef.current?.focus();
      return;
    }

    if (LeaderboardManager.isUsernameTaken(trimmed)) {
      setError('Username already taken, try another');
      inputRef.current?.focus();
      return;
    }

    const res = LeaderboardManager.setUsername(trimmed);
    if (!res.success) {
      setError(res.error || 'Failed to save username');
      return;
    }

    onComplete(trimmed);
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn select-none"
      onMouseDown={(e) => {
        // Prevent background clicks from blurring the active input
        if (e.target !== inputRef.current) {
          inputRef.current?.focus();
        }
      }}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-sky-500/40 rounded-3xl shadow-[0_0_50px_rgba(56,189,248,0.25)] p-5 sm:p-7 flex flex-col items-center text-center">
        {/* Emblem */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
          <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400" />
        </div>

        <h3 className="text-xl sm:text-2xl font-display font-black text-white tracking-wide mb-1">
          PILOT REGISTRATION
        </h3>
        <p className="text-xs text-slate-400 mb-4 sm:mb-5 leading-relaxed">
          Welcome to <strong className="text-sky-300">Earth Fall</strong>! Choose your cosmic callsign to record your scores on the Global Leaderboard.
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-3"
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="relative w-full">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                // Ensure S, W, Space, and all characters type cleanly without triggering game actions
                e.stopPropagation();
              }}
              onKeyUp={(e) => e.stopPropagation()}
              placeholder="Enter your username"
              maxLength={15}
              autoFocus
              inputMode="text"
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-slate-950/90 border border-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm font-mono text-white placeholder-slate-500 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono text-left bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-[11px] font-mono text-slate-500 text-left px-1">
            &bull; 3–15 characters (letters, numbers, _)
          </div>

          <button
            type="submit"
            className="w-full mt-1 sm:mt-2 py-2.5 sm:py-3 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-2xl shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 transition-all text-xs sm:text-sm tracking-wider cursor-pointer"
          >
            SAVE & LAUNCH
          </button>
        </form>
      </div>
    </div>
  );
};
