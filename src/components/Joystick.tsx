import React, { useState, useRef } from 'react';

interface JoystickProps {
  onChange: (vector: { x: number; y: number }) => void;
  uiScale: number;
}

export const Joystick: React.FC<JoystickProps> = ({ onChange, uiScale }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    const scale = uiScale / 100;
    setPosition({ x: dx / scale, y: dy / scale });
    onChange({ x: dx / maxRadius, y: dy / maxRadius });
  };

  return (
    <div 
      className="fixed bottom-12 left-12 w-32 h-32 bg-stone-900/80 border-4 border-stone-700 rounded-full touch-none z-50 shadow-2xl" 
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div 
        className="absolute top-1/2 left-1/2 w-16 h-16 bg-stone-400 border-4 border-b-8 border-stone-600 rounded-full cursor-pointer shadow-lg pointer-events-none transition-transform duration-75"
        style={{ transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` }}
      />
    </div>
  );
};
