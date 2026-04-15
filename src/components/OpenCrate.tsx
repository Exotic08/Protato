import React, { useState, useEffect } from 'react';
import { Item } from '../game/types';
import { ITEMS } from '../game/constants';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';

interface OpenCrateProps {
  onItemSelect: (item: Item) => void;
  cratesRemaining: number;
}

export const OpenCrate: React.FC<OpenCrateProps> = ({ onItemSelect, cratesRemaining }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [isOpening, setIsOpening] = useState(true);

  useEffect(() => {
    // Pick a random item
    const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    
    // Simulate opening animation
    const timer = setTimeout(() => {
      setItem(randomItem);
      setIsOpening(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [cratesRemaining]); // Re-run when cratesRemaining changes

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
          <Icons.Package size={64} className="text-amber-200" />
        </motion.div>
      ) : item ? (
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center w-full"
        >
          <div className="w-full bg-stone-800 border-2 border-stone-600 rounded-lg p-6 flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-stone-700 rounded-lg flex items-center justify-center mb-4">
              {React.createElement((Icons as any)[item.icon] || Icons.HelpCircle, { size: 48, className: 'text-blue-400' })}
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
