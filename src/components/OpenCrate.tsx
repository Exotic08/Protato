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
        style={{ width: '95vw', height: '90vh' }}
      >
        <h2 className="text-3xl md:text-7xl font-black text-amber-500 mb-10 md:mb-24 tracking-tighter text-center drop-shadow-[0_8px_0_rgb(180,83,9)] uppercase shrink-0 italic">
          LOOT CRATE ({cratesRemaining} REMAINING)
        </h2>

        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {isOpening ? (
            <motion.div 
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-48 h-48 md:w-80 md:h-80 bg-amber-600 rounded-[3rem] md:rounded-[4rem] border-4 md:border-12 border-amber-800 flex items-center justify-center mb-10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative"
            >
              <Package size={80} className="text-amber-200 md:hidden" />
              <Package size={180} className="text-amber-200 hidden md:block" />
              <div className="absolute inset-0 bg-white/10 rounded-inherit opacity-20" />
            </motion.div>
          ) : item ? (
            <motion.div 
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="flex flex-col items-center w-full max-w-6xl"
            >
              <div className="w-full bg-stone-800 border-4 md:border-8 border-stone-700 rounded-[3rem] md:rounded-[5rem] p-10 md:p-20 flex flex-col items-center mb-12 md:mb-24 shadow-inner relative overflow-hidden">
                {/* Rarity Glow */}
                <div className={`absolute inset-0 opacity-20 bg-current blur-[120px] animate-pulse`} style={{ color: item.rarity === 4 ? '#a855f7' : item.rarity === 3 ? '#3b82f6' : item.rarity === 2 ? '#22c55e' : '#78716c' }} />
                
                <div className="w-40 h-40 md:w-72 md:h-72 bg-stone-700 rounded-[2.5rem] md:rounded-[4rem] flex items-center justify-center mb-8 md:mb-12 border-4 md:border-8 border-white/5 relative z-10 shadow-2xl ring-8 ring-black/20">
                  <ItemIllustration id={item.id} size={120} className="md:hidden" />
                  <ItemIllustration id={item.id} size={220} className="hidden md:block" />
                </div>
                <div className="text-center relative z-10">
                  <h3 className="text-3xl md:text-8xl font-black text-white mb-4 md:mb-10 uppercase tracking-tighter leading-none">{item.name}</h3>
                  <p className="text-stone-400 text-base md:text-3xl font-bold uppercase tracking-tight leading-snug max-w-4xl italic px-4">
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
                className="w-full sm:w-auto px-20 md:px-40 py-6 md:py-12 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-[2rem] md:rounded-[3rem] text-2xl md:text-7xl transition-all border-b-[16px] md:border-b-[32px] border-amber-800 active:border-b-0 active:translate-y-8 shadow-[0_40px_80px_rgba(0,0,0,0.6)] uppercase tracking-tighter"
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
