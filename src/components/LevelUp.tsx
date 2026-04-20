import React from 'react';
import { Stats } from '../game/types';
import { motion } from 'motion/react';
import { TrendingUp, Shield, Zap, Heart, Target, Move } from 'lucide-react';

interface LevelUpProps {
  onSelectStat: (stat: keyof Stats, value: number) => void;
  luck?: number;
}

const STAT_OPTIONS: { name: string; stat: keyof Stats; value: number; icon: any; color: string; rarity: number }[] = [
  { name: '+2 Max HP', stat: 'maxHp', value: 2, icon: Heart, color: 'text-red-400', rarity: 1 },
  { name: '+2 HP Regen', stat: 'hpRegen', value: 2, icon: Heart, color: 'text-pink-400', rarity: 1 },
  { name: '+10% Damage', stat: 'damagePct', value: 10, icon: Target, color: 'text-orange-400', rarity: 2 },
  { name: '+10% Attack Speed', stat: 'attackSpeed', value: 10, icon: Zap, color: 'text-yellow-400', rarity: 2 },
  { name: '+5% Speed', stat: 'speed', value: 5, icon: Move, color: 'text-blue-400', rarity: 1 },
  { name: '+2 Armor', stat: 'armor', value: 2, icon: Shield, color: 'text-slate-400', rarity: 1 },
  { name: '+5% Dodge', stat: 'dodge', value: 5, icon: Move, color: 'text-purple-400', rarity: 1 },
  { name: '+5% Crit Chance', stat: 'critChance', value: 5, icon: Target, color: 'text-red-600', rarity: 2 },
];

export const LevelUp: React.FC<LevelUpProps> = ({ onSelectStat, luck = 0 }) => {
  // Randomly select 3 options weighting by luck
  const [options, setOptions] = React.useState<typeof STAT_OPTIONS>([]);

  React.useEffect(() => {
    const luckBonus = luck / 100;
    const pool = [...STAT_OPTIONS];
    const selected: typeof STAT_OPTIONS = [];
    
    for (let i = 0; i < 3; i++) {
      if (pool.length === 0) break;
      
      const weightedPool = pool.map(stat => ({
        stat,
        weight: 1 / (stat.rarity * Math.max(0.1, 1 - luckBonus * 0.5))
      }));
      
      const totalWeight = weightedPool.reduce((acc, p) => acc + p.weight, 0);
      let r = Math.random() * totalWeight;
      
      for (let j = 0; j < weightedPool.length; j++) {
        const p = weightedPool[j];
        r -= p.weight;
        if (r <= 0 || j === weightedPool.length - 1) {
          selected.push(p.stat);
          pool.splice(j, 1);
          break;
        }
      }
    }
    
    setOptions(selected);
  }, [luck]);

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-[5px] z-50 overflow-hidden">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden"
        style={{ width: '95vw', height: '90vh' }}
      >
        <h2 className="text-4xl md:text-8xl font-black text-blue-400 mb-2 md:mb-8 flex items-center justify-center gap-4 md:gap-10 drop-shadow-[0_8px_0_rgb(30,58,138)] shrink-0 italic uppercase">
          <TrendingUp className="w-12 h-12 md:w-32 md:h-32" />
          LEVEL UP!
        </h2>
        <p className="text-stone-400 mb-8 md:mb-16 text-sm md:text-4xl font-black uppercase tracking-[0.3em] shrink-0 text-center drop-shadow-lg">Power Up Your Hero</p>

        <div className="flex-1 overflow-y-auto pr-1 md:pr-4 custom-scrollbar pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10 justify-center">
            {options.map((opt, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => onSelectStat(opt.stat, opt.value)}
                className="bg-stone-800 border-4 border-stone-700 hover:border-blue-500 hover:bg-stone-700 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center gap-4 md:gap-10 transition-all text-center active:border-b-4 active:translate-y-2 w-full shadow-2xl relative overflow-hidden group border-b-[12px]"
              >
                <div className={`p-4 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-stone-950 border-4 border-stone-800 shadow-inner flex-shrink-0 transition-transform group-hover:scale-110 ${opt.color}`}>
                  <opt.icon className="w-10 h-10 md:w-24 md:h-24" />
                </div>
                <div className="flex flex-col gap-1 md:gap-4">
                  <span className="text-lg md:text-4xl font-black text-stone-100 uppercase leading-none tracking-tight">
                    {opt.name.split(' ')[0]} {opt.name.split(' ')[1]}
                  </span>
                  <span className="text-xs md:text-xl font-bold text-stone-500 uppercase tracking-widest">
                    Permanent Stat Boost
                  </span>
                </div>
                
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-white/5 rotate-45 translate-x-8 md:translate-x-16 -translate-y-8 md:-translate-y-16" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
