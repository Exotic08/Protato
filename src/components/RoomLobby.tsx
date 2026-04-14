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
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-stone-900 p-8 rounded-3xl border-4 border-b-8 border-stone-700 max-w-2xl w-full mx-auto shadow-2xl"
    >
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onLeave}
            className="p-2 bg-stone-800 text-stone-400 hover:text-stone-100 rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-green-500 flex items-center gap-3 drop-shadow-[0_4px_0_rgb(21,128,61)] uppercase">
              <Users className="w-8 h-8" /> LOBBY
            </h2>
            <div className="text-stone-400 font-bold mt-1 flex items-center gap-2">
              ROOM CODE: <span className="text-stone-100 bg-stone-800 px-2 py-1 rounded tracking-widest text-xl">{room.id}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-stone-950 px-4 py-2 rounded-xl border-2 border-stone-800 text-right">
          <span className="text-stone-500 text-xs uppercase font-bold tracking-widest block mb-1">MODE</span>
          <div className="text-xl font-black text-amber-500 flex items-center gap-2">
            {room.mode}
            {isHost && (
              <button onClick={onChangeMode} className="text-stone-400 hover:text-stone-100 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-stone-950 rounded-2xl border-2 border-stone-800 p-4 mb-8 min-h-[200px]">
        <h3 className="text-stone-500 text-sm font-bold uppercase mb-4 tracking-widest border-b-2 border-stone-800 pb-2">
          Players ({playersList.length}/4)
        </h3>
        <div className="space-y-2">
          {playersList.map(([uid, player]: [string, any]) => (
            <div key={uid} className="flex items-center justify-between bg-stone-900 p-3 rounded-xl border border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center text-stone-400">
                  {room.host === uid ? <Crown className="w-5 h-5 text-amber-500" /> : <Users className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-black text-stone-100">{player.displayName}</div>
                  <div className="text-xs font-bold text-stone-500 uppercase">
                    {uid === currentUserUid ? '(You)' : ''} {player.isReady ? 'READY' : 'WAITING'}
                  </div>
                </div>
              </div>
              
              {isHost && uid !== currentUserUid && (
                <button 
                  onClick={() => onKick(uid)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Kick Player"
                >
                  <UserMinus className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button 
          onClick={onStart}
          className="w-full py-5 bg-green-500 text-stone-950 font-black text-2xl rounded-2xl border-4 border-b-8 border-green-700 hover:bg-green-400 active:border-b-4 active:translate-y-1 transition-all flex items-center justify-center gap-3"
        >
          <Play className="fill-current w-6 h-6" /> START GAME
        </button>
      ) : (
        <div className="w-full py-5 bg-stone-800 text-stone-400 font-black text-xl rounded-2xl border-4 border-stone-900 text-center uppercase">
          Waiting for host to start...
        </div>
      )}
    </motion.div>
  );
};
