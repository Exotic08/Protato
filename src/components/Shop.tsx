import React from 'react';
import { Weapon, Item, Stats } from '../game/types';
import { WEAPONS, ITEMS, getNextTier } from '../game/constants';
import { motion } from 'motion/react';
import { ShoppingCart, RefreshCw, ArrowUpCircle, Coins, Lock, Unlock, Combine } from 'lucide-react';
import { WeaponIllustration, ItemIllustration } from './Illustration';
import { playClickSound, playBuySound, playErrorSound } from '../game/audio';

interface ShopProps {
  materials: number;
  playerStats: Stats;
  onBuyWeapon: (weapon: Weapon) => void;
  onBuyItem: (item: Item) => void;
  onUpgradeWeapon: (index: number, nextWeapon: Weapon) => void;
  onSellWeapon: (index: number, price: number) => void;
  onReroll: (cost: number) => void;
  onNextWave: () => void;
  currentWeapons: Weapon[];
  wave: number;
  multiplayerReadyCount?: number;
  multiplayerTotalCount?: number;
}

export const Shop: React.FC<ShopProps> = ({ 
  materials, playerStats, onBuyWeapon, onBuyItem, onUpgradeWeapon, onSellWeapon, onReroll, onNextWave, currentWeapons, wave, multiplayerReadyCount, multiplayerTotalCount 
}) => {
  const [shopItems, setShopItems] = React.useState<(Weapon | Item)[]>([]);
  const [lockedItemIds, setLockedItemIds] = React.useState<string[]>([]);
  const rerollIncrement = Math.max(1, Math.floor(0.40 * wave));
  const rerollBasePrice = Math.floor(wave * 0.75) + rerollIncrement;
  const [rerollCost, setRerollCost] = React.useState(rerollBasePrice);

  const getDynamicPrice = (basePrice: number) => {
    // Price = floor(BasePrice * (1 + Wave * 0.1)) per GDD
    const waveInflation = 1 + wave * 0.1;
    const shopDiscount = 1 + (playerStats.shopPrice / 100);
    return Math.max(1, Math.floor(basePrice * waveInflation * shopDiscount));
  };

  const getRarityByWave = (wave: number, luck: number): number => {
    const luckMultiplier = 1 + luck / 100;
    
    // T4: min wave 8, base 0%, +0.23%/wave, max 8%
    const t4Chance = Math.min(8, Math.max(0, (wave - 8 - 1) * 0.23) * luckMultiplier);
    // T3: min wave 4, base 0%, +2%/wave, max 25%
    const t3Chance = Math.min(25, Math.max(0, (wave - 4 - 1) * 2) * luckMultiplier);
    // T2: min wave 2, base 0%, +6%/wave, max 60%
    const t2Chance = Math.min(60, Math.max(0, (wave - 2 - 1) * 6) * luckMultiplier);
    
    // Top-down check
    const roll = Math.random() * 100;
    if (roll < t4Chance) return 4;
    if (roll < t3Chance) return 3;
    if (roll < t2Chance) return 2;
    return 1;
  };

  const generateItems = () => {
    const selected: (Weapon | Item)[] = [];
    const used = new Set<string>();

    // Keep locked items (MISSING-6)
    const preserved = shopItems.filter(item => lockedItemIds.includes(item.id));
    selected.push(...preserved);
    preserved.forEach(item => used.add(item.id));
    
    // Generate remaining items using proper rarity algorithm
    const slotsToFill = 4 - selected.length;
    for (let slot = 0; slot < slotsToFill; slot++) {
      const targetRarity = getRarityByWave(wave, playerStats.luck);
      const weaponPool = WEAPONS.filter(w => w.rarity === targetRarity && !used.has(w.id));
      const itemPool = ITEMS.filter(i => i.rarity === targetRarity && !used.has(i.id));
      const pool = [...weaponPool, ...itemPool];
      
      if (pool.length === 0) {
        // Fallback to any available rarity
        const fallback = [...WEAPONS, ...ITEMS].filter(x => !used.has(x.id));
        if (fallback.length > 0) {
          const pick = fallback[Math.floor(Math.random() * fallback.length)];
          used.add(pick.id);
          selected.push({ ...pick, price: getDynamicPrice(pick.price) });
        }
      } else {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        used.add(pick.id);
        selected.push({ ...pick, price: getDynamicPrice(pick.price) });
      }
    }
    
    setShopItems(selected);
  };

  React.useEffect(() => {
    generateItems();
  }, []);

  const handleReroll = () => {
    if (materials >= rerollCost) {
      onReroll(rerollCost);
      generateItems();
      setLockedItemIds([]); // Reset locks on reroll as per standard genre rules
      setRerollCost(prev => prev + rerollIncrement);
      playClickSound();
    } else {
      playErrorSound();
    }
  };

  const toggleLock = (itemId: string) => {
    setLockedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
    playClickSound();
  };

  const handleCombine = (w1Idx: number, w2Idx: number) => {
    const w1 = currentWeapons[w1Idx];
    const w2 = currentWeapons[w2Idx];
    if (w1.baseId === w2.baseId && w1.rarity === w2.rarity && w1.rarity < 4) {
      const next = getNextTier(w1);
      if (next) {
        onSellWeapon(w2Idx, 0); // Remove one silently
        onUpgradeWeapon(w1Idx, next); // Upgrade the other
        playBuySound();
      }
    }
  };

  const handleBuy = (item: Weapon | Item) => {
    if (materials >= item.price) {
      if ('type' in item) {
        if (currentWeapons.length < 6) {
          onBuyWeapon(item as Weapon);
          setShopItems(prev => prev.filter(i => i.id !== item.id));
          playBuySound();
        } else {
          playErrorSound();
          alert('Max 6 weapons!');
        }
      } else {
        onBuyItem(item as Item);
        setShopItems(prev => prev.filter(i => i.id !== item.id));
        playBuySound();
      }
    } else {
      playErrorSound();
    }
  };

  const handleUpgrade = (index: number, weapon: Weapon) => {
    const next = getNextTier(weapon);
    if (next) {
      const price = getDynamicPrice(next.price);
      if (materials >= price) {
        onUpgradeWeapon(index, { ...next, price });
        playBuySound();
      } else {
        playErrorSound();
      }
    }
  };

  const getRarityColor = (rarity: number) => {
    switch(rarity) {
      case 1: return 'border-stone-500 bg-stone-800 text-stone-300 shadow-[0_6px_0_rgb(68,64,60)]';
      case 2: return 'border-green-600 bg-green-950/40 text-green-400 shadow-[0_6px_0_rgb(22,101,52)]';
      case 3: return 'border-blue-600 bg-blue-950/40 text-blue-400 shadow-[0_6px_0_rgb(30,58,138)]';
      case 4: return 'border-purple-600 bg-purple-950/40 text-purple-400 shadow-[0_6px_0_rgb(88,28,135)]';
      default: return 'border-stone-500 bg-stone-800 text-stone-300 shadow-[0_6px_0_rgb(68,64,60)]';
    }
  };

  const [isReady, setIsReady] = React.useState(false);

  const handleNextWave = () => {
    playClickSound();
    if (multiplayerTotalCount !== undefined) {
      setIsReady(true);
    }
    onNextWave();
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-[5px] z-50 overflow-hidden">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden"
        style={{ width: '70%', height: '70%' }}
      >
        <div className="overflow-y-auto flex-1 pr-3 custom-scrollbar pb-10">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4 sticky top-0 bg-stone-900/95 z-30 pb-4 border-b-2 border-stone-800">
            <h2 className="text-3xl md:text-5xl font-black text-amber-500 flex items-center gap-3 md:gap-4 drop-shadow-[0_4px_0_rgb(180,83,9)] italic">
              <ShoppingCart className="w-8 h-8 md:w-12 md:h-12" />
              SHOP
            </h2>
            <div className="flex items-center gap-3 md:gap-6">
              <div className="text-xl md:text-2xl font-black text-green-400 bg-stone-950 px-4 py-2 md:px-7 md:py-3 rounded-xl border-2 border-stone-800 shadow-inner flex items-center gap-2">
                <Coins className="w-6 h-6 md:w-9 md:h-9 text-amber-500" />
                {materials}
              </div>
              <button
                onClick={handleReroll}
                className={`flex items-center gap-3 px-4 py-2 md:px-7 md:py-3 rounded-xl font-black text-base md:text-xl border-2 border-b-8 md:border-b-10 transition-all ${materials >= rerollCost ? 'bg-stone-200 text-stone-950 border-stone-400 hover:bg-white active:border-b-2 active:translate-y-2' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
              >
                <RefreshCw className="w-5 h-5 md:w-8 md:h-8" /> REROLL ({rerollCost})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-10">
            {shopItems.map((item) => {
              const isWeapon = 'type' in item;
              const rarityClass = getRarityColor(item.rarity);
              
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`border-4 md:border-6 rounded-[1.8rem] md:rounded-[2.5rem] p-4 md:p-8 flex flex-col gap-4 md:gap-8 cursor-pointer transition-all active:translate-y-2 ${rarityClass} min-h-[220px] md:min-h-[350px] relative shadow-[0_15px_30px_rgba(0,0,0,0.5)]`}
                  style={{ borderBottomWidth: '12px' }}
                  onClick={() => handleBuy(item)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLock(item.id); }}
                    className={`absolute top-2 md:top-4 right-2 md:right-4 p-2 md:p-4 rounded-xl border-2 md:border-4 z-20 transition-all ${lockedItemIds.includes(item.id) ? 'bg-amber-500 border-amber-700 text-stone-900 shadow-[0_4px_0_rgb(180,83,9)] scale-110' : 'bg-stone-800 border-stone-900 text-stone-500 hover:text-stone-300'}`}
                  >
                    {lockedItemIds.includes(item.id) ? <Lock className="w-6 h-6 md:w-8 md:h-8" /> : <Unlock className="w-6 h-6 md:w-8 md:h-8" />}
                  </button>

                  <div className="flex flex-col gap-4 md:gap-8">
                    <div className={`w-20 h-20 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950 border-2 md:border-4 border-black/20 shadow-inner overflow-hidden relative mx-auto`}>
                      {isWeapon ? (
                        <WeaponIllustration id={item.id} size={60} className="md:hidden relative z-10" />
                      ) : (
                        <ItemIllustration id={item.id} size={60} className="md:hidden relative z-10" />
                      )}
                      {isWeapon ? (
                        <WeaponIllustration id={item.id} size={100} className="hidden md:block relative z-10" />
                      ) : (
                        <ItemIllustration id={item.id} size={100} className="hidden md:block relative z-10" />
                      )}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent)]" />
                    </div>
                    <div className="flex-1 text-center w-full">
                      <h3 className="text-lg md:text-2xl font-black uppercase leading-tight mb-2 md:mb-3 tracking-tight">{item.name}</h3>
                      <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
                        <span className="text-green-400 font-black text-xl md:text-3xl">{item.price}</span>
                        <Coins className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
                      </div>
                      <p className="text-stone-300 text-xs md:text-xl font-black uppercase leading-tight bg-black/40 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 line-clamp-3 md:line-clamp-none italic">
                        {isWeapon ? ((item as Weapon).description || `DMG: ${(item as Weapon).damage}`) : (item as Item).description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto h-16 md:h-24">
                    <button 
                      className={`w-full h-full rounded-[1.5rem] md:rounded-[2rem] text-xl md:text-4xl font-black transition-all border-b-8 md:border-b-16 active:border-b-0 active:translate-y-3 ${materials >= item.price ? 'bg-amber-500 text-stone-950 border-amber-700 hover:bg-amber-400' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
                    >
                      {materials >= item.price ? 'BUY ITEM' : 'NO FUNDS'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mb-14 bg-stone-950/50 p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border-4 md:border-8 border-stone-800 shadow-2xl">
            <h3 className="text-2xl md:text-5xl font-black text-stone-500 mb-8 md:mb-16 flex items-center gap-4 md:gap-8 uppercase tracking-tighter">
              <ArrowUpCircle className="w-10 h-10 md:w-16 md:h-16" /> HERO ARSENAL
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
              {currentWeapons.map((w, i) => {
                const next = getNextTier(w);
                const rarityClass = getRarityColor(w.rarity);
                const sellPrice = Math.floor(w.price * 0.5);
                
                return (
                  <div key={i} className={`border-4 md:border-8 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 text-center flex flex-col justify-between ${rarityClass} bg-stone-900 shadow-xl min-h-[200px] md:min-h-[350px]`}>
                    <div>
                      <div className="flex justify-center mb-4 md:mb-8">
                         <div className="w-16 h-16 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-black/60 border-2 md:border-4 border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
                           <WeaponIllustration id={w.id} size={40} className="md:hidden relative z-10" />
                           <WeaponIllustration id={w.id} size={90} className="hidden md:block relative z-10" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                         </div>
                      </div>
                      <div className="text-xs md:text-2xl font-black truncate mb-4 md:mb-8 uppercase tracking-tight">{w.name}</div>
                    </div>
                    <div className="flex flex-col gap-3 md:gap-4">
                      {next ? (
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpgrade(i, w); }}
                            className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-lg font-black border-4 md:border-8 shadow-lg ${materials >= getDynamicPrice(next.price) ? 'bg-blue-600 text-white border-blue-800 hover:bg-blue-500' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
                          >
                            UPGRADE ({getDynamicPrice(next.price)})
                          </button>
                          
                          {currentWeapons.some((otherW, otherIdx) => otherIdx !== i && otherW.baseId === w.baseId && otherW.rarity === w.rarity) && (
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const otherIdx = currentWeapons.findIndex((otherW, idx) => idx !== i && otherW.baseId === w.baseId && otherW.rarity === w.rarity);
                                handleCombine(i, otherIdx);
                              }}
                              className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-lg font-black border-4 md:border-8 bg-purple-600 text-white border-purple-800 hover:bg-purple-500 flex items-center justify-center gap-2 shadow-lg"
                            >
                              <Combine className="w-4 h-4 md:w-6 md:h-6" /> COMBINE
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm md:text-xl text-amber-500 font-black py-3 md:py-4 uppercase tracking-widest bg-stone-950 rounded-2xl border-2 md:border-4 border-stone-800 shadow-inner">MAXED</div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onSellWeapon(i, sellPrice); playClickSound(); }}
                        className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-lg font-black border-4 md:border-8 bg-red-900/40 text-red-500 border-red-900 hover:bg-red-800/60 transition-colors shadow-md"
                      >
                        SELL ({sellPrice})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center pb-8 sticky bottom-0 bg-stone-900/95 pt-6 z-30 border-t-4 border-stone-800">
            <button
              onClick={handleNextWave}
              disabled={isReady}
              className={`font-black text-2xl md:text-6xl px-16 md:px-32 py-6 md:py-12 rounded-[2.5rem] md:rounded-[4rem] border-4 md:border-8 border-b-[16px] md:border-b-[24px] transition-all shadow-[0_30px_60px_rgba(0,0,0,0.6)] ${isReady ? 'bg-stone-600 text-stone-400 border-stone-800 cursor-not-allowed' : 'bg-green-500 text-stone-950 border-green-700 hover:bg-green-400 active:border-b-4 active:translate-y-6 hover:-translate-y-3'}`}
            >
              {multiplayerTotalCount !== undefined ? (isReady ? `WAITING... (${multiplayerReadyCount}/${multiplayerTotalCount})` : `READY! (${multiplayerReadyCount}/${multiplayerTotalCount})`) : 'ENTER BATTLE'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
