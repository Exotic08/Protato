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
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-[5px] z-50 overflow-hidden">
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden"
        style={{ width: '95vw', height: '90vh' }}
      >
        <h2 className="text-4xl md:text-8xl font-black text-center mb-8 md:mb-16 text-amber-500 drop-shadow-[0_8px_0_rgb(180,83,9)] uppercase tracking-tighter shrink-0 italic">
          SELECT <span className="text-white">HERO</span>
        </h2>
        
        <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-10">
            {CHARACTERS.map((char, idx) => {
              const unlocked = isUnlocked(char);
              
              return (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={unlocked ? { y: -15, scale: 1.03 } : {}}
                  className={`relative p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border-4 md:border-8 border-b-[16px] md:border-b-[24px] transition-all group ${unlocked ? 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-700 cursor-pointer active:border-b-4 active:translate-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-stone-900 border-stone-800 opacity-60 grayscale'}`}
                  onClick={() => unlocked && onSelect(char)}
                >
                  {!unlocked && (
                    <div className="absolute inset-0 bg-stone-950/90 flex flex-col items-center justify-center rounded-[2.2rem] md:rounded-[3.2rem] z-20 p-6">
                      <Lock className="w-12 h-12 md:w-20 md:h-20 text-amber-500/50 mb-4" />
                      <p className="text-amber-500 text-xs md:text-sm font-black text-center uppercase tracking-widest leading-tight">{char.unlockCondition.text}</p>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-4 md:gap-6 mb-4 md:mb-8">
                    <div className={`w-20 h-20 md:w-32 md:h-32 rounded-3xl flex items-center justify-center bg-stone-950 border-4 border-stone-800 shadow-inner group-hover:rotate-6 transition-transform overflow-hidden relative`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                      <CharacterIllustration id={char.id} size={64} className="md:hidden relative z-10" />
                      <CharacterIllustration id={char.id} size={96} className="hidden md:block relative z-10" />
                    </div>
                    <div className="text-center w-full">
                      <h3 className="text-lg md:text-3xl font-black text-stone-100 uppercase leading-none mb-1 md:mb-2 tracking-tight">{char.name}</h3>
                      <p className="text-amber-500/80 text-[10px] md:text-sm font-black uppercase tracking-widest">{char.description}</p>
                    </div>
                  </div>

                  <div className="bg-stone-950/80 p-3 md:p-5 rounded-2xl border-2 border-stone-700 shadow-inner min-h-[50px] md:min-h-[80px] flex items-center justify-center">
                    <p className="text-green-400 font-bold text-center text-[10px] md:text-base leading-snug uppercase tracking-tight italic">
                      "{char.skillDescription}"
                    </p>
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
