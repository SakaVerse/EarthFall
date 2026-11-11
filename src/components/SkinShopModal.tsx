import React, { useEffect, useRef, useState } from 'react';
import { X, Check, ShoppingBag, Sparkles, Flame, Eye } from 'lucide-react';
import { SkinId, SkinItem, SkinTier } from '../game/types';
import { CosmeticsManager } from '../game/cosmetics';
import { renderEarth } from '../game/earthRenderer';
import { soundEngine } from '../game/audio';

interface SkinShopModalProps {
  onClose: () => void;
  onSkinEquipped: (skinId: SkinId) => void;
}

export const SkinShopModal: React.FC<SkinShopModalProps> = ({ onClose, onSkinEquipped }) => {
  const [scrapBalance, setScrapBalance] = useState<number>(() => CosmeticsManager.getScrapBalance());
  const [unlockedSkins, setUnlockedSkins] = useState<SkinId[]>(() => CosmeticsManager.getUnlockedSkins());
  const [equippedSkinId, setEquippedSkinId] = useState<SkinId>(() => CosmeticsManager.getEquippedSkinId());
  const [selectedSkinId, setSelectedSkinId] = useState<SkinId>(() => CosmeticsManager.getEquippedSkinId());
  const [activeTierFilter, setActiveTierFilter] = useState<'all' | SkinTier>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const allSkins = CosmeticsManager.getAllSkinsSorted();
  const selectedSkin: SkinItem = CosmeticsManager.getSkin(selectedSkinId);
  const isSelectedUnlocked = unlockedSkins.includes(selectedSkinId);
  const isSelectedEquipped = equippedSkinId === selectedSkinId;

  // Render animated 2D live preview of selected skin with space background, glow, and trail
  useEffect(() => {
    let rotation = 0;
    let cloudRotation = 0;
    let startTime = performance.now();
    const trailParticles: { x: number; y: number; alpha: number; radius: number; color: string }[] = [];

    const renderLoop = (time: number) => {
      const dt = 0.016;
      rotation = (rotation + dt * 25) % 360;
      cloudRotation = (cloudRotation + dt * 38) % 360;

      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          // Background deep space radial starburst
          const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 110);
          bgGrad.addColorStop(0, selectedSkin.glowColor || 'rgba(56, 189, 248, 0.3)');
          bgGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.4)');
          bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = bgGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 110, 0, Math.PI * 2);
          ctx.fill();

          // Live animated trail emission in preview
          if (selectedSkin.trailType && selectedSkin.trailType !== 'none') {
            if (Math.random() < 0.6) {
              trailParticles.push({
                x: cx - 42 + (Math.random() - 0.5) * 10,
                y: cy + (Math.random() - 0.5) * 14,
                alpha: 0.8,
                radius: 2 + Math.random() * 3,
                color: selectedSkin.trailColor || '#38bdf8',
              });
            }
          }

          // Render trail particles
          for (let i = trailParticles.length - 1; i >= 0; i--) {
            const p = trailParticles[i];
            p.x -= 24 * dt;
            p.alpha -= 1.2 * dt;
            if (p.alpha <= 0) {
              trailParticles.splice(i, 1);
              continue;
            }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          renderEarth(ctx, {
            x: cx,
            y: cy,
            radius: 44,
            rotation,
            cloudRotation,
            verticalTilt: 0,
            health: 100,
            jumpsRemaining: 10,
            maxJumps: 10,
            isShielded: false,
            isBoosted: false,
            isMagnetized: false,
            isPhasing: false,
            isHitFlash: false,
            time: (time - startTime) / 1000,
            skin: selectedSkin,
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedSkin]);

  const handleBuy = (skin: SkinItem) => {
    soundEngine.playClick();
    const result = CosmeticsManager.buySkin(skin.id);
    if (result.success) {
      soundEngine.playRewardClaim();
      setScrapBalance(CosmeticsManager.getScrapBalance());
      setUnlockedSkins(CosmeticsManager.getUnlockedSkins());
      setEquippedSkinId(skin.id);
      onSkinEquipped(skin.id);
      setNotification(`🎉 ${skin.name} unlocked and equipped!`);
      setTimeout(() => setNotification(null), 3000);
    } else {
      soundEngine.playStaminaExhausted();
      setNotification(`❌ ${result.message}`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleEquip = (skinId: SkinId) => {
    soundEngine.playClick();
    if (CosmeticsManager.equipSkin(skinId)) {
      setEquippedSkinId(skinId);
      onSkinEquipped(skinId);
      setNotification(`⚡ ${CosmeticsManager.getSkin(skinId).name} equipped!`);
      setTimeout(() => setNotification(null), 2500);
    }
  };

  const filteredSkins = allSkins.filter(
    (s) => activeTierFilter === 'all' || s.tier === activeTierFilter
  );

  const getTierBadgeClass = (tier: SkinTier) => {
    switch (tier) {
      case 'mythic':
        return 'bg-rose-950/90 text-rose-300 border border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse';
      case 'legendary':
        return 'bg-amber-950/90 text-amber-300 border border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
      case 'epic':
        return 'bg-purple-950/90 text-purple-300 border border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.5)]';
      case 'rare':
        return 'bg-blue-950/90 text-blue-300 border border-blue-500/50';
      case 'common':
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-40 select-none animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(56,189,248,0.25)] p-4 sm:p-6 flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
                COSMETIC HANGAR
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                {unlockedSkins.length}/{allSkins.length} SKINS UNLOCKED
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-white flex items-center gap-2">
              <span>PLANETARY SKINS & SHOP</span>
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Coins Balance */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-amber-500/40 px-3.5 py-1.5 rounded-2xl shadow-inner">
              <span className="text-sm">🪙</span>
              <span className="font-mono-numbers font-black text-amber-300 text-sm sm:text-base">
                {scrapBalance.toLocaleString()}
              </span>
              <span className="text-[9px] font-mono uppercase text-slate-400">COINS</span>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="my-2 p-2 bg-sky-950/90 border border-sky-400 text-sky-200 text-xs font-mono font-bold rounded-2xl text-center animate-fadeIn shrink-0">
            {notification}
          </div>
        )}

        {/* Tier filter tabs */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-800 text-xs font-semibold overflow-x-auto shrink-0">
          {(['all', 'common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => {
                soundEngine.playClick();
                setActiveTierFilter(tier);
              }}
              className={`px-3 py-1.5 rounded-xl uppercase tracking-wider text-[10px] sm:text-[11px] font-mono transition-all cursor-pointer ${
                activeTierFilter === tier
                  ? 'bg-sky-500 text-white font-black shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Main Content Area: Preview on Left, Skin Grid on Right */}
        <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto min-h-0 flex-1">
          {/* Left Column: Live 2D Rotating Planet Preview & Details */}
          <div className="md:col-span-5 bg-slate-950/85 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center justify-between">
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>LIVE PREVIEW</span>
              </span>
              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${getTierBadgeClass(selectedSkin.tier)}`}>
                {selectedSkin.tier}
              </span>
            </div>

            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center my-2">
              <canvas
                ref={previewCanvasRef}
                width={200}
                height={200}
                className="w-full h-full block"
              />
            </div>

            <div className="w-full text-left">
              <h3 className="font-display font-black text-lg text-white mb-0.5">
                {selectedSkin.name}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">
                {selectedSkin.description}
              </p>

              {/* Special Features Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 mb-3 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 font-mono">TRAIL:</span>
                  <span className="font-mono font-bold text-sky-300 uppercase">{selectedSkin.trailType || 'STANDARD'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 font-mono">GLOW:</span>
                  <span className="font-mono font-bold text-amber-300 uppercase">{selectedSkin.glowColor ? 'CUSTOM PULSE' : 'AURA'}</span>
                </div>
                {selectedSkin.specialRender && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-mono">SPECIAL:</span>
                    <span className="font-mono font-bold text-rose-300 uppercase">{selectedSkin.specialRender}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {isSelectedEquipped ? (
                <div className="w-full py-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>EQUIPPED NOW</span>
                </div>
              ) : isSelectedUnlocked ? (
                <button
                  onClick={() => handleEquip(selectedSkin.id)}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-black font-mono text-xs rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.5)] active:scale-95 transition-all cursor-pointer"
                >
                  EQUIP SKIN
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(selectedSkin)}
                  disabled={scrapBalance < selectedSkin.price}
                  className={`w-full py-3 font-black font-mono text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    scrapBalance >= selectedSkin.price
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>BUY FOR {selectedSkin.price.toLocaleString()} COINS</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Skin Selection Grid */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[56vh] pr-1 custom-scrollbar">
            {filteredSkins.map((skin) => {
              const isUnlocked = unlockedSkins.includes(skin.id);
              const isEquipped = equippedSkinId === skin.id;
              const isSelected = selectedSkinId === skin.id;

              return (
                <div
                  key={skin.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedSkinId(skin.id);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                    isSelected
                      ? 'border-sky-400 bg-sky-950/50 shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/60'
                      : 'border-slate-800/80 bg-slate-950/70 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  {/* Status Indicator Pill */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${getTierBadgeClass(skin.tier)}`}
                    >
                      {skin.tier}
                    </span>

                    {isEquipped ? (
                      <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[9px] font-mono text-sky-400 font-semibold">OWNED</span>
                    ) : (
                      <span className="text-[9px] font-mono text-amber-300 font-bold">{skin.price} 🪙</span>
                    )}
                  </div>

                  {/* Circular Color Swatch Thumbnail */}
                  <div
                    className="w-12 h-12 rounded-full mx-auto my-1.5 shadow-lg flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${skin.continentColor}, ${skin.oceanColor})`,
                      boxShadow: `0 0 12px ${skin.glowColor || skin.atmosphereColor}88`,
                    }}
                  >
                    {skin.ringStyle && skin.ringStyle !== 'none' && (
                      <div className="absolute inset-0 border border-white/50 rounded-full scale-125 -rotate-12" />
                    )}
                  </div>

                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-slate-100 block truncate">{skin.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono text-[10px] sm:text-[11px]">
            Survive deep space and complete quests to earn coins!
          </span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
