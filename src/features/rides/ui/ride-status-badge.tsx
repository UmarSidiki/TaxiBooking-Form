import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { IBooking } from '@/models/booking';

const BADGE_CLASSES =
  'text-white font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs';

type RideStatusBadgeProps = {
  booking: Pick<IBooking, 'status' | 'date'>;
  isCompleted?: boolean;
};

export function RideStatusBadge({
  booking,
  isCompleted,
}: RideStatusBadgeProps) {
  const t = useTranslations();

  if (booking.status === 'canceled') {
    return (
      <Badge
        className={`${BADGE_CLASSES} bg-destructive hover:bg-destructive/90`}
      >
        <X className="w-3 h-3" /> {t('Dashboard.Rides.Canceled')}
      </Badge>
    );
  }

  const completed =
    isCompleted ?? new Date(booking.date) < new Date();

  if (completed) {
    return (
      <Badge
        className={`${BADGE_CLASSES} bg-muted hover:bg-muted/90 text-muted-foreground`}
      >
        <CheckCircle className="w-3 h-3" /> {t('Dashboard.Rides.Completed')}
      </Badge>
    );
  }

  return (
    <Badge className={`${BADGE_CLASSES} bg-primary hover:bg-primary/90`}>
      <Calendar className="w-3 h-3" /> {t('Dashboard.Rides.Upcoming')}
    </Badge>
  );
}
