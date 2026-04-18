import React from 'react';

interface IllustrationProps {
  id: string;
  className?: string;
  size?: number;
}

const colors = {
  pistol: ['#94a3b8', '#475569'],
  knife: ['#cbd5e1', '#64748b'],
  shotgun: ['#4b5563', '#111827'],
  smg: ['#334155', '#0f172a'],
  wand: ['#d8b4fe', '#7c3aed'],
  spear: ['#9ca3af', '#374151'],
  axe: ['#fbbf24', '#b45309'],
  sword: ['#93c5fd', '#1e40af'],
  bow: ['#d97706', '#78350f'],
  laser: ['#22d3ee', '#0891b2'],
  fire: ['#f87171', '#b91c1c'],
  ice: ['#7dd3fc', '#0284c7'],
  poison: ['#4ade80', '#166534'],
};

export const WeaponIllustration: React.FC<IllustrationProps> = ({ id, className, size = 64 }) => {
  const baseId = id.split('_')[0];
  const primary = (colors as any)[baseId]?.[0] || '#94a3b8';
  const secondary = (colors as any)[baseId]?.[1] || '#475569';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${baseId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Pistol */}
      {baseId === 'pistol' && (
        <g fill={`url(#${baseId}-grad)`}>
          <rect x="30" y="40" width="40" height="15" rx="2" />
          <rect x="30" y="45" width="12" height="25" rx="3" transform="rotate(-10 30 45)" />
          <rect x="65" y="38" width="8" height="10" rx="1" />
        </g>
      )}

      {/* Knife */}
      {baseId === 'knife' && (
        <g>
          <path d="M40 70 L60 30 Q65 20 70 30 L50 75 Z" fill={`url(#${baseId}-grad)`} />
          <rect x="35" y="70" width="12" height="15" rx="2" fill="#3f3f46" transform="rotate(-15 40 70)" />
        </g>
      )}

      {/* Shotgun */}
      {baseId === 'shotgun' && (
        <g fill={`url(#${baseId}-grad)`}>
          <rect x="25" y="42" width="50" height="8" rx="1" />
          <rect x="25" y="48" width="50" height="8" rx="1" />
          <rect x="15" y="45" width="20" height="20" rx="4" transform="rotate(-15 15 45)" />
        </g>
      )}

      {/* SMG */}
      {baseId === 'smg' && (
        <g fill={`url(#${baseId}-grad)`}>
          <rect x="30" y="35" width="45" height="12" rx="2" />
          <rect x="32" y="45" width="10" height="30" rx="2" />
          <rect x="55" y="45" width="8" height="25" rx="2" />
        </g>
      )}

      {/* Wand */}
      {baseId === 'wand' && (
        <g>
          <rect x="45" y="30" width="10" height="50" rx="5" fill="#52525b" />
          <circle cx="50" cy="25" r="12" fill={`url(#${baseId}-grad)`} filter="url(#glow)" />
          <path d="M40 25 L60 25 M50 15 L50 35" stroke="white" strokeWidth="2" opacity="0.5" />
        </g>
      )}

      {/* Spear */}
      {baseId === 'spear' && (
        <g>
          <rect x="48" y="20" width="4" height="70" rx="2" fill="#3f3f46" />
          <path d="M50 10 L35 30 L50 35 L65 30 Z" fill={`url(#${baseId}-grad)`} />
        </g>
      )}

      {/* Axe */}
      {baseId === 'axe' && (
        <g>
          <rect x="45" y="20" width="8" height="65" rx="4" fill="#3f3f46" />
          <path d="M53 25 Q75 35 53 55 L53 25" fill={`url(#${baseId}-grad)`} />
          <path d="M45 25 Q23 35 45 55 L45 25" fill={`url(#${baseId}-grad)`} />
        </g>
      )}

      {/* Default fallback for others */}
      {!['pistol', 'knife', 'shotgun', 'smg', 'wand', 'spear', 'axe'].includes(baseId) && (
        <circle cx="50" cy="50" r="30" fill={`url(#${baseId}-grad)`} />
      )}
    </svg>
  );
};

