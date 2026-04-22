import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { SoulShop } from './components/SoulShop';
import { META_UPGRADES } from './game/metaConstants';
import { ACHIEVEMENTS } from './game/achievements';
import { Language, translations } from './game/i18n';
import { GameState, Stats, Weapon, Item, GameMode, Mission, Character, RoomData, MetaStats, WeaponTag } from './game/types';
import { INITIAL_STATS, WEAPONS, ITEMS, CHARACTERS, XP_PER_LEVEL, MULTIPLAYER_SERVER, SET_BONUSES, MAP_WIDTH, MAP_HEIGHT } from './game/constants';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Skull, Trophy, Target, Infinity, Settings, LogOut, User as UserIcon, Maximize, Minimize, Users, Sparkles } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, onValue, set, update, remove, onDisconnect } from 'firebase/database';
import { playClickSound, toggleMute, initAudio, playLevelUpSound, startBGM, stopBGM, setMusicVolume, setSfxVolume } from './game/audio';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [guestUser, setGuestUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('potato_language') as Language) || 'en');
  const t = translations[language];
  
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [forceNameSetup, setForceNameSetup] = useState(false);
  const [showChangeName, setShowChangeName] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uiScale, setUiScale] = useState(100);
  const [userSetScale, setUserSetScale] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [tempScale, setTempScale] = useState(100);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [musicVol, setMusicVol] = useState(50);
  const [sfxVol, setSfxVol] = useState(100);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('STANDARD');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Multiplayer State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  // Global Stats for Unlocks
  const [globalStats, setGlobalStats] = useState({ totalKills: 0, maxWave: 0, totalMaterials: 0 });
  const [metaStats, setMetaStats] = useState<MetaStats>({ soulFragments: 0, upgrades: {} });
  const [achievements, setAchievements] = useState<string[]>([]);
  const [toast, setToast] = useState<{title: string, desc: string} | null>(null);

  useEffect(() => {
    // Check for saved guest login
    const savedGuest = localStorage.getItem('potato_guest_session');
    if (savedGuest) {
      const data = JSON.parse(savedGuest);
      setGuestUser(data);
      setDisplayName(data.username);
      if (data.stats) setGlobalStats(data.stats);
      setAuthLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setGuestUser(null);
        localStorage.removeItem('potato_guest_session');
      }
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

        // Load meta stats
        const metaRef = ref(db, `users/${currentUser.uid}/meta`);
        onValue(metaRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setMetaStats({
              soulFragments: data.soulFragments || 0,
              upgrades: data.upgrades || {}
            });
          }
        }, { onlyOnce: true });

        // Load achievements
        const achRef = ref(db, `users/${currentUser.uid}/achievements`);
        onValue(achRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setAchievements(data);
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
    if (gameState === 'MENU' || gameState === 'MULTIPLAYER_MENU' || gameState === 'ROOM_LOBBY') {
      startBGM('menu');
    } else if (gameState === 'PLAYING') {
      startBGM('gameplay');
    } else if (gameState === 'GAME_OVER') {
      startBGM('gameover');
    } else if (gameState === 'VICTORY') {
      stopBGM();
    }
  }, [gameState]);

  useEffect(() => {
    setMusicVolume(musicVol / 100);
  }, [musicVol]);

  useEffect(() => {
    setSfxVolume(sfxVol / 100);
  }, [sfxVol]);

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

  const handleMetaUpgrade = (upgradeId: string, cost: number) => {
    setMetaStats(prev => {
      const next = {
        ...prev,
        soulFragments: prev.soulFragments - cost,
        upgrades: {
          ...prev.upgrades,
          [upgradeId]: (prev.upgrades[upgradeId] || 0) + 1
        }
      };
      
      if (user) {
        set(ref(db, `users/${user.uid}/meta`), next);
      }
      return next;
    });
    playLevelUpSound();
  };
  const saveGlobalStats = (newStats: any) => {
    setGlobalStats(newStats);
    checkAchievements(newStats);
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
  const [runStats, setRunStats] = useState({ kills: 0, wave: 0, materials: 0 });

  // Weapon Tag Set Bonuses (MISSING-3)
  const effectiveStats = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    weapons.forEach(w => {
      (w.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const bonus: Partial<Stats> = {};
    Object.entries(tagCounts).forEach(([tag, count]) => {
      const bonuses = SET_BONUSES[tag as WeaponTag] || [];
      const applicable = bonuses.filter(b => b.count <= count);
      if (applicable.length > 0) {
        const topBonus = applicable[applicable.length - 1];
        Object.entries(topBonus.stats).forEach(([stat, val]) => {
          (bonus as any)[stat] = ((bonus as any)[stat] || 0) + (val as number);
        });
      }
    });

    const next = { ...stats };
    
    // Weapon-specific passives (e.g., Generator BUG-4)
    weapons.forEach(w => {
      if (w.baseId === 'generator') {
        next.rangedDamage += 10;
      }
    });

    Object.entries(bonus).forEach(([key, val]) => {
      (next as any)[key] += val;
    });
    return next;
  }, [stats, weapons]);

  const [missions, setMissions] = useState<Mission[]>([
    { id: 'm1', title: 'Slayer', description: 'Kill 50 enemies', target: 50, current: 0, type: 'KILLS', reward: 50 },
    { id: 'm2', title: 'Hoarder', description: 'Collect 100 materials', target: 100, current: 0, type: 'MATERIALS', reward: 100 },
  ]);

  const checkAchievements = (stats: any) => {
    const newUnlocked: string[] = [];
    if (stats.totalKills >= 1 && !achievements.includes('first_blood')) newUnlocked.push('first_blood');
    if (stats.maxWave >= 10 && !achievements.includes('survivor_10')) newUnlocked.push('survivor_10');
    if (stats.maxWave >= 20 && !achievements.includes('survivor_20')) newUnlocked.push('survivor_20');
    if (stats.totalMaterials >= 1000 && !achievements.includes('hoarder')) newUnlocked.push('hoarder');
    if (stats.totalKills >= 5000 && !achievements.includes('godlike')) newUnlocked.push('godlike');

    if (newUnlocked.length > 0) {
      const next = [...achievements, ...newUnlocked];
      setAchievements(next);
      if (user) set(ref(db, `users/${user.uid}/achievements`), next);
      
      const ach = ACHIEVEMENTS.find(a => a.id === newUnlocked[0]);
      if (ach) {
        setToast({ title: ach.title, desc: ach.description });
        setTimeout(() => setToast(null), 4000);
      }
    }
  };

  const startGame = (mode: GameMode = 'STANDARD') => {
    initAudio();
    playClickSound();
    
    setGameMode(mode);

    // Generate unique missions for this run if MISSION mode
    if (mode === 'MISSION') {
      const possibleMissions = [
        { id: 'm1', title: 'Slayer', description: 'Kill 50 enemies', target: 50, current: 0, type: 'KILLS', reward: 50 },
        { id: 'm2', title: 'Hoarder', description: 'Collect 100 materials', target: 100, current: 0, type: 'MATERIALS', reward: 100 },
        { id: 'm3', title: 'Time Survivor', description: 'Survive for 60 seconds', target: 60, current: 0, type: 'SURVIVE_TIME', reward: 75 },
        { id: 'm4', title: 'Elite Hunter', description: 'Kill 150 enemies', target: 150, current: 0, type: 'KILLS', reward: 150 },
      ];
      // Randomly pick 2
      const shuffled = [...possibleMissions].sort(() => 0.5 - Math.random());
      setMissions(shuffled.slice(0, 2));
    } else {
      // Default missions for context tracking
      setMissions([
        { id: 'm1', title: 'Slayer', description: 'Kill 50 enemies', target: 50, current: 0, type: 'KILLS', reward: 50 },
        { id: 'm2', title: 'Hoarder', description: 'Collect 100 materials', target: 100, current: 0, type: 'MATERIALS', reward: 100 },
      ]);
    }

    // Apply meta upgrades to base stats
    let upgradedStats = { ...INITIAL_STATS };
    const currentMetaUpgrades = metaStats.upgrades || {};
    
    META_UPGRADES.forEach(upgrade => {
      const level = currentMetaUpgrades[upgrade.id] || 0;
      if (level > 0) {
        const bonus = level * upgrade.valuePerLevel;
        (upgradedStats as any)[upgrade.stat] += bonus;
      }
    });

    setStats(upgradedStats);
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
    const uid = user?.uid || guestUser?.username;
    if (!uid || !displayName) return;
    const newRoomId = generateRoomCode();
    const roomRef = ref(db, `rooms/${newRoomId}`);
    
    const newRoom: RoomData = {
      id: newRoomId,
      host: uid,
      mode: 'STANDARD',
      state: 'LOBBY',
      wave: 1,
      players: {
        [uid]: {
          displayName: displayName,
          isReady: false
        }
      }
    };
    
    await set(roomRef, newRoom);
    
    // Set up disconnect hook to remove player from room
    const pRef = ref(db, `rooms/${newRoomId}/players/${uid}`);
    onDisconnect(pRef).remove();
    
    setRoomId(newRoomId);
    setGameState('ROOM_LOBBY');
  };

  const handleJoinRoom = async (code: string) => {
    const uid = user?.uid || guestUser?.username;
    if (!uid || !displayName) return;
    setRoomId(code);
    
    const pRef = ref(db, `rooms/${code}/players/${uid}`);
    await set(pRef, {
      displayName: displayName,
      isReady: false
    });
    
    onDisconnect(pRef).remove();
    setGameState('ROOM_LOBBY');
  };

  const handleLeaveRoom = async () => {
    const uid = user?.uid || guestUser?.username;
    if (!uid || !roomId) return;
    const pRef = ref(db, `rooms/${roomId}/players/${uid}`);
    await remove(pRef);
    onDisconnect(pRef).cancel();
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

  const handleGameOver = () => {
    // Award fragments based on wave
    const reward = Math.floor(wave * 5);
    setMetaStats(prev => {
      const next = { ...prev, soulFragments: prev.soulFragments + reward };
      if (user) set(ref(db, `users/${user.uid}/meta`), next);
      return next;
    });
    setGameState('GAME_OVER');
  };
  const handleCharacterSelect = (char: Character) => {
    setSelectedCharacter(char);
    setGameState('WEAPON_SELECT');
  };

  const handleWeaponSelect = async (weapon: Weapon) => {
    setWave(1);
    setMaterials(0);
    setXp(0);
    setLevel(1);
    
    // Apply meta upgrades and character mods (BUG-1 Fix)
    let startingStats = { ...INITIAL_STATS };
    const currentMetaUpgrades = metaStats.upgrades || {};
    
    META_UPGRADES.forEach(upgrade => {
      const level = currentMetaUpgrades[upgrade.id] || 0;
      if (level > 0) {
        const bonus = level * upgrade.valuePerLevel;
        (startingStats as any)[upgrade.stat] += bonus;
      }
    });

    if (selectedCharacter) {
      Object.entries(selectedCharacter.statsModifier).forEach(([key, val]) => {
        (startingStats as any)[key] += val;
      });
    }

    // BUG-4: Generator passive check
    if (weapon.baseId === 'generator') {
      startingStats.rangedDamage += 10;
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
    const nextGlobalStats = {
      totalKills: globalStats.totalKills + killsThisWave,
      maxWave: Math.max(globalStats.maxWave, wave),
      totalMaterials: globalStats.totalMaterials + (currentMaterials - materials)
    };
    saveGlobalStats(nextGlobalStats);
    
    // Update missions and check for completion
    setMissions(prev => prev.map(m => {
      if (m.type === 'KILLS' && killsThisWave > 0) {
        const next = Math.min(m.target, m.current + killsThisWave);
        if (next === m.target && m.current < m.target) setMaterials(curr => curr + m.reward);
        return { ...m, current: next };
      }
      if (m.type === 'MATERIALS') {
        const next = Math.min(m.target, currentMaterials);
        if (next === m.target && m.current < m.target) setMaterials(curr => curr + m.reward);
        return { ...m, current: next };
      }
      return m;
    }));

    if (gameMode === 'STANDARD' && wave >= 20) {
      // Award big bonus for victory
      const reward = 200;
      setMetaStats(prev => {
        const next = { ...prev, soulFragments: prev.soulFragments + reward };
        if (user) set(ref(db, `users/${user.uid}/meta`), next);
        return next;
      });
      setGameState('VICTORY');
      return;
    }

    if (crates > 0) {
      setGameState('OPEN_CRATE');
    } else if (currentXp >= XP_PER_LEVEL(level)) {
      playLevelUpSound();
      setGameState('LEVEL_UP');
    } else {
      setGameState('SHOP');
      if (roomId && user && roomData?.host === user.uid) {
        update(ref(db, `rooms/${roomId}`), { state: 'SHOP' });
      }
    }

    // Harvesting compounding growth (MISSING-1)
    if (stats.harvest > 0) {
      setStats(prev => {
        const isEndless = gameMode === 'ENDLESS' || wave > 20;
        const newHarvest = isEndless
          ? Math.max(0, Math.floor(prev.harvest * 0.80))
          : Math.ceil(prev.harvest * 1.05);
        return { ...prev, harvest: newHarvest };
      });
    }
  }, [level, globalStats, materials, wave, roomId, user, roomData, gameMode, stats.harvest]);

  const handleLevelUp = (stat: keyof Stats, value: number) => {
    setStats(prev => ({ ...prev, [stat]: prev[stat] + value }));
    
    setLevel(prevLevel => {
      const nextLevel = prevLevel + 1;
      setXp(prevXp => {
        const remainingXp = prevXp - XP_PER_LEVEL(prevLevel);
        if (remainingXp >= XP_PER_LEVEL(nextLevel)) {
          playLevelUpSound();
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
    const oldWeapon = weapons[index];
    setMaterials(prev => prev - nextWeapon.price);
    setWeapons(prev => {
      const newWeapons = [...prev];
      newWeapons[index] = nextWeapon;
      return newWeapons;
    });

    // BUG-4: If somehow we upgraded from/to a different weapon (unlikely with generator tier 4)
    if (oldWeapon.baseId !== nextWeapon.baseId) {
      if (oldWeapon.baseId === 'generator') setStats(prev => ({ ...prev, rangedDamage: prev.rangedDamage - 10 }));
      if (nextWeapon.baseId === 'generator') setStats(prev => ({ ...prev, rangedDamage: prev.rangedDamage + 10 }));
    }
  };

  const handleSellWeapon = (index: number, price: number) => {
    const weapon = weapons[index];
    setMaterials(prev => prev + price);
    setWeapons(prev => {
      const newWeapons = [...prev];
      newWeapons.splice(index, 1);
      return newWeapons;
    });
    // BUG-4: Generator Fix
    if (weapon && weapon.baseId === 'generator') {
      setStats(prev => ({ ...prev, rangedDamage: prev.rangedDamage - 10 }));
    }
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
          playLevelUpSound();
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
    if (user) {
      await signOut(auth);
    } else {
      setGuestUser(null);
      setDisplayName(null);
      localStorage.removeItem('potato_guest_session');
    }
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

          { (user || guestUser) && !forceNameSetup && (gameState === 'MENU' || gameState === 'PLAYING' || gameState === 'SHOP') && (
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
                        <p className="text-[10px] text-stone-500 font-black uppercase tracking-tighter">{user?.email || guestUser?.username || 'GUEST ACCOUNT'}</p>
                        <p className="text-base font-black text-stone-300 truncate">{displayName || 'No Name'}</p>
                      </div>
                    </div>

                    <div className="mb-4 bg-stone-950 p-4 rounded-2xl border-2 border-stone-800">
                      <label className="text-xs font-black text-stone-500 uppercase mb-2 flex justify-between">
                        <span>{t.language}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setLanguage('en'); localStorage.setItem('potato_language', 'en'); }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${language === 'en' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}
                          >
                            EN
                          </button>
                          <button 
                            onClick={() => { setLanguage('vi'); localStorage.setItem('potato_language', 'vi'); }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${language === 'vi' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}
                          >
                            VI
                          </button>
                        </div>
                      </label>
                    </div>

                    <div className="mb-4 bg-stone-950 p-4 rounded-2xl border-2 border-stone-800">
                      <label className="text-xs font-black text-stone-500 uppercase mb-2 flex justify-between">
                        <span>{t.uiScale}</span>
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
                        {t.resetToAuto}
                      </button>
                    </div>

                    <div className="mb-4 bg-stone-950 p-4 rounded-2xl border-2 border-stone-800 flex justify-between items-center">
                      <span className="text-xs font-black text-stone-500 uppercase">Sound</span>
                      <button 
                        onClick={() => {
                          const newMute = !isAudioMuted;
                          setIsAudioMuted(newMute);
                          toggleMute(newMute);
                          if (!newMute) playClickSound();
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-2 transition-all ${isAudioMuted ? 'bg-stone-800 text-stone-400 border-stone-700' : 'bg-green-500/20 text-green-400 border-green-500/50'}`}
                      >
                        {isAudioMuted ? 'Muted' : 'On'}
                      </button>
                    </div>

                    {!isAudioMuted && (
                      <div className="space-y-4 mb-4">
                        <div className="bg-stone-950 p-4 rounded-2xl border-2 border-stone-800">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-stone-500 uppercase">{t.musicVolume}</span>
                            <span className="text-[10px] font-black text-amber-500">{musicVol}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            value={musicVol}
                            onChange={(e) => setMusicVol(Number(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                        <div className="bg-stone-950 p-4 rounded-2xl border-2 border-stone-800">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-stone-500 uppercase">{t.sfxVolume}</span>
                            <span className="text-[10px] font-black text-amber-500">{sfxVol}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            value={sfxVol}
                            onChange={(e) => setSfxVol(Number(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      </div>
                    )}

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
                        {t.quitRun}
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setShowSettings(false); setShowChangeName(true); }}
                        className="w-full py-4 mb-2 bg-stone-800 text-stone-100 font-black rounded-2xl border-2 border-stone-950 hover:bg-stone-700 transition-all flex items-center justify-center gap-2 uppercase"
                      >
                        {t.changeName}
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
                        <LogOut className="w-4 h-4" /> {t.signOut}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {!user && !guestUser && (
          <AuthUI 
            language={language}
            onUsernameLogin={(data) => {
              setGuestUser(data);
              setDisplayName(data.username);
              localStorage.setItem('potato_guest_session', JSON.stringify(data));
              if (data.stats) setGlobalStats(data.stats);
              setAuthLoading(false);
            }} 
          />
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
            <p className="text-stone-400 text-2xl font-bold mb-12 uppercase tracking-widest">{t.surviveSwarm}</p>
            
            <div className="flex flex-col gap-6 max-w-md mx-auto">
              <button 
                onClick={() => startGame('STANDARD')}
                className="group relative px-8 py-5 bg-amber-500 text-stone-950 font-black text-2xl rounded-2xl border-4 border-b-8 border-amber-700 hover:bg-amber-400 hover:border-amber-600 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Play className="fill-current w-6 h-6" /> {t.standardRun}
                </span>
              </button>
              <button 
                onClick={() => { playClickSound(); setGameState('MULTIPLAYER_MENU'); }}
                className="group relative px-8 py-5 bg-green-500 text-stone-950 font-black text-2xl rounded-2xl border-4 border-b-8 border-green-700 hover:bg-green-400 hover:border-green-600 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Users className="w-6 h-6" /> {t.multiplayer}
                </span>
              </button>
              <button 
                onClick={() => { initAudio(); playClickSound(); startGame('ENDLESS'); }}
                className="group relative px-8 py-5 bg-stone-800 text-stone-100 font-black text-2xl rounded-2xl border-4 border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Infinity className="w-6 h-6" /> {t.endlessMode}
                </span>
              </button>
              <button 
                onClick={() => { playClickSound(); setGameState('SOUL_SHOP'); }}
                className="group relative px-8 py-5 bg-stone-800 text-amber-400 font-black text-2xl rounded-2xl border-4 border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6" /> {t.soulShop}
                </span>
              </button>
              <button 
                onClick={() => { playClickSound(); setGameState('MODE_SELECT'); }}
                className="group relative px-8 py-5 bg-stone-800 text-stone-100 font-black text-2xl rounded-2xl border-4 border-b-8 border-stone-950 hover:bg-stone-700 active:border-b-4 active:translate-y-1 transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Target className="w-6 h-6" /> {t.missions}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'MULTIPLAYER_MENU' && (
          <motion.div key="multi_menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
            <MultiplayerMenu 
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onBack={() => setGameState('MENU')}
            />
          </motion.div>
        )}

        {gameState === 'ROOM_LOBBY' && roomData && user && (
          <motion.div key="room_lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
            <RoomLobby 
              room={roomData}
              currentUserUid={user.uid}
              onStart={handleStartMultiplayer}
              onLeave={handleLeaveRoom}
              onKick={handleKickPlayer}
              onChangeMode={() => {}} // TODO
            />
          </motion.div>
        )}

        {gameState === 'MODE_SELECT' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              key="missions"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-stone-900 border-4 md:border-8 border-stone-800 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden"
              style={{ width: '70%', height: '70%' }}
            >
              <h2 className="text-3xl md:text-5xl font-black mb-6 md:mb-12 text-amber-500 flex items-center gap-4 md:gap-8 drop-shadow-[0_6px_0_rgb(180,83,9)] uppercase italic px-4">
                <Target className="w-8 h-8 md:w-16 md:h-16" /> {t.activeMissions}
              </h2>
              
              <div className="flex-1 space-y-4 md:space-y-8 mb-6 md:mb-12 overflow-y-auto pr-4 custom-scrollbar">
                {missions.map(m => {
                  const title = m.id === 'm1' ? t.missionSlayerTitle : m.id === 'm2' ? t.missionHoarderTitle : m.title;
                  const desc = m.id === 'm1' ? t.missionSlayerDesc : m.id === 'm2' ? t.missionHoarderDesc : m.description;
                  return (
                    <div key={m.id} className="bg-stone-950 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.2rem] border-4 md:border-6 border-stone-800 shadow-inner group hover:border-amber-500/30 transition-all">
                      <div className="flex justify-between items-start mb-3 md:mb-6 flex-wrap gap-3">
                        <h3 className="text-xl md:text-4xl font-black text-stone-100 uppercase tracking-tight">{title}</h3>
                        <span className="text-green-400 font-black text-lg md:text-3xl bg-stone-900 px-4 py-2 md:px-7 md:py-4 rounded-xl md:rounded-2xl border-2 md:border-4 border-stone-800 shadow-xl">+{m.reward} MAT</span>
                      </div>
                      <p className="text-stone-400 text-sm md:text-xl font-bold mb-4 md:mb-8 uppercase tracking-wide leading-relaxed">{desc}</p>
                      <div className="relative">
                        <div className="w-full bg-stone-900 h-6 md:h-10 rounded-full overflow-hidden border-2 md:border-4 border-stone-800 shadow-inner">
                          <div 
                            className="bg-amber-500 h-full transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                            style={{ width: `${(m.current / m.target) * 100}%` }}
                          />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-xs md:text-2xl drop-shadow-md">
                          {Math.floor(m.current)} / {m.target}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 shrink-0">
                <button 
                  onClick={() => { playClickSound(); startGame('MISSION'); }}
                  className="w-full py-4 md:py-8 bg-amber-600 hover:bg-amber-500 text-white font-black text-xl md:text-4xl rounded-2xl md:rounded-[2.5rem] border-4 md:border-6 border-b-8 md:border-b-16 border-amber-800 active:border-b-2 active:translate-y-2 md:active:translate-y-4 transition-all shadow-lg"
                >
                  🚀 {t.startMissionRun || 'START MISSION RUN'}
                </button>

                <button 
                  onClick={() => setGameState('MENU')}
                  className="w-full py-4 md:py-8 bg-stone-800 hover:bg-stone-700 text-stone-100 font-black text-xl md:text-4xl rounded-2xl md:rounded-[2.5rem] border-4 md:border-6 border-b-8 md:border-b-16 border-stone-950 active:border-b-2 active:translate-y-2 md:active:translate-y-4 transition-all shadow-xl"
                >
                  {t.backToMenu}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {gameState === 'SOUL_SHOP' && (
          <SoulShop 
            metaStats={metaStats} 
            onUpgrade={handleMetaUpgrade}
            onBack={() => setGameState('MENU')}
            t={t}
          />
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
              luck={stats.luck}
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
              onGameOver={handleGameOver}
              playerStats={effectiveStats}
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
              onMissionProgress={(type, amount) => {
                setMissions(prev => prev.map(m => {
                  if (m.type === type) {
                    const next = Math.min(m.target, m.current + amount);
                    if (next >= m.target && m.current < m.target) {
                      setMaterials(curr => curr + m.reward);
                    }
                    return { ...m, current: next };
                  }
                  return m;
                }));
              }}
              t={t}
              activeMissions={missions.filter(m => m.current < m.target)}
            />
          </motion.div>
        )}

        {gameState === 'SHOP' && (
          <Shop 
            key="shop"
            materials={materials}
            playerStats={stats}
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
            luck={stats.luck}
          />
        )}

        {gameState === 'GAME_OVER' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
              key="gameover"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-stone-900 border-4 md:border-8 border-red-900 rounded-[3rem] md:rounded-[5rem] p-8 md:p-20 flex flex-col shadow-[0_0_200px_rgba(239,68,68,0.2)]"
              style={{ width: '70%', height: '70%' }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Skull className="w-14 h-14 md:w-24 md:h-24 text-red-500 mx-auto mb-4 md:mb-8 drop-shadow-[0_4px_0_rgb(153,27,27)]" />
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-black text-red-500 mb-3 md:mb-6 drop-shadow-[0_4px_0_rgb(153,27,27)] uppercase tracking-tighter italic leading-none">
                {t.gameOver}
              </h2>
              
              <p className="text-stone-400 text-base md:text-2xl font-black mb-6 md:mb-10 uppercase">
                You survived <span className="text-amber-500 text-xl md:text-4xl">{wave}</span> {t.wave} in <span className="text-amber-500 text-xl md:text-4xl">{gameMode}</span> mode.
              </p>
              
              <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-10 text-left max-w-2xl mx-auto w-full">
                <div className="bg-stone-950 p-3 md:p-6 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-stone-800 shadow-inner">
                  <p className="text-stone-500 text-[8px] md:text-xs font-black uppercase mb-1 md:mb-2 tracking-widest leading-none">Items Collected</p>
                  <p className="text-xl md:text-3xl font-black text-amber-500 leading-none">{items.length}</p>
                </div>
                <div className="bg-stone-950 p-3 md:p-6 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-stone-800 shadow-inner">
                  <p className="text-stone-500 text-[8px] md:text-xs font-black uppercase mb-1 md:mb-2 tracking-widest leading-none">Total Kills</p>
                  <p className="text-xl md:text-3xl font-black text-white leading-none">{globalStats.totalKills}</p>
                </div>
              </div>

              <button 
                onClick={() => setGameState('MENU')}
                className="px-8 py-4 md:px-12 md:py-8 bg-stone-200 text-stone-950 font-black text-base md:text-2xl rounded-2xl md:rounded-[2rem] border-4 md:border-6 border-b-8 md:border-b-12 border-stone-400 hover:bg-white active:border-b-2 active:translate-y-2 md:active:translate-y-4 transition-all flex items-center gap-3 md:gap-6 mx-auto shadow-lg"
              >
                <RotateCcw className="w-6 h-6 md:w-10 md:h-10" /> {t.backToMenu}
              </button>
            </motion.div>
          </div>
        )}

        {gameState === 'VICTORY' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
              key="victory"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-stone-900 border-4 md:border-8 border-amber-600 rounded-[3rem] md:rounded-[5rem] p-8 md:p-20 flex flex-col shadow-[0_0_200px_rgba(245,158,11,0.2)]"
              style={{ width: '70%', height: '70%' }}
            >
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-14 h-14 md:w-24 md:h-24 text-amber-500 mx-auto mb-4 md:mb-8 drop-shadow-[0_4px_0_rgb(180,83,9)]" />
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-black text-amber-500 mb-3 md:mb-6 drop-shadow-[0_4px_0_rgb(180,83,9)] uppercase tracking-tighter italic leading-none">
                {t.victory}
              </h2>
              
              <p className="text-stone-200 text-base md:text-2xl font-black mb-8 md:mb-12 uppercase">
                You have survived {t.wave} 20!
              </p>

              <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8 md:mb-12 max-w-3xl mx-auto w-full">
                <div className="bg-stone-950 p-3 md:p-6 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-stone-800 shadow-inner">
                  <p className="text-stone-500 text-[8px] md:text-xs font-black uppercase mb-1 md:mb-2 tracking-widest">Kills</p>
                  <p className="text-xl md:text-4xl font-black text-white">{runStats.kills}</p>
                </div>
                <div className="bg-stone-950 p-3 md:p-6 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-stone-800 shadow-inner">
                  <p className="text-stone-500 text-[8px] md:text-xs font-black uppercase mb-1 md:mb-2 tracking-widest">Wave</p>
                  <p className="text-xl md:text-4xl font-black text-white">{runStats.wave}</p>
                </div>
                <div className="bg-stone-950 p-3 md:p-6 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-stone-800 shadow-inner">
                  <p className="text-stone-500 text-[8px] md:text-xs font-black uppercase mb-1 md:mb-2 tracking-widest">{t.materials}</p>
                  <p className="text-xl md:text-4xl font-black text-amber-500">{runStats.materials}</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setGameState('MENU');
                }}
                className="px-12 py-6 md:px-20 md:py-10 bg-amber-600 text-white font-black text-xl md:text-4xl rounded-[2rem] md:rounded-[3rem] border-4 md:border-6 border-b-12 md:border-b-24 border-amber-800 hover:bg-amber-500 active:border-b-2 active:translate-y-2 md:active:translate-y-4 transition-all flex items-center gap-4 md:gap-8 mx-auto shadow-lg"
              >
                <RotateCcw className="w-8 h-8 md:w-14 md:h-14" /> {t.backToMenu}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-24 right-8 z-[100] bg-stone-900 border-4 border-amber-500 rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[300px]"
          >
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Trophy className="text-stone-950 w-8 h-8" />
            </div>
            <div>
              <p className="text-amber-500 font-black text-xs uppercase tracking-widest leading-none mb-1">{t.achievementUnlocked}</p>
              <h4 className="text-white font-black text-xl leading-none mb-1">{toast.title}</h4>
              <p className="text-stone-400 text-[10px] font-bold uppercase">{toast.desc}</p>
            </div>
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
  );
}
