import { Stats, Weapon, Item, Character, WeaponTag } from './types';

export const INITIAL_STATS: Stats = {
  maxHp: 10,
  hpRegen: 0.5,
  lifeSteal: 0,
  damagePct: 0,
  meleeDamage: 0,
  rangedDamage: 0,
  attackSpeed: 0,
  range: 0,
  armor: 0,
  dodge: 5,
  speed: 100, // base speed pixels per second
  luck: 0,
  harvest: 0,
  critChance: 5,
  xpGain: 0,
  pickupRange: 100,
  shopPrice: 0,
};

export const CHARACTERS: Character[] = [
  { id: 'potato', name: 'Classic Potato', description: 'A well-rounded spud.', skillDescription: '+5 Max HP, +5% Speed', statsModifier: { maxHp: 5, speed: 5 }, unlockCondition: { type: 'DEFAULT', value: 0, text: 'Unlocked by default' }, icon: 'Smile', color: 'text-yellow-400' },
  { id: 'brawler', name: 'Brawler', description: 'Loves to get up close.', skillDescription: '+5 Melee Dmg, -5 Ranged Dmg', statsModifier: { meleeDamage: 5, rangedDamage: -5 }, unlockCondition: { type: 'KILLS', value: 200, text: 'Kill 200 enemies total' }, icon: 'Swords', color: 'text-red-500' },
  { id: 'ranger', name: 'Ranger', description: 'Keeps their distance.', skillDescription: '+5 Ranged Dmg, +50 Range, -5 Melee Dmg', statsModifier: { rangedDamage: 5, range: 50, meleeDamage: -5 }, unlockCondition: { type: 'WAVE', value: 5, text: 'Reach Wave 5' }, icon: 'Crosshair', color: 'text-green-500' },
  { id: 'ghost', name: 'Ghost', description: 'Hard to hit, but fragile.', skillDescription: '+30 Dodge, -5 Armor', statsModifier: { dodge: 30, armor: -5 }, unlockCondition: { type: 'WAVE', value: 10, text: 'Reach Wave 10' }, icon: 'Ghost', color: 'text-slate-300' },
  { id: 'merchant', name: 'Merchant', description: 'All about the money.', skillDescription: '+20 Harvest, -20% Damage', statsModifier: { harvest: 20, damagePct: -20 }, unlockCondition: { type: 'MATERIALS', value: 500, text: 'Collect 500 materials total' }, icon: 'Coins', color: 'text-yellow-600' },
  
  // NEW CHARACTERS (NEW-1)
  { id: 'vampire', name: 'Vampire', description: 'Hút máu kẻ thù để tồn tại.', 
    skillDescription: '+15% Life Steal, -5 Armor, -5 Max HP',
    statsModifier: { lifeSteal: 15, armor: -5, maxHp: -5 },
    unlockCondition: { type: 'MATERIALS', value: 2000, text: 'Thu thập 2000 vật liệu tổng cộng' },
    icon: 'Droplets', color: 'text-red-700' },
  { id: 'tank', name: 'Tank', description: 'Chậm như rùa nhưng khó chết.',
    skillDescription: '+30 Max HP, +5 Armor, -30% Speed',
    statsModifier: { maxHp: 30, armor: 5, speed: -30 },
    unlockCondition: { type: 'WAVE', value: 15, text: 'Đạt Wave 15' },
    icon: 'Shield', color: 'text-gray-400' },
  { id: 'speedrunner', name: 'Speedrunner', description: 'Nhanh như chớp, mong manh như thủy tinh.',
    skillDescription: '+50% Speed, +10% Attack Speed, -20 Max HP',
    statsModifier: { speed: 50, attackSpeed: 10, maxHp: -20 },
    unlockCondition: { type: 'KILLS', value: 1000, text: 'Giết 1000 kẻ địch tổng cộng' },
    icon: 'Zap', color: 'text-yellow-300' },
];

