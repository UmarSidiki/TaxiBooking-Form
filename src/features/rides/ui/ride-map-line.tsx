import { ChevronRight } from 'lucide-react';

export function RideMapLine({ start, end }: { start: string; end: string }) {
  return (
    <span className="flex items-center gap-1 truncate">
      <span className="max-w-[6rem] truncate" title={start}>
        {start}
      </span>
      <ChevronRight className="h-3 w-3 text-gray-400" />
      <span className="max-w-[6rem] truncate" title={end}>
        {end}
      </span>
    </span>
  );
}
