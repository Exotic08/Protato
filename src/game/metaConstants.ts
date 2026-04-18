import { Stats } from './types';

export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;
  stat: keyof Stats;
  valuePerLevel: number;
  basePrice: number;
  maxLevel: number;
}

export const META_UPGRADES: MetaUpgrade[] = [
  {
    id: 'hp',
    name: 'VITALITY',
    description: 'Increases Maximum HP permanently.',
    stat: 'maxHp',
    valuePerLevel: 2,
    basePrice: 50,
    maxLevel: 10
  },
  {
    id: 'dmg',
    name: 'STRENGTH',
    description: 'Increases all damage dealt.',
    stat: 'damagePct',
    valuePerLevel: 5,
    basePrice: 100,
    maxLevel: 10
  },
  {
    id: 'speed',
    name: 'AGILITY',
    description: 'Increases movement speed.',
    stat: 'speed',
    valuePerLevel: 5,
    basePrice: 150,
    maxLevel: 10
  },
  {
    id: 'luck',
    name: 'FORTUNE',
    description: 'Increases luck for better item drops.',
    stat: 'luck',
    valuePerLevel: 5,
    basePrice: 200,
    maxLevel: 10
  },
  {
    id: 'harvest',
    name: 'GREED',
    description: 'Start each wave with extra materials.',
    stat: 'harvest',
    valuePerLevel: 2,
    basePrice: 100,
    maxLevel: 10
  },
  {
    id: 'pickup',
    name: 'MAGNETISM',
    description: 'Increasrs pickup range.',
    stat: 'pickupRange',
    valuePerLevel: 20,
    basePrice: 50,
    maxLevel: 5
  }
];
