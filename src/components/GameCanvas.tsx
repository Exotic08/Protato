import React, { useEffect, useRef, useState } from 'react';
import { Player, Enemy, Projectile, Material, FloatingText, GameState, Stats, Weapon, EnemyType } from '../game/types';
import { INITIAL_STATS, WAVE_DURATION, XP_PER_LEVEL } from '../game/constants';
import { Joystick } from './Joystick';
import { io, Socket } from 'socket.io-client';

const MULTIPLAYER_SERVER = 'https://protato-production.up.railway.app';

interface GameCanvasProps {
  gameState: GameState;
  onWaveEnd: (materials: number, xp: number) => void;
  onGameOver: () => void;
  playerStats: Stats;
  playerWeapons: Weapon[];
  initialMaterials: number;
  initialXp: number;
  initialLevel: number;
  wave: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onWaveEnd,
  onGameOver,
  playerStats,
  playerWeapons,
  initialMaterials,
  initialXp,
  initialLevel,
  wave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timer, setTimer] = useState(WAVE_DURATION);
  const [materialsCount, setMaterialsCount] = useState(initialMaterials);
  const [xpCount, setXpCount] = useState(initialXp);
  
  // Game state refs to avoid closure issues in the loop
  const playerRef = useRef<Player>({
    x: 400,
    y: 300,
    radius: 15,
    hp: playerStats.maxHp,
    maxHp: playerStats.maxHp,
    stats: playerStats,
    xp: initialXp,
    level: initialLevel,
    materials: initialMaterials,
    weapons: playerWeapons,
    items: [],
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const materialsRef = useRef<Material[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const waveTimerRef = useRef<number>(WAVE_DURATION);
  const weaponCooldownsRef = useRef<{ [key: string]: number }>({});
  const shakeRef = useRef<number>(0);
  const killsRef = useRef<number>(0);
  const joystickRef = useRef({ x: 0, y: 0 });
  const socketRef = useRef<Socket | null>(null);
  const otherPlayersRef = useRef<{ [id: string]: { x: number, y: number, id: string } }>({});
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Initialize Socket.io
    socketRef.current = io(MULTIPLAYER_SERVER);

    socketRef.current.on('currentPlayers', (players) => {
      otherPlayersRef.current = players;
    });

    socketRef.current.on('newPlayer', (player) => {
      otherPlayersRef.current[player.id] = player;
    });

    socketRef.current.on('playerMoved', (player) => {
      otherPlayersRef.current[player.id] = player;
    });

    socketRef.current.on('playerDisconnected', (id) => {
      delete otherPlayersRef.current[id];
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
    
    enemiesRef.current = [];
    projectilesRef.current = [];
    materialsRef.current = [];
    floatingTextsRef.current = [];
    waveTimerRef.current = WAVE_DURATION;
    shakeRef.current = 0;
    killsRef.current = 0;
    setTimer(WAVE_DURATION);
    setMaterialsCount(initialMaterials);
    setXpCount(initialXp);

    let animationFrameId: number;
    lastTimeRef.current = performance.now();

    const update = (deltaTime: number) => {
      if (gameState !== 'PLAYING') return;

      const player = playerRef.current;
      const stats = player.stats;

      // Update shake
      if (shakeRef.current > 0) {
        shakeRef.current -= deltaTime * 20;
        if (shakeRef.current < 0) shakeRef.current = 0;
      }

      // 1. Player Movement
      let dx = 0;
      let dy = 0;
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
        const speed = (stats.speed / 100) * 3; // base speed multiplier
        player.x += dx * speed;
        player.y += dy * speed;
      }

      // Keep player in bounds
      player.x = Math.max(player.radius, Math.min(800 - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(600 - player.radius, player.y));

      // Emit movement to server
      if (socketRef.current && (dx !== 0 || dy !== 0)) {
        socketRef.current.emit('playerMovement', { x: player.x, y: player.y });
      }

      // 2. Wave Timer
      waveTimerRef.current -= deltaTime;
      if (waveTimerRef.current <= 0) {
        onWaveEnd(player.materials, player.xp, killsRef.current);
        return;
      }
      if (Math.ceil(waveTimerRef.current) !== timer) {
        setTimer(Math.ceil(waveTimerRef.current));
      }

      // 3. Enemy Spawning
      spawnTimerRef.current += deltaTime;
      
      // Scale spawn rate: starts at 1.5s, decreases as wave increases
      const baseSpawnRate = Math.max(0.4, 1.5 - (wave * 0.1));
      const spawnRate = waveTimerRef.current < 5 ? baseSpawnRate * 0.5 : baseSpawnRate;
      
      if (spawnTimerRef.current > spawnRate) {
        spawnTimerRef.current = 0;
        const side = Math.floor(Math.random() * 4);
        let ex = 0, ey = 0;
        if (side === 0) { ex = Math.random() * 800; ey = -20; }
        else if (side === 1) { ex = 820; ey = Math.random() * 600; }
        else if (side === 2) { ex = Math.random() * 800; ey = 620; }
        else { ex = -20; ey = Math.random() * 600; }

        // Determine enemy type based on wave
        let type: EnemyType = 'BASIC';
        const rand = Math.random();
        
        if (wave >= 3 && rand < 0.2) type = 'FAST';
        if (wave >= 5 && rand < 0.15) type = 'TANK';
        if (wave >= 7 && rand < 0.2) type = 'RANGED';
        if (wave >= 9 && rand < 0.25) type = 'EXPLOSIVE';

        // Scale stats per wave
        const difficultyScale = 1 + (wave - 1) * 0.15;
        let hp = 15 * difficultyScale;
        let speed = 1.2;
        let color = '#ef4444';
        let radius = 12;
        let damage = 1 * difficultyScale;

        switch(type) {
          case 'FAST': speed = 3.0; hp *= 0.5; color = '#f97316'; radius = 10; break;
          case 'TANK': speed = 0.7; hp *= 3.0; color = '#7f1d1d'; radius = 18; break;
          case 'RANGED': speed = 1.0; hp *= 0.8; color = '#8b5cf6'; radius = 12; break;
          case 'EXPLOSIVE': speed = 2.2; hp *= 0.6; color = '#fbbf24'; radius = 14; break;
        }

        enemiesRef.current.push({
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
        });
      }

      // Spawn Bosses at specific waves
      if (wave % 5 === 0 && Math.abs(waveTimerRef.current - 10) < 0.05) {
        const isMajorBoss = wave % 10 === 0;
        const bossType = isMajorBoss ? 'BOSS_2' : 'BOSS_1';
        if (!enemiesRef.current.some(e => e.type === bossType)) {
          const bossHp = (isMajorBoss ? 1000 : 400) * (1 + (wave / 10));
          enemiesRef.current.push({
            x: 400, y: -50, 
            radius: isMajorBoss ? 50 : 40, 
            hp: bossHp, maxHp: bossHp, 
            speed: 0.4, damage: 5 * (1 + wave/10), 
            type: bossType, 
            color: isMajorBoss ? '#9d174d' : '#4c1d95', 
            cooldown: 0
          });
        }
      }

      // 4. Update Enemies
      enemiesRef.current.forEach(enemy => {
        const edx = player.x - enemy.x;
        const edy = player.y - enemy.y;
        const dist = Math.sqrt(edx * edx + edy * edy);

        if (enemy.type === 'RANGED') {
          if (dist > 200) {
            enemy.x += (edx / dist) * enemy.speed;
            enemy.y += (edy / dist) * enemy.speed;
          } else if (dist < 150) {
            enemy.x -= (edx / dist) * enemy.speed;
            enemy.y -= (edy / dist) * enemy.speed;
          }
          
          // Shoot
          enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
          if (enemy.cooldown <= 0) {
            enemy.cooldown = 120;
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            projectilesRef.current.push({
              x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
              damage: 2, radius: 5, color: '#a855f7', life: 200, isEnemy: true
            });
          }
        } else if (enemy.type === 'BOSS_1') {
          enemy.x += (edx / dist) * enemy.speed;
          enemy.y += (edy / dist) * enemy.speed;
          
          enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
          if (enemy.cooldown <= 0) {
            enemy.cooldown = 180;
            // Spawn minions
            for (let i = 0; i < 4; i++) {
              enemiesRef.current.push({
                x: enemy.x + (Math.random() - 0.5) * 100,
                y: enemy.y + (Math.random() - 0.5) * 100,
                radius: 10, hp: 10, maxHp: 10, speed: 2, damage: 1, type: 'BASIC', color: '#ef4444'
              });
            }
          }
        } else if (enemy.type === 'BOSS_2') {
          enemy.x += (edx / dist) * enemy.speed;
          enemy.y += (edy / dist) * enemy.speed;
          
          enemy.cooldown = (enemy.cooldown || 0) - deltaTime * 60;
          if (enemy.cooldown <= 0) {
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
        } else {
          enemy.x += (edx / dist) * enemy.speed;
          enemy.y += (edy / dist) * enemy.speed;
        }

        // Player collision
        if (dist < player.radius + enemy.radius) {
          if (enemy.type === 'EXPLOSIVE') {
            player.hp -= 5;
            enemy.hp = 0; // die on explosion
          } else {
            player.hp -= enemy.damage / 30; // Damage per frame
          }
          shakeRef.current = 5; // Trigger shake
          if (player.hp <= 0) {
            onGameOver();
          }
        }
      });

      // 5. Weapons Logic (Auto-aim)
      player.weapons.forEach((weapon, index) => {
        const cooldownKey = `weapon_${index}`;
        if (!weaponCooldownsRef.current[cooldownKey]) weaponCooldownsRef.current[cooldownKey] = 0;
        
        weaponCooldownsRef.current[cooldownKey] -= deltaTime * 60;

        if (weaponCooldownsRef.current[cooldownKey] <= 0) {
          let nearestEnemy: Enemy | null = null;
          let minDist = weapon.range + stats.range;

          enemiesRef.current.forEach(enemy => {
            const d = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
            if (d < minDist) {
              minDist = d;
              nearestEnemy = enemy;
            }
          });

          if (nearestEnemy) {
            weaponCooldownsRef.current[cooldownKey] = weapon.cooldown / (1 + stats.attackSpeed / 100);
            
            if (weapon.type === 'RANGED') {
              const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
              for (let i = 0; i < (weapon.projectileCount || 1); i++) {
                const spread = (Math.random() - 0.5) * 0.2;
                projectilesRef.current.push({
                  x: player.x,
                  y: player.y,
                  vx: Math.cos(angle + spread) * (weapon.projectileSpeed! / 60),
                  vy: Math.sin(angle + spread) * (weapon.projectileSpeed! / 60),
                  damage: (weapon.damage + stats.rangedDamage) * (1 + stats.damagePct / 100),
                  radius: 4,
                  color: '#fbbf24',
                  life: 100,
                });
              }
            } else {
              const damage = (weapon.damage + stats.meleeDamage) * (1 + stats.damagePct / 100);
              nearestEnemy.hp -= damage;
              floatingTextsRef.current.push({
                x: nearestEnemy.x, y: nearestEnemy.y, text: Math.round(damage).toString(), color: '#ffffff', life: 30
              });
            }
          }
        }
      });

      // 6. Update Projectiles
      projectilesRef.current = projectilesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.isEnemy) {
          const d = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
          if (d < p.radius + player.radius) {
            player.hp -= p.damage;
            shakeRef.current = 3;
            if (player.hp <= 0) onGameOver();
            return false;
          }
        } else {
          let hit = false;
          enemiesRef.current.forEach(enemy => {
            if (!hit && Math.sqrt((p.x - enemy.x) ** 2 + (p.y - enemy.y) ** 2) < p.radius + enemy.radius) {
              enemy.hp -= p.damage;
              floatingTextsRef.current.push({
                x: enemy.x, y: enemy.y, text: Math.round(p.damage).toString(), color: '#ffffff', life: 30
              });
              hit = true;
            }
          });
          if (hit) return false;
        }

        return p.life > 0 && p.x > 0 && p.x < 800 && p.y > 0 && p.y < 600;
      });

      // 7. Enemy Death & Materials
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        if (enemy.hp <= 0) {
          killsRef.current += 1;
          materialsRef.current.push({
            x: enemy.x,
            y: enemy.y,
            value: 1,
            radius: 5,
          });
          return false;
        }
        return true;
      });

      // 8. Update Materials
      materialsRef.current = materialsRef.current.filter(m => {
        const d = Math.sqrt((m.x - player.x) ** 2 + (m.y - player.y) ** 2);
        if (d < 100) { // Magnet range
          const angle = Math.atan2(player.y - m.y, player.x - m.x);
          m.x += Math.cos(angle) * 5;
          m.y += Math.sin(angle) * 5;
        }
        if (d < player.radius + m.radius) {
          player.materials += m.value;
          player.xp += m.value;
          setMaterialsCount(player.materials);
          setXpCount(player.xp);
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
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, 800, 600);
      
      ctx.save();
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current;
        const sy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(sx, sy);
      }

      // Background grid
      ctx.fillStyle = '#292524'; // stone-900
      ctx.fillRect(0, 0, 800, 600);
      
      ctx.strokeStyle = '#44403c'; // stone-700
      ctx.lineWidth = 2;
      for (let i = 0; i < 800; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
      }
      for (let i = 0; i < 600; i += 50) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
      }

      const player = playerRef.current;

      // Draw Other Players
      (Object.values(otherPlayersRef.current) as any[]).forEach(p => {
        if (p.id === socketRef.current?.id) return;
        
        ctx.save();
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
        
        ctx.restore();
      });

      // Draw Materials
      materialsRef.current.forEach(m => {
        ctx.fillStyle = '#22c55e'; // green-500
        ctx.beginPath();
        ctx.rect(m.x - m.radius, m.y - m.radius, m.radius * 2, m.radius * 2);
        ctx.fill();
        ctx.strokeStyle = '#166534'; // green-800
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Enemies
      enemiesRef.current.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1c1917'; // stone-900
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Enemy HP bar
        if (enemy.hp < enemy.maxHp) {
          const barWidth = enemy.radius * 2;
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(enemy.x - barWidth/2 - 1, enemy.y - enemy.radius - 12, barWidth + 2, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.radius - 11, barWidth * (enemy.hp / enemy.maxHp), 4);
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

      // Draw Player (Potato)
      ctx.fillStyle = '#d97706'; // amber-600
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, player.radius + 2, player.radius + 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f'; // amber-900
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Potato Eyes
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(player.x - 6, player.y - 4, 5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(player.x + 6, player.y - 4, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath(); ctx.arc(player.x - 6, player.y - 4, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(player.x + 6, player.y - 4, 2, 0, Math.PI*2); ctx.fill();
      
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
        width={800}
        height={600}
        className="bg-slate-800 rounded-lg shadow-2xl border-4 border-slate-700"
      />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/50 p-2 rounded border border-white/10 text-white font-mono">
          WAVE TIMER: {timer}s
        </div>
        <div className="bg-black/50 p-2 rounded border border-white/10 text-green-400 font-mono">
          MATERIALS: {materialsCount}
        </div>
        <div className="bg-black/50 p-2 rounded border border-white/10 text-blue-400 font-mono">
          LEVEL: {playerRef.current.level}
        </div>
      </div>

      {/* XP Bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-slate-700">
        <div 
          className="h-full bg-blue-500 transition-all duration-300" 
          style={{ width: `${(xpCount / XP_PER_LEVEL(playerRef.current.level)) * 100}%` }}
        />
      </div>

      {isTouch && (
        <Joystick onChange={(v) => { joystickRef.current = v; }} />
      )}
    </div>
  );
};
