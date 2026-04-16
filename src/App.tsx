import React, { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Shop } from './components/Shop';
import { LevelUp } from './components/LevelUp';
import { CharacterSelect } from './components/CharacterSelect';
import { WeaponSelect } from './components/WeaponSelect';
import { OpenCrate } from './components/OpenCrate';
import { AuthUI } from './components/AuthUI';
import { DisplayNameModal } from './components/DisplayNameModal';
import { MultiplayerMenu } from './components/MultiplayerMenu';
import { RoomLobby } from './components/RoomLobby';
import { GameState, Stats, Weapon, Item, GameMode, Mission, Character, RoomData } from './game/types';
import { INITIAL_STATS, WEAPONS, XP_PER_LEVEL, MULTIPLAYER_SERVER } from './game/constants';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Skull, Trophy, Target, Infinity, Settings, LogOut, User as UserIcon, Maximize, Minimize, Users } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, onValue, set, update, remove, onDisconnect } from 'firebase/database';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [guestUser, setGuestUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [forceNameSetup, setForceNameSetup] = useState(false);
  const [showChangeName, setShowChangeName] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uiScale, setUiScale] = useState(100);
  const [userSetScale, setUserSetScale] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [tempScale, setTempScale] = useState(100);
  const [isPortrait, setIsPortrait] = useState(false);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('STANDARD');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Multiplayer State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  // Global Stats for Unlocks
  const [globalStats, setGlobalStats] = useState({ totalKills: 0, maxWave: 0, totalMaterials: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        // Load stats from Firebase Realtime Database
        const statsRef = ref(db, `users/${currentUser.uid}/stats`);
        onValue(statsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setGlobalStats(data);
          }
        }, { onlyOnce: true });

        // Load profile for display name
        const profileRef = ref(db, `users/${currentUser.uid}/profile`);
        onValue(profileRef, (snapshot) => {
          const data = snapshot.val();
          if (data && data.displayName) {
            setDisplayName(data.displayName);
            setForceNameSetup(false);
          } else {
            setDisplayName(null);
            setForceNameSetup(true);
          }
        });
      } else {
        setDisplayName(null);
        setForceNameSetup(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const checkScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      setIsPortrait(height > width);

      if (userSetScale) return;

      // Base resolution we want to fit is 1600x900 (16:9)
      // We use slightly larger targets to ensure some padding
      const targetWidth = 1680;
      const targetHeight = 960;
      
      const scaleX = width / targetWidth;
      const scaleY = height / targetHeight;
      
      // Use the smaller scale to ensure it fits both ways
      const scale = Math.min(scaleX, scaleY);
      
      setUiScale(Math.max(20, Math.floor(scale * 100)));
    };
    checkScale();
    window.addEventListener('resize', checkScale);
    return () => window.removeEventListener('resize', checkScale);
  }, [userSetScale]);

  useEffect(() => {
    setTempScale(uiScale);
  }, [uiScale]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
    } else {
      document.exitFullscreen().catch(e => console.error(e));
    }
  };

  const saveGlobalStats = (newStats: any) => {
    setGlobalStats(newStats);
    if (user) {
      set(ref(db, `users/${user.uid}/stats`), newStats);
    } else if (guestUser) {
      // Sync to Firestore via socket for guest users
      const socketUrl = window.location.hostname === 'localhost' || window.location.hostname.includes('run.app') 
        ? window.location.origin 
        : MULTIPLAYER_SERVER;
      import('socket.io-client').then(({ io }) => {
        const socket = io(socketUrl);
        socket.emit('updateUserData', { 
          username: guestUser.username, 
          updates: { stats: newStats } 
        });
        setTimeout(() => socket.disconnect(), 1000);
      });
    } else {
      localStorage.setItem('potato_survivor_stats', JSON.stringify(newStats));
    }
  };
  const [wave, setWave] = useState(1);
  const [materials, setMaterials] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [cratesToOpen, setCratesToOpen] = useState(0);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [weapons, setWeapons] = useState<Weapon[]>([WEAPONS[0]]); // Start with a pistol
  const [items, setItems] = useState<Item[]>([]);
  const [missions, setMissions] = useState<Mission[]>([
    { id: 'm1', title: 'Slayer', description: 'Kill 50 enemies', target: 50, current: 0, type: 'KILLS', reward: 50 },
    { id: 'm2', title: 'Hoarder', description: 'Collect 100 materials', target: 100, current: 0, type: 'MATERIALS', reward: 100 },
  ]);

  const startGame = (mode: GameMode = 'STANDARD') => {
    setGameMode(mode);
    setGameState('CHARACTER_SELECT');
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const handleCreateRoom = async () => {
    if (!user || !displayName) return;
    const newRoomId = generateRoomCode();
    const roomRef = ref(db, `rooms/${newRoomId}`);
    
    const newRoom: RoomData = {
      id: newRoomId,
      host: user.uid,
      mode: 'STANDARD',
      state: 'LOBBY',
      wave: 1,
      players: {
        [user.uid]: {
          displayName: displayName,
          isReady: false
        }
      }
    };
    
    await set(roomRef, newRoom);
    
    // Set up disconnect hook to remove player from room
    const playerRef = ref(db, `rooms/${newRoomId}/players/${user.uid}`);
    onDisconnect(playerRef).remove();
    
    setRoomId(newRoomId);
    setGameState('ROOM_LOBBY');
  };

  const handleJoinRoom = async (code: string) => {
    if (!user || !displayName) return;
    setRoomId(code);
    
    const playerRef = ref(db, `rooms/${code}/players/${user.uid}`);
    await set(playerRef, {
      displayName: displayName,
      isReady: false
    });
    
    onDisconnect(playerRef).remove();
    setGameState('ROOM_LOBBY');
  };

  const handleLeaveRoom = async () => {
    if (!user || !roomId) return;
    const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
    await remove(playerRef);
    onDisconnect(playerRef).cancel();
    setRoomId(null);
    setRoomData(null);
    setGameState('MENU');
  };

  const handleKickPlayer = async (uid: string) => {
    if (!roomId) return;
    const playerRef = ref(db, `rooms/${roomId}/players/${uid}`);
    await remove(playerRef);
  };

  const handleStartMultiplayer = async () => {
    if (!roomId) return;
    await update(ref(db, `rooms/${roomId}`), { state: 'SELECTING' });
  };

  // Listen to room changes
  useEffect(() => {
    if (!roomId || !user) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val() as RoomData | null;
      if (!data) {
        // Room deleted or we were kicked
        setRoomId(null);
        setRoomData(null);
        setGameState('MENU');
        return;
      }
      
      // If we are not in the players list, we were kicked
      if (!data.players || !data.players[user.uid]) {
        setRoomId(null);
        setRoomData(null);
        setGameState('MENU');
        return;
      }

      setRoomData(data);
      
      // Handle state transitions driven by host
      if (data.state === 'SELECTING' && gameState === 'ROOM_LOBBY') {
        setGameState('CHARACTER_SELECT');
      } else if (data.state === 'PLAYING' && (gameState === 'WEAPON_SELECT' || gameState === 'SHOP')) {
        setWave(data.wave);
        setGameState('PLAYING');
      } else if (data.state === 'SHOP' && gameState === 'PLAYING') {
        setGameState('SHOP');
      }
    });
    
    return () => unsubscribe();
  }, [roomId, user, gameState]);

  const handleCharacterSelect = (char: Character) => {
    setSelectedCharacter(char);
    setGameState('WEAPON_SELECT');
  };

  const handleWeaponSelect = async (weapon: Weapon) => {
    setWave(1);
    setMaterials(0);
    setXp(0);
    setLevel(1);
    
    // Apply character base stats modifier
    const startingStats = { ...INITIAL_STATS };
    if (selectedCharacter) {
      Object.entries(selectedCharacter.statsModifier).forEach(([key, val]) => {
        (startingStats as any)[key] += val;
      });
    }
    setStats(startingStats);
    
    setWeapons([weapon]);
    setItems([]);

    if (roomId && user) {
      // Multiplayer: wait for others
      await update(ref(db, `rooms/${roomId}/players/${user.uid}`), { isReady: true });
      
      // If host, check if everyone is ready to start PLAYING
      if (roomData?.host === user.uid) {
        // We need to check the latest data, but for simplicity we rely on the effect or a separate check
        // Actually, let's just let the host check in a useEffect or here.
        // A better way is a cloud function, but we'll do client-side host authority.
      }
    } else {
      setGameState('PLAYING');
    }
  };

  // Host authority effect to transition states when everyone is ready
  useEffect(() => {
    if (!roomId || !roomData || !user || roomData.host !== user.uid) return;

    const allReady = (Object.values(roomData.players || {}) as any[]).every(p => p.isReady);
    
    if (allReady) {
      if (roomData.state === 'SELECTING') {
        // Reset ready states and move to PLAYING
        const updates: any = { state: 'PLAYING' };
        Object.keys(roomData.players).forEach(uid => {
          updates[`players/${uid}/isReady`] = false;
        });
        update(ref(db, `rooms/${roomId}`), updates);
      } else if (roomData.state === 'SHOP') {
        // Move to next wave
        const updates: any = { state: 'PLAYING', wave: roomData.wave + 1 };
        Object.keys(roomData.players).forEach(uid => {
          updates[`players/${uid}/isReady`] = false;
        });
        update(ref(db, `rooms/${roomId}`), updates);
      }
    }
  }, [roomData, roomId, user]);

  const handleWaveEnd = useCallback(async (currentMaterials: number, currentXp: number, killsThisWave: number = 0, crates: number = 0) => {
    setMaterials(currentMaterials);
    setXp(currentXp);
    setCratesToOpen(crates);
    
    // Update global stats
    saveGlobalStats({
      totalKills: globalStats.totalKills + killsThisWave,
      maxWave: Math.max(globalStats.maxWave, wave),
      totalMaterials: globalStats.totalMaterials + (currentMaterials - materials)
    });
    
    // Update missions (simulated for now, would need actual kill count from GameCanvas)
    // For now let's just assume some progress
    setMissions(prev => prev.map(m => {
      if (m.type === 'MATERIALS') {
        const next = Math.min(m.target, currentMaterials);
        if (next === m.target && m.current < m.target) setMaterials(curr => curr + m.reward);
        return { ...m, current: next };
      }
      return m;
    }));

    if (crates > 0) {
      setGameState('OPEN_CRATE');
    } else if (currentXp >= XP_PER_LEVEL(level)) {
      setGameState('LEVEL_UP');
    } else {
      setGameState('SHOP');
      if (roomId && user && roomData?.host === user.uid) {
        update(ref(db, `rooms/${roomId}`), { state: 'SHOP' });
      }
    }
  }, [level, globalStats, materials, wave, roomId, user, roomData]);

  const handleLevelUp = (stat: keyof Stats, value: number) => {
    setStats(prev => ({ ...prev, [stat]: prev[stat] + value }));
    
    setLevel(prevLevel => {
      const nextLevel = prevLevel + 1;
      setXp(prevXp => {
        const remainingXp = prevXp - XP_PER_LEVEL(prevLevel);
        if (remainingXp >= XP_PER_LEVEL(nextLevel)) {
          setGameState('LEVEL_UP');
        } else {
          setGameState('SHOP');
          if (roomId && user && roomData?.host === user.uid) {
            update(ref(db, `rooms/${roomId}`), { state: 'SHOP' });
          }
        }
        return remainingXp;
      });
      return nextLevel;
    });
  };

  const handleBuyWeapon = (weapon: Weapon) => {
    setWeapons(prev => [...prev, weapon]);
    setMaterials(prev => prev - weapon.price);
  };

  const handleUpgradeWeapon = (index: number, nextWeapon: Weapon) => {
    setMaterials(prev => prev - nextWeapon.price);
    setWeapons(prev => {
      const newWeapons = [...prev];
      newWeapons[index] = nextWeapon;
      return newWeapons;
    });
  };

  const handleSellWeapon = (index: number, price: number) => {
    setMaterials(prev => prev + price);
    setWeapons(prev => {
      const newWeapons = [...prev];
      newWeapons.splice(index, 1);
      return newWeapons;
    });
  };

  const handleBuyItem = (item: Item) => {
    handleAddItem(item);
    setMaterials(prev => prev - item.price);
  };

  const handleAddItem = (item: Item) => {
    setItems(prev => [...prev, item]);
    setStats(prev => {
      const newStats = { ...prev };
      Object.entries(item.stats).forEach(([key, val]) => {
        (newStats as any)[key] += val;
      });
      return newStats;
    });
  };

  const handleCrateOpened = (item: Item) => {
    handleAddItem(item);
    setCratesToOpen(prev => {
      const next = prev - 1;
      if (next <= 0) {
        if (xp >= XP_PER_LEVEL(level)) {
          setGameState('LEVEL_UP');
        } else {
          setGameState('SHOP');
          if (roomId && user && roomData?.host === user.uid) {
            update(ref(db, `rooms/${roomId}`), { state: 'SHOP' });
          }
        }
      }
      return next;
    });
  };

  const handleReroll = (cost: number) => {
    setMaterials(prev => prev - cost);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setShowSettings(false);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-amber-500 font-black text-2xl">LOADING...</div>;
  }

  const scaleFactor = uiScale / 100;
  const virtualWidth = windowSize.width / scaleFactor;
  const virtualHeight = windowSize.height / scaleFactor;

  return (
    <div className="fixed inset-0 bg-stone-950 text-stone-50 overflow-hidden font-sans selection:bg-amber-500/30 flex items-center justify-center">
      <div 
        style={{ 
          width: virtualWidth,
          height: virtualHeight,
          transform: `scale(${scaleFactor})`, 
          transformOrigin: 'center',
          flexShrink: 0
        }} 
        className="relative flex flex-col items-center justify-center"
      >
        <div className="absolute top-6 right-6 z-50 flex gap-3">
          <button 
            onClick={toggleFullscreen} 
            className="p-4 bg-stone-800/90 text-stone-400 hover:text-stone-100 rounded-2xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all shadow-xl backdrop-blur-sm"
          >
            {isFullscreen ? <Minimize className="w-8 h-8" /> : <Maximize className="w-8 h-8" />}
          </button>

          {user && !forceNameSetup && (gameState === 'MENU' || gameState === 'PLAYING' || gameState === 'SHOP') && (
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-4 bg-stone-800/90 text-stone-400 hover:text-stone-100 rounded-2xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all shadow-xl backdrop-blur-sm"
              >
                <Settings className="w-8 h-8" />
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-72 bg-stone-900 border-4 border-stone-800 rounded-3xl p-5 shadow-2xl z-[60]"
                  >
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-stone-800">
                      <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-stone-500">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-stone-500 font-black uppercase tracking-tighter">{user?.email || 'GUEST ACCOUNT'}</p>
                        <p className="text-base font-black text-stone-300 truncate">{displayName || 'No Name'}</p>
                      </div>
                    </div>

                    <div className="mb-4 bg-stone-950 p-4 rounded-2xl border-2 border-stone-800">
                      <label className="text-xs font-black text-stone-500 uppercase mb-2 flex justify-between">
                        <span>UI Scale</span>
                        <span className="text-amber-500">{tempScale}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="40" 
                        max="200" 
                        step="5"
                        value={tempScale} 
                        onChange={(e) => setTempScale(Number(e.target.value))}
                        onMouseUp={() => {
                          setUiScale(tempScale);
                          setUserSetScale(true);
                        }}
                        onTouchEnd={() => {
                          setUiScale(tempScale);
                          setUserSetScale(true);
                        }}
                        className="w-full accent-amber-500 mb-1"
                      />
                      <button 
                        onClick={() => {
                          setUserSetScale(false);
                          window.dispatchEvent(new Event('resize'));
                        }}
                        className="text-[10px] text-stone-500 hover:text-stone-300 uppercase font-black w-full text-center mt-1"
                      >
                        Reset to Auto
                      </button>
                    </div>

                    {gameState === 'PLAYING' || gameState === 'SHOP' ? (
                      <button 
                        onClick={() => {
                          if (roomId) {
                            handleLeaveRoom();
                          } else {
                            setGameState('MENU');
                          }
                          setShowSettings(false);
                        }}
                        className="w-full py-4 mb-2 bg-red-500/10 text-red-500 font-black rounded-2xl border-2 border-red-500/20 hover:bg-red-500 hover:text-stone-950 transition-all flex items-center justify-center gap-2 uppercase"
                      >
                        QUIT RUN
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setShowSettings(false); setShowChangeName(true); }}
                        className="w-full py-4 mb-2 bg-stone-800 text-stone-100 font-black rounded-2xl border-2 border-stone-950 hover:bg-stone-700 transition-all flex items-center justify-center gap-2 uppercase"
                      >
                        CHANGE NAME
                      </button>
                    )}
                    
                    {gameState !== 'PLAYING' && gameState !== 'SHOP' && (
                      <button 
                        onClick={() => {
                          if (user) {
                            handleSignOut();
                          } else {
                            setGuestUser(null);
                            setDisplayName(null);
                            setShowSettings(false);
                          }
                        }}
                        className="w-full py-4 bg-red-500/10 text-red-500 font-black rounded-2xl border-2 border-red-500/20 hover:bg-red-500 hover:text-stone-950 transition-all flex items-center justify-center gap-2 uppercase"
                      >
                        <LogOut className="w-4 h-4" /> SIGN OUT
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {!user && !guestUser && (
          <AuthUI onUsernameLogin={(data) => {
            setGuestUser(data);
            setDisplayName(data.username);
            if (data.stats) setGlobalStats(data.stats);
            setAuthLoading(false);
          }} />
        )}

      {(user || guestUser) && forceNameSetup && (
        <DisplayNameModal 
          currentName={displayName} 
          forced={true} 
        />
      )}

      {user && showChangeName && (
        <DisplayNameModal 
          currentName={displayName} 
          onClose={() => setShowChangeName(false)} 
        />
      )}

      <AnimatePresence mode="wait">
        {(user || guestUser) && !forceNameSetup && gameState === 'MENU' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full max-w-4xl mx-auto mt-20"
          >
            <h1 className="text-8xl font-black mb-4 text-amber-500 drop-shadow-[0_6px_0_rgb(180,83,9)] tracking-wider flex items-center justify-center">
              PR
              <div className="w-16 h-16 bg-amber-600 rounded-full border-4 border-amber-900 relative shadow-inner overflow-hidden inline-block align-middle mx-2 mt-2">
                <div className="absolute top-4 left-3 w-3 h-3 bg-white rounded-full"><div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black rounded-full"></div></div>
                <div className="absolute top-4 right-3 w-3 h-3 bg-white rounded-full"><div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black rounded-full"></div></div>
              </div>
              TAT
              <div className="w-16 h-16 bg-amber-600 rounded-full border-4 border-amber-900 relative shadow-inner overflow-hidden inline-block align-middle mx-2 mt-2">
                <div className="absolute top-4 left-3 w-3 h-3 bg-white rounded-full"><div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black rounded-full"></div></div>
                <div className="absolute top-4 right-3 w-3 h-3 bg-white rounded-full"><div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black rounded-full"></div></div>
              </div>
              &nbsp;SURVIVOR
            </h1>
            <p className="text-stone-400 text-2xl font-bold mb-12 uppercase tracking-widest">Survive the swarm. Build your arsenal.</p>
            
            <div className="flex flex-col gap-6 max-w-md mx-auto">
              <button 
                onClick={() => startGame('STANDARD')}
                className="group relative px-8 py-5 bg-amber-500 text-stone-950 font-black text-2xl rounded-2xl border-4 border-b-8 border-amber-700 hover:bg-amber-400 hover:border-amber-600 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Play className="fill-current w-6 h-6" /> STANDARD RUN
                </span>
              </button>
              <button 
                onClick={() => setGameState('MULTIPLAYER_MENU')}
                className="group relative px-8 py-5 bg-green-500 text-stone-950 font-black text-2xl rounded-2xl border-4 border-b-8 border-green-700 hover:bg-green-400 hover:border-green-600 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Users className="w-6 h-6" /> MULTIPLAYER
                </span>
              </button>
              <button 
                onClick={() => startGame('ENDLESS')}
                className="group relative px-8 py-5 bg-stone-800 text-stone-100 font-black text-2xl rounded-2xl border-4 border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Infinity className="w-6 h-6" /> ENDLESS MODE
                </span>
              </button>
              <button 
                onClick={() => setGameState('MODE_SELECT')}
                className="group relative px-8 py-5 bg-stone-800 text-stone-100 font-black text-2xl rounded-2xl border-4 border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Target className="w-6 h-6" /> MISSIONS
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'MULTIPLAYER_MENU' && (
          <MultiplayerMenu 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBack={() => setGameState('MENU')}
          />
        )}

        {gameState === 'ROOM_LOBBY' && roomData && user && (
          <RoomLobby 
            room={roomData}
            currentUserUid={user.uid}
            onStart={handleStartMultiplayer}
            onLeave={handleLeaveRoom}
            onKick={handleKickPlayer}
            onChangeMode={() => {}} // TODO
          />
        )}

        {gameState === 'MODE_SELECT' && (
          <motion.div 
            key="missions"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-stone-900 p-8 rounded-3xl border-4 border-b-8 border-stone-700 max-w-2xl w-full"
          >
            <h2 className="text-5xl font-black mb-8 text-amber-500 flex items-center gap-4 drop-shadow-[0_4px_0_rgb(180,83,9)]">
              <Target className="w-10 h-10" /> ACTIVE MISSIONS
            </h2>
            <div className="space-y-4 mb-8">
              {missions.map(m => (
                <div key={m.id} className="bg-stone-800 p-5 rounded-2xl border-2 border-stone-700 shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black text-stone-100 uppercase">{m.title}</h3>
                    <span className="text-green-400 font-black text-xl bg-stone-950 px-3 py-1 rounded-lg border border-stone-800">+{m.reward} MAT</span>
                  </div>
                  <p className="text-stone-400 text-sm font-bold mb-4 uppercase">{m.description}</p>
                  <div className="w-full bg-stone-950 h-4 rounded-full overflow-hidden border-2 border-stone-800 shadow-inner">
                    <div 
                      className="bg-amber-500 h-full transition-all" 
                      style={{ width: `${(m.current / m.target) * 100}%` }}
                    />
                  </div>
                  <div className="text-right text-xs font-bold text-stone-500 mt-2">{m.current} / {m.target}</div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setGameState('MENU')}
              className="w-full py-4 bg-stone-200 hover:bg-white text-stone-950 font-black text-xl rounded-2xl border-4 border-b-8 border-stone-400 active:border-b-4 active:translate-y-1 transition-all"
            >
              BACK TO MENU
            </button>
          </motion.div>
        )}

        {gameState === 'CHARACTER_SELECT' && (
          <motion.div key="char_select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CharacterSelect onSelect={handleCharacterSelect} globalStats={globalStats} />
          </motion.div>
        )}

        {gameState === 'WEAPON_SELECT' && (
          <motion.div key="weap_select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {roomId && roomData?.state === 'SELECTING' && (roomData.players[user?.uid || ''] as any)?.isReady ? (
              <div className="text-center mt-40">
                <h2 className="text-4xl font-black text-amber-500 mb-4">WAITING FOR OTHERS...</h2>
                <p className="text-stone-400 text-xl font-bold uppercase">
                  {(Object.values(roomData.players) as any[]).filter(p => p.isReady).length} / {Object.keys(roomData.players).length} READY
                </p>
              </div>
            ) : (
              <WeaponSelect onSelect={handleWeaponSelect} />
            )}
          </motion.div>
        )}

        {gameState === 'OPEN_CRATE' && (
          <motion.div key="open_crate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OpenCrate 
              onItemSelect={handleCrateOpened}
              cratesRemaining={cratesToOpen}
            />
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full relative"
          >
            <GameCanvas 
              gameState={gameState}
              onWaveEnd={handleWaveEnd}
              onGameOver={() => setGameState('GAME_OVER')}
              playerStats={stats}
              playerWeapons={weapons}
              initialMaterials={materials}
              initialXp={xp}
              initialLevel={level}
              wave={wave}
              roomId={roomId}
              uiScale={uiScale}
              isHost={roomId ? roomData?.host === (user?.uid || guestUser?.username) : true}
              displayName={displayName || 'Potato'}
              isMultiplayer={!!roomId}
            />
          </motion.div>
        )}

        {gameState === 'SHOP' && (
          <Shop 
            key="shop"
            materials={materials}
            onBuyWeapon={handleBuyWeapon}
            onBuyItem={handleBuyItem}
            onUpgradeWeapon={handleUpgradeWeapon}
            onSellWeapon={handleSellWeapon}
            onReroll={handleReroll}
            onNextWave={async () => {
              if (roomId && user) {
                await update(ref(db, `rooms/${roomId}/players/${user.uid}`), { isReady: true });
              } else {
                setWave(prev => prev + 1);
                setGameState('PLAYING');
              }
            }}
            currentWeapons={weapons}
            wave={wave}
            multiplayerReadyCount={roomId && roomData ? (Object.values(roomData.players) as any[]).filter(p => p.isReady).length : undefined}
            multiplayerTotalCount={roomId && roomData ? Object.keys(roomData.players).length : undefined}
          />
        )}

        {gameState === 'LEVEL_UP' && (
          <LevelUp 
            key="levelup"
            onSelectStat={handleLevelUp}
          />
        )}

        {gameState === 'GAME_OVER' && (
          <motion.div 
            key="gameover"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center bg-stone-900 p-12 rounded-3xl border-4 border-b-8 border-red-900 shadow-2xl max-w-2xl w-full z-10"
          >
            <Skull className="w-32 h-32 text-red-500 mx-auto mb-6 drop-shadow-[0_4px_0_rgb(153,27,27)]" />
            <h2 className="text-8xl font-black text-red-500 mb-4 drop-shadow-[0_6px_0_rgb(153,27,27)]">RUN ENDED</h2>
            <p className="text-stone-400 text-3xl font-black mb-12 uppercase">You survived <span className="text-amber-500">{wave}</span> waves in <span className="text-amber-500">{gameMode}</span> mode.</p>
            <button 
              onClick={() => setGameState('MENU')}
              className="px-10 py-5 bg-stone-200 text-stone-950 font-black text-3xl rounded-2xl border-4 border-b-8 border-stone-400 hover:bg-white active:border-b-4 active:translate-y-1 transition-all flex items-center gap-4 mx-auto"
            >
              <RotateCcw className="w-8 h-8" /> BACK TO MENU
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orientation Warning */}
      {isPortrait && (
        <div className="fixed inset-0 bg-stone-950 z-[100] flex flex-col items-center justify-center p-8 text-center">
          <RotateCcw className="w-24 h-24 text-amber-500 mb-6 animate-spin-slow" />
          <h2 className="text-4xl font-black text-white mb-4 uppercase">Please Rotate Your Device</h2>
          <p className="text-stone-400 text-xl font-bold uppercase">This game is best played in landscape mode.</p>
        </div>
      )}
      </div>
    </div>
  );
}