export const WEAPONS: Weapon[] = [
  // PISTOL Tiers
  { id: 'pistol_1', baseId: 'pistol', name: 'Pistol I', type: 'RANGED', damage: 10, cooldown: 60, range: 300, projectileSpeed: 500, projectileCount: 1, knockback: 5, icon: 'Crosshair', rarity: 1, price: 5, description: 'Súng lục cơ bản', tags: ['Gun'], rangedDamageScaling: 1.0 },
  { id: 'pistol_2', baseId: 'pistol', name: 'Pistol II', type: 'RANGED', damage: 15, cooldown: 55, range: 320, projectileSpeed: 550, projectileCount: 1, knockback: 7, icon: 'Crosshair', rarity: 2, price: 15, description: 'Súng lục cải tiến', tags: ['Gun'], rangedDamageScaling: 1.0 },
  { id: 'pistol_3', baseId: 'pistol', name: 'Pistol III', type: 'RANGED', damage: 25, cooldown: 50, range: 350, projectileSpeed: 600, projectileCount: 1, knockback: 10, icon: 'Crosshair', rarity: 3, price: 40, description: 'Súng lục cao cấp', tags: ['Gun'], rangedDamageScaling: 1.0 },
  { id: 'pistol_4', baseId: 'pistol', name: 'Pistol IV', type: 'RANGED', damage: 45, cooldown: 40, range: 400, projectileSpeed: 700, projectileCount: 1, knockback: 15, icon: 'Crosshair', rarity: 4, price: 100, description: 'Súng lục huyền thoại', tags: ['Gun'], rangedDamageScaling: 1.0 },

  // KNIFE Tiers
  { id: 'knife_1', baseId: 'knife', name: 'Knife I', type: 'MELEE', damage: 15, cooldown: 45, range: 80, knockback: 10, icon: 'Sword', rarity: 1, price: 5, description: 'Dao găm cơ bản', tags: ['Blade', 'Primitive'], meleeDamageScaling: 0.8, passive: { trigger: 'ON_HIT', type: 'POISON', value: 5, chance: 20, duration: 5, description: '20% cơ hội gây độc (5 sát thương/5s)' } },
  { id: 'knife_2', baseId: 'knife', name: 'Knife II', type: 'MELEE', damage: 25, cooldown: 40, range: 90, knockback: 12, icon: 'Sword', rarity: 2, price: 15, description: 'Dao găm sắc bén', tags: ['Blade', 'Primitive'], meleeDamageScaling: 0.8 },
  { id: 'knife_3', baseId: 'knife', name: 'Knife III', type: 'MELEE', damage: 45, cooldown: 35, range: 100, knockback: 15, icon: 'Sword', rarity: 3, price: 40, description: 'Dao găm sát thủ', tags: ['Blade', 'Primitive'], meleeDamageScaling: 0.8 },
  { id: 'knife_4', baseId: 'knife', name: 'Knife IV', type: 'MELEE', damage: 80, cooldown: 30, range: 120, knockback: 20, icon: 'Sword', rarity: 4, price: 100, description: 'Dao găm huyền thoại', tags: ['Blade', 'Primitive'], meleeDamageScaling: 0.8 },

  // SHOTGUN Tiers
  { id: 'shotgun_1', baseId: 'shotgun', name: 'Shotgun I', type: 'RANGED', damage: 8, cooldown: 90, range: 200, projectileSpeed: 400, projectileCount: 4, knockback: 15, icon: 'Zap', rarity: 2, price: 20, description: 'Súng săn tầm gần' },
  { id: 'shotgun_2', baseId: 'shotgun', name: 'Shotgun II', type: 'RANGED', damage: 12, cooldown: 85, range: 220, projectileSpeed: 450, projectileCount: 5, knockback: 18, icon: 'Zap', rarity: 3, price: 50, description: 'Súng săn cải tiến' },
  { id: 'shotgun_3', baseId: 'shotgun', name: 'Shotgun III', type: 'RANGED', damage: 20, cooldown: 80, range: 250, projectileSpeed: 500, projectileCount: 6, knockback: 22, icon: 'Zap', rarity: 4, price: 120, description: 'Súng săn huyền thoại' },

  // SMG Tiers
  { id: 'smg_1', baseId: 'smg', name: 'SMG I', type: 'RANGED', damage: 3, cooldown: 10, range: 250, projectileSpeed: 600, projectileCount: 1, knockback: 2, icon: 'Crosshair', rarity: 2, price: 25, description: 'Súng liên thanh nhanh' },
  { id: 'smg_2', baseId: 'smg', name: 'SMG II', type: 'RANGED', damage: 5, cooldown: 8, range: 270, projectileSpeed: 650, projectileCount: 1, knockback: 3, icon: 'Crosshair', rarity: 3, price: 60, description: 'Súng liên thanh cải tiến' },
  { id: 'smg_3', baseId: 'smg', name: 'SMG III', type: 'RANGED', damage: 9, cooldown: 6, range: 300, projectileSpeed: 700, projectileCount: 1, knockback: 4, icon: 'Crosshair', rarity: 4, price: 150, description: 'Súng liên thanh huyền thoại' },

  // WAND Tiers
  { id: 'wand_1', baseId: 'wand', name: 'Wand I', type: 'RANGED', damage: 12, cooldown: 50, range: 400, projectileSpeed: 300, projectileCount: 1, knockback: 5, icon: 'Wand', rarity: 1, price: 8, description: 'Gậy phép cơ bản' },
  { id: 'wand_2', baseId: 'wand', name: 'Wand II', type: 'RANGED', damage: 18, cooldown: 45, range: 450, projectileSpeed: 350, projectileCount: 1, knockback: 8, icon: 'Wand', rarity: 2, price: 20, description: 'Gậy phép cải tiến' },
  { id: 'wand_3', baseId: 'wand', name: 'Wand III', type: 'RANGED', damage: 30, cooldown: 40, range: 500, projectileSpeed: 400, projectileCount: 1, knockback: 12, icon: 'Wand', rarity: 3, price: 50, description: 'Gậy phép cao cấp' },
  { id: 'wand_4', baseId: 'wand', name: 'Wand IV', type: 'RANGED', damage: 55, cooldown: 35, range: 600, projectileSpeed: 500, projectileCount: 1, knockback: 20, icon: 'Wand', rarity: 4, price: 120, description: 'Gậy phép huyền thoại' },

  // SPEAR Tiers
  { id: 'spear_1', baseId: 'spear', name: 'Spear I', type: 'MELEE', damage: 20, cooldown: 60, range: 150, knockback: 20, icon: 'Swords', rarity: 1, price: 10, description: 'Thương dài cơ bản' },
  { id: 'spear_2', baseId: 'spear', name: 'Spear II', type: 'MELEE', damage: 35, cooldown: 55, range: 170, knockback: 25, icon: 'Swords', rarity: 2, price: 25, description: 'Thương dài cải tiến' },
  { id: 'spear_3', baseId: 'spear', name: 'Spear III', type: 'MELEE', damage: 60, cooldown: 50, range: 200, knockback: 35, icon: 'Swords', rarity: 3, price: 60, description: 'Thương dài cao cấp' },
  { id: 'spear_4', baseId: 'spear', name: 'Spear IV', type: 'MELEE', damage: 110, cooldown: 45, range: 250, knockback: 50, icon: 'Swords', rarity: 4, price: 140, description: 'Thương dài huyền thoại' },

  // AXE Tiers
  { id: 'axe_1', baseId: 'axe', name: 'Axe I', type: 'MELEE', damage: 30, cooldown: 80, range: 70, knockback: 30, icon: 'Axe', rarity: 1, price: 12, description: 'Rìu chiến cơ bản' },
  { id: 'axe_2', baseId: 'axe', name: 'Axe II', type: 'MELEE', damage: 50, cooldown: 75, range: 80, knockback: 40, icon: 'Axe', rarity: 2, price: 30, description: 'Rìu chiến cải tiến' },
  { id: 'axe_3', baseId: 'axe', name: 'Axe III', type: 'MELEE', damage: 90, cooldown: 70, range: 90, knockback: 55, icon: 'Axe', rarity: 3, price: 75, description: 'Rìu chiến cao cấp' },
  { id: 'axe_4', baseId: 'axe', name: 'Axe IV', type: 'MELEE', damage: 160, cooldown: 60, range: 100, knockback: 80, icon: 'Axe', rarity: 4, price: 180, description: 'Rìu chiến huyền thoại' },

  // NEW WEAPONS
  { id: 'rusty_sword_1', baseId: 'rusty_sword', name: 'Kiếm Gỉ Sét', type: 'MELEE', damage: 10, cooldown: 72, range: 80, knockback: 10, icon: 'Sword', rarity: 1, price: 10, description: '20% Gây độc' },
  { id: 'fury_axe_1', baseId: 'fury_axe', name: 'Rìu Cuồng Nộ', type: 'MELEE', damage: 25, cooldown: 120, range: 90, knockback: 20, icon: 'Axe', rarity: 2, price: 25, description: 'Tăng tốc đánh khi máu thấp' },
  { id: 'assassin_dagger_1', baseId: 'assassin_dagger', name: 'Dao Găm Sát Thủ', type: 'MELEE', damage: 8, cooldown: 40, range: 60, knockback: 5, icon: 'Sword', rarity: 2, price: 20, description: '30% Crit, x2 Crit sau lưng' },
  { id: 'spiked_mace_1', baseId: 'spiked_mace', name: 'Chùy Gai', type: 'MELEE', damage: 20, cooldown: 90, range: 85, knockback: 25, icon: 'Zap', rarity: 2, price: 22, description: 'Giảm 5 giáp mục tiêu' },
  { id: 'boxing_gloves_1', baseId: 'boxing_gloves', name: 'Găng Tay Đấm Bốc', type: 'MELEE', damage: 5, cooldown: 30, range: 70, knockback: 50, icon: 'Zap', rarity: 1, price: 15, description: 'Đẩy lùi cực mạnh' },
  { id: 'light_sword_1', baseId: 'light_sword', name: 'Kiếm Ánh Sáng', type: 'MELEE', damage: 15, cooldown: 50, range: 120, knockback: 10, icon: 'Sword', rarity: 3, price: 45, description: 'Tầm chém rộng, xuyên 2 mục tiêu', cleave: 2 },
  { id: 'death_scythe_1', baseId: 'death_scythe', name: 'Lưỡi Hái Tử Thần', type: 'MELEE', damage: 40, cooldown: 180, range: 150, knockback: 30, icon: 'Sword', rarity: 4, price: 150, description: 'Giết quái tăng sát thương vĩnh viễn', cleave: 1, passive: { trigger: 'ON_KILL', type: 'DAMAGE_STACK', value: 0.5, description: '+0.5 Dmg mỗi mạng' } },
  { id: 'old_pistol_1', baseId: 'old_pistol', name: 'Súng Lục Cũ', type: 'RANGED', damage: 12, cooldown: 50, range: 400, projectileSpeed: 500, projectileCount: 1, knockback: 5, icon: 'Crosshair', rarity: 1, price: 12, description: 'Phát thứ 6 luôn chí mạng' },
  { id: 'wooden_bow_1', baseId: 'wooden_bow', name: 'Cung Gỗ', type: 'RANGED', damage: 15, cooldown: 70, range: 600, projectileSpeed: 600, projectileCount: 1, knockback: 8, icon: 'Target', rarity: 1, price: 15, description: '50% Xuyên thấu', pierce: 1 },
  { id: 'flamethrower_1', baseId: 'flamethrower', name: 'Súng Lửa', type: 'RANGED', damage: 3, cooldown: 8, range: 250, projectileSpeed: 400, projectileCount: 1, knockback: 1, icon: 'Zap', rarity: 3, price: 60, description: 'Cực nhanh, cháy diện rộng (AOE)', aoeRadius: 40, pierce: 2 },
  { id: 'laser_gun_1', baseId: 'laser_gun', name: 'Súng Laser', type: 'RANGED', damage: 20, cooldown: 60, range: 500, projectileSpeed: 1000, projectileCount: 1, knockback: 2, icon: 'Zap', rarity: 3, price: 80, description: 'Tia laser nảy mục tiêu', bounces: 3 },
  { id: 'magic_crossbow_1', baseId: 'magic_crossbow', name: 'Nỏ Thần', type: 'RANGED', damage: 35, cooldown: 100, range: 650, projectileSpeed: 700, projectileCount: 1, knockback: 15, icon: 'Target', rarity: 3, price: 90, description: 'Làm chậm quái 30%', passive: { trigger: 'ON_HIT', type: 'SLOW', value: 30, chance: 100, duration: 3, description: 'Giảm 30% tốc độ' } },
  { id: 'machine_gun_1', baseId: 'machine_gun', name: 'Súng Máy', type: 'RANGED', damage: 2, cooldown: 6, range: 450, projectileSpeed: 800, projectileCount: 1, knockback: 1, icon: 'Crosshair', rarity: 3, price: 100, description: 'Càng bắn lâu sát thương càng tăng' },
  { id: 'time_bomb_1', baseId: 'time_bomb', name: 'Bom Hẹn Giờ', type: 'RANGED', damage: 50, cooldown: 150, range: 300, projectileSpeed: 300, projectileCount: 1, knockback: 40, icon: 'Zap', rarity: 3, price: 70, description: 'Nổ AOE, 10% nổ kép', aoeRadius: 80, passive: { trigger: 'ON_HIT', type: 'EXPLODE', value: 10, chance: 10, description: '10% nổ kép' } },
  { id: 'ice_staff_1', baseId: 'ice_staff', name: 'Gậy Băng', type: 'RANGED', damage: 10, cooldown: 60, range: 500, projectileSpeed: 450, projectileCount: 1, knockback: 5, icon: 'Wand', rarity: 2, price: 40, description: '15% Đóng băng 1s', passive: { trigger: 'ON_HIT', type: 'FREEZE', value: 1, chance: 15, duration: 1, description: '15% Đóng băng' } },
  { id: 'thunder_staff_1', baseId: 'thunder_staff', name: 'Quyền Trượng Sấm Sét', type: 'RANGED', damage: 18, cooldown: 70, range: 450, projectileSpeed: 900, projectileCount: 1, knockback: 3, icon: 'Wand', rarity: 3, price: 85, description: 'Giật sét lan 3 mục tiêu', bounces: 2 },
  { id: 'ancient_book_1', baseId: 'ancient_book', name: 'Sách Phép Cổ', type: 'RANGED', damage: 15, cooldown: 80, range: 550, projectileSpeed: 400, projectileCount: 1, knockback: 5, icon: 'Wand', rarity: 2, price: 50, description: 'Dmg theo Int, -5% hồi chiêu' },
  { id: 'poison_flask_1', baseId: 'poison_flask', name: 'Bình Thuốc Độc', type: 'RANGED', damage: 5, cooldown: 90, range: 350, projectileSpeed: 350, projectileCount: 1, knockback: 2, icon: 'Zap', rarity: 2, price: 45, description: 'Nổ AOE, chết lây độc sang quái khác', aoeRadius: 60, passive: { trigger: 'ON_HIT', type: 'POISON', value: 3, duration: 5, chance: 100, description: 'Gây độc' } },
  { id: 'generator_1', baseId: 'generator', name: 'Máy Phát Điện', type: 'RANGED', damage: 0, cooldown: 1000, range: 0, projectileSpeed: 0, projectileCount: 0, knockback: 0, icon: 'Zap', rarity: 4, price: 120, description: '+10% sát thương Ranged' },
  { id: 'lucky_shovel_1', baseId: 'lucky_shovel', name: 'Xẻng May Mắn', type: 'MELEE', damage: 12, cooldown: 60, range: 80, knockback: 15, icon: 'Axe', rarity: 1, price: 30, description: '5% rơi tiền khi giết quái' },
];