export const CharacterIllustration: React.FC<IllustrationProps> = ({ id, className, size = 64 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="char-glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Basic Potato Shape */}
      <path d="M50 20 Q80 20 80 50 Q80 80 50 80 Q20 80 20 50 Q20 20 50 20" fill="#d97706" />
      
      {/* Potato Details */}
      {(id === 'potato' || !id) && (
        <g>
          <circle cx="40" cy="45" r="5" fill="white" />
          <circle cx="60" cy="45" r="5" fill="white" />
          <circle cx="40" cy="45" r="2" fill="black" />
          <circle cx="60" cy="45" r="2" fill="black" />
          <path d="M40 65 Q50 75 60 65" stroke="white" strokeWidth="2" fill="none" />
        </g>
      )}

      {id === 'brawler' && (
        <g>
          <path d="M20 40 L10 30 M80 40 L90 30" stroke="#ef4444" strokeWidth="4" />
          <circle cx="40" cy="45" r="5" fill="white" />
          <circle cx="60" cy="45" r="5" fill="white" />
          <path d="M35 35 L45 42 M65 35 L55 42" stroke="black" strokeWidth="3" />
          <path d="M40 65 Q50 60 60 65" stroke="black" strokeWidth="3" fill="none" />
        </g>
      )}

      {id === 'ranger' && (
        <g>
          <circle cx="50" cy="50" r="25" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="40" cy="45" r="5" fill="white" />
          <circle cx="60" cy="45" r="5" fill="white" />
          <path d="M48 50 L52 50 M50 48 L50 52" stroke="#22c55e" strokeWidth="2" />
        </g>
      )}

      {id === 'ghost' && (
        <g opacity="0.6" filter="url(#char-glow)">
          <path d="M40 45 Q40 40 45 40 Q50 40 50 45" fill="white" />
          <path d="M55 45 Q55 40 60 40 Q65 40 65 45" fill="white" />
          <circle cx="43" cy="44" r="1.5" fill="black" />
          <circle cx="58" cy="44" r="1.5" fill="black" />
        </g>
      )}

      {id === 'merchant' && (
        <g>
          <rect x="35" y="30" width="30" height="15" fill="#ca8a04" rx="2" />
          <circle cx="40" cy="55" r="5" fill="white" />
          <circle cx="60" cy="55" r="5" fill="white" />
          <path d="M45 65 L55 65" stroke="white" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
};

export const ItemIllustration: React.FC<IllustrationProps> = ({ id, className, size = 64 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="item-glow">
          <feGaussianBlur stdDeviation="1.5" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {id === 'apple' && (
        <g>
          <path d="M50 80 Q30 80 30 55 Q30 35 50 35 Q70 35 70 55 Q70 80 50 80" fill="#ef4444" />
          <path d="M50 35 L55 20" stroke="#713f12" strokeWidth="3" fill="none" />
          <path d="M55 25 Q65 15 60 25" fill="#22c55e" />
        </g>
      )}

      {id === 'coffee' && (
        <g>
          <rect x="35" y="45" width="25" height="30" rx="2" fill="#f5f5f4" />
          <path d="M60 50 Q75 50 75 60 Q75 70 60 70" stroke="#f5f5f4" strokeWidth="5" fill="none" />
          <path d="M40 35 Q45 20 50 35" stroke="#a8a29e" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M50 35 Q55 20 60 35" stroke="#a8a29e" strokeWidth="2" fill="none" opacity="0.6" />
        </g>
      )}

      {id === 'armor_plate' && (
        <g>
          <path d="M30 30 L70 30 L70 60 Q50 85 30 60 Z" fill="#64748b" />
          <rect x="35" y="35" width="30" height="5" rx="1" fill="#94a3b8" />
          <rect x="35" y="45" width="30" height="5" rx="1" fill="#94a3b8" />
        </g>
      )}

      {/* Generic fallback */}
      {!['apple', 'coffee', 'armor_plate'].includes(id) && (
        <rect x="25" y="25" width="50" height="50" rx="8" fill="#52525b" stroke="#71717a" strokeWidth="4" />
      )}
    </svg>
  );
};
