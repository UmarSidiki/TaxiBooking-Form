"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import React from "react";

export function SortablePreviewItem({
  id,
  className,
  children,
  style: styleProp,
  onClick,
  isMobile,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  isMobile?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
    ...styleProp,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${className || ""} ${isDragging ? 'ring-2 ring-primary' : ''}`}
      onClick={(e) => {
         if(!isDragging && onClick) onClick(e);
      }}
    >
      <div className="absolute -inset-[2px] border-2 border-transparent group-hover:border-primary/30 rounded-lg pointer-events-none transition-colors z-10" />
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1.5 cursor-grab opacity-0 group-hover:opacity-100 bg-background/90 hover:bg-primary hover:text-white border shadow-sm rounded-md z-20 transition-all"
        title="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      {children}
    </div>
  );
}
