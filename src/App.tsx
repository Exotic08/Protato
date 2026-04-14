import React, { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Shop } from './components/Shop';
import { LevelUp } from './components/LevelUp';
import { CharacterSelect } from './components/CharacterSelect';
import { WeaponSelect } from './components/WeaponSelect';
import { AuthUI } from './components/AuthUI';
import { DisplayNameModal } from './components/DisplayNameModal';
import { GameState, Stats, Weapon, Item, GameMode, Mission, Character } from './game/types';
import { INITIAL_STATS, WEAPONS, XP_PER_LEVEL } from './game/constants';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Skull, Trophy, Target, Infinity, Settings, LogOut, User as UserIcon, Maximize, Minimize } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [forceNameSetup, setForceNameSetup] = useState(false);
  const [showChangeName, setShowChangeName] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('STANDARD');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
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
    } else {
      localStorage.setItem('potato_survivor_stats', JSON.stringify(newStats));
    }
  };
  const [wave, setWave] = useState(1);
  const [materials, setMaterials] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
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

  const handleCharacterSelect = (char: Character) => {
    setSelectedCharacter(char);
    setGameState('WEAPON_SELECT');
  };

  const handleWeaponSelect = (weapon: Weapon) => {
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
    setGameState('PLAYING');
  };

  const handleWaveEnd = useCallback((currentMaterials: number, currentXp: number, killsThisWave: number = 0) => {
    setMaterials(currentMaterials);
    setXp(currentXp);
    
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

    if (currentXp >= XP_PER_LEVEL(level)) {
      setGameState('LEVEL_UP');
    } else {
      setGameState('SHOP');
    }
  }, [level]);

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

  const handleBuyItem = (item: Item) => {
    setItems(prev => [...prev, item]);
    setMaterials(prev => prev - item.price);
    setStats(prev => {
      const newStats = { ...prev };
      Object.entries(item.stats).forEach(([key, val]) => {
        (newStats as any)[key] += val;
      });
      return newStats;
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

  return (
    <div className="min-h-screen bg-stone-950 text-stone-50 overflow-hidden font-sans selection:bg-amber-500/30 relative">
      <button 
        onClick={toggleFullscreen} 
        className="absolute top-4 left-4 z-50 p-3 bg-stone-800 text-stone-400 hover:text-stone-100 rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all"
      >
        {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
      </button>

      {!user && <AuthUI />}

      {user && forceNameSetup && (
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

      {user && !forceNameSetup && gameState === 'MENU' && (
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-stone-800 text-stone-400 hover:text-stone-100 rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all"
          >
            <Settings className="w-6 h-6" />
          </button>
          
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-64 bg-stone-900 border-4 border-stone-800 rounded-2xl p-4 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-stone-800">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-stone-500 font-bold uppercase">{user.email}</p>
                    <p className="text-sm font-black text-stone-300 truncate">{displayName || 'No Name'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowSettings(false); setShowChangeName(true); }}
                  className="w-full py-3 mb-2 bg-stone-800 text-stone-100 font-black rounded-xl border-2 border-stone-950 hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
                >
                  CHANGE NAME
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full py-3 bg-red-500/10 text-red-500 font-black rounded-xl border-2 border-red-500/20 hover:bg-red-500 hover:text-stone-950 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> SIGN OUT
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode="wait">
        {user && !forceNameSetup && gameState === 'MENU' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full max-w-4xl mx-auto mt-20"
          >
            <h1 className="text-8xl font-black mb-4 text-amber-500 drop-shadow-[0_6px_0_rgb(180,83,9)] tracking-wider">
              POTATO SURVIVOR
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
            <WeaponSelect onSelect={handleWeaponSelect} />
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-screen flex flex-col"
          >
            <div className="p-4 bg-stone-900 border-b-4 border-stone-800 flex justify-between items-center shadow-lg z-10">
              <div className="flex gap-8">
                <div className="bg-stone-950 px-4 py-2 rounded-xl border-2 border-stone-800">
                  <span className="text-stone-500 text-xs uppercase font-bold tracking-widest block mb-1">Wave</span>
                  <div className="text-3xl font-black text-stone-100 leading-none">{wave} {gameMode === 'ENDLESS' && '∞'}</div>
                </div>
                <div className="bg-stone-950 px-4 py-2 rounded-xl border-2 border-stone-800">
                  <span className="text-stone-500 text-xs uppercase font-bold tracking-widest block mb-1">Materials</span>
                  <div className="text-3xl font-black text-green-400 leading-none">{materials}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {weapons.map((w, i) => (
                  <div key={i} className="w-12 h-12 bg-stone-800 rounded-xl border-2 border-stone-700 flex items-center justify-center text-stone-400 shadow-inner">
                    <span className="text-[10px] font-bold uppercase">{w.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
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
              />
            </div>
          </motion.div>
        )}

        {gameState === 'SHOP' && (
          <Shop 
            key="shop"
            materials={materials}
            onBuyWeapon={handleBuyWeapon}
            onBuyItem={handleBuyItem}
            onUpgradeWeapon={handleUpgradeWeapon}
            onReroll={handleReroll}
            onNextWave={() => {
              setWave(prev => prev + 1);
              setGameState('PLAYING');
            }}
            currentWeapons={weapons}
            wave={wave}
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
            className="text-center bg-stone-900 p-12 rounded-3xl border-4 border-b-8 border-red-900 shadow-2xl max-w-2xl w-full"
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
    </div>
  );
}
