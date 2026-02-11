import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  type: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarItem({ type, label, icon: Icon }: SidebarItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${type}`,
    data: {
      type: 'sidebar-item',
      fieldType: type,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center justify-center p-4 border rounded-lg bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-colors gap-2",
        isDragging && "opacity-50"
      )}
    >
      <Icon className="w-6 h-6 text-muted-foreground" />
      <span className="text-xs font-medium text-foreground text-center">{label}</span>
    </div>
  );
}
