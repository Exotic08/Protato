import React from 'react';
import { Weapon } from '../game/types';
import { WEAPONS } from '../game/constants';
import { motion } from 'motion/react';
import { WeaponIllustration } from './Illustration';

interface WeaponSelectProps {
  onSelect: (weapon: Weapon) => void;
}

export const WeaponSelect: React.FC<WeaponSelectProps> = ({ onSelect }) => {
  // Only show Tier 1 weapons for starting
  const startingWeapons = WEAPONS.filter(w => w.rarity === 1);

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-[5px] z-50 overflow-hidden">
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden"
        style={{ width: '70%', height: '70%' }}
      >
        <h2 className="text-3xl md:text-5xl font-black text-center mb-6 md:mb-12 text-white drop-shadow-[0_6px_0_rgb(30,58,138)] uppercase tracking-tight shrink-0 italic">
          SELECT STARTING <span className="text-blue-400">WEAPON</span>
        </h2>
        
        <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar pb-10">
          <div 
            className="grid gap-4 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
          >
            {startingWeapons.map((weapon, idx) => {
              return (
                <motion.div
                  key={weapon.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-stone-800 border-4 md:border-6 border-b-[12px] md:border-b-[20px] border-stone-700 hover:border-blue-500 hover:bg-stone-700 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 cursor-pointer transition-all flex flex-col items-center gap-4 md:gap-6 active:border-b-4 active:translate-y-2 group relative overflow-hidden h-full shadow-lg"
                  onClick={() => onSelect(weapon)}
                >
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-[1.5rem] md:rounded-[2rem] bg-stone-950 border-2 md:border-4 border-stone-800 shadow-inner flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/50 transition-colors relative z-10 overflow-hidden">
                    <WeaponIllustration id={weapon.id} size={64} className="md:hidden" />
                    <WeaponIllustration id={weapon.id} size={96} className="relative z-10 hidden md:block" />
                  </div>

                  <div className="flex-1 flex flex-col items-center text-center w-full relative z-10">
                    <h3 className="text-lg md:text-2xl font-black text-stone-100 mb-1 md:mb-3 uppercase line-clamp-1 leading-tight tracking-tight">{weapon.name}</h3>
                    <span className="text-[10px] md:text-sm text-blue-400 font-black mb-3 md:mb-5 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      {weapon.type}
                    </span>
                    
                    <p className="text-stone-400 text-[10px] md:text-sm font-black mb-4 md:mb-8 uppercase leading-tight line-clamp-3 bg-black/20 p-3 md:p-5 rounded-xl border border-white/5 italic">
                      {weapon.description}
                    </p>

                    <div className="mt-auto w-full grid grid-cols-2 gap-3 md:gap-4">
                      <div className="bg-stone-950 p-2 md:p-4 rounded-xl border-2 md:border-4 border-stone-800 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-[8px] md:text-xs text-stone-500 font-black uppercase font-sans">PWR</span>
                        <span className="text-red-400 text-base md:text-2xl font-black">{weapon.damage}</span>
                      </div>
                      <div className="bg-stone-950 p-2 md:p-4 rounded-xl border-2 md:border-4 border-stone-800 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-[8px] md:text-xs text-stone-500 font-black uppercase font-sans">SPD</span>
                        <span className="text-amber-400 text-base md:text-2xl font-black">
                          {Math.round(100/weapon.cooldown)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
