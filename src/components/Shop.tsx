import React from 'react';
import { Weapon, Item, Stats } from '../game/types';
import { WEAPONS, ITEMS, getNextTier } from '../game/constants';
import { motion } from 'motion/react';
import { ShoppingCart, RefreshCw, ArrowUpCircle, Coins } from 'lucide-react';
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
  const [rerollCost, setRerollCost] = React.useState(Math.max(1, Math.floor(wave / 2)));

  const getDynamicPrice = (basePrice: number) => {
    // Price increases slightly with wave to maintain balance
    // Apply shopPrice stat (e.g. -10 for 10% discount)
    const waveScaling = 1 + (wave - 1) * 0.1;
    const statScaling = 1 + (playerStats.shopPrice / 100);
    return Math.max(1, Math.floor(basePrice * waveScaling * statScaling));
  };

  const generateItems = () => {
    // Filter pool based on wave: higher waves unlock higher rarity
    const maxRarity = wave <= 3 ? 1 : wave <= 6 ? 2 : wave <= 10 ? 3 : 4;
    
    const weaponPool = WEAPONS.filter(w => w.rarity <= maxRarity);
    const itemPool = ITEMS.filter(i => i.rarity <= maxRarity);
    
    const pool = [...weaponPool, ...itemPool];
    
    // Weight by rarity and luck
    const luckBonus = playerStats.luck / 100;
    const selected = [];
    const poolCopy = [...pool];
    
    for (let i = 0; i < 4; i++) {
      if (poolCopy.length === 0) break;
      const weightedPool = poolCopy.map(item => ({
        item,
        weight: 1 / (item.rarity * (1 - luckBonus * 0.5))
      }));
      const totalWeight = weightedPool.reduce((acc, p) => acc + p.weight, 0);
      let r = Math.random() * totalWeight;
      for (let j = 0; j < weightedPool.length; j++) {
        const p = weightedPool[j];
        r -= p.weight;
        if (r <= 0 || j === weightedPool.length - 1) {
          selected.push({ ...p.item, price: getDynamicPrice(p.item.price) });
          poolCopy.splice(j, 1);
          break;
        }
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
      setRerollCost(prev => prev + 1);
      playClickSound();
    } else {
      playErrorSound();
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
    <div className="fixed inset-0 bg-stone-950/95 flex flex-col items-center justify-start p-2 md:p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-stone-900 border-4 border-b-8 border-stone-700 rounded-3xl p-4 md:p-6 max-w-[1600px] w-full shadow-2xl my-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl md:text-3xl font-black text-amber-500 flex items-center gap-3 drop-shadow-[0_4px_0_rgb(180,83,9)]">
            <ShoppingCart className="w-6 h-6 md:w-8 md:h-8" />
            SHOP
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-lg font-black text-green-400 bg-stone-950 px-4 py-1.5 rounded-xl border-4 border-stone-800 shadow-inner">
              {materials} MATERIALS
            </div>
            <button
              onClick={handleReroll}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-black text-base border-4 border-b-8 transition-all ${materials >= rerollCost ? 'bg-stone-200 text-stone-950 border-stone-400 hover:bg-white active:border-b-4 active:translate-y-1' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
            >
              <RefreshCw className="w-4 h-4" /> REROLL ({rerollCost})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {shopItems.map((item) => {
            const isWeapon = 'type' in item;
            const rarityClass = getRarityColor(item.rarity);
            
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`border-4 rounded-2xl p-3 md:p-4 flex flex-col gap-2 md:gap-3 cursor-pointer transition-all active:translate-y-1 ${rarityClass} min-h-[160px] md:min-h-[200px]`}
                style={{ borderBottomWidth: '8px' }}
                onClick={() => handleBuy(item)}
              >
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <div className={`w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-stone-800 to-stone-950 border-2 md:border-4 border-black/20 shadow-inner overflow-hidden relative mx-auto md:mx-0`}>
                    {isWeapon ? (
                      <WeaponIllustration id={item.id} size={48} className="relative z-10" />
                    ) : (
                      <ItemIllustration id={item.id} size={48} className="relative z-10" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden text-center md:text-left">
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="text-xs md:text-lg font-black uppercase leading-tight truncate w-full">{item.name}</h3>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-1 mt-1">
                      <span className="text-green-400 font-black text-xs md:text-sm">{item.price}</span>
                      <Coins className="w-3 h-3 text-amber-500" />
                    </div>
                    <p className="text-stone-300 text-[9px] md:text-[10px] font-bold mt-2 uppercase leading-tight bg-black/20 p-1 md:p-1.5 rounded-lg border border-white/5 line-clamp-2 md:line-clamp-none">
                      {isWeapon ? ((item as Weapon).description || `DMG: ${(item as Weapon).damage}`) : (item as Item).description}
                    </p>
                  </div>
                </div>
                <div className="mt-auto h-10">
                  <button 
                    className={`w-full h-full rounded-xl text-base font-black transition-all border-b-4 active:border-b-0 active:translate-y-1 ${materials >= item.price ? 'bg-amber-500 text-stone-950 border-amber-700 hover:bg-amber-400' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
                  >
                    {materials >= item.price ? 'BUY' : 'INSUFFICIENT FUNDS'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mb-6 bg-stone-950 p-3 md:p-4 rounded-2xl border-4 border-stone-800">
          <h3 className="text-lg font-black text-stone-400 mb-3 md:mb-4 flex items-center gap-2 uppercase">
            <ArrowUpCircle className="w-5 h-5" /> YOUR WEAPONS (UPGRADE / SELL)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {currentWeapons.map((w, i) => {
              const next = getNextTier(w);
              const rarityClass = getRarityColor(w.rarity);
              const sellPrice = Math.floor(w.price * 0.5);
              
              return (
                <div key={i} className={`border-4 rounded-xl p-2 md:p-3 text-center flex flex-col justify-between ${rarityClass} bg-stone-900`}>
                  <div>
                    <div className="flex justify-center mb-2">
                       <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-3xl shadow-inner">
                         <WeaponIllustration id={w.id} size={40} />
                       </div>
                    </div>
                    <div className="text-[10px] font-black truncate mb-2 uppercase">{w.name}</div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {next ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpgrade(i, w); }}
                        className={`w-full py-1 rounded-lg text-[9px] font-black border-2 ${materials >= getDynamicPrice(next.price) ? 'bg-blue-500 text-white border-blue-700 hover:bg-blue-400' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
                      >
                        UPGRADE ({getDynamicPrice(next.price)})
                      </button>
                    ) : (
                      <div className="text-[9px] text-amber-500 font-black py-1">MAX TIER</div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onSellWeapon(i, sellPrice); playClickSound(); }}
                      className="w-full py-1 rounded-lg text-[9px] font-black border-2 bg-red-900/40 text-red-400 border-red-900 hover:bg-red-800/60 transition-colors"
                    >
                      SELL ({sellPrice})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pb-2">
          <button
            onClick={handleNextWave}
            disabled={isReady}
            className={`font-black text-xl md:text-2xl px-12 py-3 md:py-4 rounded-xl border-4 border-b-8 transition-all shadow-2xl ${isReady ? 'bg-stone-600 text-stone-400 border-stone-800 cursor-not-allowed' : 'bg-green-500 text-stone-950 border-green-700 hover:bg-green-400 active:border-b-4 active:translate-y-1'}`}
          >
            {multiplayerTotalCount !== undefined ? (isReady ? `WAITING FOR OTHERS (${multiplayerReadyCount}/${multiplayerTotalCount})` : `NEXT WAVE (${multiplayerReadyCount}/${multiplayerTotalCount})`) : 'NEXT WAVE'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
