import { Stats, Weapon, Item, Character } from './types';

export const INITIAL_STATS: Stats = {
  maxHp: 10,
  hpRegen: 0,
  lifeSteal: 0,
  damagePct: 0,
  meleeDamage: 0,
  rangedDamage: 0,
  attackSpeed: 0,
  range: 0,
  armor: 0,
  dodge: 0,
  speed: 100, // base speed pixels per second
  luck: 0,
  harvest: 0,
};

export const CHARACTERS: Character[] = [
  { id: 'potato', name: 'Classic Potato', description: 'A well-rounded spud.', skillDescription: '+5 Max HP, +5% Speed', statsModifier: { maxHp: 5, speed: 5 }, unlockCondition: { type: 'DEFAULT', value: 0, text: 'Unlocked by default' }, icon: 'Smile', color: 'text-yellow-400' },
  { id: 'brawler', name: 'Brawler', description: 'Loves to get up close.', skillDescription: '+5 Melee Dmg, -5 Ranged Dmg', statsModifier: { meleeDamage: 5, rangedDamage: -5 }, unlockCondition: { type: 'KILLS', value: 200, text: 'Kill 200 enemies total' }, icon: 'Swords', color: 'text-red-500' },
  { id: 'ranger', name: 'Ranger', description: 'Keeps their distance.', skillDescription: '+5 Ranged Dmg, +50 Range, -5 Melee Dmg', statsModifier: { rangedDamage: 5, range: 50, meleeDamage: -5 }, unlockCondition: { type: 'WAVE', value: 5, text: 'Reach Wave 5' }, icon: 'Crosshair', color: 'text-green-500' },
  { id: 'ghost', name: 'Ghost', description: 'Hard to hit, but fragile.', skillDescription: '+30 Dodge, -5 Armor', statsModifier: { dodge: 30, armor: -5 }, unlockCondition: { type: 'WAVE', value: 10, text: 'Reach Wave 10' }, icon: 'Ghost', color: 'text-slate-300' },
  { id: 'merchant', name: 'Merchant', description: 'All about the money.', skillDescription: '+20 Harvest, -20% Damage', statsModifier: { harvest: 20, damagePct: -20 }, unlockCondition: { type: 'MATERIALS', value: 500, text: 'Collect 500 materials total' }, icon: 'Coins', color: 'text-yellow-600' },
];

