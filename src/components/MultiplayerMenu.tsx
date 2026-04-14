import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Plus, Play, ArrowLeft } from 'lucide-react';

interface MultiplayerMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
}

export const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({ onCreateRoom, onJoinRoom, onBack }) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-stone-900 p-8 rounded-3xl border-4 border-b-8 border-stone-700 max-w-md w-full mx-auto mt-20 shadow-2xl"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={showJoin ? () => setShowJoin(false) : onBack}
          className="p-2 bg-stone-800 text-stone-400 hover:text-stone-100 rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-4xl font-black text-green-500 flex items-center gap-3 drop-shadow-[0_4px_0_rgb(21,128,61)] uppercase">
          <Users className="w-8 h-8" /> Multiplayer
        </h2>
      </div>

      {!showJoin ? (
        <div className="flex flex-col gap-4">
          <button 
            onClick={onCreateRoom}
            className="group relative px-8 py-5 bg-green-500 text-stone-950 font-black text-2xl rounded-2xl border-4 border-b-8 border-green-700 hover:bg-green-400 active:border-b-4 active:translate-y-1 transition-all"
          >
            <span className="flex items-center justify-center gap-3">
              <Plus className="w-8 h-8" /> CREATE ROOM
            </span>
          </button>
          
          <button 
            onClick={() => setShowJoin(true)}
            className="group relative px-8 py-5 bg-stone-800 text-stone-100 font-black text-2xl rounded-2xl border-4 border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-4 active:translate-y-1 transition-all"
          >
            <span className="flex items-center justify-center gap-3">
              <Play className="fill-current w-6 h-6" /> JOIN ROOM
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-stone-950 p-4 rounded-xl border-2 border-stone-800">
            <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">Enter Room Code</label>
            <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABCD"
              maxLength={6}
              className="w-full bg-stone-900 border-2 border-stone-700 rounded-lg py-3 px-4 text-stone-100 font-black text-2xl text-center tracking-widest focus:outline-none focus:border-green-500 transition-colors uppercase"
            />
          </div>
          <button 
            onClick={() => onJoinRoom(joinCode)}
            disabled={joinCode.length < 4}
            className="w-full py-4 bg-green-500 text-stone-950 font-black text-xl rounded-2xl border-4 border-b-8 border-green-700 hover:bg-green-400 active:border-b-4 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            JOIN NOW
          </button>
        </div>
      )}
    </motion.div>
  );
};
