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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden"
        style={{ width: '70%', height: '70%' }}
      >
        <div className="flex items-center gap-4 md:gap-8 mb-6 md:mb-12 shrink-0">
          <button 
            onClick={showJoin ? () => setShowJoin(false) : onBack}
            className="p-3 md:p-6 bg-stone-800 text-stone-400 hover:text-stone-100 rounded-2xl border-2 md:border-4 border-b-6 md:border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all shadow-xl"
          >
            <ArrowLeft className="w-6 h-6 md:w-10 md:h-10" />
          </button>
          <h2 className="text-3xl md:text-5xl font-black text-green-500 flex items-center gap-3 md:gap-6 drop-shadow-[0_4px_0_rgb(21,128,61)] uppercase italic">
            <Users className="w-8 h-8 md:w-16 md:h-16" /> Multiplayer
          </h2>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-4xl mx-auto">
          {!showJoin ? (
            <div className="flex flex-col gap-6 md:gap-10 w-full">
              <button 
                onClick={onCreateRoom}
                className="group relative px-8 py-6 md:py-10 bg-green-500 text-stone-950 font-black text-2xl md:text-4xl rounded-2xl md:rounded-[2.5rem] border-4 md:border-6 border-b-8 md:border-b-16 border-green-700 hover:bg-green-400 active:border-b-2 active:translate-y-2 md:active:translate-y-4 transition-all shadow-lg"
              >
                <span className="flex items-center justify-center gap-4">
                  <Plus className="w-8 h-8 md:w-12 md:h-12" /> CREATE ROOM
                </span>
              </button>
              
              <button 
                onClick={() => setShowJoin(true)}
                className="group relative px-8 py-6 md:py-10 bg-stone-800 text-stone-100 font-black text-2xl md:text-4xl rounded-2xl md:rounded-[2.5rem] border-4 md:border-6 border-b-8 md:border-b-16 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-2 md:active:translate-y-4 transition-all shadow-lg"
              >
                <span className="flex items-center justify-center gap-4">
                  <Play className="fill-current w-8 h-8 md:w-12 md:h-12" /> JOIN ROOM
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 md:gap-12 w-full">
              <div className="bg-stone-950 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-4 md:border-6 border-stone-800 shadow-inner">
                <label className="text-xs md:text-xl font-black text-stone-500 uppercase mb-3 md:mb-6 block tracking-[0.2em]">Enter Room Code</label>
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="E.G. ABCD"
                  maxLength={6}
                  className="w-full bg-stone-900 border-4 md:border-8 border-stone-700 rounded-2xl md:rounded-[2.5rem] py-4 md:py-8 px-6 md:px-12 text-stone-100 font-black text-2xl md:text-6xl text-center tracking-[0.5em] focus:outline-none focus:border-green-500 transition-colors uppercase placeholder:text-stone-800 shadow-xl"
                />
              </div>
              <button 
                onClick={() => onJoinRoom(joinCode)}
                disabled={joinCode.length < 4}
                className="w-full py-6 md:py-10 bg-green-500 text-stone-950 font-black text-2xl md:text-4xl rounded-2xl md:rounded-[2.5rem] border-4 md:border-6 border-b-8 md:border-b-16 border-green-700 hover:bg-green-400 active:border-b-2 active:translate-y-2 md:active:translate-y-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                JOIN NOW
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
