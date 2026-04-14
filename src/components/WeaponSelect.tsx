import React from 'react';
import { Weapon } from '../game/types';
import { WEAPONS } from '../game/constants';
import { motion } from 'motion/react';
import { Sword, Zap, Crosshair, Wand, Axe } from 'lucide-react';

interface WeaponSelectProps {
  onSelect: (weapon: Weapon) => void;
}

const ICON_MAP: { [key: string]: any } = {
  Sword, Zap, Crosshair, Wand, Axe
};

export const WeaponSelect: React.FC<WeaponSelectProps> = ({ onSelect }) => {
  // Only show Tier 1 weapons for starting
  const startingWeapons = WEAPONS.filter(w => w.rarity === 1);

  return (
    <div className="w-full max-w-4xl mx-auto p-8 mt-10">
      <h2 className="text-6xl font-black text-center mb-12 text-blue-400 drop-shadow-[0_4px_0_rgb(30,58,138)]">
        SELECT STARTING WEAPON
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {startingWeapons.map(weapon => {
          const Icon = ICON_MAP[weapon.icon] || Sword;
          
          return (
            <motion.div
              key={weapon.id}
              whileHover={{ y: -5 }}
              className="bg-stone-800 border-4 border-b-8 border-stone-700 hover:border-blue-500 hover:bg-stone-700 rounded-3xl p-6 cursor-pointer transition-all flex items-center gap-6 active:border-b-4 active:translate-y-1"
              onClick={() => onSelect(weapon)}
            >
              <div className="w-20 h-20 rounded-2xl bg-stone-950 border-2 border-stone-700 shadow-inner flex items-center justify-center text-blue-400 flex-shrink-0">
                <Icon className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-stone-100 mb-2 uppercase">{weapon.name}</h3>
                <div className="flex flex-wrap gap-2 text-sm font-bold">
                  <span className="bg-stone-950 text-red-400 px-2 py-1 rounded-lg border border-stone-800">DMG: {weapon.damage}</span>
                  <span className="bg-stone-950 text-amber-400 px-2 py-1 rounded-lg border border-stone-800">CD: {weapon.cooldown}</span>
                  <span className="bg-stone-950 text-green-400 px-2 py-1 rounded-lg border border-stone-800">TYPE: {weapon.type}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
