import React from 'react';
import { motion } from 'motion/react';
import { Users, Play, ArrowLeft, Crown, UserMinus, Settings } from 'lucide-react';
import { RoomData } from '../game/types';

interface RoomLobbyProps {
  room: RoomData;
  currentUserUid: string;
  onStart: () => void;
  onLeave: () => void;
  onKick: (uid: string) => void;
  onChangeMode: () => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({ room, currentUserUid, onStart, onLeave, onKick, onChangeMode }) => {
  const isHost = room.host === currentUserUid;
  const playersList = Object.entries(room.players || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden"
        style={{ width: '70%', height: '70%' }}
      >
        <div className="flex justify-between items-start mb-10 md:mb-16 shrink-0">
          <div className="flex items-center gap-6 md:gap-12">
            <button 
              onClick={onLeave}
              className="p-4 md:p-8 bg-stone-800 text-stone-400 hover:text-stone-100 rounded-3xl border-4 border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-4 active:translate-y-2 transition-all shadow-xl"
            >
              <ArrowLeft className="w-8 h-8 md:w-16 md:h-16" />
            </button>
            <div>
              <h2 className="text-4xl md:text-8xl font-black text-green-500 flex items-center gap-4 md:gap-10 drop-shadow-[0_8px_0_rgb(21,128,61)] uppercase italic">
                <Users className="w-10 h-10 md:w-24 md:h-24" /> LOBBY
              </h2>
              <div className="text-stone-400 font-bold mt-2 flex items-center gap-4 md:gap-8">
                <span className="text-lg md:text-4xl tracking-widest uppercase">ROOM CODE:</span>
                <span className="text-stone-100 bg-stone-800 px-4 py-2 md:px-8 md:py-4 rounded-2xl tracking-[0.3em] text-2xl md:text-6xl border-4 border-stone-700 shadow-inner">{room.id}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-stone-950 px-6 py-4 md:px-12 md:py-8 rounded-3xl md:rounded-[3rem] border-4 md:border-8 border-stone-800 text-right shadow-inner">
            <span className="text-stone-500 text-sm md:text-3xl uppercase font-black tracking-widest block mb-1 md:mb-4">MODE</span>
            <div className="text-2xl md:text-6xl font-black text-amber-500 flex items-center gap-4 justify-end">
              {room.mode}
              {isHost && (
                <button onClick={onChangeMode} className="text-stone-400 hover:text-stone-100 transition-colors p-2 md:p-4 bg-stone-800 rounded-xl hover:bg-stone-700 border-2 border-stone-600">
                  <Settings className="w-6 h-6 md:w-12 md:h-12" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-stone-950/50 rounded-[2.5rem] md:rounded-[4rem] border-4 md:border-8 border-stone-800 p-6 md:p-12 mb-10 md:mb-16 shadow-inner">
          <h3 className="text-stone-500 text-lg md:text-4xl font-black uppercase mb-6 md:mb-12 tracking-widest border-b-4 border-stone-800 pb-4 md:pb-8">
            Players ({playersList.length}/4)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {playersList.map(([uid, player]: [string, any]) => (
              <div key={uid} className="flex items-center justify-between bg-stone-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 border-stone-800 shadow-xl group hover:border-amber-500/50 transition-all">
                <div className="flex items-center gap-6 md:gap-10">
                  <div className="w-16 h-16 md:w-32 md:h-32 bg-stone-800 rounded-3xl md:rounded-[2.5rem] flex items-center justify-center text-stone-400 border-4 border-stone-700 shadow-inner group-hover:bg-stone-700 transition-colors">
                    {room.host === uid ? <Crown className="w-10 h-10 md:w-20 md:h-20 text-amber-500" /> : <Users className="w-10 h-10 md:w-20 md:h-20" />}
                  </div>
                  <div>
                    <div className="font-black text-stone-100 text-2xl md:text-5xl uppercase tracking-tight mb-1 md:mb-2">{player.displayName}</div>
                    <div className={`text-sm md:text-2xl font-black uppercase tracking-[0.15em] ${player.isReady ? 'text-green-500' : 'text-stone-500'}`}>
                      {uid === currentUserUid ? '(You)' : ''} {player.isReady ? 'READY' : 'WAITING...'}
                    </div>
                  </div>
                </div>
                
                {isHost && uid !== currentUserUid && (
                  <button 
                    onClick={() => onKick(uid)}
                    className="p-4 md:p-8 text-red-500 hover:bg-red-500/10 rounded-2xl md:rounded-3xl transition-all hover:scale-110 active:scale-95"
                    title="Kick Player"
                  >
                    <UserMinus className="w-8 h-8 md:w-16 md:h-16" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0">
          {isHost ? (
            <button 
              onClick={onStart}
              className="w-full py-8 md:py-16 bg-green-500 text-stone-950 font-black text-3xl md:text-7xl rounded-[2rem] md:rounded-[3.5rem] border-4 md:border-8 border-b-[16px] md:border-b-[32px] border-green-700 hover:bg-green-400 active:border-b-4 active:translate-y-4 md:active:translate-y-8 transition-all flex items-center justify-center gap-6 md:gap-12 shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
            >
              <Play className="fill-current w-12 h-12 md:w-24 md:h-24" /> START GAME
            </button>
          ) : (
            <div className="w-full py-8 md:py-16 bg-stone-800 text-stone-400 font-black text-2xl md:text-5xl rounded-[2rem] md:rounded-[3.5rem] border-4 md:border-8 border-stone-900 text-center uppercase tracking-widest shadow-xl flex items-center justify-center gap-6">
              <span className="w-4 h-4 md:w-8 md:h-8 bg-amber-500 rounded-full animate-pulse" />
              Waiting for host to start...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
