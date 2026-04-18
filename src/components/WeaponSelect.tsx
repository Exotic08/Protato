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
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-10">
      <h2 className="text-3xl md:text-5xl font-black text-center mb-6 md:mb-10 text-white drop-shadow-[0_4px_0_rgb(30,58,138)] uppercase tracking-tight">
        SELECT STARTING <span className="text-blue-400">WEAPON</span>
      </h2>
      
      {/* Scrollable Container with Height Limit */}
      <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        <div 
          className="grid gap-[10px]" 
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
        >
          {startingWeapons.map((weapon, idx) => {
            return (
              <motion.div
                key={weapon.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5, scale: 1.03 }}
                className="bg-stone-900 border-2 border-b-4 border-stone-800 hover:border-blue-500 hover:bg-stone-800 rounded-2xl p-3 md:p-4 cursor-pointer transition-all flex flex-col items-center gap-3 active:border-b-2 active:translate-y-1 group relative overflow-hidden h-full min-h-[220px]"
                onClick={() => onSelect(weapon)}
              >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-stone-950 border-2 border-stone-800 shadow-inner flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/50 transition-colors relative z-10">
                  <WeaponIllustration id={weapon.id} size={50} className="relative z-10" />
                </div>

                <div className="flex-1 flex flex-col items-center text-center w-full relative z-10">
                  <h3 className="text-sm md:text-lg font-black text-stone-100 mb-1 uppercase line-clamp-1 leading-tight">{weapon.name}</h3>
                  <span className="text-[10px] text-blue-400 font-bold mb-2 uppercase tracking-wide bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {weapon.type}
                  </span>
                  
                  <p className="hidden md:block text-stone-400 text-[10px] font-bold mb-3 uppercase leading-tight line-clamp-2">
                    {weapon.description}
                  </p>

                  <div className="mt-auto w-full grid grid-cols-2 gap-1.5">
                    <div className="bg-stone-950/50 p-1.5 rounded-lg border border-stone-800 flex flex-col items-center justify-center">
                      <span className="text-[8px] text-stone-500 font-black uppercase">DMG</span>
                      <span className="text-red-400 text-xs md:text-sm font-black">{weapon.damage}</span>
                    </div>
                    <div className="bg-stone-950/50 p-1.5 rounded-lg border border-stone-800 flex flex-col items-center justify-center">
                      <span className="text-[8px] text-stone-500 font-black uppercase">SPD</span>
                      <span className="text-amber-400 text-xs md:text-sm font-black">
                        {Math.round(100/weapon.cooldown * 100)}
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
  );
};
