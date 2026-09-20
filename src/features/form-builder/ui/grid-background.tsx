"use client";

export function GridBackground({ columns, gap }: { columns: number; gap: number }) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
      style={{
        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px)`,
        backgroundSize: `${100 / columns}% 100%`,
        marginRight: `-${gap}px`
      }}
    />
  );
}

