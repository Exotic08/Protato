import React, { useState, useEffect } from 'react';
import { Item } from '../game/types';
import { ITEMS } from '../game/constants';
import { Package, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ItemIllustration } from './Illustration';

interface OpenCrateProps {
  onItemSelect: (item: Item) => void;
  cratesRemaining: number;
  luck?: number;
}

export const OpenCrate: React.FC<OpenCrateProps> = ({ onItemSelect, cratesRemaining, luck = 0 }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [isOpening, setIsOpening] = useState(true);

  useEffect(() => {
    // Pick a random item weighted by luck
    const luckBonus = luck / 100;
    const weightedPool = ITEMS.map(i => ({
      item: i,
      weight: 1 / (i.rarity * Math.max(0.1, 1 - luckBonus * 0.5))
    }));
    const totalWeight = weightedPool.reduce((acc, p) => acc + p.weight, 0);
    let r = Math.random() * totalWeight;
    let selectedItem = ITEMS[0];
    for (const p of weightedPool) {
      r -= p.weight;
      if (r <= 0) {
        selectedItem = p.item;
        break;
      }
    }
    
    // Simulate opening animation
    const timer = setTimeout(() => {
      setItem(selectedItem);
      setIsOpening(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [cratesRemaining, luck]); // Re-run when cratesRemaining or luck changes

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-[5px] z-50 overflow-hidden">
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[3rem] md:rounded-[5rem] p-8 md:p-16 flex flex-col items-center shadow-[0_0_150px_rgba(0,0,0,1)] relative overflow-hidden"
        style={{ width: '70%', height: '70%' }}
      >
        <h2 className="text-2xl md:text-5xl font-black text-amber-500 mb-6 md:mb-16 tracking-tighter text-center drop-shadow-[0_6px_0_rgb(180,83,9)] uppercase shrink-0 italic">
          LOOT CRATE ({cratesRemaining} REMAINING)
        </h2>

        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {isOpening ? (
            <motion.div 
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-32 h-32 md:w-56 md:h-56 bg-amber-600 rounded-[2.5rem] md:rounded-[3.5rem] border-4 md:border-8 border-amber-800 flex items-center justify-center mb-6 shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative"
            >
              <Package size={60} className="text-amber-200 md:hidden" />
              <Package size={120} className="text-amber-200 hidden md:block" />
              <div className="absolute inset-0 bg-white/10 rounded-inherit opacity-20" />
            </motion.div>
          ) : item ? (
            <motion.div 
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="flex flex-col items-center w-full max-w-4xl"
            >
              <div className="w-full bg-stone-800 border-4 md:border-6 border-stone-700 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 flex flex-col items-center mb-8 md:mb-16 shadow-inner relative overflow-hidden">
                {/* Rarity Glow */}
                <div className={`absolute inset-0 opacity-20 bg-current blur-[80px] animate-pulse`} style={{ color: item.rarity === 4 ? '#a855f7' : item.rarity === 3 ? '#3b82f6' : item.rarity === 2 ? '#22c55e' : '#78716c' }} />
                
                <div className="w-28 h-28 md:w-48 md:h-48 bg-stone-700 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mb-6 md:mb-10 border-2 md:border-6 border-white/5 relative z-10 shadow-2xl ring-4 ring-black/20">
                  <ItemIllustration id={item.id} size={80} className="md:hidden" />
                  <ItemIllustration id={item.id} size={160} className="hidden md:block" />
                </div>
                <div className="text-center relative z-10">
                  <h3 className="text-2xl md:text-5xl font-black text-white mb-2 md:mb-6 uppercase tracking-tighter leading-none">{item.name}</h3>
                  <p className="text-stone-400 text-sm md:text-2xl font-bold uppercase tracking-tight leading-snug max-w-3xl italic px-4">
                    "{item.description}"
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsOpening(true);
                  setItem(null);
                  onItemSelect(item);
                }}
                className="w-full sm:w-auto px-12 md:px-24 py-4 md:py-8 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-2xl md:rounded-[2.5rem] text-xl md:text-4xl transition-all border-b-8 md:border-b-20 border-amber-800 active:border-b-0 active:translate-y-4 shadow-lg uppercase tracking-tighter"
              >
                TAKE ITEM
              </button>
            </motion.div>
          ) : null}
        </div>
        
        {/* Background Decorative Blur */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
      </div>
    </div>
  );
};
