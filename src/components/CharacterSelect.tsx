import React from 'react';
import { Character } from '../game/types';
import { CHARACTERS } from '../game/constants';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { CharacterIllustration } from './Illustration';

interface CharacterSelectProps {
  onSelect: (character: Character) => void;
  globalStats: { totalKills: number; maxWave: number; totalMaterials: number };
}

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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <h2 className="text-4xl md:text-6xl font-black text-center mb-8 md:mb-12 text-amber-500 drop-shadow-[0_4px_0_rgb(180,83,9)] uppercase tracking-tighter">
        SELECT CHARACTER
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {CHARACTERS.map((char, idx) => {
          const unlocked = isUnlocked(char);
          
          return (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={unlocked ? { y: -8, scale: 1.05 } : {}}
              className={`relative p-6 rounded-3xl border-4 border-b-8 transition-all group ${unlocked ? 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-700 cursor-pointer active:border-b-4 active:translate-y-1 shadow-xl' : 'bg-stone-900 border-stone-800 opacity-75 grayscale'}`}
              onClick={() => unlocked && onSelect(char)}
            >
              {!unlocked && (
                <div className="absolute inset-0 bg-stone-950/80 flex flex-col items-center justify-center rounded-[1.4rem] z-10 p-4">
                  <Lock className="w-10 h-10 text-stone-600 mb-3" />
                  <p className="text-stone-500 text-[10px] font-black text-center uppercase tracking-widest">{char.unlockCondition.text}</p>
                </div>
              )}
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-stone-950 border-2 border-stone-700 shadow-inner group-hover:rotate-6 transition-transform`}>
                  <CharacterIllustration id={char.id} size={64} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-stone-100 uppercase leading-none mb-1">{char.name}</h3>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-wider">{char.description}</p>
                </div>
              </div>
              <div className="bg-stone-950 p-3 rounded-xl border-2 border-stone-800 shadow-inner min-h-[60px] flex items-center justify-center">
                <p className="text-green-400 font-black text-center text-xs leading-tight uppercase">{char.skillDescription}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
