import React, { useState, useRef } from 'react';

interface JoystickProps {
  onChange: (vector: { x: number; y: number }) => void;
  uiScale: number;
}

export const Joystick: React.FC<JoystickProps> = ({ onChange, uiScale }) => {
  const [basePos, setBasePos] = useState<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only trigger if clicking on the left half of the screen or generally anywhere if preferred
    // But usually, we want to avoid triggering on HUD elements.
    // Since HUD is pointer-events-none, it's fine.
    setIsDragging(true);
    setBasePos({ x: e.clientX, y: e.clientY });
    setKnobPos({ x: 0, y: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !basePos) return;
    
    const dx = e.clientX - basePos.x;
    const dy = e.clientY - basePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 50; // Radius in pixels

    let limitedDx = dx;
    let limitedDy = dy;

    if (distance > maxRadius) {
      limitedDx = (dx / distance) * maxRadius;
      limitedDy = (dy / distance) * maxRadius;
    }

    const scale = uiScale / 100;
    // We divide by scale because the parent container is scaled, 
    // but this joystick is fixed (outside the scale container in App.tsx? No, it's inside GameCanvas)
    // Wait, GameCanvas is inside the scale container.
    // If Joystick is inside GameCanvas, it IS scaled.
    // If it's scaled, we don't need to divide by scale for the visual position if we use absolute pixels relative to the scaled parent.
    // BUT clientX/Y are screen coordinates.
    
    setKnobPos({ x: limitedDx / scale, y: limitedDy / scale });
    onChange({ x: limitedDx / maxRadius, y: limitedDy / maxRadius });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setBasePos(null);
    setKnobPos({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
  };

  return (
    <div 
      className="absolute inset-0 touch-none z-[40]" 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {basePos && (
        <div 
          className="absolute w-32 h-32 bg-stone-900/40 border-4 border-stone-700/30 rounded-full flex items-center justify-center pointer-events-none"
          style={{ 
            left: (basePos.x - (window.innerWidth - 1680 * (uiScale/100))/2) / (uiScale/100), 
            top: (basePos.y - (window.innerHeight - 960 * (uiScale/100))/2) / (uiScale/100),
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <div 
            className="w-16 h-16 bg-stone-400/80 border-4 border-b-8 border-stone-600/80 rounded-full shadow-lg"
            style={{ 
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)` 
            }}
          />
        </div>
      )}
    </div>
  );
};
