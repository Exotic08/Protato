export type GameState = 'MENU' | 'CHARACTER_SELECT' | 'WEAPON_SELECT' | 'PLAYING' | 'SHOP' | 'LEVEL_UP' | 'GAME_OVER' | 'VICTORY' | 'MODE_SELECT' | 'MULTIPLAYER_MENU' | 'JOIN_ROOM' | 'ROOM_LOBBY' | 'OPEN_CRATE' | 'SOUL_SHOP';

export interface MetaStats {
  soulFragments: number;
  upgrades: {
    [key: string]: number; // Level of each upgrade
  };
}
export type GameMode = 'STANDARD' | 'ENDLESS' | 'MISSION';

export interface RoomData {
  id: string;
  host: string;
  mode: GameMode;
  state: 'LOBBY' | 'SELECTING' | 'PLAYING' | 'SHOP' | 'GAME_OVER';
  wave: number;
  players: {
    [uid: string]: {
      displayName: string;
      isReady: boolean;
      character?: string;
      dead?: boolean;
    }
  }
}

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
  critChance: number;
  xpGain: number;
  pickupRange: number;
  shopPrice: number;
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

export type PassiveTrigger = 'ON_KILL' | 'ON_CRIT' | 'LOW_HP' | 'ON_HIT';

export interface PassiveAbility {
  trigger: PassiveTrigger;
  type: 'STAT_BOOST' | 'HEAL' | 'FREEZE' | 'EXPLODE' | 'DAMAGE_STACK' | 'POISON' | 'SLOW' | 'BURN';
  value: number;
  chance?: number;
  duration?: number;
  description: string;
}

export type WeaponTag = 'Primitive' | 'Blade' | 'Heavy' | 'Unarmed' | 'Ethereal' 
                      | 'Gun' | 'Support' | 'Tool' | 'Blunt' | 'Explosive';

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
  description?: string;
  passive?: PassiveAbility;
  pierce?: number;
  bounces?: number;
  aoeRadius?: number;
  cleave?: number;
  tags?: WeaponTag[];
  meleeDamageScaling?: number;  // 0-1, default 1.0
  rangedDamageScaling?: number; // 0-1, default 1.0
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
  statusEffects?: StatusEffect[];
}

export type EnemyType = 'BASIC' | 'FAST' | 'TANK' | 'RANGED' | 'EXPLOSIVE' | 'BOSS_1' | 'BOSS_2' | 'LOOT_GOBLIN' | 'SWARMER' | 'SHIELDER' | 'DIVIDER' | 'TELEPORTER' | 'DASHER' | 'SUMMONER';

export interface StatusEffect {
  type: 'POISON' | 'FREEZE' | 'BURN' | 'SLOW';
  value: number;
  duration: number;
  timer: number;
  sourceId?: string;
}

export interface Enemy extends Entity {
  id: string;
  speed: number;
  damage: number;
  type: EnemyType;
  color: string;
  cooldown?: number;
  state?: any;
  statusEffects?: StatusEffect[];
  armor?: number;
  armorReduction?: number;
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
  passive?: PassiveAbility;
  isCrit?: boolean;
  pierceLeft?: number;
  bouncesLeft?: number;
  aoeRadius?: number;
  hitEnemies?: string[];
  weaponBaseSpeed?: number;
  weaponBaseId?: string;
}

export interface Material {
  id: string;
  x: number;
  y: number;
  value: number;
  radius: number;
}

export interface LootCrate {
  x: number;
  y: number;
  id: string;
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
