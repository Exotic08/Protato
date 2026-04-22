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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden"
        style={{ width: '70%', height: '70%' }}
      >
        <div className="flex items-center justify-between mb-6 md:mb-12 shrink-0">
          <button 
            onClick={onBack}
            className="p-3 md:p-6 bg-stone-800 text-stone-400 hover:text-stone-100 rounded-2xl border-2 md:border-4 border-b-6 md:border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all shadow-xl"
          >
            <ArrowLeft className="w-6 h-6 md:w-10 md:h-10" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl md:text-5xl font-black text-amber-500 drop-shadow-[0_4px_0_rgb(180,83,9)] uppercase tracking-tighter italic">
              {t.soulShop}
            </h2>
            <p className="text-stone-500 font-black text-[10px] md:text-lg uppercase tracking-[0.2em] mt-1 md:mt-3">{t.permanentUpgrades}</p>
          </div>

          <div className="bg-stone-950 px-4 py-2 md:px-8 md:py-4 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-stone-800 flex items-center gap-3 md:gap-6 shadow-inner">
            <Sparkles className="w-6 h-6 md:w-12 md:h-12 text-amber-400" />
            <div>
              <p className="text-[10px] md:text-base font-black text-stone-500 uppercase leading-none mb-1 md:mb-2">{t.yourFragments}</p>
              <p className="text-2xl md:text-4xl font-black text-amber-400 leading-none">{metaStats.soulFragments}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-stone-950/50 rounded-[1.8rem] md:rounded-[2.8rem] border-2 md:border-4 border-stone-800 p-4 md:p-8 mb-6 md:mb-10 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {META_UPGRADES.map((upgrade, idx) => {
              const level = getLevel(upgrade.id);
              const price = getPrice(upgrade.id);
              const isMax = level >= upgrade.maxLevel;
              const canAfford = metaStats.soulFragments >= price;

              return (
                <motion.div
                  key={upgrade.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-stone-900 border-2 md:border-4 border-stone-800 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-7 flex items-center justify-between gap-4 md:gap-8 shadow-xl group hover:border-amber-500/30 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 md:gap-4 mb-2 md:mb-4">
                      <h3 className="text-lg md:text-2xl font-black text-stone-100 uppercase tracking-tight">{upgrade.name}</h3>
                      <div className="flex gap-1">
                        {[...Array(upgrade.maxLevel)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-4 md:w-3 md:h-6 rounded-full border border-black/20 ${i < level ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-stone-800'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-stone-400 text-[10px] md:text-base font-bold leading-tight mb-3 md:mb-6 uppercase tracking-wide">
                      {upgrade.description}
                    </p>
                    <div className="text-green-400 font-black text-sm md:text-2xl uppercase bg-black/40 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-white/5 shadow-inner inline-block">
                      {t.currentBonus}: <span className="text-white">+{level * upgrade.valuePerLevel}{upgrade.stat === 'maxHp' ? ' HP' : upgrade.stat === 'pickupRange' ? ' px' : '%'}</span>
                    </div>
                  </div>

                  <button
                    disabled={isMax || !canAfford}
                    onClick={() => onUpgrade(upgrade.id, price)}
                    className={`flex flex-col items-center justify-center w-20 h-20 md:w-36 md:h-36 rounded-xl md:rounded-2xl border-2 md:border-4 border-b-6 md:border-b-10 transition-all px-1 ${
                      isMax 
                        ? 'bg-stone-800 border-stone-700 opacity-50 cursor-not-allowed' 
                        : canAfford 
                          ? 'bg-amber-600 border-amber-800 hover:bg-amber-500 active:border-b-2 active:translate-y-2 shadow-lg' 
                          : 'bg-stone-850 border-stone-950 opacity-75 grayscale cursor-not-allowed'
                    }`}
                  >
                    {isMax ? (
                      <span className="text-stone-400 font-black text-sm md:text-2xl uppercase">{t.maxed}</span>
                    ) : (
                      <>
                        <ChevronUp className="w-6 h-6 md:w-12 md:h-12 text-white mb-0.5" />
                        <span className="text-white font-black text-[9px] md:text-lg mb-0.5 md:mb-2 uppercase tracking-widest">{t.upgrade}</span>
                        <div className="flex items-center gap-1 md:gap-2">
                           <span className="text-amber-200 font-black text-lg md:text-3xl">{price}</span>
                           <Sparkles className="w-3 h-3 md:w-6 md:h-6 text-amber-300" />
                        </div>
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 text-center text-stone-600 font-black text-[9px] md:text-xl uppercase tracking-[0.3em] p-4 md:p-8 bg-stone-950/30 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed border-stone-800 italic">
          {t.fragmentsEarned}
        </div>
      </motion.div>
    </div>
  );
};
