import { Badge } from '@/shared/ui/badge';
import { Calendar, CheckCircle, Clock, Inbox, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { IBooking } from '@/features/booking/model';

const BADGE_CLASSES =
  'font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs';

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
        className={`${BADGE_CLASSES} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
      >
        <X className="w-3 h-3" /> {t('Dashboard.Rides.Canceled')}
      </Badge>
    );
  }

  if (booking.status === 'requested') {
    return (
      <Badge
        className={`${BADGE_CLASSES} bg-secondary text-secondary-foreground`}
      >
        <Inbox className="w-3 h-3" /> {t('Dashboard.Rides.status-requested')}
      </Badge>
    );
  }

  if (booking.status === 'awaiting_payment') {
    return (
      <Badge
        className={`${BADGE_CLASSES} bg-secondary text-secondary-foreground`}
      >
        <Clock className="w-3 h-3" /> {t('Dashboard.Rides.status-awaiting-payment')}
      </Badge>
    );
  }

  const completed =
    isCompleted ??
    (booking.status === 'completed' || new Date(booking.date) < new Date());

  if (completed || booking.status === 'completed') {
    return (
      <Badge
        className={`${BADGE_CLASSES} bg-muted hover:bg-muted/90 text-muted-foreground`}
      >
        <CheckCircle className="w-3 h-3" /> {t('Dashboard.Rides.Completed')}
      </Badge>
    );
  }

  return (
    <Badge className={`${BADGE_CLASSES} bg-primary text-primary-foreground hover:bg-primary/90`}>
      <Calendar className="w-3 h-3" /> {t('Dashboard.Rides.Upcoming')}
    </Badge>
  );
}
