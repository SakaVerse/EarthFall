import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { ActivePowerUp, ActiveSkill, GameSettings, GameState, PlayerStats, SkillType, SkinId } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { StoryIntro } from './components/StoryIntro';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SettingsModal } from './components/SettingsModal';
import { TouchControls } from './components/TouchControls';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { SkinShopModal } from './components/SkinShopModal';
import { UsernameModal } from './components/UsernameModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StoryModal } from './components/StoryModal';
import { NewBestOverlay } from './components/NewBestOverlay';
import { LeaderboardManager } from './game/leaderboard';
import { soundEngine } from './game/audio';
import { CosmeticsManager } from './game/cosmetics';
import { DailyMissionsManager } from './game/dailyMissions';
import { AuthService } from './firebase/authService';
import { CloudService } from './firebase/cloudService';
import { detectDevice } from './utils/device';
import { crazyGames } from './game/crazyGamesSdk';
import { RotateCw } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSkinShop, setShowSkinShop] = useState(false);
  const [showDailyMissions, setShowDailyMissions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isNewBestAnimating, setIsNewBestAnimating] = useState(false);
  const [newBestScore, setNewBestScore] = useState(0);
  const newBestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState<boolean>(() => !LeaderboardManager.getUsername());
  const [usernamePromptError, setUsernamePromptError] = useState<string | null>(null);

  // Device Auto-Detection
  const [detectedIsMobile, setDetectedIsMobile] = useState<boolean>(() => detectDevice().isMobile);
  const [isPortrait, setIsPortrait] = useState<boolean>(() => detectDevice().isPortrait);
  const [showOrientationHint, setShowOrientationHint] = useState<boolean>(true);

  // Live HUD telemetry
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    distance: 0,
    energyCollected: 0,
    obstaclesDodged: 0,
    maxCombo: 0,
    currentCombo: 0,
    zone: 'solar_system',
  });
  const [health, setHealth] = useState(100);
  const [jumpsRemaining, setJumpsRemaining] = useState<number>(10);
  const [maxJumps, setMaxJumps] = useState<number>(10);
  const [isGrounded, setIsGrounded] = useState(false);
  const [isGroundHazardActive, setIsGroundHazardActive] = useState(false);
  const [scrapBalance, setScrapBalance] = useState<number>(() => CosmeticsManager.getScrapBalance());
  const [coinsEarnedThisRun, setCoinsEarnedThisRun] = useState<number>(0);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [skills, setSkills] = useState<ActiveSkill[]>([]);
  const [bestScore, setBestScore] = useState(0);

  // Settings with controlMode auto
  const [settings, setSettings] = useState<GameSettings>({
    screenShake: true,
    highQualityParticles: true,
    controlMode: 'auto',
    touchControlsVisible: true,
    sound: {
      masterVolume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      muted: false,
    },
  });

  // Effective mobile mode based on auto-detection or user override
  const isMobileActive =
    settings.controlMode === 'mobile'
      ? true
      : settings.controlMode === 'pc'
      ? false
      : detectedIsMobile;

  // Real-time device event detection (screen resize & touch recognition)
  useEffect(() => {
    const handleResize = () => {
      const dev = detectDevice();
      setDetectedIsMobile(dev.isMobile);
      setIsPortrait(dev.isPortrait);
    };

    const handleFirstTouch = () => {
      setDetectedIsMobile(true);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('touchstart', handleFirstTouch, { once: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  // Initialize Game Engine on Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onStateChange = (newState) => {
      setGameState(newState);
      if (newState === 'PLAYING') {
        LeaderboardManager.recordGamePlayed();
        if (!soundEngine.isMuted()) {
          soundEngine.startMusic();
        }
      } else {
        soundEngine.stopMusic();
      }
      if (newState === 'GAME_OVER') {
        const runScore = engine.stats.score;
        const currentBest = engine.getBestScore();
        const isNewRecord = runScore > currentBest && runScore > 0;
        const highestScore = Math.max(runScore, currentBest);
        setBestScore((prev) => Math.max(prev, highestScore));
        setCoinsEarnedThisRun(engine.scrapCollectedThisRun);

        // Display celebratory NEW BEST! overlay before Game Over modal appears
        if (isNewRecord) {
          setNewBestScore(runScore);
          setIsNewBestAnimating(true);
          soundEngine.playNewBest();
          crazyGames.happyTime();

          if (newBestTimerRef.current) {
            clearTimeout(newBestTimerRef.current);
          }
          newBestTimerRef.current = setTimeout(() => {
            setIsNewBestAnimating(false);
          }, 2400);
        } else {
          setIsNewBestAnimating(false);
        }

        // Auto-persist permanent player profile & progress to Firestore
        const uid = AuthService.getUserId();
        CloudService.savePlayerProfile(uid, {
          bestScore: highestScore,
          coins: CosmeticsManager.getScrapBalance(),
          scrapBalance: CosmeticsManager.getScrapBalance(),
          unlockedSkins: CosmeticsManager.getUnlockedSkins(),
          unlockedThemes: [CosmeticsManager.getEquippedTheme()],
        }).catch(() => {});
      }
    };

    engine.onStatsUpdate = (
      newStats,
      newHealth,
      newPowerUps,
      _zoneBanner,
      newSkills,
      newJumpsRemaining,
      newMaxJumps,
      newIsGrounded,
      newIsHazard,
      newScrap
    ) => {
      setStats({ ...newStats });
      setHealth(newHealth);
      setActivePowerUps([...newPowerUps]);
      if (newSkills) {
        setSkills([...newSkills]);
      }
      if (typeof newJumpsRemaining === 'number') {
        setJumpsRemaining(newJumpsRemaining);
      }
      if (typeof newMaxJumps === 'number') {
        setMaxJumps(newMaxJumps);
      }
      if (typeof newIsGrounded === 'boolean') {
        setIsGrounded(newIsGrounded);
      }
      if (typeof newIsHazard === 'boolean') {
        setIsGroundHazardActive(newIsHazard);
      }
      if (typeof newScrap === 'number') {
        setScrapBalance(newScrap);
      }
    };

    engine.init();
    setBestScore(engine.getBestScore());
    DailyMissionsManager.checkAndRecordStreak();

    return () => {
      engine.destroy();
    };
  }, []);

  // Multi-layer permanent recovery & profile synchronization
  useEffect(() => {
    const unsub = AuthService.subscribe(async (uid, profile) => {
      if (uid) {
        try {
          if (profile) {
            // Automatically load PILOT nickname
            if (profile.nickname) {
              LeaderboardManager.setUsername(profile.nickname);
              setShowUsernamePrompt(false);
            }
            // Automatically load BEST score
            if (typeof profile.bestScore === 'number' && profile.bestScore > 0) {
              setBestScore((prev) => Math.max(prev, profile.bestScore || 0));
            }
            // Automatically load coins / scrap balance
            const cloudCoins = profile.scrapBalance ?? profile.coins;
            if (typeof cloudCoins === 'number') {
              const merged = Math.max(cloudCoins, CosmeticsManager.getScrapBalance());
              CosmeticsManager.setScrapBalance(merged);
              setScrapBalance(merged);
            }
            // Automatically load unlocked skins & themes
            if (Array.isArray(profile.unlockedSkins)) {
              CosmeticsManager.syncUnlockedSkins(profile.unlockedSkins as SkinId[]);
            }
          } else {
            // Check if nickname can be loaded directly from cloud
            const nick = await LeaderboardManager.refreshNicknameFromCloud();
            if (nick) {
              setShowUsernamePrompt(false);
            }
          }
        } catch (e) {
          console.warn('[App] Auto-recovery profile sync notice:', e);
        }
      }
    });
    return () => unsub();
  }, []);

  // Update engine when screen shake setting changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.screenShakeEnabled = settings.screenShake;
    }
  }, [settings.screenShake]);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable all game key listeners while UsernameModal is active or any input is focused
      if (
        showUsernamePrompt ||
        (e.target as HTMLElement)?.tagName === 'INPUT' ||
        (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (!engineRef.current) return;

      // Prevent default scrolling for game keys only when playing or on title
      if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (gameState === 'TITLE' && !showHowToPlay && !showSettings && !showSkinShop && !showDailyMissions && !showLeaderboard && !showUsernamePrompt) {
          handleStartGame();
        } else if (gameState === 'PLAYING') {
          engineRef.current.applyJump();
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (gameState === 'PLAYING') {
          engineRef.current.applyDive();
        }
      } else if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') {
        if (gameState === 'PLAYING') {
          engineRef.current.triggerPhaseWarp();
        }
      } else if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        if (gameState === 'PLAYING') {
          engineRef.current.triggerEmpShockwave();
        }
      } else if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        if (gameState === 'PLAYING') {
          engineRef.current.triggerRetroVent();
        }
      } else if (e.code === 'Escape') {
        if (showHowToPlay) {
          setShowHowToPlay(false);
        } else if (showSettings) {
          setShowSettings(false);
        } else if (showSkinShop) {
          setShowSkinShop(false);
        } else if (showDailyMissions) {
          setShowDailyMissions(false);
        } else if (showLeaderboard) {
          setShowLeaderboard(false);
        } else if (showStoryModal) {
          setShowStoryModal(false);
        } else if (gameState === 'PLAYING') {
          engineRef.current.pauseGame();
        } else if (gameState === 'PAUSED') {
          engineRef.current.resumeGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showHowToPlay, showSettings, showSkinShop, showDailyMissions, showLeaderboard, showStoryModal, showUsernamePrompt]);

  // Handlers
  const handleTriggerSkill = useCallback((type: SkillType) => {
    if (engineRef.current) {
      engineRef.current.triggerSkill(type);
    }
  }, []);

  const handleStartGame = useCallback(async () => {
    const currentUsername = LeaderboardManager.getUsername();
    if (!currentUsername) {
      setUsernamePromptError(null);
      setShowUsernamePrompt(true);
      return;
    }

    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handleStartStory = useCallback(() => {
    setGameState('STORY_INTRO');
  }, []);

  const handleStoryComplete = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (newBestTimerRef.current) {
      clearTimeout(newBestTimerRef.current);
    }
    setIsNewBestAnimating(false);
    crazyGames.requestMidgameAd(() => {
      if (engineRef.current) {
        engineRef.current.startGame();
      }
    });
  }, []);

  const handleHome = useCallback(() => {
    if (newBestTimerRef.current) {
      clearTimeout(newBestTimerRef.current);
    }
    setIsNewBestAnimating(false);
    if (engineRef.current) {
      engineRef.current.resetGame();
      engineRef.current.state = 'TITLE';
    }
    setGameState('TITLE');
  }, []);

  const handleClaimBonusScrap = useCallback(() => {
    crazyGames.requestRewardedAd(
      () => {
        const bonus = 150;
        const newTotal = CosmeticsManager.addScrap(bonus);
        setScrapBalance(newTotal);
        soundEngine.playRewardClaim();
      },
      () => {
        console.log('[CrazyGames] Rewarded ad dismissed without reward');
      }
    );
  }, []);

  const handleToggleMute = useCallback(() => {
    setSettings((prev) => {
      const newMuted = !prev.sound.muted;
      const updated = {
        ...prev,
        sound: { ...prev.sound, muted: newMuted },
      };
      soundEngine.updateSettings(updated.sound);
      if (newMuted) {
        soundEngine.stopMusic();
      } else {
        if (gameState === 'PLAYING') {
          soundEngine.startMusic();
        }
      }
      return updated;
    });
  }, [gameState]);

  const handleClearHighScores = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.clearHighScores();
      setBestScore(0);
    }
  }, []);

  const handleCanvasTap = useCallback(() => {
    if (!isMobileActive && gameState === 'PLAYING' && engineRef.current) {
      engineRef.current.applyJump();
    }
  }, [gameState, isMobileActive]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center font-display select-none touch-none">
      {/* Dynamic Viewport Container: Scaled cleanly without letterbox overflow */}
      <div className="relative w-full h-full max-w-[177.78vh] max-h-[100vh] sm:max-h-[56.25vw] aspect-auto sm:aspect-video flex items-center justify-center overflow-hidden cosmic-vignette">
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain block ${isMobileActive ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={!isMobileActive ? handleCanvasTap : undefined}
        />

        {/* PORTRAIT ORIENTATION HELPER FOR MOBILE */}
        {isMobileActive && isPortrait && showOrientationHint && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2 bg-slate-950/95 border border-sky-500/50 text-sky-200 text-[10px] sm:text-[11px] font-mono px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md">
            <RotateCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            <span>Rotate to Landscape for Wider Field of View</span>
            <button
              onClick={() => setShowOrientationHint(false)}
              className="ml-1 text-slate-400 hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* FIRST-TIME / CHANGE USERNAME MODAL */}
        {showUsernamePrompt && (
          <UsernameModal
            initialError={usernamePromptError}
            onComplete={(_name) => {
              setUsernamePromptError(null);
              setShowUsernamePrompt(false);
              if (engineRef.current) {
                engineRef.current.startGame();
              }
            }}
          />
        )}

        {/* TITLE SCREEN OVERLAY */}
        {gameState === 'TITLE' && !showHowToPlay && !showSettings && !showSkinShop && !showDailyMissions && !showLeaderboard && !showStoryModal && !showUsernamePrompt && (
          <TitleScreen
            onStart={handleStartGame}
            onOpenShop={() => setShowSkinShop(true)}
            onOpenMissions={() => setShowDailyMissions(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenStory={() => setShowStoryModal(true)}
            onSettings={() => setShowSettings(true)}
            bestScore={bestScore}
            muted={settings.sound.muted}
            onToggleMute={handleToggleMute}
            isMobile={isMobileActive}
          />
        )}

        {/* STORY PROLOGUE INTRO */}
        {gameState === 'STORY_INTRO' && (
          <StoryIntro onComplete={handleStoryComplete} isMobile={isMobileActive} />
        )}

        {/* IN-GAME HUD */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <HUD
            stats={stats}
            health={health}
            jumpsRemaining={jumpsRemaining}
            maxJumps={maxJumps}
            isGrounded={isGrounded}
            isGroundHazardActive={isGroundHazardActive}
            scrapBalance={scrapBalance}
            activePowerUps={activePowerUps}
            skills={skills}
            bestScore={bestScore}
            muted={settings.sound.muted}
            isMobile={isMobileActive}
            onPause={handlePause}
            onToggleMute={handleToggleMute}
            onTriggerSkill={handleTriggerSkill}
          />
        )}

        {/* MOBILE ON-SCREEN TOUCH CONTROLS */}
        {isMobileActive && gameState === 'PLAYING' && (
          <TouchControls
            onJump={() => engineRef.current?.applyJump()}
            onDive={() => engineRef.current?.applyDive()}
            skills={skills}
            onTriggerSkill={handleTriggerSkill}
            jumpsRemaining={jumpsRemaining}
            maxJumps={maxJumps}
          />
        )}

        {/* PAUSE MODAL */}
        {gameState === 'PAUSED' && (
          <PauseModal
            onResume={handleResume}
            onRestart={handleRestart}
            onHome={handleHome}
            onOpenShop={() => setShowSkinShop(true)}
            muted={settings.sound.muted}
            isMobile={isMobileActive}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* GAME OVER MODAL */}
        {/* 'NEW BEST!' TEXT ANIMATION OVERLAY (Shown before Game Over modal appears) */}
        {isNewBestAnimating && (
          <NewBestOverlay
            score={newBestScore}
            onDismiss={() => {
              if (newBestTimerRef.current) {
                clearTimeout(newBestTimerRef.current);
              }
              setIsNewBestAnimating(false);
            }}
          />
        )}

        {/* GAME OVER MODAL (Revealed after NEW BEST celebration) */}
        {gameState === 'GAME_OVER' && !isNewBestAnimating && (
          <GameOverModal
            stats={stats}
            bestScore={bestScore}
            coinsEarned={coinsEarnedThisRun}
            onRestart={handleRestart}
            onHome={handleHome}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onClaimBonusScrap={handleClaimBonusScrap}
            isMobile={isMobileActive}
          />
        )}

        {/* HOW TO PLAY MODAL */}
        {showHowToPlay && (
          <HowToPlayModal onClose={() => setShowHowToPlay(false)} isMobile={isMobileActive} />
        )}

        {/* SETTINGS MODAL */}
        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={(newSettings) =>
              setSettings((prev) => ({ ...prev, ...newSettings }))
            }
            onClearHighScores={handleClearHighScores}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* DAILY MISSIONS / DIRECTIVES MODAL */}
        {showDailyMissions && (
          <DailyMissionsModal
            onClose={() => setShowDailyMissions(false)}
            onClaimReward={() => {
              setScrapBalance(CosmeticsManager.getScrapBalance());
              engineRef.current?.refreshCosmetics();
            }}
          />
        )}

        {/* SKIN SHOP & COSMETIC HANGAR MODAL */}
        {showSkinShop && (
          <SkinShopModal
            onClose={() => setShowSkinShop(false)}
            onSkinEquipped={(_skinId: SkinId) => {
              setScrapBalance(CosmeticsManager.getScrapBalance());
              engineRef.current?.refreshCosmetics();
            }}
          />
        )}

        {/* GLOBAL LEADERBOARD MODAL */}
        {showLeaderboard && (
          <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
        )}

        {/* EARTHFALL CHRONICLES STORY MODAL */}
        {showStoryModal && (
          <StoryModal onClose={() => setShowStoryModal(false)} />
        )}
      </div>
    </div>
  );
}