export const ITEMS: Item[] = [
  { id: 'apple', name: 'Apple', description: '+3 Max HP', stats: { maxHp: 3 }, price: 5, rarity: 1, icon: 'Heart' },
  { id: 'coffee', name: 'Coffee', description: '+10% Attack Speed, -1 Armor', stats: { attackSpeed: 10, armor: -1 }, price: 10, rarity: 1, icon: 'Coffee' },
  { id: 'weights', name: 'Weights', description: '+2 Melee Damage, -5% Speed', stats: { meleeDamage: 2, speed: -5 }, price: 12, rarity: 1, icon: 'Dumbbell' },
  { id: 'glasses', name: 'Glasses', description: '+20 Range, +5% Damage', stats: { range: 20, damagePct: 5 }, price: 15, rarity: 2, icon: 'Glasses' },
  { id: 'armor_plate', name: 'Armor Plate', description: '+3 Armor, -2% Speed', stats: { armor: 3, speed: -2 }, price: 20, rarity: 2, icon: 'Shield' },
  { id: 'steroids', name: 'Steroids', description: '+5 Melee Damage, +2 Ranged Damage, -10 Max HP', stats: { meleeDamage: 5, rangedDamage: 2, maxHp: -10 }, price: 30, rarity: 3, icon: 'Zap' },
  { id: 'energy_drink', name: 'Energy Drink', description: '+15% Speed, +10% Attack Speed', stats: { speed: 15, attackSpeed: 10 }, price: 40, rarity: 3, icon: 'Zap' },
  
  // 20 NEW ITEMS
  { id: 'rotting_wood_armor', name: 'Giáp Gỗ Mục', description: '+2 Armor, -1 Speed', stats: { armor: 2, speed: -1 }, price: 8, rarity: 1, icon: 'Shield' },
  { id: 'energy_shield', name: 'Khiên Năng Lượng', description: '+10% Dodge', stats: { dodge: 10 }, price: 15, rarity: 2, icon: 'Shield' },
  { id: 'medical_bandage', name: 'Băng Gạc Y Tế', description: '+5 HP Regen', stats: { hpRegen: 5 }, price: 12, rarity: 1, icon: 'Heart' },
  { id: 'steel_heart', name: 'Trái Tim Thép', description: '+20 Max HP, -2% Atk Speed', stats: { maxHp: 20, attackSpeed: -2 }, price: 25, rarity: 3, icon: 'Heart' },
  { id: 'reflex_shoes', name: 'Giày Phản Phản', description: '+5% Speed, +1 Armor', stats: { speed: 5, armor: 1 }, price: 12, rarity: 1, icon: 'Zap' },
  { id: 'scope', name: 'Kính Ngắm', description: '+5% Crit Chance', stats: { critChance: 5 }, price: 15, rarity: 2, icon: 'Crosshair' },
  { id: 'sharpening_stone', name: 'Đá Mài Sắc', description: '+3 Melee Damage', stats: { meleeDamage: 3 }, price: 15, rarity: 2, icon: 'Sword' },
  { id: 'spare_ammo', name: 'Hộp Đạn Dự Phòng', description: '+3 Ranged Damage', stats: { rangedDamage: 3 }, price: 15, rarity: 2, icon: 'Crosshair' },
  { id: 'telescope', name: 'Ống Kính Viễn Vọng', description: '+50 Range, -5% Atk Speed', stats: { range: 50, attackSpeed: -5 }, price: 20, rarity: 2, icon: 'Glasses' },
  { id: 'blacksmith_gloves', name: 'Găng Tay Thợ Rèn', description: '+10% Atk Speed', stats: { attackSpeed: 10 }, price: 18, rarity: 2, icon: 'Zap' },
  { id: 'torn_pouch', name: 'Túi Tiền Rách', description: '+5 Luck, +10 Gold/Wave', stats: { luck: 5, harvest: 10 }, price: 15, rarity: 1, icon: 'Coins' },
  { id: 'four_leaf_clover', name: 'Cỏ 4 Lá', description: '+15 Luck', stats: { luck: 15 }, price: 20, rarity: 2, icon: 'Smile' },
  { id: 'membership_card', name: 'Thẻ Thành Viên', description: '-10% Shop Price', stats: { shopPrice: -10 }, price: 25, rarity: 3, icon: 'Coins' },
  { id: 'calculator', name: 'Máy Tính Cầm Tay', description: '+10% XP Gain', stats: { xpGain: 10 }, price: 30, rarity: 3, icon: 'Glasses' },
  { id: 'money_magnet', name: 'Nam Châm Hút Tiền', description: '+50% Pickup Range', stats: { pickupRange: 50 }, price: 20, rarity: 2, icon: 'Zap' },
  { id: 'fire_flask', name: 'Bình Lửa', description: '20% phản nổ khi bị đánh', stats: {}, price: 35, rarity: 3, icon: 'Zap' },
  { id: 'butterfly_wings', name: 'Cánh Bướm', description: 'Đứng im 5s thì đòn sau X2 sát thương', stats: {}, price: 40, rarity: 4, icon: 'Zap' },
  { id: 'demon_mask', name: 'Mặt Nạ Quỷ', description: '+20% Damage, -10 Max HP', stats: { damagePct: 20, maxHp: -10 }, price: 45, rarity: 4, icon: 'Smile' },
  { id: 'oxygen_tank', name: 'Bình Oxy', description: 'Tàng hình 2s khi bị tấn công, hồi chiêu 5 giây', stats: {}, price: 50, rarity: 4, icon: 'Zap' },
  { id: 'badge_10a1', name: 'Huy Hiệu 10A1', description: '+5 All Stats', stats: { maxHp: 5, hpRegen: 5, lifeSteal: 5, damagePct: 5, meleeDamage: 5, rangedDamage: 5, attackSpeed: 5, range: 5, armor: 5, dodge: 5, speed: 5, luck: 5, harvest: 5, critChance: 5, xpGain: 5, pickupRange: 5, shopPrice: -5 }, price: 100, rarity: 4, icon: 'Target' },
];

