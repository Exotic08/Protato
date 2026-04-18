import React from 'react';
import { Stats } from '../game/types';
import { motion } from 'motion/react';
import { TrendingUp, Shield, Zap, Heart, Target, Move } from 'lucide-react';

interface LevelUpProps {
  onSelectStat: (stat: keyof Stats, value: number) => void;
}

const STAT_OPTIONS: { name: string; stat: keyof Stats; value: number; icon: any; color: string }[] = [
  { name: '+2 Max HP', stat: 'maxHp', value: 2, icon: Heart, color: 'text-red-400' },
  { name: '+5% Damage', stat: 'damagePct', value: 5, icon: Target, color: 'text-orange-400' },
  { name: '+10% Attack Speed', stat: 'attackSpeed', value: 10, icon: Zap, color: 'text-yellow-400' },
  { name: '+5% Speed', stat: 'speed', value: 5, icon: Move, color: 'text-blue-400' },
  { name: '+1 Armor', stat: 'armor', value: 1, icon: Shield, color: 'text-slate-400' },
];

export const LevelUp: React.FC<LevelUpProps> = ({ onSelectStat }) => {
  // Randomly select 3 options
  const [options, setOptions] = React.useState<typeof STAT_OPTIONS>([]);

  React.useEffect(() => {
    const shuffled = [...STAT_OPTIONS].sort(() => 0.5 - Math.random());
    setOptions(shuffled.slice(0, 3));
  }, []);

  return (
    <div className="fixed inset-0 bg-stone-950/90 flex flex-col items-center justify-center p-8 z-50">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-stone-900 border-4 border-b-8 border-stone-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl text-center"
      >
        <h2 className="text-4xl font-black text-blue-400 mb-1 flex items-center justify-center gap-4 drop-shadow-[0_4px_0_rgb(30,58,138)]">
          <TrendingUp className="w-10 h-10" />
          LEVEL UP!
        </h2>
        <p className="text-stone-400 mb-6 text-xl font-bold uppercase">Choose a stat to upgrade</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 justify-center">
          {options.map((opt, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -8 }}
              onClick={() => onSelectStat(opt.stat, opt.value)}
              className="bg-stone-800 border-4 border-b-8 border-stone-700 hover:border-blue-500 hover:bg-stone-700 p-4 md:p-6 rounded-3xl flex flex-row sm:flex-col items-center gap-4 transition-all text-left sm:text-center active:border-b-4 active:translate-y-1 w-full"
            >
              <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-stone-950 border-2 border-stone-800 shadow-inner flex-shrink-0 ${opt.color}`}>
                <opt.icon className="w-8 h-8 md:w-12 md:h-12" />
              </div>
              <span className="text-lg md:text-xl font-black text-stone-100 uppercase leading-tight">{opt.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
