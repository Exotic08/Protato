import React, { useEffect, useRef, useState } from 'react';
import { Player, Enemy, Projectile, Material, FloatingText, GameState, Stats, Weapon, EnemyType, StatusEffect } from '../game/types';
import { INITIAL_STATS, WAVE_DURATION, XP_PER_LEVEL, MAP_WIDTH, MAP_HEIGHT, GRID_SIZE_X, GRID_SIZE_Y } from '../game/constants';
import { Joystick } from './Joystick';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Droplets, Snowflake, Wind, Heart, Shield, Zap, Target } from 'lucide-react';
import { playShootSound, playMagicSound, playMeleeSound, playHitSound, playPlayerHitSound, playCoinSound, playExplosionSound, playDashSound, playSummonSound, playDodgeSound, playEnemyDeathSound } from '../game/audio';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

const MULTIPLAYER_SERVER = 'https://protato-production.up.railway.app';

interface GameCanvasProps {
  gameState: GameState;
  onWaveEnd: (materials: number, xp: number, kills: number, crates: number) => void;
  onGameOver: () => void;
  onMissionProgress?: (type: 'KILLS' | 'MATERIALS', amount: number) => void;
  playerStats: Stats;
  playerWeapons: Weapon[];
  initialMaterials: number;
  initialXp: number;
  initialLevel: number;
  wave: number;
  roomId?: string | null;
  uiScale: number;
  isHost: boolean;
  displayName: string;
  isMultiplayer: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onWaveEnd,
  onGameOver,
  onMissionProgress,
  playerStats,
  playerWeapons,
  initialMaterials,
  initialXp,
  initialLevel,
  wave,
  roomId,
  uiScale,
  isHost,
  displayName,
  isMultiplayer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentWaveDuration = Math.min(60, 20 + (wave - 1) * 4);
  const [timer, setTimer] = useState(currentWaveDuration);
  const [playerHp, setPlayerHp] = useState(playerStats.maxHp);
  const [playerStatusEffects, setPlayerStatusEffects] = useState<StatusEffect[]>([]);
  const [materialsCount, setMaterialsCount] = useState(initialMaterials);
  const [xpCount, setXpCount] = useState(initialXp);
  const [isDead, setIsDead] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [reviveProgress, setReviveProgress] = useState<{ [id: string]: number }>({});
  
