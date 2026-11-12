import React, { useState, useRef, useEffect } from 'react';
import { User, Rocket, AlertCircle, Loader2 } from 'lucide-react';
import { LeaderboardManager } from '../game/leaderboard';
import { soundEngine } from '../game/audio';

interface UsernameModalProps {
  onComplete: (username: string) => void;
  initialError?: string | null;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete, initialError }) => {
  const [username, setUsername] = useState(() => LeaderboardManager.getUsername() || '');
  const [error, setError] = useState<string | null>(initialError || null);
  const [isChecking, setIsChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Native capture listener to guarantee S, W, Space, and all letters work flawlessly
    const inputEl = inputRef.current;
    const stopNative = (e: KeyboardEvent) => {
      e.stopPropagation();
      // Allow default input typing for all alphanumeric keys, space, backspace, etc.
    };

    if (inputEl) {
      inputEl.addEventListener('keydown', stopNative, { capture: true });
      inputEl.addEventListener('keypress', stopNative, { capture: true });
      inputEl.addEventListener('keyup', stopNative, { capture: true });
    }

    return () => {
      clearTimeout(timer);
      if (inputEl) {
        inputEl.removeEventListener('keydown', stopNative, { capture: true });
        inputEl.removeEventListener('keypress', stopNative, { capture: true });
        inputEl.removeEventListener('keyup', stopNative, { capture: true });
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChecking) return;
    soundEngine.playClick();

    const trimmed = username.trim();
    const formatCheck = LeaderboardManager.validateUsernameFormat(trimmed);
    if (!formatCheck.valid) {
      setError(formatCheck.error || 'Nickname must be 2–12 alphanumeric characters');
      inputRef.current?.focus();
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Check and reserve uniquely in Firebase Firestore
      const result = await LeaderboardManager.reserveNickname(trimmed);
      if (!result.success) {
        setError(result.error || 'Nickname is already taken, please try another!');
        inputRef.current?.focus();
        setIsChecking(false);
        return;
      }

      onComplete(trimmed);
    } catch {
      setError('Connection error, please try again');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn select-none"
      onMouseDown={(e) => {
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
          Welcome to <strong className="text-sky-300">Earth Fall</strong>! Choose your cosmic nickname to record your scores on the Global Leaderboard.
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
                // Ensure S, W, Space, and all keys type properly into input
                e.stopPropagation();
              }}
              onKeyUp={(e) => e.stopPropagation()}
              placeholder="Enter your nickname"
              maxLength={12}
              autoFocus
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              disabled={isChecking}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-slate-950/90 border border-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm font-mono text-white placeholder-slate-500 transition-all disabled:opacity-60"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono text-left bg-rose-950/60 border border-rose-600 p-2.5 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-semibold text-rose-200">{error}</span>
            </div>
          )}

          <div className="text-[11px] font-mono text-slate-500 text-left px-1">
            &bull; Up to 12 alphanumeric characters (letters and numbers only)
          </div>

          <button
            type="submit"
            disabled={isChecking}
            className="w-full mt-1 sm:mt-2 py-2.5 sm:py-3 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-60 text-white font-black rounded-2xl shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 transition-all text-xs sm:text-sm tracking-wider cursor-pointer flex items-center justify-center gap-2"
          >
            {isChecking && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            <span>{isChecking ? 'VERIFYING...' : 'CONFIRM NICKNAME'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
