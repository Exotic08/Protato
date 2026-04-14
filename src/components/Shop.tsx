import React from 'react';
import { Weapon, Item, Stats } from '../game/types';
import { WEAPONS, ITEMS, getNextTier } from '../game/constants';
import { motion } from 'motion/react';
import { ShoppingCart, Sword, Zap, Heart, Coffee, Dumbbell, Glasses, Crosshair, RefreshCw, ArrowUpCircle, Wand, Axe } from 'lucide-react';

interface ShopProps {
  materials: number;
  onBuyWeapon: (weapon: Weapon) => void;
  onBuyItem: (item: Item) => void;
  onUpgradeWeapon: (index: number, nextWeapon: Weapon) => void;
  onReroll: (cost: number) => void;
  onNextWave: () => void;
  currentWeapons: Weapon[];
  wave: number;
  multiplayerReadyCount?: number;
  multiplayerTotalCount?: number;
}

const ICON_MAP: { [key: string]: any } = {
  Sword, Zap, Heart, Coffee, Dumbbell, Glasses, Crosshair, Wand, Axe
};

export const Shop: React.FC<ShopProps> = ({ 
  materials, onBuyWeapon, onBuyItem, onUpgradeWeapon, onReroll, onNextWave, currentWeapons, wave, multiplayerReadyCount, multiplayerTotalCount 
}) => {
  const [shopItems, setShopItems] = React.useState<(Weapon | Item)[]>([]);
  const [rerollCost, setRerollCost] = React.useState(Math.max(1, Math.floor(wave / 2)));

  const getDynamicPrice = (basePrice: number) => {
    // Price increases slightly with wave to maintain balance
    // But base prices are lower now in constants
    return Math.floor(basePrice * (1 + (wave - 1) * 0.1));
  };

  const generateItems = () => {
    // Filter pool based on wave: higher waves unlock higher rarity
    const maxRarity = wave <= 3 ? 1 : wave <= 6 ? 2 : wave <= 10 ? 3 : 4;
    
    const weaponPool = WEAPONS.filter(w => w.rarity <= maxRarity);
    const itemPool = ITEMS.filter(i => i.rarity <= maxRarity);
    
    const pool = [...weaponPool, ...itemPool];
    const shuffled = pool.sort(() => 0.5 - Math.random());
    
    // Apply dynamic pricing to the selected items
    const selected = shuffled.slice(0, 4).map(item => ({
      ...item,
      price: getDynamicPrice(item.price)
    }));
    
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
    }
  };

  const handleBuy = (item: Weapon | Item) => {
    if (materials >= item.price) {
      if ('type' in item) {
        if (currentWeapons.length < 6) {
          onBuyWeapon(item as Weapon);
          setShopItems(prev => prev.filter(i => i.id !== item.id));
        } else {
          alert('Max 6 weapons!');
        }
      } else {
        onBuyItem(item as Item);
        setShopItems(prev => prev.filter(i => i.id !== item.id));
      }
    }
  };

  const handleUpgrade = (index: number, weapon: Weapon) => {
    const next = getNextTier(weapon);
    if (next) {
      const price = getDynamicPrice(next.price);
      if (materials >= price) {
        onUpgradeWeapon(index, { ...next, price });
      }
    }
  };

  const getRarityColor = (rarity: number) => {
    switch(rarity) {
      case 1: return 'border-stone-500 bg-stone-800 text-stone-300';
      case 2: return 'border-green-500 bg-green-900/40 text-green-400';
      case 3: return 'border-blue-500 bg-blue-900/40 text-blue-400';
      case 4: return 'border-purple-500 bg-purple-900/40 text-purple-400';
      default: return 'border-stone-500 bg-stone-800 text-stone-300';
    }
  };

  const [isReady, setIsReady] = React.useState(false);

  const handleNextWave = () => {
    if (multiplayerTotalCount !== undefined) {
      setIsReady(true);
    }
    onNextWave();
  };

  return (
    <div className="fixed inset-0 bg-stone-950/95 flex flex-col items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-stone-900 border-4 border-b-8 border-stone-700 rounded-3xl p-8 max-w-5xl w-full shadow-2xl my-8"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-5xl font-black text-amber-500 flex items-center gap-4 drop-shadow-[0_4px_0_rgb(180,83,9)]">
            <ShoppingCart className="w-10 h-10" />
            SHOP
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-black text-green-400 bg-stone-950 px-6 py-3 rounded-2xl border-4 border-stone-800 shadow-inner">
              {materials} MATERIALS
            </div>
            <button
              onClick={handleReroll}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xl border-4 border-b-8 transition-all ${materials >= rerollCost ? 'bg-stone-200 text-stone-950 border-stone-400 hover:bg-white active:border-b-4 active:translate-y-1' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
            >
              <RefreshCw className="w-5 h-5" /> REROLL ({rerollCost})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {shopItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || ShoppingCart;
            const isWeapon = 'type' in item;
            const rarityClass = getRarityColor(item.rarity);
            
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className={`border-4 border-b-8 rounded-3xl p-5 flex gap-5 cursor-pointer transition-all active:border-b-4 active:translate-y-1 ${rarityClass}`}
                onClick={() => handleBuy(item)}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 bg-stone-950 border-2 border-stone-800 shadow-inner`}>
                  <Icon className="w-12 h-12" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-2xl font-black uppercase">{item.name}</h3>
                      <span className="text-green-400 font-black text-xl">{item.price}</span>
                    </div>
                    <p className="text-stone-400 text-sm font-bold mt-1 uppercase">
                      {isWeapon ? `DMG: ${(item as Weapon).damage} | TIER: ${(item as Weapon).rarity}` : (item as Item).description}
                    </p>
                  </div>
                  <button 
                    className={`mt-3 w-full py-2 rounded-xl text-lg font-black transition-colors border-2 ${materials >= item.price ? 'bg-amber-500 text-stone-950 border-amber-700 hover:bg-amber-400' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
                  >
                    BUY
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mb-10 bg-stone-950 p-6 rounded-3xl border-4 border-stone-800">
          <h3 className="text-2xl font-black text-stone-400 mb-6 flex items-center gap-3 uppercase">
            <ArrowUpCircle className="w-6 h-6" /> YOUR WEAPONS (UPGRADE)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {currentWeapons.map((w, i) => {
              const next = getNextTier(w);
              const Icon = ICON_MAP[w.icon] || Sword;
              const rarityClass = getRarityColor(w.rarity);
              
              return (
                <div key={i} className={`border-4 rounded-2xl p-4 text-center ${rarityClass}`}>
                  <div className="flex justify-center mb-3">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-black truncate mb-3 uppercase">{w.name}</div>
                  {next ? (
                    <button
                      onClick={() => handleUpgrade(i, w)}
                      className={`w-full py-2 rounded-xl text-xs font-black border-2 ${materials >= getDynamicPrice(next.price) ? 'bg-blue-500 text-white border-blue-700 hover:bg-blue-400' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}
                    >
                      UPGRADE ({getDynamicPrice(next.price)})
                    </button>
                  ) : (
                    <div className="text-xs text-amber-500 font-black py-2">MAX TIER</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleNextWave}
            disabled={isReady}
            className={`font-black text-3xl px-16 py-5 rounded-2xl border-4 border-b-8 transition-all shadow-2xl ${isReady ? 'bg-stone-600 text-stone-400 border-stone-800 cursor-not-allowed' : 'bg-green-500 text-stone-950 border-green-700 hover:bg-green-400 active:border-b-4 active:translate-y-1'}`}
          >
            {multiplayerTotalCount !== undefined ? (isReady ? `WAITING FOR OTHERS (${multiplayerReadyCount}/${multiplayerTotalCount})` : `NEXT WAVE (${multiplayerReadyCount}/${multiplayerTotalCount})`) : 'NEXT WAVE'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
