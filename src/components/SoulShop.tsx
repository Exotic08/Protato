import React from 'react';
import { MetaStats } from '../game/types';
import { META_UPGRADES } from '../game/metaConstants';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, ChevronUp } from 'lucide-react';

interface SoulShopProps {
  metaStats: MetaStats;
  onUpgrade: (upgradeId: string, cost: number) => void;
  onBack: () => void;
  t: any;
}

export const SoulShop: React.FC<SoulShopProps> = ({ metaStats, onUpgrade, onBack, t }) => {
  const getLevel = (id: string) => metaStats.upgrades[id] || 0;
  
  const getPrice = (id: string) => {
    const upgrade = META_UPGRADES.find(u => u.id === id);
    if (!upgrade) return 0;
    const level = getLevel(id);
    return Math.floor(upgrade.basePrice * Math.pow(1.5, level));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className="p-4 bg-stone-800 text-stone-400 hover:text-stone-100 rounded-2xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        
        <div className="text-center">
          <h2 className="text-5xl font-black text-amber-500 drop-shadow-[0_4px_0_rgb(180,83,9)] uppercase tracking-tighter">
            {t.soulShop}
          </h2>
          <p className="text-stone-500 font-black text-xs uppercase tracking-widest mt-2">{t.permanentUpgrades}</p>
        </div>

        <div className="bg-stone-900 px-6 py-4 rounded-3xl border-4 border-stone-800 flex items-center gap-4">
          <Sparkles className="w-8 h-8 text-amber-400" />
          <div>
            <p className="text-[10px] font-black text-stone-500 uppercase leading-none">{t.yourFragments}</p>
            <p className="text-3xl font-black text-amber-400 leading-none">{metaStats.soulFragments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {META_UPGRADES.map((upgrade, idx) => {
          const level = getLevel(upgrade.id);
          const price = getPrice(upgrade.id);
          const isMax = level >= upgrade.maxLevel;
          const canAfford = metaStats.soulFragments >= price;

          return (
            <motion.div
              key={upgrade.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-stone-900 border-4 border-stone-800 rounded-3xl p-6 flex items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-stone-100 uppercase tracking-tight">{upgrade.name}</h3>
                  <div className="flex gap-1">
                    {[...Array(upgrade.maxLevel)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-4 rounded-full ${i < level ? 'bg-amber-500' : 'bg-stone-800'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-stone-500 text-xs font-bold leading-relaxed mb-1 capitalize">
                  {upgrade.description}
                </p>
                <p className="text-green-400 text-[10px] font-black uppercase">
                  {t.currentBonus}: <span className="text-white">+{level * upgrade.valuePerLevel}{upgrade.stat === 'speed' ? 'px' : upgrade.stat === 'maxHp' ? 'HP' : '%'}</span>
                </p>
              </div>

              <button
                disabled={isMax || !canAfford}
                onClick={() => onUpgrade(upgrade.id, price)}
                className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-4 border-b-8 transition-all px-2 ${
                  isMax 
                    ? 'bg-stone-800 border-stone-700 opacity-50 cursor-not-allowed' 
                    : canAfford 
                      ? 'bg-amber-600 border-amber-800 hover:bg-amber-500 active:border-b-4 active:translate-y-1' 
                      : 'bg-stone-800 border-stone-950 opacity-75 grayscale cursor-not-allowed'
                }`}
              >
                {isMax ? (
                  <span className="text-stone-400 font-black text-xs uppercase">{t.maxed}</span>
                ) : (
                  <>
                    <ChevronUp className="w-6 h-6 text-white mb-1" />
                    <span className="text-white font-black text-xs mb-1">{t.upgrade}</span>
                    <span className="text-amber-200 font-black text-base">{price}</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 text-center text-stone-600 font-black text-[10px] uppercase tracking-widest max-w-sm mx-auto p-4 bg-stone-900/50 rounded-2xl border-2 border-dashed border-stone-800">
        {t.fragmentsEarned}
      </div>
    </div>
  );
};