  // Game state refs to avoid closure issues in the loop
  const playerRef = useRef<Player & { isDead?: boolean }>({
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
    radius: 15,
    hp: playerStats.maxHp,
    maxHp: playerStats.maxHp,
    stats: playerStats,
    xp: initialXp,
    level: initialLevel,
    materials: initialMaterials,
    weapons: playerWeapons,
    items: [],
    statusEffects: [],
    isDead: false,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const materialsRef = useRef<Material[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cratesRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const waveTimerRef = useRef<number>(currentWaveDuration);
  const weaponCooldownsRef = useRef<{ [key: string]: number }>({});
  const shakeRef = useRef<number>(0);
  const killsRef = useRef<number>(0);
  const joystickRef = useRef({ x: 0, y: 0 });
  const socketRef = useRef<Socket | null>(null);
  const otherPlayersRef = useRef<{ [id: string]: { x: number, y: number, targetX: number, targetY: number, id: string, name?: string, hp?: number, maxHp?: number, isDead?: boolean } }>({});
  const enemiesTargetRef = useRef<{ [id: string]: Enemy }>({});
  const lastEmitTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const lastIsMovingRef = useRef<boolean>(false);
  const lastHpRef = useRef<number>(playerStats.maxHp);
  const reviveProgressRef = useRef<{ [id: string]: number }>({});
  const [isTouch, setIsTouch] = useState(false);
  const [ping, setPing] = useState<number>(0);
  const weaponStacksRef = useRef<{ [key: string]: number }>({});
  const shotCountRef = useRef<{ [key: string]: number }>({});
  const rampCountRef = useRef<{ [key: string]: number }>({});
  const idleTimerRef = useRef<number>(0);
  const invincibilityTimerRef = useRef<number>(0);
  const itemCooldownsRef = useRef<{ [key: string]: number }>({});

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 15 + Math.random() * 15,
        color,
        size: 1.5 + Math.random() * 3
      });
    }
  };

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Initialize Socket.io
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname.includes('run.app') 
      ? window.location.origin 
      : MULTIPLAYER_SERVER;
    
    socketRef.current = io(socketUrl);

    // Ping logic
    const pingInterval = setInterval(() => {
      const start = Date.now();
      socketRef.current?.emit('ping', () => {
        setPing(Date.now() - start);
      });
    }, 2000);

    if (roomId) {
      socketRef.current.emit('joinRoom', { roomId, name: displayName });
    }

    socketRef.current.on('currentPlayers', (players) => {
      const playersWithTargets: any = {};
      Object.keys(players).forEach(id => {
        if (id !== socketRef.current?.id) {
          playersWithTargets[id] = { ...players[id], targetX: players[id].x, targetY: players[id].y };
        }
      });
      otherPlayersRef.current = playersWithTargets;
    });

    socketRef.current.on('newPlayer', (player) => {
      otherPlayersRef.current[player.id] = { ...player, targetX: player.x, targetY: player.y };
    });

    socketRef.current.on('playerMoved', (player) => {
      if (!otherPlayersRef.current[player.id]) {
        otherPlayersRef.current[player.id] = { ...player, targetX: player.x, targetY: player.y };
      } else {
        otherPlayersRef.current[player.id].targetX = player.x;
        otherPlayersRef.current[player.id].targetY = player.y;
        otherPlayersRef.current[player.id].name = player.name;
        otherPlayersRef.current[player.id].hp = player.hp;
        otherPlayersRef.current[player.id].maxHp = player.maxHp;
        otherPlayersRef.current[player.id].isDead = player.isDead;
      }
    });

    socketRef.current.on('playerDied', (id) => {
      if (id === socketRef.current?.id) {
        playerRef.current.isDead = true;
        playerRef.current.hp = 0;
        setIsDead(true);
      } else if (otherPlayersRef.current[id]) {
        otherPlayersRef.current[id].isDead = true;
        otherPlayersRef.current[id].hp = 0;
      }
    });

    socketRef.current.on('playerRevived', (id) => {
      if (id === socketRef.current?.id) {
        playerRef.current.isDead = false;
        playerRef.current.hp = playerRef.current.maxHp / 2;
        setIsDead(false);
        setIsSpectating(false);
      } else if (otherPlayersRef.current[id]) {
        otherPlayersRef.current[id].isDead = false;
        otherPlayersRef.current[id].hp = (otherPlayersRef.current[id].maxHp || 100) / 2;
      }
    });

    socketRef.current.on('playerDisconnected', (id) => {
      delete otherPlayersRef.current[id];
    });

    socketRef.current.on('enemiesUpdate', (data: any) => {
      const enemies = Array.isArray(data) ? data : data?.enemies;
      if (!enemies || !Array.isArray(enemies)) return;

      if (!isHost) {
        const newTargetMap: { [id: string]: Enemy } = {};
        enemies.forEach(e => {
          if (!e) return;
          newTargetMap[e.id] = e;
          
          const existing = enemiesRef.current.find(curr => curr && curr.id === e.id);
          if (!existing) {
            enemiesRef.current.push({ ...e });
          } else {
            // Update non-positional stats directly
            existing.hp = e.hp;
            existing.type = e.type;
            existing.color = e.color;
            existing.radius = e.radius;
          }
        });
        
        enemiesRef.current = enemiesRef.current.filter(curr => curr && newTargetMap[curr.id]);
        enemiesTargetRef.current = newTargetMap;
      }
    });

    socketRef.current.on('materialsUpdate', (materials) => {
      materialsRef.current = materials;
    });

    socketRef.current.on('enemyDamage', (data: { id: string, damage: number }) => {
      if (isHost && enemiesRef.current) {
        const enemy = enemiesRef.current.find(e => e && e.id === data.id);
        if (enemy) {
          enemy.hp -= data.damage;
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(pingInterval);
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // Reset game state for new wave
    playerRef.current.hp = playerStats.maxHp;
    playerRef.current.stats = playerStats;
    playerRef.current.weapons = playerWeapons;
    playerRef.current.materials = initialMaterials;
    playerRef.current.xp = initialXp;
    playerRef.current.level = initialLevel;
    
    playerRef.current.isDead = false;
    setIsDead(false);
    setIsSpectating(false);
    setReviveProgress({});
    
    enemiesRef.current = [];
    projectilesRef.current = [];
    materialsRef.current = [];
    floatingTextsRef.current = [];
    waveTimerRef.current = currentWaveDuration;
    shakeRef.current = 0;
    killsRef.current = 0;
    setTimer(currentWaveDuration);
    setMaterialsCount(initialMaterials);
    setXpCount(initialXp);

    let animationFrameId: number;
    lastTimeRef.current = performance.now();

    const update = (deltaTime: number) => {
      if (gameState !== 'PLAYING') return;
      const now = Date.now();

      const weaponStyleBaseIds = ['flamethrower', 'ice_staff', 'thunder_staff', 'magic_crossbow', 'poison_flask', 'time_bomb'];
      const player = playerRef.current;
      const stats = player.stats;

      const isBlockedByShield = (enemy: Enemy, sourceX: number, sourceY: number) => {
        if (enemy.type !== 'SHIELDER') return false;
        let tx = player.x;
        let ty = player.y;
        let mD = Math.sqrt((tx - enemy.x)**2 + (ty - enemy.y)**2);
        Object.values(otherPlayersRef.current).forEach((p: any) => {
          const d = Math.sqrt((p.x - enemy.x)**2 + (p.y - enemy.y)**2);
          if (d < mD) { mD = d; tx = p.x; ty = p.y; }
        });
        const shieldAngle = Math.atan2(ty - enemy.y, tx - enemy.x);
        const hitAngle = Math.atan2(sourceY - enemy.y, sourceX - enemy.x);
        let dAng = hitAngle - shieldAngle;
        while (dAng > Math.PI) dAng -= Math.PI * 2;
        while (dAng < -Math.PI) dAng += Math.PI * 2;
        return Math.abs(dAng) < 0.8;
      };

      // Apply HP Regen
      if (!player.isDead && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + stats.hpRegen * deltaTime);
      }

      // Process Player Status Effects
      if (player.statusEffects && player.statusEffects.length > 0) {
        player.statusEffects = player.statusEffects.filter(effect => {
          effect.timer += deltaTime;
          
          if (effect.type === 'POISON' || effect.type === 'BURN') {
            const ticksPerSec = effect.type === 'POISON' ? 2 : 5;
            const totalTicks = effect.duration * ticksPerSec;
            const damagePerTick = effect.value / totalTicks;
            
            if (Math.floor(effect.timer * ticksPerSec) > Math.floor((effect.timer - deltaTime) * ticksPerSec)) {
              player.hp -= damagePerTick;
            }
          }
          
          return effect.timer < effect.duration;
        });
      }

      // Sync player state to React (throttled)
      if (now - lastSyncTimeRef.current > 100) {
        setPlayerHp(player.hp);
        setPlayerStatusEffects([...(player.statusEffects || [])]);
        lastSyncTimeRef.current = now;
      }

      // Check for item cooldowns
      Object.keys(itemCooldownsRef.current).forEach(key => {
        if (itemCooldownsRef.current[key] > 0) {
          itemCooldownsRef.current[key] -= deltaTime;
        }
      });

      // Update invincibility
      if (invincibilityTimerRef.current > 0) {
        invincibilityTimerRef.current -= deltaTime;
      }

      // Update shake
      if (shakeRef.current > 0) {
        shakeRef.current -= deltaTime * 20;
        if (shakeRef.current < 0) shakeRef.current = 0;
      }

      // Interpolate other players
      (Object.values(otherPlayersRef.current) as any[]).forEach(p => {
        p.x += (p.targetX - p.x) * 0.15;
        p.y += (p.targetY - p.y) * 0.15;
      });

      // Interpolate enemies if not host
      if (!isHost) {
        enemiesRef.current.forEach(enemy => {
          const target = enemiesTargetRef.current[enemy.id];
          if (target) {
            enemy.x += (target.x - enemy.x) * 0.15;
            enemy.y += (target.y - enemy.y) * 0.15;
          }
        });
      }

      // 1. Player Movement
      let dx = 0;
      let dy = 0;

      if (player.isDead) {
        // Dead players can't move
      } else {
        if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= 1;
        if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += 1;
        if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= 1;
        if (keysRef.current['d'] || keysRef.current['arrowright']) dx += 1;

        if (joystickRef.current.x !== 0 || joystickRef.current.y !== 0) {
          dx = joystickRef.current.x;
          dy = joystickRef.current.y;
        } else if (dx !== 0 || dy !== 0) {
          const length = Math.sqrt(dx * dx + dy * dy);
          dx /= length;
          dy /= length;
        }

        if (dx !== 0 || dy !== 0) {
          // Calculate effective speed
          let playerSpeedMultiplier = 1;
          if (player.statusEffects) {
            player.statusEffects.forEach(ef => {
              if (ef.type === 'SLOW') playerSpeedMultiplier *= (1 - ef.value / 100);
            });
          }
          const speed = (stats.speed / 100) * 3 * playerSpeedMultiplier; // base speed multiplier
          player.x += dx * speed;
          player.y += dy * speed;
          idleTimerRef.current = 0;
        } else {
          idleTimerRef.current += deltaTime;
        }

        // Keep player in bounds
        player.x = Math.max(player.radius, Math.min(MAP_WIDTH - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(MAP_HEIGHT - player.radius, player.y));

        // Check for reviving others
        if (isMultiplayer) {
          let progressChanged = false;
          (Object.values(otherPlayersRef.current) as any[]).forEach(p => {
            if (p.isDead) {
              const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
              if (dist < 60) {
                reviveProgressRef.current[p.id] = (reviveProgressRef.current[p.id] || 0) + deltaTime;
                progressChanged = true;
                
                if (reviveProgressRef.current[p.id] >= 5) {
                  console.log('Emitting revive for', p.id);
                  socketRef.current?.emit('revivePlayer', { targetId: p.id, roomId });
                  delete reviveProgressRef.current[p.id];
                }
              } else if (reviveProgressRef.current[p.id]) {
                delete reviveProgressRef.current[p.id];
                progressChanged = true;
              }
            }
          });
          
          if (progressChanged) {
            setReviveProgress({ ...reviveProgressRef.current });
          }
        }
      }

      // Emit movement to server (Throttled ~30fps)
      const isMoving = !player.isDead && (dx !== 0 || dy !== 0);
      const hpChanged = Math.abs(player.hp - lastHpRef.current) > 0.5;
      
      if (socketRef.current && (isMoving || lastIsMovingRef.current || hpChanged || player.isDead !== (lastHpRef.current <= 0)) && now - lastEmitTimeRef.current > 33) {
        socketRef.current.emit('playerMovement', { 
          x: Math.round(player.x), 
          y: Math.round(player.y), 
          hp: Math.round(player.hp),
          maxHp: Math.round(player.maxHp),
          isDead: player.isDead,
          roomId, 
          name: displayName 
        });
        lastEmitTimeRef.current = now;
        lastIsMovingRef.current = isMoving;
        lastHpRef.current = player.hp;
      }

      // 2. Wave Timer
      waveTimerRef.current -= deltaTime;
      if (waveTimerRef.current <= 0) {
        onWaveEnd(player.materials, player.xp, killsRef.current, cratesRef.current);
        return;
      }
      if (Math.ceil(waveTimerRef.current) !== timer) {
        setTimer(Math.ceil(waveTimerRef.current));
      }

      // 3. Enemy Spawning (Only host spawns)
      if (isHost) {
        spawnTimerRef.current += deltaTime;
        
        // Boss Spawning
        const isBossWave = (wave === 10 || wave === 20 || (wave > 20 && wave % 10 === 0));
        if (isBossWave && waveTimerRef.current > 50 && !enemiesRef.current.find(e => e.type === 'BOSS_1' || e.type === 'BOSS_2')) {
          const bType = wave % 20 === 0 ? 'BOSS_2' : 'BOSS_1';
          const bossScale = 1 + (wave - 1) * 0.2;
          const boss: Enemy = {
            id: 'boss-' + wave,
            x: MAP_WIDTH / 2,
            y: MAP_HEIGHT / 2 - 200,
            hp: 2000 * bossScale,
            maxHp: 2000 * bossScale,
            speed: 0.8,
            damage: 20 * bossScale,
            type: bType,
            color: bType === 'BOSS_1' ? '#4c1d95' : '#701a75',
            radius: 40,
            statusEffects: [],
            armor: 20 * bossScale,
          };
          enemiesRef.current.push(boss);
          if (isMultiplayer) socketRef.current?.emit('spawnEnemy', { ...boss, roomId });
        }

        // Scale spawn rate: starts at 1.5s, decreases as wave increases
        const baseSpawnRate = Math.max(0.2, 1.5 - (wave * 0.1));
        const spawnRate = waveTimerRef.current < 5 ? baseSpawnRate * 0.5 : baseSpawnRate;
        
        if (spawnTimerRef.current > spawnRate) {
          spawnTimerRef.current = 0;
          const side = Math.floor(Math.random() * 4);
          let ex = 0, ey = 0;
          if (side === 0) { ex = Math.random() * MAP_WIDTH; ey = -20; }
          else if (side === 1) { ex = MAP_WIDTH + 20; ey = Math.random() * MAP_HEIGHT; }
          else if (side === 2) { ex = Math.random() * MAP_WIDTH; ey = MAP_HEIGHT + 20; }
          else { ex = -20; ey = Math.random() * MAP_HEIGHT; }

          // Determine enemy type based on wave
          let type: EnemyType = 'BASIC';
          const rand = Math.random();
          
          if (wave >= 3 && rand < 0.2) type = 'FAST';
          if (wave >= 5 && rand < 0.15) type = 'TANK';
          if (wave >= 6 && rand < 0.12) type = 'DASHER';
          if (wave >= 7 && rand < 0.2) type = 'RANGED';
          if (wave >= 9 && rand < 0.25) type = 'EXPLOSIVE';
          if (wave >= 10 && rand < 0.08) type = 'SUMMONER';
          if (wave >= 4 && rand < 0.1) type = 'SWARMER';
          if (wave >= 8 && rand < 0.1) type = 'SHIELDER';
          if (wave >= 12 && rand < 0.08) type = 'DIVIDER';
          if (wave >= 15 && rand < 0.05) type = 'TELEPORTER';
          if (rand < 0.02) type = 'LOOT_GOBLIN'; // 2% chance to spawn a loot goblin

          // Scale stats per wave
          const difficultyScale = wave <= 20 
            ? 1 + (wave - 1) * 0.15 
            : 1 + (wave - 1) * 0.15 + Math.pow(wave - 20, 1.2) * 0.1;
            
          let hp = 15 * difficultyScale;
          let speed = 1.2;
          let color = '#ef4444';
          let radius = 12;
          let damage = 1 * difficultyScale;
          let state = 0; // For Dasher (0=walk, 1=prep, 2=dash)

          switch(type) {
            case 'FAST': speed = 3.0; hp *= 0.5; color = '#f97316'; radius = 10; break;
            case 'TANK': speed = 0.7; hp *= 3.0; color = '#7f1d1d'; radius = 18; break;
            case 'DASHER': speed = 1.0; hp *= 1.2; color = '#facc15'; radius = 13; damage *= 1.5; state = 0; break;
            case 'SUMMONER': speed = 0.5; hp *= 1.5; color = '#a21caf'; radius = 16; break;
            case 'RANGED': speed = 1.0; hp *= 0.8; color = '#8b5cf6'; radius = 12; break;
            case 'EXPLOSIVE': speed = 2.2; hp *= 0.6; color = '#fbbf24'; radius = 14; break;
            case 'LOOT_GOBLIN': speed = 2.5; hp *= 2.0; color = '#10b981'; radius = 15; damage = 0; break;
            case 'SWARMER': speed = 3.5; hp *= 0.3; color = '#ec4899'; radius = 8; break;
            case 'SHIELDER': speed = 0.8; hp *= 2.0; color = '#64748b'; radius = 16; break;
            case 'DIVIDER': speed = 1.0; hp *= 2.5; color = '#8b5cf6'; radius = 20; break;
            case 'TELEPORTER': speed = 1.5; hp *= 1.2; color = '#06b6d4'; radius = 14; break;
          }

          enemiesRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            x: ex,
            y: ey,
            radius,
            hp,
            maxHp: hp,
            speed,
            damage,
            type,
            color,
            cooldown: 0,
            state
          });
        }

        // Spawn Bosses at specific waves
        if (wave % 5 === 0 && Math.abs(waveTimerRef.current - 10) < 0.05) {
          const isMajorBoss = wave % 10 === 0;
          const bossType = isMajorBoss ? 'BOSS_2' : 'BOSS_1';
          if (!enemiesRef.current.some(e => e.type === bossType)) {
            const bossHp = (isMajorBoss ? 1000 : 400) * (1 + (wave / 10));
            enemiesRef.current.push({
              id: bossType + '_' + wave,
              x: MAP_WIDTH / 2, y: -50, 
              radius: isMajorBoss ? 50 : 40, 
              hp: bossHp, maxHp: bossHp, 
              speed: 0.4, damage: 5 * (1 + wave/10), 
              type: bossType, 
              color: isMajorBoss ? '#9d174d' : '#4c1d95', 
              cooldown: 0
            });
          }
        }
      }

      // 4. Update Enemies
      enemiesRef.current.forEach(enemy => {
        // Find nearest player (including other players)
        let targetX = player.x;
        let targetY = player.y;
        let minDist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);

        (Object.values(otherPlayersRef.current) as { x: number, y: number, id: string }[]).forEach(p => {
          if (!p) return;
          const d = Math.sqrt((p.x - enemy.x) ** 2 + (p.y - enemy.y) ** 2);
          if (d < minDist) {
            minDist = d;
            targetX = p.x;
            targetY = p.y;
          }
        });

        const edx = targetX - enemy.x;
        const edy = targetY - enemy.y;
        const dist = Math.sqrt(edx * edx + edy * edy);

        // Update Status Effects
        if (enemy.statusEffects && enemy.statusEffects.length > 0) {
          enemy.statusEffects = enemy.statusEffects.filter(effect => {
            effect.timer += deltaTime;
            
            if (effect.type === 'POISON' || effect.type === 'BURN') {
              // Apply DOT damage
              const ticksPerSec = effect.type === 'POISON' ? 2 : 5;
              const totalTicks = effect.duration * ticksPerSec;
              const damagePerTick = effect.value / totalTicks;
              
              if (Math.floor(effect.timer * ticksPerSec) > Math.floor((effect.timer - deltaTime) * ticksPerSec)) {
                enemy.hp -= damagePerTick;
                if (effect.type === 'BURN') {
                  spawnParticles(enemy.x, enemy.y, '#ef4444', 1);
                }
              }
            }
            
            return effect.timer < effect.duration;
          });
        }

        let speedMultiplier = 1;
        if (enemy.statusEffects && enemy.statusEffects.length > 0) {
          const hasFreeze = enemy.statusEffects.some(e => e.type === 'FREEZE');
          if (hasFreeze) {
            speedMultiplier = 0;
          } else {
            const slows = enemy.statusEffects.filter(e => e.type === 'SLOW');
            if (slows.length > 0) {
              const maxSlow = Math.max(...slows.map(s => s.value));
              speedMultiplier = Math.max(0.1, 1 - (maxSlow / 100));
            }
          }
        }
        
        const currentSpeed = enemy.speed * speedMultiplier;

        if (isHost && dist > 0.1) {
          if (enemy.type === 'RANGED') {
            if (dist > 200) {
              enemy.x += (edx / dist) * currentSpeed;
              enemy.y += (edy / dist) * currentSpeed;
            } else if (dist < 150) {
              enemy.x -= (edx / dist) * currentSpeed;
              enemy.y -= (edy / dist) * currentSpeed;
            }
            
            // Shoot
            enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
            if (enemy.cooldown <= 0 && speedMultiplier > 0) {
              enemy.cooldown = 120;
              const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
              projectilesRef.current.push({
                x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
                damage: 2, radius: 5, color: '#a855f7', life: 200, isEnemy: true
              });
            }
          } else if (enemy.type === 'BOSS_1') {
            enemy.x += (edx / dist) * currentSpeed;
            enemy.y += (edy / dist) * currentSpeed;
            
            enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
            if (enemy.cooldown <= 0 && speedMultiplier > 0) {
              enemy.cooldown = 180;
              // Spawn minions
              for (let i = 0; i < 4; i++) {
                enemiesRef.current.push({
                  id: 'minion_' + Math.random().toString(36).substr(2, 5),
                  x: enemy.x + (Math.random() - 0.5) * 100,
                  y: enemy.y + (Math.random() - 0.5) * 100,
                  radius: 10, hp: 10, maxHp: 10, speed: 2, damage: 1, type: 'BASIC', color: '#ef4444'
                });
              }
            }
          } else if (enemy.type === 'BOSS_2') {
            enemy.x += (edx / dist) * currentSpeed;
            enemy.y += (edy / dist) * currentSpeed;
            
            enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
            if (enemy.cooldown <= 0 && speedMultiplier > 0) {
              enemy.cooldown = 100;
              // Shoot pattern
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                projectilesRef.current.push({
                  x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
                  damage: 3, radius: 6, color: '#ec4899', life: 300, isEnemy: true
                });
              }
            }
          } else if (enemy.type === 'TELEPORTER') {
            enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
            if (enemy.cooldown <= 0 && speedMultiplier > 0) {
              enemy.cooldown = 240; // 4 seconds
              // Teleport near target
              const angle = Math.random() * Math.PI * 2;
              const distToTpt = 100 + Math.random() * 100;
              enemy.x = targetX + Math.cos(angle) * distToTpt;
              enemy.y = targetY + Math.sin(angle) * distToTpt;
              floatingTextsRef.current.push({
                x: enemy.x, y: enemy.y, text: 'ZAP!', color: '#06b6d4', life: 30
              });
            } else {
              enemy.x += (edx / dist) * currentSpeed;
              enemy.y += (edy / dist) * currentSpeed;
            }
          } else if (enemy.type === 'DASHER') {
            // Dasher Logic: 0 = walk, 1 = prepare dash, 2 = dash
            if (enemy.state === 0) {
              enemy.x += (edx / dist) * currentSpeed;
              enemy.y += (edy / dist) * currentSpeed;
              if (dist < 200) {
                enemy.state = 1;
                enemy.cooldown = 40; // Prepare for 40 frames
              }
            } else if (enemy.state === 1) {
              enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
              if (enemy.cooldown <= 0 && speedMultiplier > 0) {
                enemy.state = 2;
                enemy.cooldown = 30; // Dash duration 30 frames
                playDashSound();
                floatingTextsRef.current.push({ x: enemy.x, y: enemy.y, text: 'DASH!', color: '#facc15', life: 20 });
              }
            } else if (enemy.state === 2) {
              enemy.x += (edx / dist) * (currentSpeed * 4.5); // Fast dash current direction
              enemy.y += (edy / dist) * (currentSpeed * 4.5);
              enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
              if (enemy.cooldown <= 0) {
                enemy.state = 0; // Back to walk
              }
            }
          } else if (enemy.type === 'SUMMONER') {
             // Try to stay away
            if (dist > 300) {
              enemy.x += (edx / dist) * currentSpeed;
              enemy.y += (edy / dist) * currentSpeed;
            } else if (dist < 250) {
              enemy.x -= (edx / dist) * currentSpeed;
              enemy.y -= (edy / dist) * currentSpeed;
            }
            
            enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
            if (enemy.cooldown <= 0 && speedMultiplier > 0) {
              enemy.cooldown = 180; // Summon every 3 seconds
              playSummonSound();
              enemiesRef.current.push({
                id: 'summon_' + Math.random().toString(36).substr(2, 5),
                x: enemy.x + (Math.random() - 0.5) * 40,
                y: enemy.y + (Math.random() - 0.5) * 40,
                radius: 8, hp: 5, maxHp: 5, speed: 3.5, damage: 1, type: 'SWARMER', color: '#ec4899'
              });
              floatingTextsRef.current.push({ x: enemy.x, y: enemy.y, text: 'SUMMON', color: '#a21caf', life: 30 });
            }
          } else if (enemy.type === 'SWARMER') {
            // Jittery movement
            const jitter = (Math.random() - 0.5) * 2;
            enemy.x += (edx / dist) * currentSpeed + jitter;
            enemy.y += (edy / dist) * currentSpeed + jitter;
          } else {
            enemy.x += (edx / dist) * currentSpeed;
            enemy.y += (edy / dist) * currentSpeed;
          }
        }

        // Player collision - ONLY for local player
        const distToLocalPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (distToLocalPlayer < player.radius + enemy.radius) {
          if (invincibilityTimerRef.current > 0) {
            // Invincible
          } else if (Math.random() * 100 < stats.dodge && enemy.type !== 'EXPLOSIVE') {
            // Dodged successfully
            playDodgeSound();
            spawnParticles(player.x, player.y, '#94a3b8', 6);
            if (Math.random() < 0.2) {
              floatingTextsRef.current.push({ x: player.x, y: player.y - 20, text: 'DODGE!', color: '#94a3b8', life: 20 });
            }
          } else {
            let actualDamage = 0;
            const armorReduction = stats.armor >= 0 ? (stats.armor / (stats.armor + 15)) : 0;
            const enemyDmg = enemy.type === 'EXPLOSIVE' ? 5 : (enemy.damage / 30);
            
            actualDamage = Math.max(0.01, enemyDmg * (1 - armorReduction));
            
            if (enemy.type === 'EXPLOSIVE') {
              enemy.hp = 0; // die on explosion
            }

            player.hp -= actualDamage;
            shakeRef.current = 5; // Trigger shake
            playPlayerHitSound();
            spawnParticles(player.x, player.y, '#ef4444', 10);

            // Apply debuff to player
            if (enemy.type === 'TANK' || enemy.type === 'BOSS_1' || enemy.type === 'BOSS_2') {
              if (!player.statusEffects) player.statusEffects = [];
              if (!player.statusEffects.some(ef => ef.type === 'SLOW')) {
                player.statusEffects.push({ type: 'SLOW', value: 40, duration: 2, timer: 0 });
              }
            }
            
            // Handle Oxygen Tank
            if (player.items.some(i => i.id === 'oxygen_tank') && (itemCooldownsRef.current['oxygen_tank'] || 0) <= 0) {
              invincibilityTimerRef.current = 2; // 2s invincibility
              itemCooldownsRef.current['oxygen_tank'] = 5; // 5s cooldown
              floatingTextsRef.current.push({ x: player.x, y: player.y - 30, text: 'INVISIBLE!', color: '#60a5fa', life: 40 });
            }

            // Fire Flask Item
            if (actualDamage > 0 && Math.random() < 0.2 && player.items.some(i => i.id === 'fire_flask')) {
              floatingTextsRef.current.push({ x: player.x, y: player.y - 20, text: 'FIRE FLASK!', color: '#ef4444', life: 30 });
              enemiesRef.current.forEach(e => {
                if (Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2) < 120) {
                  e.hp -= 20; // fixed 20 true damage
                }
              });
            }
          }

          if (player.hp <= 0 && !player.isDead) {
            if (isMultiplayer) {
              player.isDead = true;
              player.hp = 0;
              setIsDead(true);
            } else {
              onGameOver();
            }
          }
        }
      });

      // 5. Weapons Logic (Auto-aim)
      if (!player.isDead) {
        player.weapons.forEach((weapon, index) => {
          const cooldownKey = `weapon_${index}`;
          if (!weaponCooldownsRef.current[cooldownKey]) weaponCooldownsRef.current[cooldownKey] = 0;
          
          weaponCooldownsRef.current[cooldownKey] -= deltaTime * 60;

          if (weaponCooldownsRef.current[cooldownKey] <= 0) {
            let maxDist = weapon.range + stats.range;
            let targets: { enemy: Enemy, dist: number }[] = [];

            enemiesRef.current.forEach(enemy => {
              const d = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
              if (d < maxDist) {
                targets.push({ enemy, dist: d });
              }
            });

            if (targets.length > 0) {
              targets.sort((a, b) => a.dist - b.dist);
              const numTargets = weapon.type === 'MELEE' ? Math.max(1, weapon.cleave || 1) : 1;
              const hitTargets = targets.slice(0, numTargets);
              
              let effectiveCooldown = weapon.cooldown / (1 + stats.attackSpeed / 100);
              
              // Handle Fury Axe: lower HP = faster attack
              if (weapon.baseId === 'fury_axe') {
                const hpPercent = player.hp / player.maxHp;
                if (hpPercent < 0.5) {
                  effectiveCooldown /= 2; // Double speed at half health
                }
              }
              
              weaponCooldownsRef.current[cooldownKey] = effectiveCooldown;
              
              // Handle Machine Gun ramp
              if (weapon.baseId === 'machine_gun') {
                rampCountRef.current[weapon.id] = (rampCountRef.current[weapon.id] || 0) + 1;
                const rampMax = 50;
                const bonusSpeed = Math.min(rampMax, (rampCountRef.current[weapon.id] || 0) * 2);
                weaponCooldownsRef.current[cooldownKey] /= (1 + bonusSpeed / 100);
              }

              if (weapon.type === 'RANGED') {
                const nearestEnemy = hitTargets[0].enemy;
                const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
                
                // Handle LOW_HP passives
                let extraFreeze = false;
                if (weapon.passive?.trigger === 'LOW_HP' && player.hp < player.maxHp * 0.3) {
                  if (weapon.passive.type === 'FREEZE' && Math.random() < (weapon.passive.chance || 0) / 100) {
                    extraFreeze = true;
                  }
                }

                // Handle Butterfly Wings
                let damageMultiplier = 1;
                if (idleTimerRef.current >= 5 && player.items.some(i => i.id === 'butterfly_wings')) {
                  damageMultiplier = 2;
                  idleTimerRef.current = 0; // consumed
                  floatingTextsRef.current.push({ x: player.x, y: player.y - 40, text: 'X2 DAMAGE!', color: '#facc15', life: 40 });
                }

                if (weapon.baseId === 'wand' || weapon.baseId === 'ice_staff' || weapon.baseId === 'thunder_staff' || weapon.baseId === 'ancient_book' || weapon.baseId === 'flamethrower' || weapon.baseId === 'poison_flask' || weapon.baseId === 'time_bomb') {
                  playMagicSound();
                } else {
                  playShootSound();
                }

                for (let i = 0; i < (weapon.projectileCount || 1); i++) {
                  const spread = (Math.random() - 0.5) * 0.2;
                  const bonusDmg = weapon.passive?.type === 'DAMAGE_STACK' ? (weaponStacksRef.current[weapon.id] || 0) : 0;
                  
                  // Machine Gun ramp damage
                  const rampBonus = (weapon.baseId === 'machine_gun' ? (rampCountRef.current[weapon.id] || 0) * 0.1 : 0);
                  
                  let finalDamage = (weapon.damage + stats.rangedDamage + bonusDmg + rampBonus) * (1 + stats.damagePct / 100) * damageMultiplier;
                  
                  // Old Pistol 6th shot crit
                  let isCrit = Math.random() * 100 < stats.critChance;
                  if (weapon.baseId === 'old_pistol') {
                    shotCountRef.current[weapon.id] = (shotCountRef.current[weapon.id] || 0) + 1;
                    if (shotCountRef.current[weapon.id] >= 6) {
                      isCrit = true;
                      shotCountRef.current[weapon.id] = 0;
                    }
                  }

                  if (isCrit) finalDamage *= 2;

                  projectilesRef.current.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle + spread) * (weapon.projectileSpeed! / 60),
                    vy: Math.sin(angle + spread) * (weapon.projectileSpeed! / 60),
                    damage: finalDamage,
                    radius: 4,
                    color: extraFreeze ? '#60a5fa' : '#fbbf24',
                    life: 100,
                    passive: weapon.passive,
                    isCrit,
                    pierceLeft: weapon.pierce || 0,
                    bouncesLeft: weapon.bounces || 0,
                    aoeRadius: weapon.aoeRadius || 0,
                    hitEnemies: [],
                    weaponBaseSpeed: weapon.projectileSpeed || 500,
                    weaponBaseId: weapon.baseId
                  });
                }
              } else {
                if (hitTargets.length > 0) playMeleeSound();
                hitTargets.forEach(({ enemy: nearestEnemy }) => {
                  playHitSound();
                  const bonusDmg = weapon.passive?.type === 'DAMAGE_STACK' ? (weaponStacksRef.current[weapon.id] || 0) : 0;
                  let damage = (weapon.damage + stats.meleeDamage + bonusDmg) * (1 + stats.damagePct / 100);
                  
                  const isCrit = Math.random() * 100 < stats.critChance;
                  if (isCrit) {
                    damage *= 2;
                    if (weapon.passive?.trigger === 'ON_CRIT') {
                      if (weapon.passive.type === 'HEAL') player.hp = Math.min(player.maxHp, player.hp + weapon.passive.value);
                    }
                  }
                  
                  const isBlocked = isBlockedByShield(nearestEnemy, player.x, player.y);
                  
                  const enemyArmor = (nearestEnemy.armor || 0) - (nearestEnemy.armorReduction || 0);
                  const finalMeleeDmg = isBlocked ? 0 : Math.max(1, damage - enemyArmor);
                  
                  if (isBlocked) {
                    floatingTextsRef.current.push({ x: nearestEnemy.x, y: nearestEnemy.y - 20, text: 'BLOCK!', color: '#94a3b8', life: 20 });
                  } else {
                    nearestEnemy.hp -= finalMeleeDmg;
                    spawnParticles(nearestEnemy.x, nearestEnemy.y, nearestEnemy.color, 6);
                  }

                  // Handle Spiked Mace armor shred
                  if (weapon.baseId === 'spiked_mace') {
                    if (!nearestEnemy.armorReduction) nearestEnemy.armorReduction = 0;
                    nearestEnemy.armorReduction += 5;
                  }

                  // Life Steal
                  if (stats.lifeSteal > 0) {
                    player.hp = Math.min(player.maxHp, player.hp + damage * (stats.lifeSteal / 100));
                  }
                  
                  // Handle ON_HIT passives
                  if (weapon.passive?.trigger === 'ON_HIT') {
                    if (weapon.passive.type === 'HEAL' && Math.random() < (weapon.passive.chance || 0) / 100) {
                      player.hp = Math.min(player.maxHp, player.hp + weapon.passive.value);
                    } else if (weapon.passive.type === 'POISON' && Math.random() < (weapon.passive.chance || 0) / 100) {
                      if (!nearestEnemy.statusEffects) nearestEnemy.statusEffects = [];
                      const existing = nearestEnemy.statusEffects.find(e => e.type === 'POISON');
                      if (existing) {
                        existing.timer = 0;
                        existing.value = Math.max(existing.value, weapon.passive.value);
                      } else {
                        nearestEnemy.statusEffects.push({
                          type: 'POISON', value: weapon.passive.value, duration: weapon.passive.duration || 5, timer: 0
                        });
                      }
                    } else if (weapon.passive.type === 'SLOW' && Math.random() < (weapon.passive.chance || 0) / 100) {
                      if (!nearestEnemy.statusEffects) nearestEnemy.statusEffects = [];
                      const existing = nearestEnemy.statusEffects.find(e => e.type === 'SLOW');
                      if (existing) { existing.timer = 0; } else {
                        nearestEnemy.statusEffects.push({ type: 'SLOW', value: weapon.passive.value, duration: weapon.passive.duration || 3, timer: 0 });
                      }
                    } else if (weapon.passive.type === 'FREEZE' && Math.random() < (weapon.passive.chance || 0) / 100) {
                      if (!nearestEnemy.statusEffects) nearestEnemy.statusEffects = [];
                      const existing = nearestEnemy.statusEffects.find(e => e.type === 'FREEZE');
                      if (existing) { existing.timer = 0; } else {
                        nearestEnemy.statusEffects.push({ type: 'FREEZE', value: weapon.passive.value, duration: weapon.passive.duration || 1, timer: 0 });
                      }
                    }
                  }

                  if (roomId && socketRef.current) {
                    socketRef.current.emit('enemyDamage', { id: nearestEnemy.id, damage, roomId });
                  }
                  floatingTextsRef.current.push({
                    x: nearestEnemy.x, y: nearestEnemy.y, text: Math.round(damage).toString(), color: isCrit ? '#fde047' : '#ffffff', life: 30
                  });
                });
              }
            }
          }
        });
      }

      // 6. Update Projectiles
      projectilesRef.current = projectilesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.isEnemy) {
          const d = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
          if (d < p.radius + player.radius) {
            if (Math.random() * 100 < stats.dodge) {
              floatingTextsRef.current.push({ x: player.x, y: player.y - 20, text: 'DODGE!', color: '#94a3b8', life: 20 });
              playDodgeSound(); // DODGE SOUND
              spawnParticles(player.x, player.y, '#94a3b8', 6);
              return false; // Dodged, but projectile still destroyed
            }
            const armorReduction = stats.armor >= 0 ? (stats.armor / (stats.armor + 15)) : 0;
            const actualDmg = Math.max(0.01, p.damage * (1 - armorReduction));
            player.hp -= actualDmg;
            shakeRef.current = 3;
            playPlayerHitSound(); // PLAYER HIT SOUND
            spawnParticles(player.x, player.y, '#ef4444', 12);
            
            // Fire Flask Item
            if (Math.random() < 0.2 && player.items.some(i => i.id === 'fire_flask')) {
              floatingTextsRef.current.push({ x: player.x, y: player.y - 20, text: 'FIRE FLASK!', color: '#ef4444', life: 30 });
              enemiesRef.current.forEach(e => {
                if (Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2) < 120) {
                  e.hp -= 20;
                }
              });
            }

            if (player.hp <= 0) onGameOver();
            return false;
          }
        } else {
          let hit = false;
          enemiesRef.current.forEach(enemy => {
            if (hit || (p.hitEnemies && p.hitEnemies.includes(enemy.id))) return;

            if (Math.sqrt((p.x - enemy.x) ** 2 + (p.y - enemy.y) ** 2) < p.radius + enemy.radius) {
              if (!p.hitEnemies) p.hitEnemies = [];
              p.hitEnemies.push(enemy.id);
              playHitSound();

              let enemiesToDamage = [enemy];

              // Handle AOE
              if (p.aoeRadius && p.aoeRadius > 0) {
                playExplosionSound();
                const isDouble = p.passive?.type === 'EXPLODE' && Math.random() < ((p.passive.chance || 0) / 100);
                const radiusMulti = isDouble ? 1.5 : 1; // 50% larger on double explosion
                
                enemiesRef.current.forEach(e => {
                  if (e.id !== enemy.id && Math.sqrt((p.x - e.x)**2 + (p.y - e.y)**2) < (p.aoeRadius! * radiusMulti)) {
                    enemiesToDamage.push(e);
                  }
                });
                floatingTextsRef.current.push({ x: p.x, y: p.y, text: isDouble ? 'DOUBLE BOOM!' : 'BOOM!', color: '#fb923c', life: 20 });
                if (isDouble) {
                  // Push them twice to double the damage they take later
                  enemiesToDamage = [...enemiesToDamage, ...enemiesToDamage];
                }
              }

              enemiesToDamage.forEach(e => {
                const isBlocked = isBlockedByShield(e, p.x - p.vx, p.y - p.vy);
                
                const baseDmg = p.damage;
                const enemyArmor = (e.armor || 0) - (e.armorReduction || 0);
                const actualEnemyDmg = isBlocked ? 0 : Math.max(1, baseDmg - enemyArmor);
                
                if (isBlocked) {
                  floatingTextsRef.current.push({ x: e.x, y: e.y - 20, text: 'BLOCK!', color: '#94a3b8', life: 20 });
                } else {
                  e.hp -= actualEnemyDmg;
                  spawnParticles(e.x, e.y, e.color, 4);
                }
                
                // Life Steal
                if (stats.lifeSteal > 0) {
                  player.hp = Math.min(player.maxHp, player.hp + p.damage * (stats.lifeSteal / 100));
                }

                // Handle ranged passives
                if (p.passive?.trigger === 'ON_HIT' || (p.weaponBaseId && weaponStyleBaseIds.includes(p.weaponBaseId))) {
                  let passiveType = p.passive?.type;
                  let passiveValue = p.passive?.value || 0;
                  let passiveDuration = p.passive?.duration || 0;
                  let passiveChance = p.passive?.chance || 100;

                  // Infer passives from baseId if missing
                  if (p.weaponBaseId === 'flamethrower') {
                    passiveType = 'BURN'; passiveValue = 5; passiveDuration = 3; passiveChance = 100;
                  }

                  if (passiveType === 'POISON' && Math.random() < passiveChance / 100) {
                    if (!e.statusEffects) e.statusEffects = [];
                    const existing = e.statusEffects.find(eff => eff.type === 'POISON');
                    if (existing) { existing.timer = 0; existing.value = Math.max(existing.value, passiveValue); } 
                    else { e.statusEffects.push({ type: 'POISON', value: passiveValue, duration: passiveDuration || 5, timer: 0 }); }
                  } else if (passiveType === 'BURN' && Math.random() < passiveChance / 100) {
                    if (!e.statusEffects) e.statusEffects = [];
                    const existing = e.statusEffects.find(eff => eff.type === 'BURN');
                    if (existing) { existing.timer = 0; existing.value = Math.max(existing.value, passiveValue); } 
                    else { e.statusEffects.push({ type: 'BURN', value: passiveValue, duration: passiveDuration || 3, timer: 0 }); }
                  } else if (passiveType === 'SLOW' && Math.random() < passiveChance / 100) {
                    if (!e.statusEffects) e.statusEffects = [];
                    const existing = e.statusEffects.find(eff => eff.type === 'SLOW');
                    if (existing) { existing.timer = 0; }
                    else { e.statusEffects.push({ type: 'SLOW', value: p.passive.value, duration: p.passive.duration || 3, timer: 0 }); }
                  } else if (p.passive.type === 'FREEZE' && Math.random() < (p.passive.chance || 0) / 100) {
                    if (!e.statusEffects) e.statusEffects = [];
                    const existing = e.statusEffects.find(eff => eff.type === 'FREEZE');
                    if (existing) { existing.timer = 0; }
                    else { e.statusEffects.push({ type: 'FREEZE', value: p.passive.value, duration: p.passive.duration || 1, timer: 0 }); }
                  }
                }

                if (roomId && socketRef.current) {
                  socketRef.current.emit('enemyDamage', { id: e.id, damage: p.damage, roomId });
                }
                floatingTextsRef.current.push({
                  x: e.x, y: e.y, text: Math.round(p.damage).toString(), color: p.isCrit ? '#fde047' : '#ffffff', life: 30
                });
              });
              
              if (p.isCrit && p.passive?.trigger === 'ON_CRIT' && p.passive.type === 'HEAL') {
                player.hp = Math.min(player.maxHp, player.hp + p.passive.value);
              }

              let projectileDies = true;
              
              if (p.bouncesLeft && p.bouncesLeft > 0) {
                p.bouncesLeft--;
                projectileDies = false;
                let nextTarget: Enemy | null = null;
                let minDistBounce = 300;
                enemiesRef.current.forEach(eb => {
                  if (!p.hitEnemies!.includes(eb.id)) {
                    const db = Math.sqrt((eb.x - p.x)**2 + (eb.y - p.y)**2);
                    if (db < minDistBounce) { minDistBounce = db; nextTarget = eb; }
                  }
                });
                if (nextTarget) {
                  const speedMultiplier = (p.weaponBaseSpeed || 500) / 60;
                  const angle = Math.atan2(nextTarget.y - p.y, nextTarget.x - p.x);
                  p.vx = Math.cos(angle) * speedMultiplier;
                  p.vy = Math.sin(angle) * speedMultiplier;
                } else {
                  projectileDies = true;
                }
              } else if (p.pierceLeft && p.pierceLeft > 0) {
                p.pierceLeft--;
                projectileDies = false;
              }

              hit = projectileDies;
            }
          });
          if (hit) return false;
        }

        return p.life > 0 && p.x > 0 && p.x < MAP_WIDTH && p.y > 0 && p.y < MAP_HEIGHT;
      });

      // 7. Enemy Death & Materials
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        if (!enemy) return false;
        if (enemy.hp <= 0) {
          killsRef.current += 1;
          if (onMissionProgress) onMissionProgress('KILLS', 1);
          playEnemyDeathSound(); // ENEMY DEATH SOUND
          spawnParticles(enemy.x, enemy.y, enemy.color, 20);

          // Handle Lucky Shovel
          player.weapons.forEach(w => {
            if (w.baseId === 'lucky_shovel' && Math.random() < 0.05) {
              const goldValue = 1 + Math.floor(Math.random() * 3);
              player.materials += goldValue;
              floatingTextsRef.current.push({ x: enemy.x, y: enemy.y, text: `+${goldValue} GOLD`, color: '#facc15', life: 40 });
            }
          });
          
          // Handle Poison Flask chain
          if (enemy.statusEffects?.some(eff => eff.type === 'POISON')) {
            enemiesRef.current.forEach(e => {
              const d = Math.sqrt((e.x - enemy.x)**2 + (e.y - enemy.y)**2);
              if (d < 100 && e.id !== enemy.id) {
                if (!e.statusEffects) e.statusEffects = [];
                e.statusEffects.push({ type: 'POISON', value: 3, duration: 5, timer: 0 });
              }
            });
          }
          
          // Handle ON_KILL passives
          player.weapons.forEach(w => {
            if (w.passive?.trigger === 'ON_KILL') {
              if (w.passive.type === 'DAMAGE_STACK') {
                weaponStacksRef.current[w.id] = (weaponStacksRef.current[w.id] || 0) + w.passive.value;
              } else if (w.passive.type === 'HEAL' && Math.random() < (w.passive.chance || 0) / 100) {
                player.hp = Math.min(player.maxHp, player.hp + w.passive.value);
              }
            }
          });

          if (enemy.type === 'LOOT_GOBLIN' || enemy.type === 'BOSS_1' || enemy.type === 'BOSS_2') {
            cratesRef.current += 1;
            floatingTextsRef.current.push({
              x: enemy.x, y: enemy.y, text: 'CRATE DROPPED!', color: '#10b981', life: 60
            });
          }

          if (enemy.type === 'DIVIDER') {
            // Spawn 3 basic enemies
            for (let i = 0; i < 3; i++) {
              enemiesRef.current.push({
                id: 'sub_' + Math.random().toString(36).substr(2, 5),
                x: enemy.x + (Math.random() - 0.5) * 20,
                y: enemy.y + (Math.random() - 0.5) * 20,
                radius: 10,
                hp: 15,
                maxHp: 15,
                speed: 1.5,
                damage: 1,
                type: 'BASIC',
                color: '#ef4444',
                cooldown: 0
              });
            }
          }

          const materialId = Math.random().toString(36).substr(2, 9);
          if (isMultiplayer) {
            if (isHost) {
              socketRef.current?.emit('spawnMaterial', {
                id: materialId,
                x: enemy.x,
                y: enemy.y,
                value: enemy.type === 'BOSS_1' || enemy.type === 'BOSS_2' ? 50 : (enemy.type === 'LOOT_GOBLIN' ? 20 : 1),
                radius: enemy.type === 'BOSS_1' || enemy.type === 'BOSS_2' ? 15 : 5,
                roomId
              });
            }
          } else {
            materialsRef.current.push({
              id: materialId,
              x: enemy.x,
              y: enemy.y,
              value: enemy.type === 'BOSS_1' || enemy.type === 'BOSS_2' ? 50 : (enemy.type === 'LOOT_GOBLIN' ? 20 : 1),
              radius: enemy.type === 'BOSS_1' || enemy.type === 'BOSS_2' ? 15 : 5,
            });
          }
          return false;
        }
        return true;
      });

      // 8. Update Materials
      materialsRef.current = materialsRef.current.filter(m => {
        const d = Math.sqrt((m.x - player.x) ** 2 + (m.y - player.y) ** 2);
        
        // Magnet range based on stat
        const magnetRange = stats.pickupRange;

        if (d < magnetRange) { 
          const angle = Math.atan2(player.y - m.y, player.x - m.x);
          m.x += Math.cos(angle) * 5;
          m.y += Math.sin(angle) * 5;
        }
        if (d < player.radius + m.radius) {
          const matValue = Math.round(m.value * (1 + stats.harvest / 100));
          const xpValue = Math.round(m.value * (1 + stats.xpGain / 100));

          player.materials += matValue;
          player.xp += xpValue;
          if (onMissionProgress) onMissionProgress('MATERIALS', matValue);
          setMaterialsCount(player.materials);
          setXpCount(player.xp);
          playCoinSound();
          
          if (isMultiplayer && socketRef.current) {
            socketRef.current.emit('materialPickedUp', { id: m.id, x: m.x, y: m.y, roomId });
          }
          return false;
        }
        return true;
      });

      // 9. Update Floating Texts
      floatingTextsRef.current = floatingTextsRef.current.filter(t => {
        t.y -= 0.5;
        t.life--;
        return t.life > 0;
      });

      // 10. Update Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        return p.life > 0;
      });

      // Sync state if host (Throttled ~20fps)
      if (isHost && roomId && socketRef.current && now - lastSyncTimeRef.current > 50) {
        const optimizedEnemies = enemiesRef.current.map(e => ({
          id: e.id, 
          x: Math.round(e.x), 
          y: Math.round(e.y), 
          hp: Math.round(e.hp),
          type: e.type,
          color: e.color,
          radius: e.radius
        }));
        socketRef.current.emit('enemiesUpdate', { enemies: optimizedEnemies, roomId });
        
        lastSyncTimeRef.current = now;
      }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
      
      ctx.save();
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current;
        const sy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(sx, sy);
      }

      // Background grid
      ctx.fillStyle = '#1c1917'; // stone-950
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
      
      // Draw grid with subtle details
      ctx.strokeStyle = '#292524'; // stone-900
      ctx.lineWidth = 1;
      for (let i = 0; i <= MAP_WIDTH; i += GRID_SIZE_X) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, MAP_HEIGHT); ctx.stroke();
      }
      for (let i = 0; i <= MAP_HEIGHT; i += GRID_SIZE_Y) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(MAP_WIDTH, i); ctx.stroke();
      }

      // Add "dots" at intersections
      ctx.fillStyle = '#44403c';
      for (let x = 0; x <= MAP_WIDTH; x += GRID_SIZE_X) {
        for (let y = 0; y <= MAP_HEIGHT; y += GRID_SIZE_Y) {
          ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill();
        }
      }

      // Border glow/vignette
      const vignette = ctx.createRadialGradient(MAP_WIDTH/2, MAP_HEIGHT/2, MAP_WIDTH/4, MAP_WIDTH/2, MAP_HEIGHT/2, MAP_WIDTH/1.5);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      const player = playerRef.current;

      // Draw Other Players
      (Object.values(otherPlayersRef.current) as any[]).forEach(p => {
        if (!p || p.id === socketRef.current?.id) return;
        
        ctx.save();
        if (p.isDead) {
          // Draw Corpse
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#44403c';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, player.radius, player.radius + 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw Tombstone icon
          ctx.fillStyle = '#78716c';
          ctx.fillRect(p.x - 5, p.y - 15, 10, 20);
          ctx.fillRect(p.x - 10, p.y - 10, 20, 5);

          // Draw Revive Progress Bar if anyone is reviving this player
          const progress = reviveProgress[p.id];
          if (progress !== undefined) {
            ctx.globalAlpha = 1.0;
            const barWidth = 40;
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(p.x - barWidth/2, p.y - 30, barWidth, 6);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(p.x - barWidth/2, p.y - 30, barWidth * (progress / 5), 6);
          }
        } else {
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#92400e'; // darker amber
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, player.radius, player.radius + 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Simple eyes for other players
          ctx.fillStyle = 'white';
          ctx.beginPath(); ctx.arc(p.x - 4, p.y - 3, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(p.x + 4, p.y - 3, 3, 0, Math.PI*2); ctx.fill();
        }

        // Draw Name
        if (p.name) {
          ctx.globalAlpha = 1;
          ctx.font = 'bold 12px Fredoka, sans-serif';
          ctx.fillStyle = p.isDead ? '#a8a29e' : 'white';
          ctx.textAlign = 'center';
          ctx.fillText(p.name + (p.isDead ? ' (DEAD)' : ''), p.x, p.y - player.radius - 15);
        }

        // Draw Health Bar for other players
        if (!p.isDead && p.hp !== undefined && p.maxHp !== undefined) {
          const barWidth = 30;
          const barHeight = 4;
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(p.x - barWidth / 2, p.y - player.radius - 10, barWidth, barHeight);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(p.x - barWidth / 2, p.y - player.radius - 10, barWidth * (p.hp / p.maxHp), barHeight);
        }

        // Draw Revive Progress
        if (p.isDead && reviveProgress[p.id]) {
          const progress = reviveProgress[p.id] / 5;
          const barWidth = 40;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(p.x - barWidth/2, p.y + 20, barWidth, 6);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(p.x - barWidth/2, p.y + 20, barWidth * progress, 6);
          ctx.font = '10px sans-serif';
          ctx.fillStyle = 'white';
          ctx.fillText('REVIVING...', p.x, p.y + 35);
        }
        
        ctx.restore();
      });

      // Draw Materials
      materialsRef.current.forEach(m => {
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 5 + m.x) * 2;
        
        ctx.save();
        ctx.translate(m.x, m.y + bounce);
        
        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, m.radius * 2);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Crystal shape
        ctx.fillStyle = '#4ade80'; // brighter green
        ctx.beginPath();
        ctx.moveTo(0, -m.radius);
        ctx.lineTo(m.radius * 0.8, 0);
        ctx.lineTo(0, m.radius);
        ctx.lineTo(-m.radius * 0.8, 0);
        ctx.closePath();
        ctx.fill();
        
        // Shine
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.2, -m.radius * 0.5);
        ctx.lineTo(m.radius * 0.2, -m.radius * 0.2);
        ctx.lineTo(0, 0);
        ctx.fill();

        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
      });

      // Draw Enemies
      enemiesRef.current.forEach(enemy => {
        const isPoisoned = enemy.statusEffects?.some(e => e.type === 'POISON');
        const isSlowed = enemy.statusEffects?.some(e => e.type === 'SLOW');
        const isFrozen = enemy.statusEffects?.some(e => e.type === 'FREEZE');
        
        ctx.fillStyle = isFrozen ? '#7dd3fc' : enemy.color;
        
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.lineWidth = 3;
        if (isPoisoned) ctx.strokeStyle = '#22c55e';
        else if (isSlowed) ctx.strokeStyle = '#3b82f6';
        else ctx.strokeStyle = '#1c1917'; // stone-900
        
        ctx.stroke();

        if (isFrozen) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(enemy.x - enemy.radius - 2, enemy.y - enemy.radius - 2, enemy.radius * 2 + 4, enemy.radius * 2 + 4);
        }

        // Decorative details for specific types
        if (enemy.type === 'SHIELDER') {
          // Find target to face the shield
          let targetX = player.x;
          let targetY = player.y;
          let minDist = Math.sqrt((player.x - enemy.x)**2 + (player.y - enemy.y)**2);
          Object.values(otherPlayersRef.current).forEach((p: any) => {
            const d = Math.sqrt((p.x - enemy.x)**2 + (p.y - enemy.y)**2);
            if (d < minDist) { minDist = d; targetX = p.x; targetY = p.y; }
          });
          const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius + 4, angle - 0.8, angle + 0.8);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 5;
          ctx.stroke();
        } else if (enemy.type === 'DASHER') {
           if (enemy.state === 1) {
             // Blink white when preparing
             if (Math.floor(Date.now() / 50) % 2 === 0) {
                ctx.fillStyle = 'white';
                ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2); ctx.fill();
             }
           }
        } else if (enemy.type === 'SUMMONER') {
           ctx.beginPath();
           ctx.arc(enemy.x, enemy.y, enemy.radius * 1.5, 0, Math.PI * 2);
           ctx.strokeStyle = 'rgba(162, 28, 175, 0.3)';
           ctx.lineWidth = 2;
           ctx.stroke();
        } else if (enemy.type === 'DIVIDER') {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath(); ctx.arc(enemy.x - 5, enemy.y, 4, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(enemy.x + 5, enemy.y, 4, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(enemy.x, enemy.y + 5, 4, 0, Math.PI*2); ctx.fill();
        } else if (enemy.type === 'TELEPORTER') {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius + (Math.sin(Date.now()/100)*3), 0, Math.PI*2); ctx.stroke();
        } else if (enemy.type === 'SWARMER') {
          ctx.fillStyle = '#f472b6';
          for (let i = 0; i < 4; i++) {
            const ang = (i / 4) * Math.PI * 2 + (Date.now()/500);
            ctx.beginPath();
            ctx.arc(enemy.x + Math.cos(ang)*enemy.radius, enemy.y + Math.sin(ang)*enemy.radius, 2, 0, Math.PI*2);
            ctx.fill();
          }
        }

        // Poison bubbles effect
        if (isPoisoned && Math.random() < 0.1) {
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(enemy.x + (Math.random()-0.5)*enemy.radius*2, enemy.y - (Math.random())*enemy.radius, 2, 0, Math.PI*2);
          ctx.fill();
        }
        
        // Enemy HP bar
        if (enemy && enemy.hp !== undefined && enemy.maxHp !== undefined && enemy.hp < enemy.maxHp) {
          const barWidth = enemy.radius * 2.5;
          const barHeight = 4;
          const bx = enemy.x - barWidth/2;
          const by = enemy.y - enemy.radius - 12;

          // Background/Container
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.roundRect(bx - 1, by - 1, barWidth + 2, barHeight + 2, 2);
          ctx.fill();

          // Health Fill
          const hpRatio = enemy.hp / enemy.maxHp;
          ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.2 ? '#eab308' : '#ef4444');
          ctx.beginPath();
          ctx.roundRect(bx, by, barWidth * hpRatio, barHeight, 2);
          ctx.fill();
        }
      });

      // Draw Projectiles
      projectilesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Player (Potato)
      if (player.isDead) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.ellipse(player.x, player.y, player.radius + 2, player.radius + 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Draw Tombstone
        ctx.fillStyle = '#78716c';
        ctx.fillRect(player.x - 5, player.y - 15, 10, 20);
        ctx.fillRect(player.x - 10, player.y - 10, 20, 5);
        ctx.restore();
      } else {
        ctx.fillStyle = '#d97706'; // amber-600
        ctx.beginPath();
        ctx.ellipse(player.x, player.y, player.radius + 2, player.radius + 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f'; // amber-900
        ctx.lineWidth = 3;
        ctx.stroke();
  
        // Draw Player Name
        ctx.font = 'bold 14px Fredoka, sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(displayName, player.x, player.y - player.radius - 15);
        
        // Potato Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(player.x - 6, player.y - 4, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x + 6, player.y - 4, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(player.x - 6, player.y - 4, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x + 6, player.y - 4, 2, 0, Math.PI*2); ctx.fill();
      }
      
      // Draw Weapons
      const weaponSlots = [
        { x: player.radius + 15, y: -10, defaultAngle: 0 },
        { x: player.radius + 20, y: 5, defaultAngle: 0 },
        { x: player.radius + 10, y: 20, defaultAngle: 0 },
        { x: -(player.radius + 15), y: -10, defaultAngle: Math.PI },
        { x: -(player.radius + 20), y: 5, defaultAngle: Math.PI },
        { x: -(player.radius + 10), y: 20, defaultAngle: Math.PI },
      ];

      player.weapons.forEach((weapon, index) => {
        if (index >= 6) return;
        const slot = weaponSlots[index];
        
        // Find nearest enemy to point at
        let nearestEnemy: Enemy | null = null;
        let minDist = Infinity;
        enemiesRef.current.forEach(enemy => {
          const d = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
          if (d < minDist) {
            minDist = d;
            nearestEnemy = enemy;
          }
        });

        let angle = slot.defaultAngle;
        if (nearestEnemy && minDist < weapon.range + player.stats.range + 100) {
          angle = Math.atan2(nearestEnemy.y - (player.y + slot.y), nearestEnemy.x - (player.x + slot.x));
        }

        ctx.save();
        ctx.translate(player.x + slot.x, player.y + slot.y);
        
        // Flip weapon vertically if pointing left so it's not upside down
        if (Math.abs(angle) > Math.PI / 2) {
          ctx.scale(1, -1);
          ctx.rotate(-angle);
        } else {
          ctx.rotate(angle);
        }
        
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 2;
        
        if (weapon.type === 'MELEE') {
          ctx.fillStyle = '#94a3b8'; // slate-400 blade
          if (weapon.baseId === 'spear') {
            ctx.fillRect(0, -2, 30, 4);
            ctx.strokeRect(0, -2, 30, 4);
          } else if (weapon.baseId === 'axe') {
            ctx.fillRect(0, -2, 15, 4);
            ctx.strokeRect(0, -2, 15, 4);
            ctx.beginPath(); ctx.arc(15, 0, 8, -Math.PI/2, Math.PI/2); ctx.fill(); ctx.stroke();
          } else {
            // Knife/Sword
            ctx.fillRect(0, -3, 15, 6);
            ctx.strokeRect(0, -3, 15, 6);
          }
        } else {
          ctx.fillStyle = '#475569'; // slate-600 gun body
          if (weapon.baseId === 'wand') {
            ctx.fillStyle = '#78350f'; // brown stick
            ctx.fillRect(0, -2, 20, 4);
            ctx.strokeRect(0, -2, 20, 4);
            ctx.fillStyle = '#38bdf8'; // glowing tip
            ctx.beginPath(); ctx.arc(20, 0, 4, 0, Math.PI*2); ctx.fill();
          } else if (weapon.baseId === 'shotgun') {
            ctx.fillRect(0, -4, 20, 8);
            ctx.strokeRect(0, -4, 20, 8);
          } else if (weapon.baseId === 'smg') {
            ctx.fillRect(0, -3, 15, 6);
            ctx.fillRect(5, 3, 4, 6); // magazine
            ctx.strokeRect(0, -3, 15, 6);
          } else {
            // Pistol
            ctx.fillRect(0, -3, 12, 6);
            ctx.fillRect(0, 0, 4, 8); // handle
            ctx.strokeRect(0, -3, 12, 6);
          }
        }
        
        ctx.restore();
      });

      // Player HP bar
      const pBarWidth = 40;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(player.x - pBarWidth/2 - 2, player.y + player.radius + 10, pBarWidth + 4, 8);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(player.x - pBarWidth/2, player.y + player.radius + 12, pBarWidth * (player.hp / player.maxHp), 4);

      // Draw Floating Texts
      floatingTextsRef.current.forEach(t => {
        ctx.font = 'bold 16px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = t.color;
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 3;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
      });

      // Minimap
      // Improved Minimap Logic
      const mmWidth = 150;
      const mmHeight = mmWidth * (MAP_HEIGHT / MAP_WIDTH);
      const mmX = MAP_WIDTH - mmWidth - 20;
      const mmY = 20;
      
      ctx.save();
      // Background and border
      ctx.fillStyle = 'rgba(12, 10, 9, 0.8)';
      ctx.beginPath();
      ctx.roundRect?.(mmX - 5, mmY - 5, mmWidth + 10, mmHeight + 10, 10);
      ctx.fill();
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2;
      ctx.stroke();

      // "MINIMAP" label on canvas
      ctx.fillStyle = '#57534e';
      ctx.font = 'bold 8px Fredoka, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('MINIMAP', mmX + mmWidth, mmY + mmHeight + 8);
      
      const scaleX = mmWidth / MAP_WIDTH;
      const scaleY = mmHeight / MAP_HEIGHT;
      
      // Draw other players
      Object.values(otherPlayersRef.current).forEach((p: any) => {
        if (p && !p.isDead) {
          ctx.fillStyle = '#10b981'; // Green for allies
          ctx.beginPath();
          ctx.arc(mmX + p.x * scaleX, mmY + p.y * scaleY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw enemies
      ctx.fillStyle = '#ef4444';
      enemiesRef.current.forEach(e => {
        if (!e) return;
        ctx.beginPath();
        ctx.arc(mmX + e.x * scaleX, mmY + e.y * scaleY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw local player
      ctx.fillStyle = '#60a5fa'; // Blue for local
      ctx.beginPath();
      ctx.arc(mmX + playerRef.current.x * scaleX, mmY + playerRef.current.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
      // Glow for local player
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#60a5fa';
      ctx.stroke();
      
      ctx.restore();

      ctx.restore();
    };

    const loop = (time: number) => {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      update(deltaTime);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) draw(ctx);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="bg-slate-800 rounded-lg shadow-2xl border-4 border-slate-700"
      />
      
      {/* HUD Container */}
      <div className="absolute top-4 left-4 flex flex-col gap-4 pointer-events-none w-64">
        {/* Player Vital Stats */}
        <div className="bg-stone-900/80 backdrop-blur-md p-3 rounded-2xl border-2 border-stone-800 shadow-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Vitality</span>
            </div>
            <span className="text-xs font-black text-stone-300">{Math.ceil(playerHp)} / {playerStats.maxHp}</span>
          </div>
          
          {/* Health Bar */}
          <div className="h-4 bg-stone-950 rounded-full border-2 border-stone-800 overflow-hidden relative shadow-inner">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${(playerHp / playerStats.maxHp) * 100}%` }}
              className="h-full bg-gradient-to-r from-red-600 to-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-stone-950/50 px-2 py-1.5 rounded-lg border border-stone-800 flex items-center justify-between">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black text-blue-400">{playerStats.armor}</span>
            </div>
            <div className="bg-stone-950/50 px-2 py-1.5 rounded-lg border border-stone-800 flex items-center justify-between">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-black text-amber-500">{playerStats.speed}%</span>
            </div>
          </div>
        </div>

        {/* Wave & Time */}
        <div className="flex gap-2">
           <div className="bg-stone-900/80 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-stone-800 shadow-xl flex flex-col items-center min-w-[80px]">
             <span className="text-[8px] font-black text-stone-500 uppercase tracking-tighter">Wave</span>
             <span className="text-lg font-black text-amber-500 leading-none">{wave}</span>
           </div>
           <div className="bg-stone-900/80 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-stone-800 shadow-xl flex flex-col items-center min-w-[80px]">
             <span className="text-[8px] font-black text-stone-500 uppercase tracking-tighter">Time</span>
             <span className="text-lg font-black text-white leading-none">{timer}s</span>
           </div>
        </div>

        {/* Currency & Level */}
        <div className="flex gap-2">
          <div className="bg-stone-950/80 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-stone-800 shadow-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-sm font-black text-green-400">{materialsCount}</span>
          </div>
          <div className="bg-stone-950/80 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-stone-800 shadow-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-sm font-black text-blue-400">LVL {playerRef.current.level}</span>
          </div>
        </div>

        {/* Status Effects HUD */}
        <div className="flex gap-2 flex-wrap">
          <AnimatePresence>
            {playerStatusEffects.map((effect, idx) => (
              <motion.div 
                key={`${effect.type}-${idx}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-8 h-8 rounded-lg bg-stone-900 border-2 border-stone-800 flex items-center justify-center relative shadow-lg overflow-hidden"
              >
                {effect.type === 'BURN' && <Flame className="w-4 h-4 text-orange-500" />}
                {effect.type === 'POISON' && <Droplets className="w-4 h-4 text-green-500" />}
                {effect.type === 'FREEZE' && <Snowflake className="w-4 h-4 text-blue-300" />}
                {effect.type === 'SLOW' && <Wind className="w-4 h-4 text-slate-400" />}
                
                {/* Duration Overlay */}
                <div 
                  className="absolute bottom-0 left-0 w-full bg-white/10" 
                  style={{ height: `${(1 - effect.timer / effect.duration) * 100}%` }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Weapons HUD */}
      <div className="absolute top-44 right-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-stone-900/80 backdrop-blur-md p-2 rounded-2xl border-2 border-stone-800 shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            {playerWeapons.map((w, i) => (
              <div key={i} className={`w-12 h-12 rounded-xl border-2 border-stone-800 flex items-center justify-center relative overflow-hidden bg-stone-950/50`}>
                <div className={`absolute inset-0 opacity-10 ${
                  w.rarity === 1 ? 'bg-stone-500' :
                  w.rarity === 2 ? 'bg-green-500' :
                  w.rarity === 3 ? 'bg-blue-500' : 'bg-purple-500'
                }`} />
                <span className="text-[8px] font-black text-stone-400 uppercase text-center leading-none p-1 z-10">
                  {w.name.split(' ')[0]}
                </span>
                
                {/* Rarity Indicator */}
                <div className={`absolute bottom-0 right-0 w-2 h-2 ${
                  w.rarity === 1 ? 'bg-stone-500' :
                  w.rarity === 2 ? 'bg-green-500' :
                  w.rarity === 3 ? 'bg-blue-500' : 'bg-purple-500'
                }`} />
              </div>
            ))}
            {[...Array(6 - playerWeapons.length)].map((_, i) => (
              <div key={`empty-${i}`} className="w-12 h-12 rounded-xl border-2 border-dashed border-stone-800 bg-stone-950/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Health Warning Vignette */}
      {playerHp / playerStats.maxHp < 0.3 && (
        <motion.div 
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none border-[40px] border-red-500/20 blur-2xl"
        />
      )}

      {/* XP Bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-slate-700">
        <div 
          className="h-full bg-blue-500 transition-all duration-300" 
          style={{ width: `${(xpCount / XP_PER_LEVEL(playerRef.current.level)) * 100}%` }}
        />
      </div>

      {isTouch && (
        <Joystick onChange={(v) => { joystickRef.current = v; }} uiScale={uiScale} />
      )}
      {/* Ping Display */}
      <div className="absolute bottom-4 right-4 bg-stone-900/80 backdrop-blur-sm border-2 border-stone-800 rounded-lg px-3 py-1 text-[10px] font-black text-stone-400 z-50 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${ping < 100 ? 'bg-green-500' : ping < 200 ? 'bg-amber-500' : 'bg-red-500'}`} />
        PING: {ping}ms
      </div>
      {/* Death Overlay */}
      {isDead && !isSpectating && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <h2 className="text-5xl font-bold text-red-500 mb-4 font-fredoka">YOU DIED</h2>
          <p className="text-white mb-8 text-center max-w-md">
            Wait for a friend to stand on your corpse for 5 seconds to revive you!
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsSpectating(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all transform hover:scale-105"
            >
              Spectate
            </button>
            <button 
              onClick={onGameOver}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all transform hover:scale-105"
            >
              Give Up
            </button>
          </div>
        </div>
      )}

      {isDead && isSpectating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white font-bold z-40">
          SPECTATING MODE - Wait for revive
        </div>
      )}
    </div>
  );
};