export const WEAPONS: Weapon[] = [
  // PISTOL Tiers
  { id: 'pistol_1', baseId: 'pistol', name: 'Pistol I', type: 'RANGED', damage: 10, cooldown: 60, range: 300, projectileSpeed: 500, projectileCount: 1, knockback: 5, icon: 'Crosshair', rarity: 1, price: 5 },
  { id: 'pistol_2', baseId: 'pistol', name: 'Pistol II', type: 'RANGED', damage: 15, cooldown: 55, range: 320, projectileSpeed: 550, projectileCount: 1, knockback: 7, icon: 'Crosshair', rarity: 2, price: 15 },
  { id: 'pistol_3', baseId: 'pistol', name: 'Pistol III', type: 'RANGED', damage: 25, cooldown: 50, range: 350, projectileSpeed: 600, projectileCount: 1, knockback: 10, icon: 'Crosshair', rarity: 3, price: 40 },
  { id: 'pistol_4', baseId: 'pistol', name: 'Pistol IV', type: 'RANGED', damage: 45, cooldown: 40, range: 400, projectileSpeed: 700, projectileCount: 1, knockback: 15, icon: 'Crosshair', rarity: 4, price: 100 },

  // KNIFE Tiers
  { id: 'knife_1', baseId: 'knife', name: 'Knife I', type: 'MELEE', damage: 15, cooldown: 45, range: 80, knockback: 10, icon: 'Sword', rarity: 1, price: 5 },
  { id: 'knife_2', baseId: 'knife', name: 'Knife II', type: 'MELEE', damage: 25, cooldown: 40, range: 90, knockback: 12, icon: 'Sword', rarity: 2, price: 15 },
  { id: 'knife_3', baseId: 'knife', name: 'Knife III', type: 'MELEE', damage: 45, cooldown: 35, range: 100, knockback: 15, icon: 'Sword', rarity: 3, price: 40 },
  { id: 'knife_4', baseId: 'knife', name: 'Knife IV', type: 'MELEE', damage: 80, cooldown: 30, range: 120, knockback: 20, icon: 'Sword', rarity: 4, price: 100 },

  // SHOTGUN Tiers
  { id: 'shotgun_1', baseId: 'shotgun', name: 'Shotgun I', type: 'RANGED', damage: 8, cooldown: 90, range: 200, projectileSpeed: 400, projectileCount: 4, knockback: 15, icon: 'Zap', rarity: 2, price: 20 },
  { id: 'shotgun_2', baseId: 'shotgun', name: 'Shotgun II', type: 'RANGED', damage: 12, cooldown: 85, range: 220, projectileSpeed: 450, projectileCount: 5, knockback: 18, icon: 'Zap', rarity: 3, price: 50 },
  { id: 'shotgun_3', baseId: 'shotgun', name: 'Shotgun III', type: 'RANGED', damage: 20, cooldown: 80, range: 250, projectileSpeed: 500, projectileCount: 6, knockback: 22, icon: 'Zap', rarity: 4, price: 120 },

  // SMG Tiers
  { id: 'smg_1', baseId: 'smg', name: 'SMG I', type: 'RANGED', damage: 3, cooldown: 10, range: 250, projectileSpeed: 600, projectileCount: 1, knockback: 2, icon: 'Crosshair', rarity: 2, price: 25 },
  { id: 'smg_2', baseId: 'smg', name: 'SMG II', type: 'RANGED', damage: 5, cooldown: 8, range: 270, projectileSpeed: 650, projectileCount: 1, knockback: 3, icon: 'Crosshair', rarity: 3, price: 60 },
  { id: 'smg_3', baseId: 'smg', name: 'SMG III', type: 'RANGED', damage: 9, cooldown: 6, range: 300, projectileSpeed: 700, projectileCount: 1, knockback: 4, icon: 'Crosshair', rarity: 4, price: 150 },

  // WAND Tiers
  { id: 'wand_1', baseId: 'wand', name: 'Wand I', type: 'RANGED', damage: 12, cooldown: 50, range: 400, projectileSpeed: 300, projectileCount: 1, knockback: 5, icon: 'Wand', rarity: 1, price: 8 },
  { id: 'wand_2', baseId: 'wand', name: 'Wand II', type: 'RANGED', damage: 18, cooldown: 45, range: 450, projectileSpeed: 350, projectileCount: 1, knockback: 8, icon: 'Wand', rarity: 2, price: 20 },
  { id: 'wand_3', baseId: 'wand', name: 'Wand III', type: 'RANGED', damage: 30, cooldown: 40, range: 500, projectileSpeed: 400, projectileCount: 1, knockback: 12, icon: 'Wand', rarity: 3, price: 50 },
  { id: 'wand_4', baseId: 'wand', name: 'Wand IV', type: 'RANGED', damage: 55, cooldown: 35, range: 600, projectileSpeed: 500, projectileCount: 1, knockback: 20, icon: 'Wand', rarity: 4, price: 120 },

  // SPEAR Tiers
  { id: 'spear_1', baseId: 'spear', name: 'Spear I', type: 'MELEE', damage: 20, cooldown: 60, range: 150, knockback: 20, icon: 'Swords', rarity: 1, price: 10 },
  { id: 'spear_2', baseId: 'spear', name: 'Spear II', type: 'MELEE', damage: 35, cooldown: 55, range: 170, knockback: 25, icon: 'Swords', rarity: 2, price: 25 },
  { id: 'spear_3', baseId: 'spear', name: 'Spear III', type: 'MELEE', damage: 60, cooldown: 50, range: 200, knockback: 35, icon: 'Swords', rarity: 3, price: 60 },
  { id: 'spear_4', baseId: 'spear', name: 'Spear IV', type: 'MELEE', damage: 110, cooldown: 45, range: 250, knockback: 50, icon: 'Swords', rarity: 4, price: 140 },

  // AXE Tiers
  { id: 'axe_1', baseId: 'axe', name: 'Axe I', type: 'MELEE', damage: 30, cooldown: 80, range: 70, knockback: 30, icon: 'Axe', rarity: 1, price: 12 },
  { id: 'axe_2', baseId: 'axe', name: 'Axe II', type: 'MELEE', damage: 50, cooldown: 75, range: 80, knockback: 40, icon: 'Axe', rarity: 2, price: 30 },
  { id: 'axe_3', baseId: 'axe', name: 'Axe III', type: 'MELEE', damage: 90, cooldown: 70, range: 90, knockback: 55, icon: 'Axe', rarity: 3, price: 75 },
  { id: 'axe_4', baseId: 'axe', name: 'Axe IV', type: 'MELEE', damage: 160, cooldown: 60, range: 100, knockback: 80, icon: 'Axe', rarity: 4, price: 180 },
];

export const ITEMS: Item[] = [
  { id: 'apple', name: 'Apple', description: '+3 Max HP', stats: { maxHp: 3 }, price: 5, rarity: 1, icon: 'Heart' },
  { id: 'coffee', name: 'Coffee', description: '+10% Attack Speed, -1 Armor', stats: { attackSpeed: 10, armor: -1 }, price: 10, rarity: 1, icon: 'Coffee' },
  { id: 'weights', name: 'Weights', description: '+2 Melee Damage, -5% Speed', stats: { meleeDamage: 2, speed: -5 }, price: 12, rarity: 1, icon: 'Dumbbell' },
  { id: 'glasses', name: 'Glasses', description: '+20 Range, +5% Damage', stats: { range: 20, damagePct: 5 }, price: 15, rarity: 2, icon: 'Glasses' },
  { id: 'armor_plate', name: 'Armor Plate', description: '+3 Armor, -2% Speed', stats: { armor: 3, speed: -2 }, price: 20, rarity: 2, icon: 'Shield' },
  { id: 'steroids', name: 'Steroids', description: '+5 Melee Damage, +2 Ranged Damage, -10 Max HP', stats: { meleeDamage: 5, rangedDamage: 2, maxHp: -10 }, price: 30, rarity: 3, icon: 'Zap' },
  { id: 'energy_drink', name: 'Energy Drink', description: '+15% Speed, +10% Attack Speed', stats: { speed: 15, attackSpeed: 10 }, price: 40, rarity: 3, icon: 'Zap' },
];

export const WAVE_DURATION = 20; // seconds
export const XP_PER_LEVEL = (level: number) => 5 + level * 10;

export const getNextTier = (weapon: Weapon): Weapon | null => {
  return WEAPONS.find(w => w.baseId === weapon.baseId && w.rarity === weapon.rarity + 1) || null;
};