export const SET_BONUSES: Record<WeaponTag, { count: number; stats: Partial<Stats> }[]> = {
  Primitive: [
    { count: 2, stats: { maxHp: 3 } },
    { count: 3, stats: { maxHp: 6 } },
    { count: 4, stats: { maxHp: 9 } },
    { count: 5, stats: { maxHp: 12 } },
    { count: 6, stats: { maxHp: 15 } },
  ],
  Blade: [
    { count: 2, stats: { meleeDamage: 1, lifeSteal: 1 } },
    { count: 3, stats: { meleeDamage: 2, lifeSteal: 2 } },
    { count: 4, stats: { meleeDamage: 3, lifeSteal: 3 } },
    { count: 5, stats: { meleeDamage: 4, lifeSteal: 4 } },
    { count: 6, stats: { meleeDamage: 5, lifeSteal: 5 } },
  ],
  Heavy: [
    { count: 2, stats: { damagePct: 5 } },
    { count: 3, stats: { damagePct: 10 } },
    { count: 4, stats: { damagePct: 15 } },
    { count: 5, stats: { damagePct: 20 } },
    { count: 6, stats: { damagePct: 25 } },
  ],
  Gun: [
    { count: 2, stats: { range: 10 } },
    { count: 3, stats: { range: 20 } },
    { count: 4, stats: { range: 30 } },
    { count: 5, stats: { range: 40 } },
    { count: 6, stats: { range: 50 } },
  ],
  Blunt: [
    { count: 2, stats: { armor: 1, maxHp: 0, speed: -2 } },
    { count: 3, stats: { armor: 1, maxHp: 2, speed: -4 } },
    { count: 4, stats: { armor: 2, maxHp: 4, speed: -8 } },
    { count: 5, stats: { armor: 2, maxHp: 6, speed: -12 } },
    { count: 6, stats: { armor: 3, maxHp: 6, speed: -15 } },
  ],
  Ethereal: [
    { count: 2, stats: { dodge: 6, armor: -1 } },
    { count: 3, stats: { dodge: 12, armor: -2 } },
    { count: 4, stats: { dodge: 18, armor: -3 } },
    { count: 5, stats: { dodge: 24, armor: -4 } },
    { count: 6, stats: { dodge: 30, armor: -5 } },
  ],
  Support: [
    { count: 2, stats: { harvest: 5 } },
    { count: 3, stats: { harvest: 10 } },
    { count: 4, stats: { harvest: 15 } },
    { count: 5, stats: { harvest: 20 } },
    { count: 6, stats: { harvest: 25 } },
  ],
  Explosive: [
    { count: 2, stats: { damagePct: 5 } },
    { count: 3, stats: { damagePct: 10 } },
    { count: 4, stats: { damagePct: 15 } },
    { count: 5, stats: { damagePct: 20 } },
    { count: 6, stats: { damagePct: 25 } },
  ],
  Unarmed: [
    { count: 2, stats: { dodge: 3 } },
    { count: 3, stats: { dodge: 6 } },
    { count: 4, stats: { dodge: 9 } },
    { count: 5, stats: { dodge: 12 } },
    { count: 6, stats: { dodge: 15 } },
  ],
  Tool: [
    { count: 2, stats: {} },
    { count: 6, stats: {} },
  ],
};

export const WAVE_DURATION = 20; // seconds
export const XP_PER_LEVEL = (level: number) => 5 + level * 10;
export const MAP_WIDTH = 1600;
export const MAP_HEIGHT = 900;
export const MULTIPLAYER_SERVER = ''; // Fallback for production if needed
export const GRID_SIZE_X = MAP_WIDTH / 50; // 32px
export const GRID_SIZE_Y = MAP_HEIGHT / 30; // 30px

export const getNextTier = (weapon: Weapon): Weapon | null => {
  return WEAPONS.find(w => w.baseId === weapon.baseId && w.rarity === weapon.rarity + 1) || null;
};
