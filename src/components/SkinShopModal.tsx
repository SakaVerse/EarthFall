import React, { useEffect, useRef, useState } from 'react';
import { X, Check, ShoppingBag, Sparkles, Palette, Shield } from 'lucide-react';
import { SkinId, SkinItem, SkinTier } from '../game/types';
import { CosmeticsManager, SKINS } from '../game/cosmetics';
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

  const selectedSkin: SkinItem = SKINS[selectedSkinId] || SKINS.earth_classic;
  const isSelectedUnlocked = unlockedSkins.includes(selectedSkinId);
  const isSelectedEquipped = equippedSkinId === selectedSkinId;

  // Render animated 2D live preview of selected skin
  useEffect(() => {
    let rotation = 0;
    let cloudRotation = 0;
    let startTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = 0.016;
      rotation = (rotation + dt * 25) % 360;
      cloudRotation = (cloudRotation + dt * 38) % 360;

      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Deep space radial glow behind planet
          const bgGrad = ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            10,
            canvas.width / 2,
            canvas.height / 2,
            110
          );
          bgGrad.addColorStop(0, selectedSkin.glowColor || 'rgba(56, 189, 248, 0.25)');
          bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = bgGrad;
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, 110, 0, Math.PI * 2);
          ctx.fill();

          renderEarth(ctx, {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 46,
            rotation,
            cloudRotation,
            verticalTilt: 0,
            health: 100,
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
      setNotification(`⚡ ${SKINS[skinId].name} equipped!`);
      setTimeout(() => setNotification(null), 2500);
    }
  };

  const allSkins = Object.values(SKINS);
  const filteredSkins = allSkins.filter(
    (s) => activeTierFilter === 'all' || s.tier === activeTierFilter
  );

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-40 select-none animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest">
                COSMETIC HANGAR & SKINS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                {unlockedSkins.length}/{allSkins.length} SKINS UNLOCKED
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span>PLANETARY SKINS</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Scrap balance badge */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-amber-500/40 px-3.5 py-1.5 rounded-xl shadow-inner">
              <span className="text-sm">⚙️</span>
              <span className="font-mono-numbers font-bold text-amber-300 text-sm">
                {scrapBalance.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400">SCRAP</span>
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
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="my-2 p-2 bg-sky-950/80 border border-sky-500/50 text-sky-200 text-xs font-mono font-bold rounded-xl text-center animate-fadeIn">
            {notification}
          </div>
        )}

        {/* Tier filter tabs */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
          {(['all', 'common', 'rare', 'legendary'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => {
                soundEngine.playClick();
                setActiveTierFilter(tier);
              }}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider text-[11px] font-mono transition-colors ${
                activeTierFilter === tier
                  ? 'bg-sky-500 text-white font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Main Content Area: Preview on Left, Skin Grid on Right */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto">
          {/* Left Column: Live 2D Rotating Planet Preview & Details */}
          <div className="md:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center">
            <div className="relative w-44 h-44 flex items-center justify-center my-2">
              <canvas
                ref={previewCanvasRef}
                width={200}
                height={200}
                className="w-full h-full block"
              />
            </div>

            <div className="w-full text-left mt-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-display font-extrabold text-base text-white">{selectedSkin.name}</h3>
                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    selectedSkin.tier === 'legendary'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50'
                      : selectedSkin.tier === 'rare'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {selectedSkin.tier}
                </span>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed mb-3">{selectedSkin.description}</p>

              {/* System-wide Theme Badge */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 mb-4 text-xs">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-0.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px] uppercase">DYNAMIC ASSET THEME</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {selectedSkin.themeId === 'cyberpunk'
                    ? 'Changes canvas to Cyberpunk Synth Grid & vector asteroids!'
                    : selectedSkin.themeId === 'solar'
                    ? 'Changes canvas to Solar Coronal Storm & magma asteroids!'
                    : selectedSkin.themeId === 'glacial'
                    ? 'Changes canvas to Glacial Absolute Zero & ice meteors!'
                    : selectedSkin.themeId === 'void'
                    ? 'Changes canvas to Dark Matter Singularity & event horizon!'
                    : 'Standard cosmic deep space theme.'}
                </p>
              </div>

              {/* Action Button */}
              {isSelectedEquipped ? (
                <div className="w-full py-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>EQUIPPED NOW</span>
                </div>
              ) : isSelectedUnlocked ? (
                <button
                  onClick={() => handleEquip(selectedSkin.id)}
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold font-mono text-xs rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.4)] active:scale-95 transition-all"
                >
                  EQUIP SKIN
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(selectedSkin)}
                  disabled={scrapBalance < selectedSkin.price}
                  className={`w-full py-2.5 font-bold font-mono text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${
                    scrapBalance >= selectedSkin.price
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>BUY FOR {selectedSkin.price} ⚙️</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Skin Selection Grid */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[55vh] pr-1">
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
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                    isSelected
                      ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  {/* Status Indicator Pill */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                        skin.tier === 'legendary'
                          ? 'bg-purple-950/90 text-purple-300'
                          : skin.tier === 'rare'
                          ? 'bg-amber-950/90 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {skin.tier}
                    </span>

                    {isEquipped ? (
                      <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[9px] font-mono text-sky-400">OWNED</span>
                    ) : (
                      <span className="text-[9px] font-mono text-amber-300 font-bold">{skin.price} ⚙️</span>
                    )}
                  </div>

                  {/* Circular Color Swatch Thumbnail */}
                  <div className="w-10 h-10 rounded-full mx-auto my-1.5 shadow-md flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${skin.continentColor}, ${skin.oceanColor})`,
                      boxShadow: `0 0 10px ${skin.atmosphereColor}66`,
                    }}
                  >
                    {skin.ringStyle && skin.ringStyle !== 'none' && (
                      <div className="absolute inset-0 border border-white/40 rounded-full scale-125 -rotate-12" />
                    )}
                  </div>

                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-slate-200 block truncate">{skin.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">Collect orbs and complete daily missions to earn scrap!</span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
