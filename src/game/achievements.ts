export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', title: 'FIRST BLOOD', description: 'Kill your first enemy.', icon: 'kill' },
  { id: 'survivor_10', title: 'SURVIVOR I', description: 'Survive 10 waves.', icon: 'wave' },
  { id: 'survivor_20', title: 'SURVIVOR II', description: 'Survive 20 waves.', icon: 'trophy' },
  { id: 'hoarder', title: 'GOLD DIGGER', description: 'Collect 1000 total materials.', icon: 'coin' },
  { id: 'godlike', title: 'GODLIKE', description: 'Kill 5000 total enemies.', icon: 'skull' }
];
