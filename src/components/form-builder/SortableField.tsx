import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IFormField } from '@/models/form-layout';
import { cn } from '@/lib/utils';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SortableFieldProps {
  field: IFormField;
  onRemove: (id: string) => void;
}

export function SortableField({ field, onRemove }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, data: { type: 'field', field } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Grid width classes
  const widthClasses = {
    full: "col-span-12",
    "two-thirds": "col-span-8",
    half: "col-span-6",
    third: "col-span-4",
    quarter: "col-span-3",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group bg-background border rounded-md p-3 shadow-sm",
        widthClasses[field.width] || "col-span-12",
        isDragging && "opacity-50 z-50 ring-2 ring-primary"
      )}
    >
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-destructive"
          onClick={() => onRemove(field.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="pt-2">
        <label className="text-sm font-medium text-muted-foreground block mb-1">
          {field.label}
        </label>
        <div className="h-9 w-full bg-muted/20 border border-dashed rounded flex items-center px-3 text-xs text-muted-foreground">
          {field.placeholder || field.type}
        </div>
      </div>
    </div>
  );
}
