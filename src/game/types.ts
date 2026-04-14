export type GameState = 'MENU' | 'CHARACTER_SELECT' | 'WEAPON_SELECT' | 'PLAYING' | 'SHOP' | 'LEVEL_UP' | 'GAME_OVER' | 'VICTORY' | 'MODE_SELECT';
export type GameMode = 'STANDARD' | 'ENDLESS' | 'MISSION';

export interface Stats {
  maxHp: number;
  hpRegen: number;
  lifeSteal: number;
  damagePct: number;
  meleeDamage: number;
  rangedDamage: number;
  attackSpeed: number;
  range: number;
  armor: number;
  dodge: number;
  speed: number;
  luck: number;
  harvest: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  skillDescription: string;
  statsModifier: Partial<Stats>;
  unlockCondition: {
    type: 'DEFAULT' | 'KILLS' | 'WAVE' | 'MATERIALS';
    value: number;
    text: string;
  };
  icon: string;
  color: string;
}

export type WeaponType = 'MELEE' | 'RANGED';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  cooldown: number; // in frames or ms
  range: number;
  projectileSpeed?: number;
  projectileCount?: number;
  knockback: number;
  icon: string;
  rarity: number; // 1 to 4 (Tier)
  price: number;
  baseId: string; // To group same weapons for upgrades
}

export interface Item {
  id: string;
  name: string;
  description: string;
  stats: Partial<Stats>;
  price: number;
  rarity: number;
  icon: string;
}

export interface Entity {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
}

export interface Player extends Entity {
  stats: Stats;
  xp: number;
  level: number;
  materials: number;
  weapons: Weapon[];
  items: Item[];
}

export type EnemyType = 'BASIC' | 'FAST' | 'TANK' | 'RANGED' | 'EXPLOSIVE' | 'BOSS_1' | 'BOSS_2';

export interface Enemy extends Entity {
  speed: number;
  damage: number;
  type: EnemyType;
  color: string;
  cooldown?: number;
  state?: any;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  life: number;
  isEnemy?: boolean;
}

export interface Material {
  x: number;
  y: number;
  value: number;
  radius: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'KILLS' | 'MATERIALS' | 'SURVIVE_TIME';
  reward: number;
}
