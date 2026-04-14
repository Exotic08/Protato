import React from 'react';
import { Character } from '../game/types';
import { CHARACTERS } from '../game/constants';
import { motion } from 'motion/react';
import { Smile, Swords, Crosshair, Ghost, Coins, Lock } from 'lucide-react';

interface CharacterSelectProps {
  onSelect: (character: Character) => void;
  globalStats: { totalKills: number; maxWave: number; totalMaterials: number };
}

const ICON_MAP: { [key: string]: any } = {
  Smile, Swords, Crosshair, Ghost, Coins
};

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect, globalStats }) => {
  
  const isUnlocked = (char: Character) => {
    switch (char.unlockCondition.type) {
      case 'DEFAULT': return true;
      case 'KILLS': return globalStats.totalKills >= char.unlockCondition.value;
      case 'WAVE': return globalStats.maxWave >= char.unlockCondition.value;
      case 'MATERIALS': return globalStats.totalMaterials >= char.unlockCondition.value;
      default: return false;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8">
      <h2 className="text-6xl font-black text-center mb-12 text-amber-500 drop-shadow-[0_4px_0_rgb(180,83,9)]">
        SELECT CHARACTER
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {CHARACTERS.map(char => {
          const unlocked = isUnlocked(char);
          const Icon = ICON_MAP[char.icon] || Smile;
          
          return (
            <motion.div
              key={char.id}
              whileHover={unlocked ? { y: -5 } : {}}
              className={`relative p-6 rounded-3xl border-4 border-b-8 transition-all ${unlocked ? 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-700 cursor-pointer active:border-b-4 active:translate-y-1' : 'bg-stone-900 border-stone-800 opacity-75 grayscale'}`}
              onClick={() => unlocked && onSelect(char)}
            >
              {!unlocked && (
                <div className="absolute inset-0 bg-stone-950/70 flex flex-col items-center justify-center rounded-2xl z-10">
                  <Lock className="w-12 h-12 text-stone-500 mb-2" />
                  <p className="text-stone-400 text-sm font-bold text-center px-4 uppercase">{char.unlockCondition.text}</p>
                </div>
              )}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-stone-950 border-2 border-stone-700 shadow-inner ${char.color}`}>
                  <Icon className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-stone-100 uppercase">{char.name}</h3>
                  <p className="text-stone-400 text-sm font-bold">{char.description}</p>
                </div>
              </div>
              <div className="bg-stone-950 p-4 rounded-xl border-2 border-stone-800 shadow-inner">
                <p className="text-green-400 font-bold text-sm">{char.skillDescription}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
