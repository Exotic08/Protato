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
      weight: 1 / (i.rarity * (1 - luckBonus * 0.5))
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
    <div className="w-full max-w-2xl mx-auto bg-stone-900 border-4 border-stone-700 rounded-xl p-8 flex flex-col items-center">
      <h2 className="text-3xl font-black text-amber-500 mb-8 tracking-wider">
        LOOT CRATE ({cratesRemaining} REMAINING)
      </h2>

      {isOpening ? (
        <motion.div 
          animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-32 h-32 bg-amber-600 rounded-lg border-4 border-amber-800 flex items-center justify-center mb-8"
        >
          <Package size={64} className="text-amber-200" />
        </motion.div>
      ) : item ? (
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center w-full"
        >
          <div className="w-full bg-stone-800 border-2 border-stone-600 rounded-lg p-6 flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-stone-700 rounded-lg flex items-center justify-center mb-4">
              <ItemIllustration id={item.id} size={80} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
            <p className="text-stone-400 text-center">{item.description}</p>
          </div>

          <button
            onClick={() => {
              setIsOpening(true);
              setItem(null);
              onItemSelect(item);
            }}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xl transition-colors"
          >
            TAKE ITEM
          </button>
        </motion.div>
      ) : null}
    </div>
  );
};
